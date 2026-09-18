import { createContext, useContext, useState, type ReactNode } from 'react';

export type Locale = 'en' | 'ar';

type LocaleState = { locale: Locale; setLocale: (locale: Locale) => void };

const LocaleContext = createContext<LocaleState | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');
  return <LocaleContext value={{ locale, setLocale }}>{children}</LocaleContext>;
}

export function useLocale() {
  const state = useContext(LocaleContext);
  if (!state) throw new Error('useLocale must be used inside LocaleProvider');
  return state;
}
