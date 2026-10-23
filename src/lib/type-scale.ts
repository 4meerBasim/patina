import { useWindowDimensions } from 'react-native';

import { TypeCap } from '@/constants/theme';

// The system text size as a multiplier, tracked reactively so a change in Settings
// re-renders rather than waiting for the next mount.
export function useFontScale(): number {
  return useWindowDimensions().fontScale;
}

// At Large and above the design document asks layouts to respond, not just grow: the
// editorial tab bar shows its labels and two-column blocks stack.
export function useIsLargeType(): boolean {
  return useFontScale() >= TypeCap.large;
}

// A hero figure stops growing at its cap and abbreviates from there.
export function useCompactHero(): boolean {
  return useFontScale() > TypeCap.hero;
}
