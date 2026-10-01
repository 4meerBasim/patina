import { useCallback, useEffect, useState } from 'react';

import { useDataActions, useSettings } from '@/store';

import { authenticate, getBiometricAvailability } from './biometric';

type BiometricSetting = {
  enabled: boolean;
  available: boolean | null;
  setEnabled: (next: boolean) => Promise<void>;
};

export function useBiometricSetting(): BiometricSetting {
  const { biometricLock } = useSettings();
  const { updateSettings } = useDataActions();
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    void getBiometricAvailability().then((value) => {
      if (active) setAvailable(value);
    });
    return () => {
      active = false;
    };
  }, []);

  const setEnabled = useCallback(
    async (next: boolean) => {
      if (!next) {
        await updateSettings({ biometricLock: false });
        return;
      }
      const value = await getBiometricAvailability();
      setAvailable(value);
      if (!value) return;
      if (await authenticate('Confirm it is you to turn on Lock')) {
        await updateSettings({ biometricLock: true });
      }
    },
    [updateSettings],
  );

  return { enabled: biometricLock, available, setEnabled };
}
