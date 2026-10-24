import { Appearance as RNAppearance, useColorScheme } from 'react-native';

import { DarkPalette, LightPalette } from '@/constants/theme';
import type { Appearance } from '@/data/settings';

export const APPEARANCES: Appearance[] = ['dark', 'light', 'system'];

// iOS resolves DynamicColorIOS against the app's override, so setting the scheme here is
// what makes every static stylesheet in the app flip. 'system' clears the override.
export function applyAppearance(appearance: Appearance): void {
  RNAppearance.setColorScheme(appearance === 'system' ? 'unspecified' : appearance);
}

export function nextAppearance(current: Appearance): Appearance {
  return APPEARANCES[(APPEARANCES.indexOf(current) + 1) % APPEARANCES.length];
}

export function appearanceLabel(appearance: Appearance): string {
  return appearance.charAt(0).toUpperCase() + appearance.slice(1);
}

// The palette as plain strings, for the few places that need a colour they can read:
// the navigation theme, and anything interpolating on the UI thread.
export function usePalette(): typeof DarkPalette | typeof LightPalette {
  return useColorScheme() === 'light' ? LightPalette : DarkPalette;
}

export function useIsLightAppearance(): boolean {
  return useColorScheme() === 'light';
}
