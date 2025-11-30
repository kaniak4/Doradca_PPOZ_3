import { z } from 'zod';

/**
 * Schemat walidacji dla odpowiedzi z API Gemini
 * Zapewnia type safety i walidację struktury danych
 */

const ExpertRoleSchema = z.enum(['Legislator', 'Praktyk', 'Audytor']);

const AgentResponseSchema = z.object({
  role: ExpertRoleSchema,
  title: z.string().min(1, 'Tytuł nie może być pusty'),
  analysis: z.string().min(10, 'Analiza musi mieć co najmniej 10 znaków'),
  keyPoints: z.array(z.string().min(1)).min(1, 'Musi być co najmniej jeden kluczowy argument'),
  recommendationScore: z.number().int().min(0).max(100, 'Ocena musi być między 0 a 100'),
});

const CitationSchema = z.object({
  source: z.string().min(1, 'Źródło nie może być puste'),
  reliability: z.enum(['Wysokie', 'Średnie', 'Niskie']),
  snippet: z.string().min(1, 'Cytat nie może być pusty'),
  url: z.string().url().optional().or(z.literal('')),
});

const RiskLevelSchema = z.enum(['Niskie', 'Średnie', 'Wysokie']);

export const AnalysisResultSchema = z.object({
  summary: z.string().min(10, 'Podsumowanie musi mieć co najmniej 10 znaków'),
  finalRecommendation: z.string().min(10, 'Rekomendacja musi mieć co najmniej 10 znaków'),
  agents: z.object({
    legislator: AgentResponseSchema.refine(
      (agent) => agent.role === 'Legislator',
      { message: 'Legislator musi mieć role "Legislator"' }
    ),
    practitioner: AgentResponseSchema.refine(
      (agent) => agent.role === 'Praktyk',
      { message: 'Practitioner musi mieć role "Praktyk"' }
    ),
    auditor: AgentResponseSchema.refine(
      (agent) => agent.role === 'Audytor',
      { message: 'Auditor musi mieć role "Audytor"' }
    ),
  }),
  citations: z.array(CitationSchema),
  riskAssessment: z.object({
    legalRisk: RiskLevelSchema,
    financialRisk: RiskLevelSchema,
    safetyRisk: RiskLevelSchema,
  }),
});

/**
 * Waliduje odpowiedź z API i zwraca zwalidowane dane
 * @param {unknown} data - Dane do walidacji
 * @returns {Promise<z.infer<typeof AnalysisResultSchema>>} - Zwalidowane dane
 * @throws {Error} - Jeśli walidacja się nie powiedzie
 */
export const validateAnalysisResult = (data) => {
  try {
    return AnalysisResultSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      throw new Error(`Walidacja odpowiedzi z API nie powiodła się: ${errorMessages}`);
    }
    throw error;
  }
};

