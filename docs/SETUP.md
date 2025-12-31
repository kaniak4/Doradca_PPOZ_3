# Instrukcja uruchomienia

## Aktywacja środowiska conda

```bash
conda activate doradca-ppoz
```

## Uruchomienie aplikacji

**Wszystkie komendy należy uruchamiać z głównego katalogu projektu** (`PPOZ_Ekspert_2`).

### Instalacja zależności

```bash
npm install
```

**Uwaga:** Po instalacji automatycznie tworzony jest symlink `backend/node_modules -> ../frontend/node_modules`, aby backend mógł korzystać z modułów zainstalowanych w frontend.

### Uruchomienie backendu

```bash
npm run dev:server
```

### Uruchomienie frontendu

```bash
npm run dev
```

### Uruchomienie backendu i frontendu jednocześnie

```bash
npm run dev:all
```

### Przełączanie między branchami
```bash
# Wróć do głównej wersji
git checkout main

# Wróć do designu
git checkout design-v2

### Gdy design jest gotowy — scalenie

# Przełącz się na main
git checkout main

# Scal zmiany z design-v2
git merge design-v2

# Wypchnij zmiany
git push origin main