import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, type Owner } from '../api/api';

type Theme = 'light' | 'dark';
const THEME_KEY = 'API_FETCH_MANAGER_theme';

interface AppState {
  theme: Theme;
  toggleTheme: () => void;
  owners: Owner[];
  ownerId: string | null;
  setOwnerId: (id: string) => void;
  reloadOwners: () => Promise<void>;
  inspect: boolean;
  setInspect: (v: boolean) => void;
}

const Ctx = createContext<AppState | null>(null);
export const useApp = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp phải nằm trong <AppProvider>');
  return c;
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_KEY) as Theme | null;
    if (saved) return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [owners, setOwners] = useState<Owner[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [inspect, setInspect] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const reloadOwners = useCallback(async () => {
    const list = await api.get<Owner[]>('/owners');
    setOwners(list);
    setOwnerId((cur) => cur ?? list[0]?.id ?? null);
  }, []);

  useEffect(() => {
    reloadOwners().catch(() => {});
  }, [reloadOwners]);

  return (
    <Ctx.Provider
      value={{
        theme,
        toggleTheme: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')),
        owners,
        ownerId,
        setOwnerId,
        reloadOwners,
        inspect,
        setInspect,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
