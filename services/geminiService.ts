import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, ExpertRole } from "../types";

const SYSTEM_INSTRUCTION = `
Jesteś silnikiem symulacyjnym aplikacji "Doradca PPOŻ". Twoim zadaniem jest przeanalizowanie problemu użytkownika z zakresu BHP i ochrony przeciwpożarowej (PPOŻ) z perspektywy trzech wirtualnych ekspertów:

1. **Legislator (Prawnik)**: Formalista. Skupia się wyłącznie na Ustawie o ochronie przeciwpożarowej, Kodeksie Pracy i Rozporządzeniach MSWiA. Cytuje konkretne paragrafy. Nie obchodzą go koszty, liczy się litera prawa.
2. **Praktyk Biznesowy**: Pragmatyk. Szuka rozwiązań "good enough". Zależy mu na niskich kosztach, szybkości wdrożenia i tym, by nie paraliżować pracy firmy. Często szuka zamienników lub rozwiązań organizacyjnych zamiast drogich technicznych.
3. **Audytor Ryzyka**: Analityk. Waży opinie Prawnika i Praktyka. Ocenia ryzyko mandatu vs koszt wdrożenia vs ryzyko realnego pożaru. Daje ostateczną, wyważoną rekomendację.

Twoja odpowiedź musi być w formacie JSON i zawierać analizę każdego z nich.
`;

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "Krótkie streszczenie problemu." },
    finalRecommendation: { type: Type.STRING, description: "Ostateczna, konkretna porada dla użytkownika łącząca wszystkie perspektywy." },
    riskAssessment: {
      type: Type.OBJECT,
      properties: {
        legalRisk: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
        financialRisk: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
        safetyRisk: { type: Type.STRING, enum: ["Low", "Medium", "High"] }
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
          reliability: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
          snippet: { type: Type.STRING, description: "Krótki cytat lub numer artykułu." },
          url: { type: Type.STRING, description: "Link do ISAP lub wiarygodnego źródła (opcjonalnie)." }
        },
        required: ["source", "reliability", "snippet"]
      }
    }
  },
  required: ["summary", "finalRecommendation", "agents", "riskAssessment", "citations"]
};

export const analyzeSafetyQuery = async (query: string): Promise<AnalysisResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });

  // Using gemini-2.5-flash for speed and efficiency
  const model = "gemini-2.5-flash";

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [{ text: `Analizuj następujący problem PPOŻ/BHP: "${query}"` }]
        }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.4, // Keep it relatively deterministic but creative enough for different personas
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text) as AnalysisResult;
    return result;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};