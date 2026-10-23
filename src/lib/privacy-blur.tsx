import { BlurView } from 'expo-blur';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { create } from 'zustand';

import { Colors } from '@/constants/theme';
import { useDataStore } from '@/store';

const MASK_CHARACTER = '•';

type FigureVisibility = {
  hidden: boolean;
  hide: () => void;
  reveal: () => void;
};

// Session state, deliberately not persisted: the setting says how the app opens, and
// revealing or hiding figures by hand lasts only as long as the app stays open.
const useFigureVisibility = create<FigureVisibility>((set) => ({
  hidden: useDataStore.getState().settings.privacyBlur,
  hide: () => set({ hidden: true }),
  reveal: () => set({ hidden: false }),
}));

export function maskFigure(formatted: string): string {
  return MASK_CHARACTER.repeat(Math.max(4, Math.min(formatted.replace(/\D/g, '').length, 6)));
}

export type FigureMask = {
  hidden: boolean;
  mask: (formatted: string) => string;
  onPress: () => void;
  onLongPress: () => void;
  accessibilityHint: string;
};

// A tap hides the figures, a long press brings them back — the pair the design document
// asks for, so a figure can be covered in public without opening settings.
export function useFigureMask(): FigureMask {
  const hidden = useFigureVisibility((state) => state.hidden);
  const hide = useFigureVisibility((state) => state.hide);
  const reveal = useFigureVisibility((state) => state.reveal);

  return {
    hidden,
    mask: useCallback((formatted: string) => (hidden ? maskFigure(formatted) : formatted), [hidden]),
    onPress: hide,
    onLongPress: reveal,
    accessibilityHint: hidden ? 'Long press to show the figures' : 'Tap to hide the figures',
  };
}

export function PrivacyBlurGate({ children }: { children: ReactNode }) {
  const privacyBlur = useDataStore((state) => state.settings.privacyBlur);
  const [covered, setCovered] = useState(false);
  const wasHidden = useRef(useDataStore.getState().settings.privacyBlur);

  useEffect(() => {
    if (privacyBlur && !wasHidden.current) useFigureVisibility.getState().hide();
    wasHidden.current = privacyBlur;
  }, [privacyBlur]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      setCovered(next !== 'active');
      if (next !== 'active' && useDataStore.getState().settings.privacyBlur) {
        useFigureVisibility.getState().hide();
      }
    });
    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.flex}>
      {children}
      {privacyBlur && covered ? (
        <BlurView
          intensity={60}
          tint="dark"
          style={styles.cover}
          pointerEvents="none"
          importantForAccessibility="no-hide-descendants"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  cover: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
    bottom: 0,
    backgroundColor: Colors.inkScrim,
    zIndex: 20,
  },
});
