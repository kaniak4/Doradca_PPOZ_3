import { z } from 'zod';

/**
 * Schemat walidacji dla request body w /api/analyze
 * Zapewnia walidację i sanitizację danych wejściowych
 */

/**
 * Sanityzuje zapytanie - usuwa potencjalnie niebezpieczne znaki
 * ale zachowuje polskie znaki diakrytyczne
 */
const sanitizeQuery = (query) => {
  if (typeof query !== 'string') {
    return '';
  }
  
  // Usuń znaki kontrolne (oprócz nowych linii i tabulatorów)
  // Zachowaj polskie znaki i podstawowe znaki interpunkcyjne
  return query
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Usuń znaki kontrolne
    .trim();
};

/**
 * Schemat walidacji dla zapytania użytkownika
 */
export const AnalyzeRequestSchema = z.object({
  query: z
    .string({
      required_error: 'Query is required',
      invalid_type_error: 'Query must be a string',
    })
    .min(10, 'Query must be at least 10 characters long')
    .max(2000, 'Query must not exceed 2000 characters')
    .refine(
      (val) => {
        const sanitized = sanitizeQuery(val);
        return sanitized.length >= 10;
      },
      {
        message: 'Query contains invalid characters or is too short after sanitization',
      }
    )
    .transform(sanitizeQuery), // Automatyczna sanitizacja
  mode: z
    .enum(['information', 'problem'], {
      errorMap: () => ({ message: 'Mode must be either "information" or "problem"' })
    })
    .default('problem')
    .optional(),
});

/**
 * Waliduje i sanitizuje request body
 * @param {unknown} data - Dane do walidacji
 * @returns {Promise<{ query: string }>} - Zwalidowane i zsanitizowane dane
 * @throws {z.ZodError} - Jeśli walidacja się nie powiedzie
 */
export const validateAnalyzeRequest = (data) => {
  try {
    return AnalyzeRequestSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      throw new Error(`Walidacja request nie powiodła się: ${errorMessages}`);
    }
    throw error;
  }
};

