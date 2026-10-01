import type { ReactNode } from 'react';

import { useDataActions, useSettings } from '@/store';

export type Locale = 'en' | 'ar';

type LocaleState = { locale: Locale; setLocale: (locale: Locale) => void };

export function LocaleProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useLocale(): LocaleState {
  const locale = useSettings().locale;
  const { updateSettings } = useDataActions();
  return {
    locale,
    setLocale: (next) => {
      void updateSettings({ locale: next });
    },
  };
}
