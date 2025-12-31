# Bezpieczeństwo

## 1. Bezpieczeństwo API Key

## Problem (PRZED)

❌ **API Key był eksportowany do bundle JavaScript frontendu**
- `process.env.API_KEY` był dostępny w kodzie frontendowym przez Vite
- Klucz API mógł być wycieknięty w bundle JavaScript
- Każdy użytkownik mógł zobaczyć API Key w kodzie źródłowym przeglądarki

## Rozwiązanie (PO)

✅ **API Key jest teraz bezpiecznie przechowywany tylko w backendzie**

### Architektura

```
Frontend (React)          Backend (Node.js/Express)        Gemini API
     │                            │                              │
     │  POST /api/analyze         │                              │
     ├───────────────────────────>│                              │
     │                            │  Wywołanie z API Key         │
     │                            ├─────────────────────────────>│
     │                            │                              │
     │                            │  Odpowiedź                   │
     │                            │<─────────────────────────────│
     │  Wynik analizy             │                              │
     │<───────────────────────────│                              │
```

### Zmiany

1. **Backend (`server/`)**
   - Przechowuje API Key w zmiennych środowiskowych
   - API Key nigdy nie opuszcza serwera
   - Endpoint `/api/analyze` przyjmuje zapytania i zwraca wyniki

2. **Frontend (`services/geminiService.ts`)**
   - Nie zawiera API Key
   - Wywołuje backend przez HTTP POST
   - Używa `fetch()` do komunikacji z backendem

3. **Konfiguracja Vite**
   - Usunięto eksport `process.env.API_KEY` do frontendu
   - Dodano proxy do backendu w trybie development
   - Zmienne środowiskowe z prefiksem `VITE_` są dostępne tylko dla frontendu

### Konfiguracja

Utwórz plik `.env` w głównym katalogu:

```env
# Tylko backend - NIE jest eksportowany do frontendu
GEMINI_API_KEY=your_gemini_api_key_here

# Port backendu (opcjonalne)
PORT=3003

# URL backendu dla frontendu (opcjonalne)
VITE_API_BASE_URL=http://localhost:3003
```

### Weryfikacja

Aby sprawdzić, że API Key nie jest w bundle frontendu:

1. Zbuduj projekt: `npm run build`
2. Sprawdź plik `dist/assets/index-*.js`
3. Wyszukaj "GEMINI_API_KEY" lub swój klucz API
4. **Nie powinien być znaleziony** ✅

### Uruchomienie

```bash
# Uruchom frontend i backend jednocześnie
npm run dev:all

# Lub osobno:
npm run dev:server  # Backend na porcie 3003
npm run dev         # Frontend na porcie 5175
```

---

## 2. HTTPS Enforcement

### Problem

❌ **Brak wymuszania bezpiecznego połączenia**
- Aplikacja mogła działać przez HTTP w produkcji
- Dane przesyłane niezaszyfrowane
- Ryzyko ataków man-in-the-middle

### Rozwiązanie

✅ **Automatyczne przekierowanie HTTP → HTTPS w produkcji**

### Implementacja

Middleware `enforceHTTPS` (`server/middleware/security.js`):
- Sprawdza czy request przyszedł przez HTTPS
- Wspiera proxy (X-Forwarded-Proto header)
- Automatyczne przekierowanie 301 (permanent redirect)
- **Wyłączone w development** - działa tylko w produkcji

### Jak działa

1. **Development**: HTTPS nie jest wymuszany - pozwala na łatwe testowanie lokalnie
2. **Production**: Wszystkie HTTP requests są automatycznie przekierowywane na HTTPS

### Konfiguracja

Middleware automatycznie wykrywa produkcję przez `NODE_ENV=production`:

```bash
# Development - HTTPS nie jest wymuszany
NODE_ENV=development npm run dev:server

# Production - HTTPS jest wymuszany
NODE_ENV=production npm run start:server
```

### Wsparcie dla proxy/reverse proxy

Jeśli aplikacja działa za reverse proxy (nginx, cloudflare, etc.), middleware automatycznie wykrywa HTTPS przez:
- `X-Forwarded-Proto: https` header
- `X-Forwarded-SSL: on` header

---

## 3. Content Security Policy (CSP) i Nagłówki Bezpieczeństwa

### Problem

❌ **Brak nagłówków bezpieczeństwa**
- Brak ochrony przed XSS
- Brak ochrony przed clickjacking
- Brak kontroli nad zasobami zewnętrznymi

### Rozwiązanie

✅ **Kompletny zestaw nagłówków bezpieczeństwa**

### Implementowane nagłówki

#### Content Security Policy (CSP)

Kontroluje, jakie zasoby mogą być ładowane:

**Development:**
- `'unsafe-inline'` i `'unsafe-eval'` dla development tools
- Zezwala na `http://localhost:*` dla hot-reload

**Production:**
- Restrykcyjna polityka bez `'unsafe-eval'`
- `upgrade-insecure-requests` - automatyczne przekierowanie HTTP → HTTPS
- Tylko HTTPS dla połączeń zewnętrznych

#### HTTP Strict Transport Security (HSTS)

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```
- Wymusza HTTPS przez 1 rok
- Działa tylko w produkcji

#### X-Frame-Options

```
X-Frame-Options: DENY
```
- Blokuje osadzanie strony w iframe (ochrona przed clickjacking)

#### X-Content-Type-Options

```
X-Content-Type-Options: nosniff
```
- Zapobiega MIME type sniffing

#### X-XSS-Protection

```
X-XSS-Protection: 1; mode=block
```
- Dodatkowa ochrona przed XSS w starszych przeglądarkach

#### Referrer-Policy

```
Referrer-Policy: strict-origin-when-cross-origin
```
- Kontroluje jakie informacje są przekazywane w referrer

#### Permissions-Policy

```
Permissions-Policy: geolocation=(), microphone=(), camera=(), ...
```
- Wyłącza niepotrzebne funkcje przeglądarki

### Plik konfiguracji

Wszystkie nagłówki są zdefiniowane w:
- `server/middleware/security.js`

### Testowanie

Sprawdź nagłówki w przeglądarce (DevTools → Network → Response Headers):

```bash
# Uruchom backend
npm run dev:server

# Sprawdź nagłówki w przeglądarce
curl -I http://localhost:3003/health
```

Powinieneś zobaczyć:
- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `X-XSS-Protection`
- `Referrer-Policy`
- `Permissions-Policy`

---

## Podsumowanie

✅ **API Key** - bezpiecznie przechowywany tylko w backendzie  
✅ **HTTPS Enforcement** - automatyczne przekierowanie w produkcji  
✅ **CSP Headers** - ochrona przed XSS i innymi atakami  
✅ **Security Headers** - kompletny zestaw nagłówków bezpieczeństwa

Aplikacja jest teraz znacznie bardziej bezpieczna! 🔒
