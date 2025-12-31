/**
 * Middleware bezpieczeństwa - HTTPS redirect, CSP, i inne nagłówki bezpieczeństwa
 */

/**
 * Wymusza przekierowanie HTTP → HTTPS w produkcji
 */
export const enforceHTTPS = (req, res, next) => {
  // W development nie wymuszamy HTTPS
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  // Sprawdź czy request przyszedł przez HTTPS lub przez proxy (X-Forwarded-Proto)
  const isSecure = req.secure || 
                   req.headers['x-forwarded-proto'] === 'https' ||
                   req.headers['x-forwarded-ssl'] === 'on';

  if (!isSecure) {
    const httpsUrl = `https://${req.headers.host}${req.originalUrl}`;
    return res.redirect(301, httpsUrl);
  }

  next();
};

/**
 * Ustawia nagłówki Content Security Policy
 */
export const setCSPHeaders = (req, res, next) => {
  // W development - bardziej liberalna polityka dla development tools
  const isDevelopment = process.env.NODE_ENV === 'development';

  const cspPolicy = isDevelopment
    ? [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com", // Tailwind CDN + development tools
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' http://localhost:* https:",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ')
    : [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https:",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
        "upgrade-insecure-requests",
      ].join('; ');

  res.setHeader('Content-Security-Policy', cspPolicy);
  next();
};

/**
 * Ustawia dodatkowe nagłówki bezpieczeństwa
 */
export const setSecurityHeaders = (req, res, next) => {
  // HSTS - HTTP Strict Transport Security (tylko w produkcji)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // X-Frame-Options - zapobiega clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // X-Content-Type-Options - zapobiega MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-XSS-Protection - dodatkowa ochrona przed XSS (legacy, ale pomaga w starszych przeglądarkach)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer-Policy - kontrola przekazywania referrer
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy - kontrola funkcji przeglądarki
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
  );

  next();
};

/**
 * Kombinacja wszystkich middleware bezpieczeństwa
 */
export const securityMiddleware = [enforceHTTPS, setCSPHeaders, setSecurityHeaders];

