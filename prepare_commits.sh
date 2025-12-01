#!/bin/bash

# Skrypt do przygotowania commitów dla v2.0
# Uruchom: bash prepare_commits.sh

# Funkcja pomocnicza - dodaje pliki tylko jeśli są zmienione
add_files_if_changed() {
    local files_to_add=()
    for file in "$@"; do
        # Sprawdź czy plik istnieje i jest zmieniony/nowy
        if [ -e "$file" ]; then
            # Sprawdź status git (M=modified, A=added, ??=untracked)
            if git status --porcelain "$file" 2>/dev/null | grep -q .; then
                files_to_add+=("$file")
            fi
        fi
    done
    
    if [ ${#files_to_add[@]} -gt 0 ]; then
        git add "${files_to_add[@]}"
        return 0
    else
        return 1
    fi
}

# Funkcja pomocnicza - commit tylko jeśli są zmiany
commit_if_changes() {
    local message="$1"
    if ! git diff --cached --quiet; then
        git commit -m "$message"
        return 0
    else
        echo "  ⚠️  Brak zmian do commitowania, pomijam..."
        return 1
    fi
}

echo "🚀 Przygotowywanie commitów dla v2.0..."
echo ""

# Commit 1: Backend infrastructure
echo "📦 Commit 1: Backend infrastructure..."
if add_files_if_changed server/index.js server/middleware/ server/validation/requestSchema.js server/services/cacheService.js server/services/shareService.js .gitignore; then
    commit_if_changes "feat: Add backend infrastructure with Express.js

- Add Express.js backend server
- Add security middleware (CORS, rate limiting)
- Add input validation with Zod
- Add in-memory cache service
- Add share service for report sharing
- Update .gitignore for vectorstore and .env files"
else
    echo "  ⚠️  Brak zmian w backend infrastructure, pomijam..."
fi

# Commit 2: RAG system implementation
echo "📦 Commit 2: RAG system implementation..."
if add_files_if_changed server/services/pdfParser.js server/services/embeddingService.js server/services/vectorStore.js server/services/ragService.js server/services/legalDatabaseService.js server/scripts/ server/config/legalDocuments.json server/config.js; then
    commit_if_changes "feat: Implement RAG system for legal document verification

- Add PDF parser with flat parsing and context injection
- Add embedding service (Gemini/OpenAI support)
- Add in-memory vector store with JSON persistence
- Add RAG service for document retrieval
- Add legal database service integration
- Add initialization script for indexing documents
- Add viewChunks script for debugging
- Add legalDocuments.json configuration
- Update config.js with RAG settings"
else
    echo "  ⚠️  Brak zmian w RAG system, pomijam..."
fi

# Commit 3: Backend services integration
echo "📦 Commit 3: Backend services integration..."
if add_files_if_changed server/services/geminiService.js server/validation/analysisSchema.js services/geminiService.ts; then
    commit_if_changes "feat: Integrate RAG with Gemini service and update validation

- Integrate RAG system with Gemini analysis
- Add grounded generation based on legal documents
- Update analysis schema for new citation fields (verified, chunkId, articleNumber, pageNumber)
- Add citation verification logic
- Update frontend service for new API structure
- Support both 'information' and 'problem' analysis modes"
else
    echo "  ⚠️  Brak zmian w backend services, pomijam..."
fi

# Commit 4: Types and configuration updates
echo "📦 Commit 4: Types and configuration updates..."
if add_files_if_changed types.ts vite.config.ts vite-env.d.ts; then
    commit_if_changes "feat: Update types and configuration for v2.0

- Add AnalysisMode type (information/problem)
- Add HistoryEntry interface
- Update Citation interface with RAG fields
- Update AnalysisResult for dual mode support
- Add vite-env.d.ts for environment variables
- Update vite.config.ts with proxy and envPrefix"
else
    echo "  ⚠️  Brak zmian w types/config, pomijam..."
fi

# Commit 5: Frontend hooks refactoring
echo "📦 Commit 5: Frontend hooks refactoring..."
if add_files_if_changed hooks/ components/SkeletonLoaders.tsx; then
    commit_if_changes "refactor: Separate business logic into custom hooks

- Extract analysis logic to useAnalysis hook
- Extract export logic to useExport hook
- Add useHistory hook for history management
- Add useShare hook for sharing functionality
- Add skeleton loaders component
- Update hooks index exports"
else
    echo "  ⚠️  Brak zmian w hooks, pomijam..."
fi

# Commit 6: UI components and improvements
echo "📦 Commit 6: UI components and improvements..."
if add_files_if_changed App.tsx components/Dashboard.tsx components/AgentCard.tsx components/Sidebar.tsx components/Tooltip.tsx public/print.css utils/textFormatter.tsx; then
    commit_if_changes "feat: Add UI improvements and new features

- Add sidebar with history and settings
- Add analysis mode selector (Information/Problem)
- Add sticky navigation tabs
- Improve tooltips with React Portal
- Add print stylesheet for reports
- Add exit confirmation dialog
- Improve citation grouping by source
- Add history badge and toggle functionality
- Add text formatter for markdown support
- Improve AgentCard with formatted text display"
else
    echo "  ⚠️  Brak zmian w UI components, pomijam..."
fi

# Commit 7: Export functionality
echo "📦 Commit 7: Export functionality..."
if add_files_if_changed services/pdfReport.tsx services/exportService.ts; then
    commit_if_changes "feat: Add PDF and DOCX export functionality

- Add PDF report generation with react-pdf
- Add DOCX export with docx library
- Fix Polish character support in PDF (Helvetica font)
- Add export service with error handling
- Support both export formats with proper formatting"
else
    echo "  ⚠️  Brak zmian w export, pomijam..."
fi

# Commit 8: Legal documents
echo "📦 Commit 8: Legal documents..."
if add_files_if_changed server/data/legal_documents/; then
    commit_if_changes "chore: Add legal documents (PDFs)

- Add Polish legal acts (ustawy)
- Add Polish regulations (rozporządzenia)
- Documents ready for RAG indexing"
else
    echo "  ⚠️  Brak zmian w legal documents, pomijam..."
fi

# Commit 9: Documentation
echo "📦 Commit 9: Documentation..."
if add_files_if_changed README.md TODO.md KRYTYKA.md SETUP.md SECURITY.md .env.example; then
    commit_if_changes "docs: Update documentation for v2.0

- Update README.md with v2.0 features and changelog
- Update TODO.md with completed tasks
- Add SETUP.md with installation instructions
- Add SECURITY.md with security best practices
- Add .env.example template with all required variables"
else
    echo "  ⚠️  Brak zmian w documentation, pomijam..."
fi

# Commit 10: Package configuration
echo "📦 Commit 10: Package configuration..."
if add_files_if_changed package.json package-lock.json; then
    commit_if_changes "chore: Update package.json dependencies

- Add backend dependencies (express, cors, dotenv)
- Add RAG dependencies (openai, pdf-parse)
- Add export dependencies (@react-pdf/renderer, docx, file-saver)
- Add dev dependencies (concurrently, tailwindcss, postcss)
- Add npm scripts for dev:server and dev:all"
else
    echo "  ⚠️  Brak zmian w package.json, pomijam..."
fi

# Commit 11: Assets
echo "📦 Commit 11: Assets..."
if add_files_if_changed assets/; then
    commit_if_changes "chore: Add application screenshots

- Add application screenshots"
else
    echo "  ⚠️  Brak zmian w assets, pomijam..."
fi

# Sprawdź pozostałe pliki
echo ""
echo "📋 Sprawdzanie pozostałych plików..."
REMAINING=$(git status --porcelain | grep -v "^??" || true)
if [ -n "$REMAINING" ]; then
    echo "⚠️  Pozostały niezacommitowane pliki:"
    echo "$REMAINING"
    echo ""
    read -p "Czy dodać pozostałe pliki? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add -A
        git commit -m "chore: Add remaining files for v2.0"
    fi
else
    echo "✅ Wszystkie pliki zostały zacommitowane!"
fi

echo ""
echo "✅ Commity zostały utworzone!"
echo ""
echo "📊 Ostatnie 11 commitów:"
git log --oneline -11
echo ""
echo "🚀 Gotowe do push:"
echo "   git fetch origin"
echo "   git pull --rebase origin main"
echo "   git push origin main"