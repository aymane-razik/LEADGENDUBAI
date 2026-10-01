'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeProviderContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'dark' | 'light';
}

const ThemeProviderContext = createContext<ThemeProviderContextValue | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeProviderContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

export function ThemeProvider({ children, attribute = 'class', defaultTheme = 'system', enableSystem = true }: { children: ReactNode; attribute?: string; defaultTheme?: Theme; enableSystem?: boolean }) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('light');

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (resolved: 'dark' | 'light') => {
      root.classList.remove('light', 'dark');
      root.classList.add(resolved);
      setResolvedTheme(resolved);
    };

    const handleChange = () => {
      const effective = theme === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : theme;
      applyTheme(effective);
    };

    handleChange();
    if (enableSystem) {
      mediaQuery.addEventListener('change', handleChange);
    }

    return () => {
      if (enableSystem) {
        mediaQuery.removeEventListener('change', handleChange);
      }
    };
  }, [theme, enableSystem]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme, resolvedTheme: resolvedTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}
