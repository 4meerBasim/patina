import * as SecureStore from 'expo-secure-store';

import type { CurrencyCode } from './types';
import type { Database } from './db/client';
import { getKv, setKv } from './db/repositories';

export type Locale = 'en' | 'ar';
export type NumeralSystem = 'latin' | 'arabic';
export type Appearance = 'dark' | 'light' | 'system';

export type Settings = {
  locale: Locale;
  numeralSystem: NumeralSystem;
  baseCurrency: CurrencyCode;
  appearance: Appearance;
  privacyBlur: boolean;
  biometricLock: boolean;
};

export const defaultSettings: Settings = {
  locale: 'en',
  numeralSystem: 'latin',
  baseCurrency: 'USD',
  appearance: 'dark',
  privacyBlur: false,
  biometricLock: false,
};

const KV_KEY = 'settings';
const BIOMETRIC_KEY = 'patina.biometric_lock';

type StoredSettings = Omit<Settings, 'biometricLock'>;

export async function loadSettings(db: Database): Promise<Settings> {
  const raw = await getKv(db, KV_KEY);
  const stored: StoredSettings = raw
    ? { ...toStored(defaultSettings), ...(JSON.parse(raw) as Partial<StoredSettings>) }
    : toStored(defaultSettings);
  const biometric = await readBiometricFlag();
  return { ...stored, biometricLock: biometric };
}

export async function saveSettings(db: Database, settings: Settings): Promise<void> {
  await setKv(db, KV_KEY, JSON.stringify(toStored(settings)));
  await SecureStore.setItemAsync(BIOMETRIC_KEY, settings.biometricLock ? 'true' : 'false');
}

function toStored(settings: Settings): StoredSettings {
  const { biometricLock: _biometricLock, ...rest } = settings;
  return rest;
}

// expo-secure-store has no web/keystore-less implementation; a read there throws.
async function readBiometricFlag(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(BIOMETRIC_KEY)) === 'true';
  } catch {
    return false;
  }
}
