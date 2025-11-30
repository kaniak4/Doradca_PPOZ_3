<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🔥 Doradca PPOŻ AI

> Inteligentny system wsparcia decyzji w zakresie ochrony przeciwpożarowej i bezpieczeństwa pracy, wykorzystujący sztuczną inteligencję do analizy problemów PPOŻ/BHP z perspektywy trzech wirtualnych ekspertów.

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-Private-red.svg)](LICENSE)

</div>

## 📋 Spis treści

- [O projekcie](#-o-projekcie)
- [Funkcjonalności](#-funkcjonalności)
- [Technologie](#-technologie)
- [Wymagania](#-wymagania)
- [Instalacja](#-instalacja)
- [Konfiguracja](#-konfiguracja)
- [Uruchomienie](#-uruchomienie)
- [Struktura projektu](#-struktura-projektu)
- [API](#-api)
- [Bezpieczeństwo](#-bezpieczeństwo)
- [Development](#-development)
- [Licencja](#-licencja)

## 🎯 O projekcie

**Doradca PPOŻ AI** to aplikacja webowa, która wykorzystuje model językowy Google Gemini do analizy problemów z zakresu ochrony przeciwpożarowej (PPOŻ) i bezpieczeństwa pracy (BHP). System symuluje konsultację z trzema wirtualnymi ekspertami:

- **Legislator (Prawnik)** - analizuje zgodność z przepisami prawa i normami
- **Praktyk Biznesowy** - ocenia koszty i praktyczność rozwiązań
- **Audytor Ryzyka** - syntetyzuje opinie i daje ostateczną rekomendację

Aplikacja generuje szczegółowe raporty z oceną ryzyka (prawnego, finansowego, bezpieczeństwa) oraz weryfikacją źródeł prawnych.

## ✨ Funkcjonalności

### Główne funkcje

- 🤖 **Analiza AI** - Inteligentna analiza problemów PPOŻ/BHP z wykorzystaniem Google Gemini
- 👥 **Trzy perspektywy ekspertów** - Legislator, Praktyk Biznesowy, Audytor Ryzyka
- 📊 **Ocena ryzyka** - Automatyczna ocena ryzyka prawnego, finansowego i bezpieczeństwa
- 📚 **Weryfikacja źródeł** - Automatyczna weryfikacja cytowań prawnych
- 📄 **Eksport raportów** - Generowanie raportów w formatach PDF i DOCX
- 🎨 **Nowoczesny UI** - Responsywny interfejs z obsługą trybu ciemnego
- ⚡ **Cache** - Inteligentne cache'owanie wyników dla szybszych odpowiedzi
- 🔒 **Bezpieczeństwo** - API Key przechowywany tylko w backendzie

### Funkcje techniczne

- ⚡ **Asynchroniczne ładowanie** - Obsługa anulowania zapytań (AbortController)
- 🎯 **Walidacja** - Walidacja zapytań przed wysłaniem
- 🔄 **Retry logic** - Automatyczne ponawianie nieudanych zapytań
- 📈 **Health checks** - Monitoring stanu backendu
- 🛡️ **Rate limiting** - Ochrona przed nadużyciami
- 🌐 **CORS** - Skonfigurowane CORS dla bezpiecznej komunikacji

## 🛠️ Technologie

### Frontend

- **React 19.2** - Biblioteka UI
- **TypeScript 5.8** - Typowanie statyczne
- **Vite 6.2** - Build tool i dev server
- **Tailwind CSS 4.1** - Utility-first CSS framework
- **Lucide React** - Ikony
- **React PDF** - Generowanie PDF
- **Docx** - Generowanie dokumentów Word

### Backend

- **Node.js** - Runtime environment
- **Express 4.21** - Framework webowy
- **Google Gemini API** - Model językowy AI
- **Zod** - Walidacja schematów

### Narzędzia deweloperskie

- **Concurrently** - Uruchamianie wielu procesów
- **TypeScript** - Type checking

## 📦 Wymagania

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Google Gemini API Key** - [Jak uzyskać klucz API](https://ai.google.dev/)

## 🚀 Instalacja

1. **Sklonuj repozytorium**
   ```bash
   git clone <repository-url>
   cd PPOZ_Ekspert_2
   ```

2. **Zainstaluj zależności**
   ```bash
   npm install
   ```

## ⚙️ Konfiguracja

1. **Utwórz plik `.env` w głównym katalogu projektu:**
   ```bash
   # Google Gemini API Key (wymagane)
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # Port backendu (opcjonalne, domyślnie 3001)
   PORT=3001
   
   # URL backendu dla frontendu (opcjonalne)
   VITE_API_BASE_URL=http://localhost:3001
   
   # Środowisko (opcjonalne)
   NODE_ENV=development
   ```

2. **Uzyskaj klucz API Google Gemini:**
   - Przejdź do [Google AI Studio](https://ai.google.dev/)
   - Utwórz nowy projekt
   - Wygeneruj klucz API
   - Skopiuj klucz do pliku `.env`

   ⚠️ **Ważne:** Nigdy nie commituj pliku `.env` do repozytorium!

## ▶️ Uruchomienie

### Opcja 1: Uruchom frontend i backend jednocześnie (zalecane)

```bash
npm run dev:all
```

To uruchomi:
- Backend na `http://localhost:3001`
- Frontend na `http://localhost:3000`

### Opcja 2: Uruchom osobno

**Terminal 1 - Backend:**
```bash
npm run dev:server
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### Build produkcyjny

```bash
# Build frontendu
npm run build

# Uruchom serwer produkcyjny
npm run start:server
```

## 📁 Struktura projektu

```
PPOZ_Ekspert_2/
├── components/           # Komponenty React
│   ├── AgentCard.tsx     # Karta eksperta
│   ├── Dashboard.tsx     # Główny dashboard
│   ├── ErrorBoundary.tsx # Obsługa błędów
│   ├── Tooltip.tsx       # Tooltip z portalem
│   └── ...
├── hooks/                # Custom hooks
│   ├── useAnalysis.ts    # Hook do analizy
│   ├── useExport.ts      # Hook do eksportu
│   ├── useTheme.ts       # Hook do motywu
│   └── index.ts          # Eksport hooks
├── services/             # Frontend services
│   ├── geminiService.ts  # API client
│   ├── exportService.ts  # Eksport raportów
│   └── pdfReport.tsx    # Szablon PDF
├── server/               # Backend Node.js
│   ├── index.js          # Główny serwer Express
│   ├── middleware/      # Middleware
│   │   ├── security.js   # Security headers
│   │   └── rateLimiter.js # Rate limiting
│   ├── services/         # Backend services
│   │   ├── geminiService.js # Gemini API
│   │   └── cacheService.js  # Cache
│   └── validation/       # Walidacja
│       └── analysisSchema.js
├── types.ts              # TypeScript types
├── App.tsx               # Główny komponent
├── index.tsx             # Entry point
├── vite.config.ts        # Konfiguracja Vite
├── tsconfig.json         # Konfiguracja TypeScript
└── package.json          # Zależności
```

## 🔌 API

### Endpoints

#### `POST /api/analyze`

Analizuje zapytanie PPOŻ/BHP i zwraca szczegółową analizę.

**Request:**
```json
{
  "query": "Czy w małym magazynie 50m2 muszę montować hydrant wewnętrzny?"
}
```

**Response:**
```json
{
  "summary": "Krótkie streszczenie problemu",
  "finalRecommendation": "Ostateczna rekomendacja",
  "agents": {
    "legislator": {
      "role": "Legislator",
      "title": "Radca Prawny ds. PPOŻ",
      "analysis": "...",
      "keyPoints": ["..."],
      "recommendationScore": 85
    },
    "practitioner": { ... },
    "auditor": { ... }
  },
  "riskAssessment": {
    "legalRisk": "Wysokie",
    "financialRisk": "Średnie",
    "safetyRisk": "Niskie"
  },
  "citations": [
    {
      "source": "Rozporządzenie MSWiA",
      "reliability": "Wysokie",
      "snippet": "...",
      "url": "..."
    }
  ],
  "cached": false
}
```

#### `GET /health`

Sprawdza stan backendu.

**Response:**
```json
{
  "status": "ok",
  "message": "Backend is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### `GET /api/cache/stats` (tylko development)

Zwraca statystyki cache.

**Response:**
```json
{
  "size": 5,
  "maxSize": 100,
  "keys": ["query:...", ...]
}
```

#### `DELETE /api/cache` (tylko development)

Czyści cache.

#### `GET /api/rate-limit/stats` (tylko development)

Zwraca statystyki rate limitingu.

## 🔒 Bezpieczeństwo

### Ochrona API Key

✅ **API Key jest przechowywany tylko w backendzie**
- Frontend nie ma dostępu do API Key
- Wszystkie wywołania Gemini API przechodzą przez backend
- API Key nie jest eksportowany do bundle JavaScript

### Security Headers

Aplikacja implementuje następujące zabezpieczenia:
- **CSP (Content Security Policy)** - Ochrona przed XSS
- **HTTPS redirect** - Wymuszenie bezpiecznego połączenia (w produkcji)
- **Security headers** - Dodatkowe nagłówki bezpieczeństwa
- **CORS** - Skonfigurowane CORS dla bezpiecznej komunikacji
- **Rate limiting** - Ochrona przed nadużyciami

Więcej informacji w [SECURITY.md](./SECURITY.md)

## 💻 Development

### Struktura kodu

Aplikacja wykorzystuje następujące wzorce:

- **Hooks** - Logika biznesowa w custom hooks (`useAnalysis`, `useExport`, `useTheme`)
- **Services** - Warstwa abstrakcji API (`geminiService.ts`)
- **Components** - Komponenty UI oddzielone od logiki
- **Types** - Pełne typowanie TypeScript

### Cache

Backend implementuje cache w pamięci:
- **TTL:** 24 godziny
- **Max size:** 100 wpisów
- **Automatic cleanup:** Wygasłe wpisy są automatycznie usuwane

W produkcji można zastąpić Redis lub innym rozwiązaniem.

### Obsługa błędów

- **Error types** - Typy błędów dla lepszej obsługi (`ErrorType` enum)
- **Retry logic** - Automatyczne ponawianie nieudanych zapytań
- **Error boundaries** - React Error Boundaries dla UI
- **Timeout handling** - Obsługa timeoutów zapytań (60 sekund)

### Walidacja

- **Frontend** - Walidacja długości i formatu zapytań (10-2000 znaków)
- **Backend** - Walidacja schematów z użyciem Zod
- **Type safety** - Pełne typowanie TypeScript

## 📝 Licencja

Projekt jest prywatny i nie jest dostępny do publicznego użytku.

## 🤝 Wsparcie

W przypadku problemów lub pytań:
1. Sprawdź [SECURITY.md](./SECURITY.md) dla informacji o bezpieczeństwie
2. Sprawdź [SETUP.md](./SETUP.md) dla instrukcji instalacji
3. Sprawdź [KRYTYKA.md](./KRYTYKA.md) dla analizy architektury

## 📄 Dodatkowe informacje

- **Wersja:** 1.0.0
- **Status:** W rozwoju
- **Wymagania:** Node.js 18+, npm 9+

---

<div align="center">

**Pamiętaj:** Sztuczna inteligencja może popełniać błędy. Zawsze konsultuj decyzje z uprawnionym rzeczoznawcą.

Made with ❤️ using React, TypeScript, and Google Gemini

</div>
