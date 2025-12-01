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
 * Sprawdza czy tekst wygląda na losowy/nonsensowny ciąg znaków
 * Wykrywa przypadki typu "asdasfasgaewsgfsegaegg"
 * Ta sama logika co w frontendzie dla spójności
 */
const isLikelyRandomText = (text) => {
  const trimmed = text.trim();
  
  // 1. Sprawdź czy zawiera spacje (sensowne zdania mają spacje między słowami)
  // Jeśli brak spacji i długość > 15 znaków, prawdopodobnie losowy ciąg
  if (!trimmed.includes(' ') && trimmed.length > 15) {
    // Wyjątek: może być jedno długie słowo (sprawdzamy czy ma sensowne wzorce)
    const hasRepeatingPattern = /(.{2,})\1{2,}/.test(trimmed); // Powtarzające się wzorce
    if (hasRepeatingPattern) {
      return true;
    }
    
    // Sprawdź różnorodność znaków (entropia)
    const uniqueChars = new Set(trimmed.toLowerCase()).size;
    const entropyRatio = uniqueChars / trimmed.length;
    
    // Dla ciągów 16-20 znaków: jeśli entropia < 0.5 (za mało różnorodności), blokuj
    if (trimmed.length <= 20 && entropyRatio < 0.5) {
      return true;
    }
    
    // Dla dłuższych ciągów (> 20): bardziej restrykcyjne sprawdzenie
    if (trimmed.length > 20 && entropyRatio < 0.4) {
      return true;
    }
  }
  
  // 2. Sprawdź proporcję liter do nie-liter
  const letterMatch = trimmed.match(/[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g);
  const letterCount = letterMatch ? letterMatch.length : 0;
  const letterRatio = letterCount / trimmed.length;
  
  // Jeśli mniej niż 60% liter (dużo losowych znaków), prawdopodobnie losowy
  if (letterRatio < 0.6 && trimmed.length > 15) {
    return true;
  }
  
  // 3. Sprawdź czy składa się głównie z powtarzających się znaków
  const charCounts = {};
  for (const char of trimmed.toLowerCase()) {
    charCounts[char] = (charCounts[char] || 0) + 1;
  }
  const maxCharCount = Math.max(...Object.values(charCounts));
  const maxCharRatio = maxCharCount / trimmed.length;
  
  // Jeśli jeden znak stanowi więcej niż 40% tekstu, prawdopodobnie losowy
  if (maxCharRatio > 0.4 && trimmed.length > 20) {
    return true;
  }
  
  // 4. Sprawdź czy zawiera sensowne słowa (ciągi liter oddzielone spacjami/punktacją)
  // Policz słowa (ciągi liter/cyfr)
  const words = trimmed.split(/[\s\p{P}]+/u).filter(w => w.length > 1);
  if (words.length === 0 && trimmed.length > 15) {
    return true; // Brak słów w długim tekście
  }
  
  // Jeśli jest tylko jedno "słowo" ale jest bardzo długie i nie ma sensu
  if (words.length === 1 && words[0].length > 30) {
    const word = words[0];
    // Sprawdź czy to nie jest ciąg losowy (wysoka entropia + brak wzorców)
    const uniqueInWord = new Set(word.toLowerCase()).size;
    if (uniqueInWord / word.length < 0.5) {
      return true; // Za mało różnorodności
    }
  }
  
  // 5. Sprawdź czy nie składa się głównie z samych spacji i znaków specjalnych
  const meaningfulChars = trimmed.match(/[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ0-9]/g);
  if (meaningfulChars && meaningfulChars.length < trimmed.length * 0.5) {
    return true;
  }
  
  return false;
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
    .refine(
      (val) => {
        const sanitized = sanitizeQuery(val);
        return !isLikelyRandomText(sanitized);
      },
      {
        message: 'Zapytanie wygląda na losowy ciąg znaków. Wprowadź sensowne pytanie dotyczące PPOŻ/BHP.',
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

