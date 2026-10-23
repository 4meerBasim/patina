import { memo, useRef } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  Easing,
  useReducedMotion,
  withTiming,
  type EntryExitAnimationFunction,
} from 'react-native-reanimated';

import { Motion } from '@/constants/theme';

export type DriftDirection = 'up' | 'down' | 'none';

const DRIFT = Easing.bezier(...Motion.driftEasing);

function timing(duration: number) {
  return { duration, easing: DRIFT };
}

// A changed glyph cross-fades while the outgoing copy drifts 24px in the direction of the
// change and the incoming one arrives from the opposite side. Both copies sit above an
// invisible in-flow glyph, so the cell keeps its width and nothing re-layouts mid-drift.
function enterFrom(offset: number, duration: number): EntryExitAnimationFunction {
  return () => {
    'worklet';
    return {
      initialValues: { opacity: 0, transform: [{ translateY: offset }] },
      animations: {
        opacity: withTiming(1, timing(duration)),
        transform: [{ translateY: withTiming(0, timing(duration)) }],
      },
    };
  };
}

function exitTo(offset: number, duration: number): EntryExitAnimationFunction {
  return () => {
    'worklet';
    return {
      initialValues: { opacity: 1, transform: [{ translateY: 0 }] },
      animations: {
        opacity: withTiming(0, timing(duration)),
        transform: [{ translateY: withTiming(offset, timing(duration)) }],
      },
    };
  };
}

const DriftCell = memo(function DriftCell({
  glyph,
  direction,
  style,
  maxFontSizeMultiplier,
}: {
  glyph: string;
  direction: DriftDirection;
  style?: StyleProp<TextStyle>;
  maxFontSizeMultiplier?: number;
}) {
  const reducedMotion = useReducedMotion();
  const duration = reducedMotion ? 0 : Motion.drift;
  const offset = reducedMotion || direction === 'none' ? 0 : Motion.digitDrift;
  const rise = direction === 'down' ? -offset : offset;

  return (
    <View style={styles.cell}>
      <Text
        style={[style, styles.spacer]}
        maxFontSizeMultiplier={maxFontSizeMultiplier}
        importantForAccessibility="no">
        {glyph}
      </Text>
      <Animated.Text
        key={glyph}
        entering={enterFrom(rise, duration)}
        exiting={exitTo(-rise, duration)}
        style={[style, styles.glyph]}
        maxFontSizeMultiplier={maxFontSizeMultiplier}
        importantForAccessibility="no">
        {glyph}
      </Animated.Text>
    </View>
  );
});

export type DriftingFigureProps = {
  value: string;
  // The figure behind the string. Given it, the component drifts up for an increase and
  // down for a decrease without the caller tracking the previous value itself.
  amount?: number;
  direction?: DriftDirection;
  style?: StyleProp<TextStyle>;
  tailStyle?: StyleProp<TextStyle>;
  maxFontSizeMultiplier?: number;
  accessibilityLabel?: string;
};

// Splits a formatted figure into one cell per glyph so only the digits that changed move.
// Tabular numerals keep the row's width stable; the tail style covers the cents, which the
// editorial and native heroes both set in a dimmer colour.
export const DriftingFigure = memo(function DriftingFigure({
  value,
  amount,
  direction = 'none',
  style,
  tailStyle,
  maxFontSizeMultiplier,
  accessibilityLabel,
}: DriftingFigureProps) {
  const previous = useRef(amount);
  let moving = direction;
  if (amount !== undefined) {
    const before = previous.current;
    moving = before === undefined || amount === before ? 'none' : amount > before ? 'up' : 'down';
    previous.current = amount;
  }
  const tailFrom = tailStyle ? value.search(/[.٫]/) : -1;

  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? value}>
      {Array.from(value).map((glyph, index) => (
        <DriftCell
          key={index}
          glyph={glyph}
          direction={moving}
          style={tailFrom >= 0 && index >= tailFrom ? [style, tailStyle] : style}
          maxFontSizeMultiplier={maxFontSizeMultiplier}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  cell: {
    position: 'relative',
  },
  spacer: {
    opacity: 0,
  },
  glyph: {
    position: 'absolute',
    top: 0,
    start: 0,
  },
});
