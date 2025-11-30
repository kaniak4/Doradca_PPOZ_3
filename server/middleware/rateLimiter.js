/**
 * Prosty rate limiter - globalny (na cały serwer)
 * Dla narzędzia używanego przez jedną osobę wystarczy globalny limit
 */

// Konfiguracja
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minuta
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '10', 10), // domyślnie 10/min
  enabled: process.env.RATE_LIMIT_ENABLED !== 'false', // domyślnie włączony
};

// Przechowuje liczniki zapytań (timestampy)
let requestTimestamps = [];

/**
 * Czyści stare zapytania (starsze niż okno czasowe)
 */
const cleanOldRequests = () => {
  const now = Date.now();
  requestTimestamps = requestTimestamps.filter(
    timestamp => now - timestamp < RATE_LIMIT.windowMs
  );
};

/**
 * Rate limiting middleware
 */
export const rateLimiter = (req, res, next) => {
  // Wyłącz w development jeśli ustawione
  if (process.env.NODE_ENV === 'development' && process.env.RATE_LIMIT_ENABLED === 'false') {
    return next();
  }

  // Wyłącz jeśli globalnie wyłączony
  if (!RATE_LIMIT.enabled) {
    return next();
  }

  const now = Date.now();

  // Wyczyść stare zapytania
  cleanOldRequests();

  // Sprawdź limit
  if (requestTimestamps.length >= RATE_LIMIT.maxRequests) {
    const oldestRequest = requestTimestamps[0];
    const waitTime = Math.ceil((RATE_LIMIT.windowMs - (now - oldestRequest)) / 1000);
    
    return res.status(429).json({
      error: 'Przekroczono limit zapytań',
      message: `Maksymalnie ${RATE_LIMIT.maxRequests} zapytań na minutę. Spróbuj ponownie za ${waitTime} sekund.`,
      retryAfter: waitTime,
      limit: RATE_LIMIT.maxRequests,
      window: RATE_LIMIT.windowMs / 1000,
    });
  }

  // Dodaj timestamp bieżącego zapytania
  requestTimestamps.push(now);

  // Dodaj nagłówki informujące o limicie
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT.maxRequests);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT.maxRequests - requestTimestamps.length));
  res.setHeader('X-RateLimit-Reset', new Date(now + RATE_LIMIT.windowMs).toISOString());

  next();
};

/**
 * Zwraca statystyki rate limitera (dla debugowania)
 */
export const getRateLimitStats = () => {
  cleanOldRequests();
  return {
    enabled: RATE_LIMIT.enabled,
    limit: RATE_LIMIT.maxRequests,
    window: RATE_LIMIT.windowMs / 1000,
    currentRequests: requestTimestamps.length,
    remaining: Math.max(0, RATE_LIMIT.maxRequests - requestTimestamps.length),
  };
};

