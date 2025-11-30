# Instrukcje commitów dla v2.0

## 📋 Przygotowanie

Przed wykonaniem commitów upewnij się, że:
1. ✅ Wszystkie zmiany są gotowe
2. ✅ README.md został zaktualizowany (v2.0)
3. ✅ Nie ma błędów kompilacji

## 🚀 Sposób 1: Automatyczny (zalecany)

Uruchom przygotowany skrypt:

```bash
bash prepare_commits.sh
```

Skrypt automatycznie:
- Utworzy 8 logicznych commitów
- Pogrupuje pliki tematycznie
- Doda odpowiednie komunikaty commitów

## 📝 Sposób 2: Ręczny

Jeśli wolisz wykonać commity ręcznie, oto plan:

### Commit 1: Backend infrastructure
```bash
git add server/index.js server/middleware/ server/validation/requestSchema.js server/services/cacheService.js server/services/shareService.js .gitignore
git commit -m "feat: Add backend infrastructure with Express.js

- Add Express.js backend server
- Add security middleware (CORS, rate limiting)
- Add input validation with Zod
- Add in-memory cache service
- Add share service for report sharing
- Update .gitignore for vectorstore"
```

### Commit 2: RAG system implementation
```bash
git add server/services/pdfParser.js server/services/embeddingService.js server/services/vectorStore.js server/services/ragService.js server/services/legalDatabaseService.js server/scripts/ server/config/legalDocuments.json server/config.js
git commit -m "feat: Implement RAG system for legal document verification

- Add PDF parser with flat parsing and context injection
- Add embedding service (Gemini/OpenAI support)
- Add in-memory vector store with JSON persistence
- Add RAG service for document retrieval
- Add legal database service integration
- Add initialization script for indexing documents
- Add viewChunks script for debugging
- Add legalDocuments.json configuration"
```

### Commit 3: Backend integration and validation
```bash
git add server/services/geminiService.js server/validation/analysisSchema.js services/geminiService.ts
git commit -m "feat: Integrate RAG with Gemini service and update validation

- Integrate RAG system with Gemini analysis
- Add grounded generation based on legal documents
- Update analysis schema for new citation fields
- Add citation verification logic
- Update frontend service for new API structure"
```

### Commit 4: Frontend hooks refactoring
```bash
git add hooks/ components/SkeletonLoaders.tsx
git commit -m "refactor: Separate business logic into custom hooks

- Extract analysis logic to useAnalysis hook
- Extract export logic to useExport hook
- Add useHistory hook for history management
- Add skeleton loaders component
- Update hooks index exports"
```

### Commit 5: UI improvements and features
```bash
git add App.tsx components/Dashboard.tsx components/AgentCard.tsx components/Sidebar.tsx components/Tooltip.tsx public/print.css index.html types.ts
git commit -m "feat: Add UI improvements and new features

- Add sidebar with history and settings
- Add analysis mode selector (Information/Problem)
- Add sticky navigation tabs
- Improve tooltips with React Portal
- Add print stylesheet for reports
- Add exit confirmation dialog
- Improve citation grouping by source
- Add history badge and toggle functionality
- Update types for new features"
```

### Commit 6: Export functionality
```bash
git add services/pdfReport.tsx services/exportService.ts
git commit -m "feat: Add PDF and DOCX export functionality

- Add PDF report generation with react-pdf
- Add DOCX export with docx library
- Fix Polish character support in PDF (Helvetica font)
- Add export service with error handling"
```

### Commit 7: Configuration and documentation
```bash
git add README.md TODO.md KRYTYKA.md SETUP.md SECURITY.md .env.example package.json vite.config.ts
git commit -m "docs: Update documentation for v2.0

- Update README.md with v2.0 features and changelog
- Update TODO.md with completed tasks
- Add SETUP.md and SECURITY.md
- Add .env.example template
- Update package.json dependencies
- Update vite.config.ts for new structure"
```

### Commit 8: Assets and utilities
```bash
git add assets/ utils/ vite-env.d.ts
git commit -m "chore: Add assets and utility files

- Add application assets
- Add utility functions
- Add TypeScript environment declarations"
```

## 🔍 Sprawdzenie przed push

```bash
# Zobacz ostatnie commity
git log --oneline -8

# Sprawdź status
git status

# Zobacz różnice (jeśli są)
git diff
```

## 🚀 Push do repozytorium

```bash
git push origin main
```

## 📊 Podsumowanie zmian v2.0

- ✨ System RAG dla weryfikacji cytowań prawnych
- 🎯 Dwa tryby analizy (Informacja/Problem)
- 📖 Historia analiz z sidebar
- 💾 Eksport do PDF i DOCX
- 🖨️ Optymalizacja drukowania
- 🔧 Refaktoryzacja do custom hooks
- 🏗️ Backend z Express.js
- ✅ Walidacja danych (Zod)
- 🛡️ Rate limiting i security middleware

