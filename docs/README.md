# 🔥 Doradca PPOŻ AI

> Inteligentny system wsparcia decyzji w zakresie ochrony przeciwpożarowej i bezpieczeństwa pracy, wykorzystujący sztuczną inteligencję do analizy problemów PPOŻ/BHP z perspektywy trzech wirtualnych ekspertów.

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-Private-red.svg)](LICENSE)

</div>

## 🎯 Problem

Firmy i instytucje często napotykają problemy z interpretacją przepisów PPOŻ/BHP, które wymagają konsultacji z wieloma ekspertami (prawnikiem, praktykiem biznesowym, audytorem). Tradycyjne konsultacje są czasochłonne, kosztowne i nie zawsze dostępne. Dodatkowo, modele AI mogą generować nieprawdziwe informacje (halucynacje), co jest szczególnie niebezpieczne w kontekście przepisów prawnych.

**Doradca PPOŻ AI** rozwiązuje te problemy poprzez:
- Automatyczną analizę problemów z trzech perspektyw eksperckich
- Weryfikację odpowiedzi na podstawie rzeczywistych dokumentów prawnych (RAG)
- Eliminację halucynacji AI poprzez system weryfikacji cytowań
- Szybką i dostępną 24/7 analizę problemów PPOŻ/BHP

## 🎬 Demo

<!-- TODO: Dodaj GIF demonstracyjny aplikacji -->
<div align="center">
  <img src="path/to/demo.gif" alt="Demo aplikacji" width="800"/>
</div>

## ✨ Funkcjonalności

### Główne funkcje

- 🤖 **Analiza AI** - Inteligentna analiza problemów PPOŻ/BHP z wykorzystaniem Google Gemini
- 🎯 **Dwa tryby analizy**:
  - **Tryb Informacji** - Szczegółowe odpowiedzi oparte wyłącznie na przepisach prawnych
  - **Tryb Problemu** - Kompleksowa analiza z perspektywy trzech ekspertów
- 👥 **Trzy perspektywy ekspertów**:
  - **Legislator (Prawnik)** - analizuje zgodność z przepisami prawa i normami
  - **Praktyk Biznesowy** - ocenia koszty i praktyczność rozwiązań
  - **Audytor Ryzyka** - syntetyzuje opinie i daje ostateczną rekomendację
- 📊 **Ocena ryzyka** - Automatyczna ocena ryzyka prawnego, finansowego i bezpieczeństwa
- 📚 **System RAG** - Weryfikacja cytowań na podstawie rzeczywistych dokumentów prawnych (eliminacja halucynacji AI)
- 📖 **Historia analiz** - Automatyczne zapisywanie i przeglądanie poprzednich analiz
- 💾 **Eksport raportów** - Generowanie raportów w formatach PDF i DOCX
- 🖨️ **Drukowanie** - Optymalizacja raportów do druku
- 🎨 **Nowoczesny UI** - Responsywny interfejs z obsługą trybu ciemnego
- ⚡ **Cache** - Inteligentne cache'owanie wyników dla szybszych odpowiedzi
- 🔒 **Bezpieczeństwo** - API Key przechowywany tylko w backendzie

## 📸 Zrzuty ekranu

<!-- TODO: Dodaj zrzuty ekranu aplikacji -->
<div align="center">
  <img src="path/to/screenshot1.png" alt="Dashboard" width="400"/>
  <img src="path/to/screenshot2.png" alt="Analiza ekspertów" width="400"/>
  <img src="path/to/screenshot3.png" alt="Eksport raportu" width="400"/>
</div>

## 🗺️ Roadmap

### ✅ Zrealizowane
- [x] System RAG z weryfikacją cytowań prawnych
- [x] Dwa tryby analizy (Informacja i Problem)
- [x] Historia analiz z możliwością przeglądania
- [x] Eksport raportów do PDF i DOCX
- [x] Optymalizacja drukowania raportów
- [x] Backend z Express.js dla bezpieczeństwa
- [x] Rate limiting i middleware bezpieczeństwa
- [x] Nowoczesny UI z glassmorphism effects

### 🚧 W trakcie
- [ ] Weryfikacja cytowań - rzeczywiste linki ISAP
- [ ] Responsywność na bardzo małych ekranach
- [ ] Optymalizacja memoization

### 📋 Planowane
- [ ] Wersjonowanie raportów
- [ ] Integracja z kalendarzem (przypomnienia)
- [ ] PWA support (offline mode)
- [ ] Multi-language support
- [ ] Integracja z zewnętrznymi bazami danych prawnych

## 🛠️ Tech Stack

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
- **OpenAI API** - Embeddings dla systemu RAG
- **Zod** - Walidacja schematów

### Narzędzia
- **Concurrently** - Uruchamianie wielu procesów
- **ChromaDB** - Vectorstore dla RAG

## 🚀 Szybki start

1. **Zainstaluj zależności:**
   ```bash
   npm install
   ```

2. **Utwórz plik `.env` w głównym katalogu:**
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3003
   VITE_API_BASE_URL=http://localhost:3003
   ```

3. **Uruchom aplikację:**
```bash
npm run dev:all
```

Backend: `http://localhost:3003` | Frontend: `http://localhost:5175`

## 📚 Dokumentacja

- [SETUP.md](./SETUP.md) - Szczegółowa instrukcja instalacji
- [SECURITY.md](./SECURITY.md) - Informacje o bezpieczeństwie
- [TODO.md](./TODO.md) - Lista zadań i planów rozwoju

## ⚠️ Uwaga

**Pamiętaj:** Sztuczna inteligencja może popełniać błędy. Zawsze konsultuj decyzje z uprawnionym rzeczoznawcą.

---

<div align="center">

Made with ❤️ using React, TypeScript, and Google Gemini

</div>
