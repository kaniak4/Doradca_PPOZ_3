export type AnalysisMode = 'information' | 'problem';

export enum ExpertRole {
  LEGISLATOR = 'Legislator',
  PRACTITIONER = 'Praktyk',
  AUDITOR = 'Audytor',
  LEGAL_EXPERT = 'Aspekt Prawny' // Dla trybu "Informacja"
}

export interface Citation {
  source: string;
  reliability: 'Wysokie' | 'Średnie' | 'Niskie';
  snippet: string;
  url?: string;
  verified: boolean; // Zawsze true dla RAG (bo pochodzi z dokumentów)
  chunkId?: string; // ID chunka w vectorstore
  articleNumber?: string; // Numer artykułu/paragrafu (np. "Art. 15", "§ 3")
  pageNumber?: number; // Numer strony w PDF
}

export interface AgentResponse {
  role: ExpertRole;
  title: string;
  analysis: string;
  keyPoints: string[];
  recommendationScore: number; // 0-100
}

export interface AnalysisResult {
  mode: AnalysisMode;
  summary: string;
  finalRecommendation: string;
  agents: {
    legislator?: AgentResponse;
    practitioner?: AgentResponse;
    auditor?: AgentResponse;
    legalExpert?: AgentResponse; // Dla trybu "Informacja"
  };
  citations: Citation[];
  riskAssessment: {
    legalRisk: 'Niskie' | 'Średnie' | 'Wysokie';
    financialRisk: 'Niskie' | 'Średnie' | 'Wysokie';
    safetyRisk: 'Niskie' | 'Średnie' | 'Wysokie';
  };
}

export type TabView = 'SUMMARY' | 'EXPERTS' | 'CITATIONS' | 'EXPORT';

export interface HistoryEntry {
  id: string;
  query: string;
  timestamp: number;
  summary: string;
  finalRecommendation: string;
  riskAssessment: {
    legalRisk: 'Niskie' | 'Średnie' | 'Wysokie';
    financialRisk: 'Niskie' | 'Średnie' | 'Wysokie';
    safetyRisk: 'Niskie' | 'Średnie' | 'Wysokie';
  };
  citationsCount: number;
  // Pełny wynik zapisany dla możliwości przywrócenia
  fullResult: AnalysisResult;
}