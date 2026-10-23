import { memo, useEffect, useState, type ReactNode } from 'react';
import { AppState, I18nManager, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Colors, Motion } from '@/constants/theme';

const SETTLE = Easing.bezier(...Motion.settleEasing);
const WARM_WINDOW_MS = 5 * 60 * 1000;

// Module state so the reveal survives a remount: it belongs to the app's launch, not to
// one component's lifetime. A cold launch leaves this null, which is what distinguishes it
// from coming back to an app that was only briefly away.
let lastInactiveAt: number | null = null;

export function useReveal(): boolean {
  const [active] = useState(
    () => lastInactiveAt === null || Date.now() - lastInactiveAt >= WARM_WINDOW_MS,
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'active') lastInactiveAt = Date.now();
    });
    return () => subscription.remove();
  }, []);

  return active;
}

export type RevealProps = {
  active: boolean;
  delay?: number;
  duration?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

// Opacity from 0 with a 12px rise, which is the only entrance the design document allows.
export const Reveal = memo(function Reveal({
  active,
  delay = 0,
  duration = Motion.settle,
  children,
  style,
}: RevealProps) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(active && !reducedMotion ? 0 : 1);

  useEffect(() => {
    if (!active || reducedMotion) {
      progress.value = 1;
      return;
    }
    progress.value = withDelay(delay, withTiming(1, { duration, easing: SETTLE }));
  }, [active, delay, duration, progress, reducedMotion]);

  const enter = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * Motion.rise }],
  }));

  return <Animated.View style={[style, enter]}>{children}</Animated.View>;
});

// The brass hairline draws itself across the caption, from the start edge, which mirrors
// to right-to-left with the rest of the layout.
export const BrassRule = memo(function BrassRule({
  active,
  style,
}: {
  active: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const reducedMotion = useReducedMotion();
  const drawn = useSharedValue(active && !reducedMotion ? 0 : 1);

  useEffect(() => {
    if (!active || reducedMotion) {
      drawn.value = 1;
      return;
    }
    drawn.value = withTiming(1, { duration: Motion.rule, easing: SETTLE });
  }, [active, drawn, reducedMotion]);

  // scaleX rather than width so the draw stays on the compositor, anchored to the edge the
  // layout starts from — which is the right edge once the app is in Arabic.
  const draw = useAnimatedStyle(() => ({ transform: [{ scaleX: drawn.value }] }));

  return (
    <Animated.View
      style={[styles.rule, I18nManager.isRTL ? styles.fromEnd : styles.fromStart, style, draw]}
    />
  );
});

const styles = StyleSheet.create({
  rule: {
    height: 1,
    backgroundColor: Colors.brass,
  },
  fromStart: {
    transformOrigin: 'left',
  },
  fromEnd: {
    transformOrigin: 'right',
  },
});
