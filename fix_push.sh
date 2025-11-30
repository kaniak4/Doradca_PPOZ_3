#!/bin/bash

# Skrypt do rozwiązania konfliktu push
# Wykonaj: bash fix_push.sh

set -e

echo "🔄 Pobieranie zmian z remote..."
git fetch origin

echo ""
echo "📊 Sprawdzanie różnic..."
echo "Lokalne commity, których nie ma na remote:"
git log origin/main..HEAD --oneline || echo "Brak lokalnych commitów"

echo ""
echo "Remote commity, których nie ma lokalnie:"
git log HEAD..origin/main --oneline || echo "Brak remote commitów"

echo ""
echo "🔀 Integracja zmian z remote..."
echo "Wybierz opcję:"
echo "1) git pull --rebase (zalecane - zachowa liniową historię)"
echo "2) git pull (merge - utworzy merge commit)"
echo ""
read -p "Wybierz opcję (1/2): " choice

if [ "$choice" = "1" ]; then
    echo "🔄 Wykonuję rebase..."
    git pull --rebase origin main
elif [ "$choice" = "2" ]; then
    echo "🔀 Wykonuję merge..."
    git pull origin main
else
    echo "❌ Nieprawidłowa opcja"
    exit 1
fi

echo ""
echo "✅ Zmiany zintegrowane!"
echo ""
echo "📊 Status:"
git status

echo ""
echo "🚀 Gotowe do push:"
echo "   git push origin main"

