import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Sprawdź localStorage
    const saved = localStorage.getItem('theme') as Theme | null;
    if (saved && ['light', 'dark'].includes(saved)) {
      return saved;
    }
    // Domyślnie sprawdź preferencje systemowe przy pierwszym załadowaniu
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    // Zastosuj theme do document
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Zapisz do localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => current === 'light' ? 'dark' : 'light');
  };

  const setThemeDirect = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  return {
    theme,
    resolvedTheme: theme, // resolvedTheme jest teraz tym samym co theme
    toggleTheme,
    setTheme: setThemeDirect,
  };
};

