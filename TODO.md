# 📋 TODO - Doradca PPOŻ AI

> Lista zadań do wykonania w najbliższych etapach produkcji i usprawnień

**Ostatnia aktualizacja:** 2024-12-30

---

## ✅ Zrealizowane (Reference)

### Bezpieczeństwo
- ✅ API Key przeniesiony do backendu
- ✅ Rate limiting (10 zapytań/minutę, konfigurowalne)
- ✅ Timeout dla zapytań (60 sekund)
- ✅ Walidacja długości zapytania (10-2000 znaków)
- ✅ Health check backendu
- ✅ Sanityzacja danych wejściowych (`server/validation/requestSchema.js`)
- ✅ Walidacja po stronie backendu z użyciem Zod
- ✅ Walidacja odpowiedzi z API (Zod schema)

### UX/UI
- ✅ Skeleton loaders dla każdej sekcji
- ✅ Progress bar z etapami przetwarzania
- ✅ Możliwość anulowania zapytania
- ✅ Lepsze komunikaty błędów z różnicowaniem typów
- ✅ Przycisk "Spróbuj ponownie" w komunikatach błędów
- ✅ Tooltips/help text dla kluczowych elementów
- ✅ Dark mode (light/dark toggle)
- ✅ ErrorBoundary
- ✅ Płynne animacje przejść między tabami
- ✅ React.memo dla optymalizacji komponentów

### Obsługa błędów
- ✅ Różnicowanie typów błędów (NETWORK, TIMEOUT, SERVER_ERROR, CLIENT_ERROR, RATE_LIMIT, ABORTED)
- ✅ Szczegółowe komunikaty błędów
- ✅ Retry mechanism (manual)
- ✅ Health check z wizualnym wskaźnikiem

### Infrastruktura
- ✅ Backend Express.js
- ✅ Cache dla zapytań (cacheService)
- ✅ .env.example z konfiguracją
- ✅ Middleware bezpieczeństwa (CSP, security headers)
- ✅ Konfiguracja centralna (`server/config.js`)
- ✅ TypeScript strict mode
- ✅ Lazy loading dla Dashboard

### Funkcjonalności
- ✅ Udostępnianie raportów (shareService)
- ✅ Eksport do DOCX i PDF

---

## 🎯 FAZA 1: Mockup/Demo → Stabilizacja
**Cel:** Ustabilizować podstawowe funkcjonalności, poprawić UX, przygotować do beta

### Krytyczne (Musi być przed beta)
- [ ] **Historia zapytań**
  - Problem: Użytkownik nie może wrócić do poprzednich analiz
  - Rozwiązanie: Dodać localStorage/IndexedDB dla historii
  - Komponenty: `hooks/useHistory.ts`, `components/HistoryPanel.tsx`
  - Funkcje: zapisywanie, wyszukiwanie, filtrowanie, usuwanie
  - **Priorytet:** Wysoki - podstawowa funkcjonalność

- [ ] **Weryfikacja cytowań - rzeczywiste linki ISAP**
  - Problem: Linki do ISAP są tylko placeholderami (`href="#"`)
  - Rozwiązanie: Zaimplementować rzeczywiste linki do ISAP/PKN
  - Plik: `components/Dashboard.tsx` (sekcja Citations)
  - API: Integracja z ISAP API lub generowanie linków na podstawie źródła
  - **Priorytet:** Wysoki - poprawia wiarygodność

### UX/UI
- [ ] **Responsywność na bardzo małych ekranach**
  - Problem: Może być problem na telefonach
  - Rozwiązanie: Przetestować i poprawić mobile view
  - Pliki: `App.tsx`, `components/Dashboard.tsx`, `components/AgentCard.tsx`
  - Testy: różne rozdzielczości (320px, 375px, 414px)
  - **Priorytet:** Średni - ważne dla użyteczności

- [x] **Możliwość drukowania** ✅
  - Problem: Nie można wydrukować raportu
  - Rozwiązanie: Dodać CSS dla print media
  - Plik: `public/print.css` z `@media print`
  - **Priorytet:** Średni
  - Status: **Zaimplementowane**
    - ✅ Plik `public/print.css` z kompletnymi stylami print
    - ✅ Przycisk "Drukuj" w sekcji eksportu
    - ✅ Ukrycie elementów UI (header, footer, przyciski, nawigacja)
    - ✅ Formatowanie A4 z odpowiednimi marginesami
    - ✅ Optymalizacja dla druku (page-break, kolory, czcionki)
    - ✅ Klasa `no-print` dla elementów, które nie powinny być drukowane

- [ ] **Optymalizacja memoization**
  - Problem: Komponenty mogą renderować się za często
  - Rozwiązanie: Przejrzeć i dodać useMemo, useCallback gdzie potrzebne
  - Pliki: `components/Dashboard.tsx`, `components/AgentCard.tsx`
  - **Priorytet:** Niski - już częściowo zrobione

### Ustawienia (Sekcja w Sidebar)
- [ ] **Zarządzanie historią**
  - Problem: Limit historii jest hardcoded (50), brak kontroli użytkownika
  - Rozwiązanie: Dodać ustawienia w sekcji Settings:
    - Maksymalna liczba zapisanych analiz (10-200, domyślnie 50)
    - Włącz/wyłącz automatyczne zapisywanie do historii
    - Automatyczne czyszczenie po X dniach (opcjonalne, 7/30/90 dni)
  - Pliki: `components/Sidebar.tsx`, `hooks/useHistory.ts`, `hooks/useSettings.ts` (nowy)
  - Storage: localStorage dla ustawień
  - **Priorytet:** Wysoki - podstawowa funkcjonalność ustawień

- [ ] **Zarządzanie motywem**
  - Problem: Przycisk motywu jest w headerze, brak opcji "auto"
  - Rozwiązanie: Przenieść do sekcji Ustawienia z opcjami:
    - Jasny / Ciemny / Auto (wykrywanie preferencji systemowych)
  - Pliki: `components/Sidebar.tsx`, `hooks/useTheme.ts`, `App.tsx` (usunąć przycisk z headera)
  - **Priorytet:** Średni - poprawa UX

- [ ] **Tryb prywatny**
  - Problem: Brak możliwości pracy bez zapisywania historii
  - Rozwiązanie: Dodać opcję "Tryb prywatny" w ustawieniach:
    - Włączony: analizy nie są zapisywane do historii
    - Wyłączony: normalne działanie (zapis do historii)
  - Pliki: `hooks/useSettings.ts`, `hooks/useHistory.ts`, `App.tsx`
  - **Priorytet:** Średni - ważne dla prywatności

- [ ] **Informacje o aplikacji**
  - Problem: Brak informacji o wersji i statusie
  - Rozwiązanie: Dodać sekcję informacji w ustawieniach:
    - Wersja aplikacji (z package.json)
    - Status połączenia z backendem (już jest w headerze, można przenieść)
    - Reset ustawień do domyślnych
    - Link do dokumentacji/pomocy (opcjonalnie)
  - Pliki: `components/Sidebar.tsx`, `components/SettingsPanel.tsx` (nowy lub w Sidebar)
  - **Priorytet:** Niski - nice to have

### Refaktoryzacja
- [x] **Włączyć TypeScript strict mode** ✅
- [ ] **Abstrakcja API**
  - Problem: Bezpośrednie wywołania w komponentach
  - Rozwiązanie: Dodać warstwę abstrakcji (API client)
  - Plik: `services/apiClient.ts`
  - **Priorytet:** Średni

---

## 🚀 FAZA 2: Beta → Przygotowanie do Produkcji
**Cel:** Dodać kluczowe funkcje, testy, monitoring, dokumentacja

### Funkcjonalności
- [ ] **Porównanie z poprzednimi analizami**
  - Problem: Nie można porównać różnych scenariuszy
  - Rozwiązanie: Dodać funkcję porównywania (side-by-side view)
  - Komponenty: `components/ComparisonView.tsx`
  - **Priorytet:** Średni

- [ ] **Wersjonowanie raportów**
  - Problem: Nie można śledzić zmian w przepisach
  - Rozwiązanie: Dodać daty ważności analiz, powiadomienia o zmianach
  - Funkcje: timestamp, expiration date, notification system
  - **Priorytet:** Niski

### Testy (⚠️ **WAŻNE: Dodać przed produkcją**)
- [ ] **Testy jednostkowe (krytyczna logika)**
  - Problem: Zero testów dla kluczowej logiki
  - Rozwiązanie: Dodać Vitest dla krytycznej logiki biznesowej
  - Pliki do testowania:
    - `server/validation/analysisSchema.js` (walidacja Zod)
    - `server/middleware/rateLimiter.js` (rate limiting)
    - `hooks/useAnalysis.ts` (walidacja query)
  - Konfiguracja: `vitest.config.ts`, `package.json` (dodaj scripts)
  - **Priorytet:** Wysoki - przed produkcją
  - **Kiedy:** Gdy funkcjonalności się ustabilizują

- [ ] **Testy integracyjne**
  - Problem: Nie testuje się integracji z API
  - Rozwiązanie: Dodać testy z mockami API
  - Narzędzia: MSW (Mock Service Worker) lub podobne
  - **Priorytet:** Średni - przed produkcją
  - **Kiedy:** Gdy API się ustabilizuje

- [ ] **Testy E2E (podstawowe scenariusze)**
  - Problem: Nie testuje się pełnego flow
  - Rozwiązanie: Dodać Playwright/Cypress dla kluczowych scenariuszy
  - Scenariusze: pełny flow analizy, obsługa błędów, rate limiting
  - **Priorytet:** Średni - przed produkcją
  - **Kiedy:** Przed wersją beta

### Dokumentacja
- [ ] **Rozszerzenie README**
  - Problem: README wymaga aktualizacji
  - Rozwiązanie: Rozszerzyć o:
    - Opis architektury
    - Instrukcje deploymentu
    - Przykłady użycia API
    - Contributing guidelines
  - **Priorytet:** Wysoki - przed beta

- [ ] **DEPLOYMENT.md**
  - Problem: Nie wiadomo jak wdrożyć
  - Rozwiązanie: Dodać instrukcje deploymentu (Docker, VPS, cloud)
  - **Priorytet:** Wysoki - przed produkcją

- [ ] **CHANGELOG.md**
  - Problem: Nie śledzi się zmian
  - Rozwiązanie: Dodać CHANGELOG.md z historią zmian
  - **Priorytet:** Średni

### Backend
- [ ] **Logging system**
  - Problem: Podstawowe logowanie
  - Rozwiązanie: Dodać structured logging (Winston, Pino)
  - Plik: `server/utils/logger.js`
  - **Priorytet:** Wysoki - przed produkcją

- [ ] **Monitoring i metryki**
  - Problem: Brak monitoringu
  - Rozwiązanie: Dodać metryki (response time, error rate, rate limit usage)
  - Narzędzia: Prometheus, Grafana lub proste endpointy
  - **Priorytet:** Wysoki - przed produkcją

---

## 🏭 FAZA 3: Produkcja → Stabilizacja i Optymalizacja
**Cel:** Zapewnić stabilność, wydajność, dostępność w produkcji

### Testy (pełne pokrycie)
- [ ] **Testy jednostkowe (pełne pokrycie)**
  - Rozszerzyć testy o wszystkie moduły
  - Pliki: `services/geminiService.ts`, `server/services/geminiService.js`
  - **Priorytet:** Wysoki

- [ ] **Testy E2E (pełne scenariusze)**
  - Rozszerzyć o wszystkie scenariusze użytkownika
  - **Priorytet:** Wysoki

- [ ] **Testy accessibility**
  - Problem: Nie wiadomo czy aplikacja jest dostępna
  - Rozwiązanie: Dodać axe-core lub podobne
  - Narzędzia: `@axe-core/react`, `jest-axe`
  - **Priorytet:** Wysoki - wymagane dla produkcji

- [ ] **Testy wydajnościowe**
  - Problem: Nie mierzy się performance
  - Rozwiązanie: Dodać Lighthouse CI
  - Konfiguracja: `.lighthouserc.js`
  - **Priorytet:** Średni

### Dostępność (WCAG AA compliance)
- [ ] **Dodatkowe ARIA labels**
  - Problem: Nie wszystkie elementy mają ARIA labels
  - Rozwiązanie: Przejrzeć i dodać brakujące aria-label, aria-describedby
  - Pliki: wszystkie komponenty
  - **Priorytet:** Wysoki - wymagane dla produkcji

- [ ] **Keyboard navigation**
  - Problem: Nie wszystko dostępne z klawiatury
  - Rozwiązanie: Dodać focus management, skip links
  - Plik: `App.tsx` (dodać skip to main content)
  - **Priorytet:** Wysoki

- [ ] **Kontrast WCAG AA**
  - Problem: Niektóre kolory mogą nie spełniać wymagań
  - Rozwiązanie: Sprawdzić WCAG AA compliance, poprawić kontrast
  - Narzędzia: WebAIM Contrast Checker
  - **Priorytet:** Wysoki

- [ ] **Alt text dla ikon**
  - Problem: Nie wszystkie ikony mają opisy
  - Rozwiązanie: Dodać aria-label lub title do wszystkich ikon
  - **Priorytet:** Wysoki

### Wydajność
- [ ] **Service Worker dla offline**
  - Problem: Aplikacja nie działa offline
  - Rozwiązanie: Dodać PWA support
  - Pliki: `public/sw.js`, `public/manifest.json`
  - Funkcje: cache strategies, offline fallback
  - **Priorytet:** Średni - zależy od wymagań

- [ ] **Optymalizacja obrazów** (jeśli będą dodane)
  - Problem: Brak obrazów, ale warto przygotować
  - Rozwiązanie: Użyć lazy loading, WebP format
  - **Priorytet:** Niski

---

## 🌟 FAZA 4: Post-produkcja → Rozszerzenia
**Cel:** Dodatkowe funkcje, integracje, zaawansowane możliwości

### Funkcjonalności
- [ ] **Integracja z bazą danych przepisów**
  - Problem: Cytowania są generowane przez AI, nie z rzeczywistej bazy
  - Rozwiązanie: Integracja z ISAP API lub lokalną bazą
  - Komponenty: `services/legalDatabaseService.ts`
  - **Priorytet:** Średni

- [ ] **Personalizacja ekspertów**
  - Problem: Brak możliwości dostosowania ekspertów
  - Rozwiązanie: Dodać ustawienia dla każdego eksperta (ton, szczegółowość)
  - Komponenty: `components/SettingsPanel.tsx`
  - **Priorytet:** Niski

- [ ] **Powiadomienia o zmianach przepisów**
  - Problem: Brak powiadomień
  - Rozwiązanie: System powiadomień (email/push) o zmianach w przepisach
  - **Priorytet:** Niski

- [ ] **Integracja z kalendarzem**
  - Problem: Brak integracji z kalendarzem (terminy wdrożeń)
  - Rozwiązanie: Export do Google Calendar, iCal
  - **Priorytet:** Niski

### Dokumentacja
- [ ] **Dokumentacja API (JSDoc)**
  - Problem: Brak dokumentacji API
  - Rozwiązanie: Dodać JSDoc comments do wszystkich funkcji
  - Pliki: `services/geminiService.ts`, `hooks/useAnalysis.ts`, `server/services/geminiService.js`
  - **Priorytet:** Średni

- [ ] **Dokumentacja komponentów**
  - Problem: Nie wiadomo jakie props przyjmują
  - Rozwiązanie: Dodać Storybook lub podobne
  - Plik: `.storybook/`
  - **Priorytet:** Niski

### Architektura
- [ ] **State management**
  - Problem: Stan tylko w komponentach React
  - Rozwiązanie: Rozważyć Context API lub Zustand dla złożonego stanu
  - Plik: `context/AppContext.tsx` lub `store/useStore.ts`
  - **Priorytet:** Niski - tylko jeśli będzie potrzeba

---

## 📊 Roadmap - Timeline

### Q1 2025: Faza 1 - Stabilizacja Mockup
**Cel:** Ustabilizować podstawowe funkcjonalności

- Historia zapytań
- Rzeczywiste linki ISAP
- Responsywność mobile
- Print CSS
- Abstrakcja API

**Kryteria ukończenia:**
- ✅ Wszystkie podstawowe funkcje działają stabilnie
- ✅ Aplikacja działa na mobile
- ✅ Gotowe do testów beta z użytkownikami

---

### Q2 2025: Faza 2 - Beta
**Cel:** Przygotowanie do produkcji

- Testy jednostkowe (krytyczna logika)
- Testy integracyjne
- Testy E2E (podstawowe)
- Dokumentacja (README, DEPLOYMENT)
- Logging i monitoring
- Porównanie analiz

**Kryteria ukończenia:**
- ✅ Testy pokrywają krytyczną logikę
- ✅ Dokumentacja kompletna
- ✅ Monitoring działa
- ✅ Gotowe do produkcji

---

### Q3 2025: Faza 3 - Produkcja
**Cel:** Stabilizacja w produkcji

- Testy accessibility (WCAG AA)
- Pełne pokrycie testami
- Optymalizacja wydajności
- PWA (opcjonalnie)

**Kryteria ukończenia:**
- ✅ WCAG AA compliance
- ✅ Wysokie pokrycie testami (>80%)
- ✅ Performance score >90
- ✅ Stabilna produkcja

---

### Q4 2025+: Faza 4 - Rozszerzenia
**Cel:** Dodatkowe funkcje i integracje

- Integracja z bazą przepisów
- Personalizacja
- Powiadomienia
- Integracja z kalendarzem

---

## 📝 Uwagi

### Testy - Kiedy dodawać?
- **Teraz (Faza 1):** ❌ Nie - projekt w fazie mockup, funkcje się zmieniają
- **Faza 2 (Beta):** ✅ Tak - gdy funkcjonalności się ustabilizują
- **Faza 3 (Produkcja):** ✅ Tak - pełne pokrycie przed produkcją

### Priorytetyzacja
1. **Krytyczne:** Bezpieczeństwo, podstawowe funkcje
2. **Wysokie:** UX, testy przed produkcją, dokumentacja
3. **Średnie:** Optymalizacje, dodatkowe funkcje
4. **Niskie:** Nice-to-have, rozszerzenia

### Rate limiting
- Obecnie działa globalnie (10 zapytań/min)
- W przyszłości można rozważyć per-user limiting

### Cache
- Działa w backendzie
- Rozważyć cache w frontendzie dla historii

### Dark mode
- Zaimplementowany
- Może wymagać dodatkowych poprawek kontrastu (WCAG)

---

## 🔗 Powiązane Pliki

- `KRYTYKA.md` - Szczegółowa analiza problemów
- `SECURITY.md` - Dokumentacja bezpieczeństwa
- `SETUP.md` - Instrukcje instalacji
- `README.md` - Dokumentacja główna

---

**Uwaga:** Ten plik powinien być regularnie aktualizowany w miarę postępów prac. Fazy mogą się przesuwać w zależności od priorytetów biznesowych.
