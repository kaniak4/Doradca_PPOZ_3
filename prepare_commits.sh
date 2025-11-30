#!/bin/bash

# Skrypt do przygotowania commitów dla v2.0
# Uruchom: bash prepare_commits.sh

set -e

echo "🚀 Przygotowywanie commitów dla v2.0..."
echo ""

# Commit 1: Backend infrastructure
echo "📦 Commit 1: Backend infrastructure..."
git add server/index.js server/middleware/ server/validation/requestSchema.js server/services/cacheService.js server/services/shareService.js .gitignore
git commit -m "feat: Add backend infrastructure with Express.js

- Add Express.js backend server
- Add security middleware (CORS, rate limiting)
- Add input validation with Zod
- Add in-memory cache service
- Add share service for report sharing
- Update .gitignore for vectorstore"

# Commit 2: RAG system implementation
echo "📦 Commit 2: RAG system implementation..."
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

# Commit 3: Backend integration and validation
echo "📦 Commit 3: Backend integration and validation..."
git add server/services/geminiService.js server/validation/analysisSchema.js services/geminiService.ts
git commit -m "feat: Integrate RAG with Gemini service and update validation

- Integrate RAG system with Gemini analysis
- Add grounded generation based on legal documents
- Update analysis schema for new citation fields
- Add citation verification logic
- Update frontend service for new API structure"

# Commit 4: Frontend hooks refactoring
echo "📦 Commit 4: Frontend hooks refactoring..."
git add hooks/ components/SkeletonLoaders.tsx
git commit -m "refactor: Separate business logic into custom hooks

- Extract analysis logic to useAnalysis hook
- Extract export logic to useExport hook
- Add useHistory hook for history management
- Add skeleton loaders component
- Update hooks index exports"

# Commit 5: UI improvements and features
echo "📦 Commit 5: UI improvements and features..."
git add App.tsx components/Dashboard.tsx components/AgentCard.tsx components/Sidebar.tsx components/Tooltip.tsx public/print.css
# Sprawdź czy index.html ma zmiany
if ! git diff --cached --quiet index.html 2>/dev/null && git diff --quiet index.html 2>/dev/null; then
  git add index.html
fi
git commit -m "feat: Add UI improvements and new features

- Add sidebar with history and settings
- Add analysis mode selector (Information/Problem)
- Add sticky navigation tabs
- Improve tooltips with React Portal
- Add print stylesheet for reports
- Add exit confirmation dialog
- Improve citation grouping by source
- Add history badge and toggle functionality"

# Commit 6: Export functionality
echo "📦 Commit 6: Export functionality..."
git add services/pdfReport.tsx services/exportService.ts
# types.ts - dodaj tylko jeśli nie był już w poprzednich commitach
if git diff --quiet types.ts 2>/dev/null; then
  echo "  ⚠️  types.ts już zacommitowany, pomijam..."
else
  git add types.ts
fi
git commit -m "feat: Add PDF and DOCX export functionality

- Add PDF report generation with react-pdf
- Add DOCX export with docx library
- Fix Polish character support in PDF (Helvetica font)
- Add export service with error handling
- Update types for export functionality"

# Commit 7: Configuration and documentation
echo "📦 Commit 7: Configuration and documentation..."
git add README.md TODO.md KRYTYKA.md SETUP.md SECURITY.md .env.example package.json vite.config.ts
git commit -m "docs: Update documentation for v2.0

- Update README.md with v2.0 features and changelog
- Update TODO.md with completed tasks
- Add SETUP.md and SECURITY.md
- Add .env.example template
- Update package.json dependencies
- Update vite.config.ts for new structure"

# Commit 8: Assets and utilities
echo "📦 Commit 8: Assets and utilities..."
# Sprawdź czy foldery istnieją i mają pliki
if [ -d "assets" ] && [ "$(ls -A assets 2>/dev/null)" ]; then
  git add assets/
fi
if [ -d "utils" ] && [ "$(ls -A utils 2>/dev/null)" ]; then
  git add utils/
fi
if [ -f "vite-env.d.ts" ]; then
  git add vite-env.d.ts
fi
# Sprawdź czy są jakieś pliki do dodania
if ! git diff --cached --quiet; then
  git commit -m "chore: Add assets and utility files

- Add application assets
- Add utility functions
- Add TypeScript environment declarations"
else
  echo "  ⚠️  Brak plików do commitowania w tym kroku, pomijam..."
fi

# Sprawdź pozostałe pliki
echo ""
echo "📋 Sprawdzanie pozostałych plików..."
REMAINING=$(git status --porcelain)
if [ -n "$REMAINING" ]; then
  echo "⚠️  Pozostały niezacommitowane pliki:"
  echo "$REMAINING"
  echo ""
  echo "Możesz je dodać ręcznie lub uruchomić:"
  echo "  git add -A && git commit -m 'chore: Add remaining files for v2.0'"
else
  echo "✅ Wszystkie pliki zostały zacommitowane!"
fi

echo ""
echo "✅ Commity zostały utworzone!"
echo ""
echo "📊 Ostatnie 8 commitów:"
git log --oneline -8
echo ""
echo "🚀 Gotowe do push:"
echo "   git push origin main"
