import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  setTheme: (theme) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('boom-pos-theme', theme);
    }
    set({ theme });
  },
  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    get().setTheme(next);
  },
}));

// Initialize theme from localStorage on load (client-side only)
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('boom-pos-theme') as Theme | null;
  const preferred = stored || 'light';
  document.documentElement.setAttribute('data-theme', preferred);
  useThemeStore.setState({ theme: preferred });
}
