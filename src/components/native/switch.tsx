import { useEffect } from 'react';
import { Pressable, StyleSheet, useColorScheme } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Colors, DarkPalette, LightPalette } from '@/constants/theme';

type SwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
};

const timing = { duration: 200, easing: Easing.bezier(0.4, 0, 0.2, 1) };

export function Switch({ value, onValueChange, accessibilityLabel }: SwitchProps) {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, timing);
  }, [value, progress]);

  // interpolateColor runs on the UI thread and needs a colour it can parse, which rules
  // out the appearance-resolved tokens: the brass endpoint comes from the palette directly.
  const brass = useColorScheme() === 'light' ? LightPalette.brass : DarkPalette.brass;
  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [Colors.glassFill, brass]),
  }));

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * 20 }],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      hitSlop={8}
      onPress={() => onValueChange(!value)}>
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.knob, knobStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 51,
    height: 31,
    borderRadius: 16,
    justifyContent: 'center',
  },
  knob: {
    position: 'absolute',
    left: 2,
    top: 2,
    width: 27,
    height: 27,
    borderRadius: 13.5,
    backgroundColor: Colors.white,
    boxShadow: `0 2px 4px ${Colors.shadow}`,
  },
});
