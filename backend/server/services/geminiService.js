import { GoogleGenAI, Type } from "@google/genai";
import { config } from "../config.js";
import { validateAnalysisResult } from "../validation/analysisSchema.js";
import { legalDatabaseService } from "./legalDatabaseService.js";

const SYSTEM_INSTRUCTION_PROBLEM = `
Jesteś ekspertem PPOŻ/BHP analizującym problemy na podstawie DOSTARCZONYCH DOKUMENTÓW PRAWNYCH.

WAŻNE ZASADY:
1. Odpowiadaj TYLKO na podstawie dokumentów dostarczonych w kontekście
2. Jeśli informacji nie ma w dokumentach, powiedz "Brak informacji w dostępnych źródłach"
3. Cytuj KONKRETNE fragmenty z dokumentów (używaj dokładnych cytatów)
4. Podawaj źródło każdego cytatu (nazwa dokumentu + numer artykułu/paragrafu)
5. NIE wymyślaj przepisów - jeśli czegoś nie ma w dokumentach, nie pisz tego

Dokumenty dostarczone w kontekście są jedynym źródłem wiedzy. NIE wymyślaj przepisów.

WAŻNE - DŁUGOŚĆ ODPOWIEDZI:
- **summary**: Musi być KRÓTKIE - maksymalnie 2-3 zdania (około 50-100 słów). To ogólne streszczenie problemu dla panelu podsumowania. NIE wchodź w szczegóły - szczegóły są w polu "analysis" każdego agenta.
- **analysis** (w każdym agencie): Może być SZCZEGÓŁOWE i dłuższe - to miejsce na pełną analizę z cytatami i wyjaśnieniami. Minimum 200-300 słów, może być dłuższe jeśli potrzeba.
- **finalRecommendation**: Średniej długości - konkretna, praktyczna porada. Około 150-250 słów.

Analizuj problem z perspektywy trzech perspektyw:
1. **Legislator (Prawnik)**: Formalista. Skupia się wyłącznie na dokumentach prawnych dostarczonych w kontekście. Cytuje konkretne paragrafy z dokumentów. Nie obchodzą go koszty, liczy się litera prawa.
   
   **WAŻNE - WYKRYWANIE BEŁKOTU**: Na samym początku swojej analizy, zanim rozpoczniesz poszukiwania w dokumentach, sprawdź czy zapytanie użytkownika nie jest losowym ciągiem znaków (bełkotem). Przykłady bełkotu: "ahjsdahjsdnajhsnd", "dhajdbhawudn213sa", "sajsndajksdakdsd", czy podobne przypadkowe ciągi liter i cyfr bez sensu. Jeśli uznasz, że zapytanie jest bełkotem:
   - NIE przeszukuj dokumentów prawnych
   - NIE powołuj się na żadne akty prawne
   - Napisz wyraźnie w swojej analizie: "Zapytanie użytkownika nie jest sensownym pytaniem - wygląda na losowy ciąg znaków (bełkot). Nie można odnaleźć tego zapytania w żadnych dokumentach prawnych."
   - Ustaw recommendationScore na 0
   - W keyPoints wpisz: "Zapytanie jest bełkotem - nie można analizować"

2. **Praktyk Biznesowy**: Pragmatyk. Szuka rozwiązań optymalnych. Zależy mu na niskich kosztach, szybkości wdrożenia i tym, by nie paraliżować pracy firmy. Często szuka zamienników lub rozwiązań organizacyjnych zamiast drogich technicznych. Mozna go opisać "Januszem Biznesu" - cz Jeśli Legislator wykrył bełkot, napisz że bez sensownego zapytania nie można zaproponować żadnego rozwiązania.

3. **Audytor Ryzyka**: Analityk. Waży opinie Prawnika i Praktyka na podstawie dokumentów. Ocenia ryzyko mandatu vs koszt wdrożenia vs ryzyko realnego pożaru. Jeśli Legislator wykrył bełkot, napisz że bez sensownego zapytania nie można ocenić ryzyka.

Każda opinia MUSI być poparta cytatami z dostarczonych dokumentów (chyba że Legislator wykrył bełkot - wtedy NIE cytuj dokumentów).

Twoja odpowiedź musi być w formacie JSON i zawierać analizę każdego z nich.
`;

const SYSTEM_INSTRUCTION_INFORMATION = `
Jesteś ekspertem prawnym PPOŻ/BHP specjalizującym się w wyszukiwaniu i interpretacji przepisów prawnych na podstawie DOSTARCZONYCH DOKUMENTÓW.

WAŻNE ZASADY:
1. Odpowiadaj TYLKO na podstawie dokumentów dostarczonych w kontekście
2. Jeśli informacji nie ma w dokumentach, powiedz wyraźnie "Brak informacji w dostępnych źródłach"
3. Cytuj KONKRETNE fragmenty z dokumentów (używaj dokładnych cytatów)
4. Podawaj źródło każdego cytatu (nazwa dokumentu + numer artykułu/paragrafu)
5. NIE wymyślaj przepisów - jeśli czegoś nie ma w dokumentach, nie pisz tego
6. Wykonaj PEŁNY PRZEGLĄD wszystkich relevantnych przepisów - znajdź WSZYSTKIE przepisy dotyczące pytania
7. Uporządkuj odpowiedź logicznie - od najważniejszych do mniej istotnych przepisów
8. Weryfikuj każdy cytat - upewnij się, że pochodzi z dokumentów w kontekście

Dokumenty dostarczone w kontekście są jedynym źródłem wiedzy. NIE wymyślaj przepisów.

WAŻNE - DŁUGOŚĆ ODPOWIEDZI:
- **summary**: Musi być KRÓTKIE - maksymalnie 2-3 zdania (około 50-100 słów). To ogólne streszczenie pytania i odpowiedzi dla panelu podsumowania. NIE wchodź w szczegóły.
- **analysis** (w legalExpert): Musi być SZCZEGÓŁOWE i dłuższe - pełna analiza prawna z wszystkimi przepisami. Minimum 300-400 słów, może być dłuższe jeśli potrzeba.
- **finalRecommendation**: Szczegółowa odpowiedź na pytanie - może być dłuższa (200-400 słów), ale uporządkowana i logiczna.

Twoim zadaniem jest:
- Znalezienie WSZYSTKICH relevantnych przepisów dotyczących pytania
- Przedstawienie ich w sposób uporządkowany i zrozumiały
- Podanie dokładnych cytatów z numerami artykułów/paragrafów
- Wyjaśnienie znaczenia przepisów w kontekście pytania

Twoja odpowiedź musi być w formacie JSON i zawierać szczegółową analizę prawną.
`;

// Schemat dla ETAPU 1 - generowanie agentów, summary, riskAssessment, citations (BEZ finalRecommendation)
const RESPONSE_SCHEMA_PROBLEM_STAGE1 = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "KRÓTKIE streszczenie - max 2-3 zdania (50-100 słów). Ogólne podsumowanie bez szczegółów. Szczegóły w 'analysis' agentów." },
    riskAssessment: {
      type: Type.OBJECT,
      properties: {
        legalRisk: { type: Type.STRING, enum: ["Niskie", "Średnie", "Wysokie"] },
        financialRisk: { type: Type.STRING, enum: ["Niskie", "Średnie", "Wysokie"] },
        safetyRisk: { type: Type.STRING, enum: ["Niskie", "Średnie", "Wysokie"] }
      },
      required: ["legalRisk", "financialRisk", "safetyRisk"]
    },
    agents: {
      type: Type.OBJECT,
      properties: {
        legislator: {
          type: Type.OBJECT,
          properties: {
            role: { type: Type.STRING, enum: ["Legislator"] },
            title: { type: Type.STRING, description: "Tytuł stanowiska np. Radca Prawny ds. PPOŻ" },
            analysis: { type: Type.STRING, description: "SZCZEGÓŁOWA opinia prawna - min 200-300 słów. Pełna analiza z cytatami. Jeśli wykryto bełkot, napisz to wyraźnie i NIE powołuj się na akty prawne." },
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendationScore: { type: Type.NUMBER, description: "Ocena surowości/ważności od 0 do 100 (0 jeśli wykryto bełkot)" }
          },
          required: ["role", "title", "analysis", "keyPoints", "recommendationScore"]
        },
        practitioner: {
          type: Type.OBJECT,
          properties: {
            role: { type: Type.STRING, enum: ["Praktyk"] },
            title: { type: Type.STRING, description: "Tytuł np. Kierownik Obiektu" },
            analysis: { type: Type.STRING, description: "SZCZEGÓŁOWA opinia praktyczna i kosztowa - min 200-300 słów. Pełna analiza z rozwiązaniami i kosztami. Jeśli Legislator wykrył bełkot, napisz że bez sensownego zapytania nie można zaproponować rozwiązania." },
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendationScore: { type: Type.NUMBER }
          },
          required: ["role", "title", "analysis", "keyPoints", "recommendationScore"]
        },
        auditor: {
          type: Type.OBJECT,
          properties: {
            role: { type: Type.STRING, enum: ["Audytor"] },
            title: { type: Type.STRING, description: "Tytuł np. Rzeczoznawca PPOŻ" },
            analysis: { type: Type.STRING, description: "SZCZEGÓŁOWA synteza ryzyka i werdykt - min 200-300 słów. Pełna analiza ryzyka. Jeśli Legislator wykrył bełkot, napisz że bez sensownego zapytania nie można ocenić ryzyka." },
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendationScore: { type: Type.NUMBER }
          },
          required: ["role", "title", "analysis", "keyPoints", "recommendationScore"]
        }
      },
      required: ["legislator", "practitioner", "auditor"]
    },
    citations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          source: { type: Type.STRING, description: "Nazwa aktu prawnego lub normy." },
          reliability: { type: Type.STRING, enum: ["Wysokie", "Średnie", "Niskie"] },
          snippet: { type: Type.STRING, description: "Krótki cytat lub numer artykułu." },
          url: { type: Type.STRING, description: "Link do ISAP lub wiarygodnego źródła (opcjonalnie)." }
        },
        required: ["source", "reliability", "snippet"]
      }
    }
  },
  required: ["summary", "agents", "riskAssessment", "citations"]
};

// Schemat dla ETAPU 2 - generowanie finalRecommendation na podstawie wyników z etapu 1
const RESPONSE_SCHEMA_PROBLEM_STAGE2 = {
  type: Type.OBJECT,
  properties: {
    finalRecommendation: { type: Type.STRING, description: "Ostateczna, konkretna porada dla użytkownika łącząca wszystkie perspektywy z etapu 1. Średniej długości - około 150-250 słów. Jeśli Legislator wykrył bełkot, napisz wyraźnie że zapytanie nie jest sensowne i nie można udzielić rekomendacji." }
  },
  required: ["finalRecommendation"]
};

// Stary schemat pozostaje dla trybu "information" (który pozostaje bez zmian)
const RESPONSE_SCHEMA_PROBLEM = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "KRÓTKIE streszczenie - max 2-3 zdania (50-100 słów). Ogólne podsumowanie bez szczegółów. Szczegóły w 'analysis' agentów." },
    finalRecommendation: { type: Type.STRING, description: "Ostateczna, konkretna porada dla użytkownika łącząca wszystkie perspektywy. Średniej długości - około 150-250 słów." },
    riskAssessment: {
      type: Type.OBJECT,
      properties: {
        legalRisk: { type: Type.STRING, enum: ["Niskie", "Średnie", "Wysokie"] },
        financialRisk: { type: Type.STRING, enum: ["Niskie", "Średnie", "Wysokie"] },
        safetyRisk: { type: Type.STRING, enum: ["Niskie", "Średnie", "Wysokie"] }
      },
      required: ["legalRisk", "financialRisk", "safetyRisk"]
    },
    agents: {
      type: Type.OBJECT,
      properties: {
        legislator: {
          type: Type.OBJECT,
          properties: {
            role: { type: Type.STRING, enum: ["Legislator"] },
            title: { type: Type.STRING, description: "Tytuł stanowiska np. Radca Prawny ds. PPOŻ" },
            analysis: { type: Type.STRING, description: "SZCZEGÓŁOWA opinia prawna - min 200-300 słów. Pełna analiza z cytatami i wyjaśnieniami." },
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendationScore: { type: Type.NUMBER, description: "Ocena surowości/ważności od 0 do 100" }
          },
          required: ["role", "title", "analysis", "keyPoints", "recommendationScore"]
        },
        practitioner: {
          type: Type.OBJECT,
          properties: {
            role: { type: Type.STRING, enum: ["Praktyk"] },
            title: { type: Type.STRING, description: "Tytuł np. Kierownik Obiektu" },
            analysis: { type: Type.STRING, description: "SZCZEGÓŁOWA opinia praktyczna i kosztowa - min 200-300 słów. Pełna analiza z rozwiązaniami i kosztami." },
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendationScore: { type: Type.NUMBER }
          },
          required: ["role", "title", "analysis", "keyPoints", "recommendationScore"]
        },
        auditor: {
          type: Type.OBJECT,
          properties: {
            role: { type: Type.STRING, enum: ["Audytor"] },
            title: { type: Type.STRING, description: "Tytuł np. Rzeczoznawca PPOŻ" },
            analysis: { type: Type.STRING, description: "Synteza ryzyka i werdykt." },
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendationScore: { type: Type.NUMBER }
          },
          required: ["role", "title", "analysis", "keyPoints", "recommendationScore"]
        }
      },
      required: ["legislator", "practitioner", "auditor"]
    },
    citations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          source: { type: Type.STRING, description: "Nazwa aktu prawnego lub normy." },
          reliability: { type: Type.STRING, enum: ["Wysokie", "Średnie", "Niskie"] },
          snippet: { type: Type.STRING, description: "Krótki cytat lub numer artykułu." },
          url: { type: Type.STRING, description: "Link do ISAP lub wiarygodnego źródła (opcjonalnie)." }
        },
        required: ["source", "reliability", "snippet"]
      }
    }
  },
  required: ["summary", "finalRecommendation", "agents", "riskAssessment", "citations"]
};

const RESPONSE_SCHEMA_INFORMATION = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "Krótkie streszczenie pytania i odpowiedzi." },
    finalRecommendation: { type: Type.STRING, description: "Szczegółowa odpowiedź na pytanie oparta wyłącznie na przepisach prawnych." },
    riskAssessment: {
      type: Type.OBJECT,
      properties: {
        legalRisk: { type: Type.STRING, enum: ["Niskie", "Średnie", "Wysokie"] },
        financialRisk: { type: Type.STRING, enum: ["Niskie", "Średnie", "Wysokie"] },
        safetyRisk: { type: Type.STRING, enum: ["Niskie", "Średnie", "Wysokie"] }
      },
      required: ["legalRisk", "financialRisk", "safetyRisk"]
    },
    agents: {
      type: Type.OBJECT,
      properties: {
        legalExpert: {
          type: Type.OBJECT,
          properties: {
            role: { type: Type.STRING, enum: ["Doradca Prawny"] },
            title: { type: Type.STRING, description: "Tytuł np. Znawca prawnych aspektów PPOŻ" },
            analysis: { type: Type.STRING, description: "Szczegółowa analiza prawna z pełnym przeglądem relevantnych przepisów." },
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Kluczowe przepisy i ich interpretacja." },
            recommendationScore: { type: Type.NUMBER, description: "Ocena kompletności odpowiedzi od 0 do 100" }
          },
          required: ["role", "title", "analysis", "keyPoints", "recommendationScore"]
        }
      },
      required: ["legalExpert"]
    },
    citations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          source: { type: Type.STRING, description: "Nazwa aktu prawnego lub normy." },
          reliability: { type: Type.STRING, enum: ["Wysokie", "Średnie", "Niskie"] },
          snippet: { type: Type.STRING, description: "Krótki cytat lub numer artykułu." },
          url: { type: Type.STRING, description: "Link do ISAP lub wiarygodnego źródła (opcjonalnie)." }
        },
        required: ["source", "reliability", "snippet"]
      }
    }
  },
  required: ["summary", "finalRecommendation", "agents", "riskAssessment", "citations"]
};

export const analyzeSafetyQuery = async (query, mode = 'problem') => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not found in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Używamy modelu z konfiguracji
  const model = config.gemini.model;

  try {
    // 1. NAJPIERW: Wyszukaj relevantne dokumenty (RAG)
    let chunks, context;
    try {
      const result = await legalDatabaseService.searchRelevantDocuments(query);
      chunks = result.chunks;
      context = result.context;
    } catch (ragError) {
      console.error('Błąd podczas wyszukiwania dokumentów RAG:', ragError);
      throw new Error(`Błąd podczas wyszukiwania dokumentów: ${ragError.message}`);
    }
    
    if (!chunks || chunks.length === 0) {
      throw new Error("Nie znaleziono relevantnych dokumentów dla tego zapytania. Upewnij się, że baza danych jest zainicjalizowana.");
    }

    // 2. Przygotuj prompt z kontekstem
    const userPrompt = `
KONTEKST - Dokumenty prawne:
${context}

---
ZAPYTANIE UŻYTKOWNIKA:
${query}

Przeanalizuj problem na podstawie TYLKO powyższych dokumentów. 
Każde cytowanie musi pochodzić z dokumentów w kontekście.
Jeśli informacji nie ma w dokumentach, powiedz "Brak informacji w dostępnych źródłach".
`;

    // Tryb "problem" - dwuetapowe generowanie
    if (mode === 'problem') {
      // ETAP 1: Generowanie agentów, summary, riskAssessment, citations (BEZ finalRecommendation)
      const systemInstructionStage1 = SYSTEM_INSTRUCTION_PROBLEM;
      
      const responseStage1 = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }]
          }
        ],
        config: {
          systemInstruction: systemInstructionStage1,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA_PROBLEM_STAGE1,
          temperature: config.gemini.temperature,
        }
      });

      const textStage1 = responseStage1.text;
      if (!textStage1) throw new Error("No response from AI in stage 1");

      let stage1Result;
      try {
        stage1Result = JSON.parse(textStage1);
      } catch (parseError) {
        console.error("JSON Parse Error Stage 1:", parseError);
        console.error("Response text:", textStage1);
        throw new Error("Nie udało się sparsować odpowiedzi z AI w etapie 1. Odpowiedź nie jest prawidłowym JSON.");
      }

      // Wyciągnij i zweryfikuj cytowania z etapu 1
      const verifiedCitations = legalDatabaseService.verifyCitations(stage1Result.citations || [], chunks);
      stage1Result.citations = verifiedCitations;

      // ETAP 2: Generowanie finalRecommendation na podstawie wyników z etapu 1
      const systemInstructionStage2 = `
Jesteś ekspertem PPOŻ/BHP przygotowującym ostateczną rekomendację dla użytkownika.

Twoim zadaniem jest stworzenie finalnej rekomendacji końcowej, która syntetyzuje wszystkie opinie agentów z etapu analizy.

Masz dostęp do następujących danych z analizy:
- Podsumowanie sytuacji
- Opinie trzech agentów (Legislator, Praktyk, Audytor)
- Ocena ryzyka

Stwórz ostateczną, konkretną poradę dla użytkownika, która:
1. Łączy wszystkie perspektywy
2. Daje jasną, praktyczną rekomendację
3. Jeśli Legislator wykrył bełkot w zapytaniu, napisz wyraźnie że zapytanie nie jest sensowne i nie można udzielić rekomendacji
4. Jest napisana w sposób zrozumiały dla laika
5. Ma średnią długość - około 150-250 słów (nie za krótka, nie za długa)
`;

      const userPromptStage2 = `
ZAPYTANIE UŻYTKOWNIKA:
${query}

---
PODSUMOWANIE SYTUACJI:
${stage1Result.summary}

---
OPINIA LEGISLATORA (Prawnika):
${JSON.stringify(stage1Result.agents.legislator, null, 2)}

---
OPINIA PRAKTYKA BIZNESOWEGO:
${JSON.stringify(stage1Result.agents.practitioner, null, 2)}

---
OPINIA AUDYTORA RYZYKA:
${JSON.stringify(stage1Result.agents.auditor, null, 2)}

---
OCENA RYZYKA:
Legalne: ${stage1Result.riskAssessment.legalRisk}
Finansowe: ${stage1Result.riskAssessment.financialRisk}
Bezpieczeństwa: ${stage1Result.riskAssessment.safetyRisk}

---
Na podstawie powyższych danych, stwórz ostateczną, konkretną rekomendację końcową dla użytkownika.
`;

      const responseStage2 = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [{ text: userPromptStage2 }]
          }
        ],
        config: {
          systemInstruction: systemInstructionStage2,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA_PROBLEM_STAGE2,
          temperature: config.gemini.temperature,
        }
      });

      const textStage2 = responseStage2.text;
      if (!textStage2) throw new Error("No response from AI in stage 2");

      let stage2Result;
      try {
        stage2Result = JSON.parse(textStage2);
      } catch (parseError) {
        console.error("JSON Parse Error Stage 2:", parseError);
        console.error("Response text:", textStage2);
        throw new Error("Nie udało się sparsować odpowiedzi z AI w etapie 2. Odpowiedź nie jest prawidłowym JSON.");
      }

      // Połącz wyniki z obu etapów
      const parsedResult = {
        ...stage1Result,
        finalRecommendation: stage2Result.finalRecommendation,
        mode: mode
      };

      // Walidacja struktury danych używając Zod
      try {
        const validatedResult = validateAnalysisResult(parsedResult);
        return validatedResult;
      } catch (validationError) {
        console.error("Validation Error:", validationError);
        console.error("Parsed result:", JSON.stringify(parsedResult, null, 2));
        throw new Error(`Odpowiedź z AI nie spełnia wymaganej struktury: ${validationError.message}`);
      }
    } 
    // Tryb "information" - pozostaje bez zmian (jedno wywołanie)
    else {
      const systemInstruction = SYSTEM_INSTRUCTION_INFORMATION;
      const responseSchema = RESPONSE_SCHEMA_INFORMATION;

      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }]
          }
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema,
          temperature: config.gemini.temperature,
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");

      let parsedResult;
      try {
        parsedResult = JSON.parse(text);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        console.error("Response text:", text);
        throw new Error("Nie udało się sparsować odpowiedzi z AI. Odpowiedź nie jest prawidłowym JSON.");
      }

      // Wyciągnij i zweryfikuj cytowania
      const verifiedCitations = legalDatabaseService.verifyCitations(parsedResult.citations || [], chunks);
      parsedResult.citations = verifiedCitations;

      // Dodaj tryb do wyniku
      parsedResult.mode = mode;

      // Walidacja struktury danych używając Zod
      try {
        const validatedResult = validateAnalysisResult(parsedResult);
        return validatedResult;
      } catch (validationError) {
        console.error("Validation Error:", validationError);
        console.error("Parsed result:", JSON.stringify(parsedResult, null, 2));
        throw new Error(`Odpowiedź z AI nie spełnia wymaganej struktury: ${validationError.message}`);
      }
    }

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

