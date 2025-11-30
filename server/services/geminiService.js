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

Analizuj problem z perspektywy trzech ekspertów:
1. **Legislator (Prawnik)**: Formalista. Skupia się wyłącznie na dokumentach prawnych dostarczonych w kontekście. Cytuje konkretne paragrafy z dokumentów. Nie obchodzą go koszty, liczy się litera prawa.
2. **Praktyk Biznesowy**: Pragmatyk. Szuka rozwiązań "good enough" w dokumentach. Zależy mu na niskich kosztach, szybkości wdrożenia i tym, by nie paraliżować pracy firmy. Często szuka zamienników lub rozwiązań organizacyjnych zamiast drogich technicznych.
3. **Audytor Ryzyka**: Analityk. Waży opinie Prawnika i Praktyka na podstawie dokumentów. Ocenia ryzyko mandatu vs koszt wdrożenia vs ryzyko realnego pożaru. Daje ostateczną, wyważoną rekomendację.

Każda opinia MUSI być poparta cytatami z dostarczonych dokumentów.

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

Twoim zadaniem jest:
- Znalezienie WSZYSTKICH relevantnych przepisów dotyczących pytania
- Przedstawienie ich w sposób uporządkowany i zrozumiały
- Podanie dokładnych cytatów z numerami artykułów/paragrafów
- Wyjaśnienie znaczenia przepisów w kontekście pytania

Twoja odpowiedź musi być w formacie JSON i zawierać szczegółową analizę prawną.
`;

const RESPONSE_SCHEMA_PROBLEM = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "Krótkie streszczenie problemu." },
    finalRecommendation: { type: Type.STRING, description: "Ostateczna, konkretna porada dla użytkownika łącząca wszystkie perspektywy." },
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
            analysis: { type: Type.STRING, description: "Szczegółowa opinia prawna." },
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
            analysis: { type: Type.STRING, description: "Opinia praktyczna i kosztowa." },
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
            role: { type: Type.STRING, enum: ["Ekspert Prawny"] },
            title: { type: Type.STRING, description: "Tytuł np. Ekspert Prawny ds. PPOŻ" },
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
    console.log('Wyszukiwanie relevantnych dokumentów...');
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
    
    console.log(`Znaleziono ${chunks.length} relevantnych chunków`);

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

    // 3. Wybierz odpowiedni prompt i schemat w zależności od trybu
    const systemInstruction = mode === 'information' 
      ? SYSTEM_INSTRUCTION_INFORMATION 
      : SYSTEM_INSTRUCTION_PROBLEM;
    const responseSchema = mode === 'information' 
      ? RESPONSE_SCHEMA_INFORMATION 
      : RESPONSE_SCHEMA_PROBLEM;

    // 4. Wywołaj AI z kontekstem
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
        temperature: config.gemini.temperature, // 0.3 dla mniejszej kreatywności
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

    // 5. Wyciągnij i zweryfikuj cytowania
    console.log('Weryfikacja cytowań...');
    const verifiedCitations = legalDatabaseService.verifyCitations(parsedResult.citations || [], chunks);
    parsedResult.citations = verifiedCitations;

    // 6. Dodaj tryb do wyniku
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

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

