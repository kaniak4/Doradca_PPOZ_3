export enum ExpertRole {
  LEGISLATOR = 'Legislator',
  PRACTITIONER = 'Praktyk',
  AUDITOR = 'Audytor'
}

export interface Citation {
  source: string;
  reliability: 'High' | 'Medium' | 'Low';
  snippet: string;
  url?: string;
}

export interface AgentResponse {
  role: ExpertRole;
  title: string;
  analysis: string;
  keyPoints: string[];
  recommendationScore: number; // 0-100
}

export interface AnalysisResult {
  summary: string;
  finalRecommendation: string;
  agents: {
    legislator: AgentResponse;
    practitioner: AgentResponse;
    auditor: AgentResponse;
  };
  citations: Citation[];
  riskAssessment: {
    legalRisk: 'Low' | 'Medium' | 'High';
    financialRisk: 'Low' | 'Medium' | 'High';
    safetyRisk: 'Low' | 'Medium' | 'High';
  };
}

export type TabView = 'SUMMARY' | 'EXPERTS' | 'CITATIONS' | 'EXPORT';