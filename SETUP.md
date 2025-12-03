# Instrukcja uruchomienia

## Aktywacja środowiska conda

```bash
conda activate doradca-ppoz
```

## Uruchomienie aplikacji

### Uruchomienie backendu

```bash
npm run dev:server
```

### Uruchomienie frontendu

```bash
npm run dev
```

### Uruchomienie backendu i frontendu

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