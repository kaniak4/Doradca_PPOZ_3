/**
 * Konfiguracja serwera
 * Wartości mogą być nadpisane przez zmienne środowiskowe
 */

export const config = {
  // Konfiguracja modelu AI
  gemini: {
    // Model Gemini do użycia
    // Dostępne opcje: "gemini-2.5-flash", "gemini-2.0-flash-exp", "gemini-1.5-pro"
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    
    // Temperatura modelu (0.0 - 2.0)
    // Niższe wartości = bardziej deterministyczne odpowiedzi
    // Wyższe wartości = bardziej kreatywne odpowiedzi
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.4,
  },
  
  // Konfiguracja serwera
  server: {
    port: parseInt(process.env.PORT) || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
};

