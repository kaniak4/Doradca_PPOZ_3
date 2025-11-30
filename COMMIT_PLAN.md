# Plan commitów dla v2.0

## Commit 1: Backend infrastructure
**Pliki:**
- server/index.js
- server/middleware/ (wszystkie pliki)
- server/validation/requestSchema.js
- server/services/cacheService.js
- server/services/shareService.js
- .gitignore (dodanie vectorstore/)

**Message:**
```
feat: Add backend infrastructure with Express.js

- Add Express.js backend server
- Add security middleware (CORS, rate limiting)
- Add input validation with Zod
- Add in-memory cache service
- Add share service for report sharing
- Update .gitignore for vectorstore
```

## Commit 2: RAG system implementation
**Pliki:**
- server/services/pdfParser.js
- server/services/embeddingService.js
- server/services/vectorStore.js
- server/services/ragService.js
- server/services/legalDatabaseService.js
- server/scripts/initializeLegalDatabase.js
- server/scripts/viewChunks.js
- server/config/legalDocuments.json
- server/config.js (RAG config)

**Message:**
```
feat: Implement RAG system for legal document verification

- Add PDF parser with flat parsing and context injection
- Add embedding service (Gemini/OpenAI support)
- Add in-memory vector store with JSON persistence
- Add RAG service for document retrieval
- Add legal database service integration
- Add initialization script for indexing documents
- Add viewChunks script for debugging
- Add legalDocuments.json configuration
```

## Commit 3: Backend integration and validation
**Pliki:**
- server/services/geminiService.js
- server/validation/analysisSchema.js
- services/geminiService.ts (frontend)

**Message:**
```
feat: Integrate RAG with Gemini service and update validation

- Integrate RAG system with Gemini analysis
- Add grounded generation based on legal documents
- Update analysis schema for new citation fields
- Add citation verification logic
- Update frontend service for new API structure
```

## Commit 4: Frontend hooks refactoring
**Pliki:**
- hooks/useAnalysis.ts
- hooks/useExport.ts
- hooks/useHistory.ts
- hooks/index.ts
- components/SkeletonLoaders.tsx

**Message:**
```
refactor: Separate business logic into custom hooks

- Extract analysis logic to useAnalysis hook
- Extract export logic to useExport hook
- Add useHistory hook for history management
- Add skeleton loaders component
- Update hooks index exports
```

## Commit 5: UI improvements and features
**Pliki:**
- App.tsx
- components/Dashboard.tsx
- components/AgentCard.tsx
- components/Sidebar.tsx
- components/Tooltip.tsx
- public/print.css
- index.html (print.css link)

**Message:**
```
feat: Add UI improvements and new features

- Add sidebar with history and settings
- Add analysis mode selector (Information/Problem)
- Add sticky navigation tabs
- Improve tooltips with React Portal
- Add print stylesheet for reports
- Add exit confirmation dialog
- Improve citation grouping by source
- Add history badge and toggle functionality
```

## Commit 6: Export functionality
**Pliki:**
- services/pdfReport.tsx
- services/exportService.ts
- types.ts (export types)

**Message:**
```
feat: Add PDF and DOCX export functionality

- Add PDF report generation with react-pdf
- Add DOCX export with docx library
- Fix Polish character support in PDF (Helvetica font)
- Add export service with error handling
- Update types for export functionality
```

## Commit 7: Configuration and documentation
**Pliki:**
- README.md
- TODO.md
- KRYTYKA.md
- SETUP.md
- SECURITY.md
- .env.example
- package.json
- vite.config.ts

**Message:**
```
docs: Update documentation for v2.0

- Update README.md with v2.0 features and changelog
- Update TODO.md with completed tasks
- Add SETUP.md and SECURITY.md
- Add .env.example template
- Update package.json dependencies
- Update vite.config.ts for new structure
```

## Commit 8: Assets and utilities
**Pliki:**
- assets/ (wszystkie pliki)
- utils/ (wszystkie pliki)
- vite-env.d.ts

**Message:**
```
chore: Add assets and utility files

- Add application assets
- Add utility functions
- Add TypeScript environment declarations
```

