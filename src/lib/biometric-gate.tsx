import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Colors, Fonts } from '@/constants/theme';
import { useDataStore } from '@/store';

import { authenticate, getBiometricAvailability } from './biometric';

type LockStatus = 'checking' | 'locked' | 'unlocked';

function useBiometricLock() {
  const [status, setStatus] = useState<LockStatus>(() =>
    useDataStore.getState().settings.biometricLock ? 'checking' : 'unlocked',
  );
  const [authenticating, setAuthenticating] = useState(false);
  const authenticatingRef = useRef(false);
  const appState = useRef(AppState.currentState);

  const unlock = useCallback(async () => {
    if (authenticatingRef.current) return;
    authenticatingRef.current = true;
    setAuthenticating(true);
    try {
      if (await authenticate('Unlock Patina')) setStatus('unlocked');
    } finally {
      authenticatingRef.current = false;
      setAuthenticating(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!useDataStore.getState().settings.biometricLock) {
        setStatus('unlocked');
        return;
      }
      const available = await getBiometricAvailability();
      if (active) setStatus(available ? 'locked' : 'unlocked');
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (status === 'locked') void unlock();
  }, [status, unlock]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      const previous = appState.current;
      appState.current = next;
      if (authenticatingRef.current) return;
      if (next === 'active' && previous === 'background') {
        void (async () => {
          if (!useDataStore.getState().settings.biometricLock) return;
          if (await getBiometricAvailability()) setStatus('locked');
        })();
      }
    });
    return () => subscription.remove();
  }, []);

  return { status, authenticating, unlock };
}

function LockOverlay({
  authenticating,
  onUnlock,
}: {
  authenticating: boolean;
  onUnlock: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    opacity.value = reducedMotion
      ? 1
      : withTiming(1, { duration: 240, easing: Easing.out(Easing.quad) });
  }, [opacity, reducedMotion]);

  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[styles.overlay, fade]}
      accessibilityViewIsModal
      importantForAccessibility="yes">
      <Text style={styles.caption}>Patina</Text>
      <Text style={styles.title} accessibilityRole="header">
        Locked
      </Text>
      <Text style={styles.body}>Unlock to view your portfolio.</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Unlock Patina"
        accessibilityHint="Authenticates with Face ID, Touch ID, or your device passcode"
        accessibilityState={{ disabled: authenticating, busy: authenticating }}
        disabled={authenticating}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.button}
        onPress={onUnlock}>
        <Text style={styles.buttonLabel}>Unlock</Text>
      </Pressable>
    </Animated.View>
  );
}

export function BiometricGate({ children }: { children: ReactNode }) {
  const { status, authenticating, unlock } = useBiometricLock();

  return (
    <View style={styles.flex}>
      {children}
      {status !== 'unlocked' ? (
        <LockOverlay authenticating={authenticating} onUnlock={unlock} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
    bottom: 0,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    zIndex: 10,
  },
  caption: {
    fontFamily: Fonts.manropeMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.32,
    textTransform: 'uppercase',
    color: Colors.slate,
    marginBottom: 16,
  },
  title: {
    fontFamily: Fonts.newsreaderLight32,
    fontSize: 32,
    lineHeight: 38,
    color: Colors.bone,
    textAlign: 'center',
  },
  body: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.ash,
    textAlign: 'center',
    marginTop: 8,
  },
  button: {
    marginTop: 32,
    minHeight: 52,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: Colors.brass,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    fontFamily: Fonts.manropeMedium,
    fontSize: 15,
    color: Colors.bone,
  },
});
