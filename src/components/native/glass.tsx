import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors } from '@/constants/theme';

type GlassProps = {
  radius: number;
  isFloating?: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

export function Glass({ radius, isFloating = false, style, children }: GlassProps) {
  return (
    <View style={[styles.stack, { borderRadius: radius }, isFloating && styles.dropShadow, style]}>
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.layer,
          { borderRadius: radius, overflow: 'hidden' },
        ]}>
        {isFloating && <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />}
        <View style={[StyleSheet.absoluteFill, styles.fill, { borderRadius: radius }]} />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    zIndex: 0,
  },
  layer: {
    zIndex: -1,
  },
  dropShadow: {
    boxShadow: `0 6px 16px ${Colors.shadow}`,
  },
  fill: {
    backgroundColor: Colors.glassFill,
    borderWidth: 0.5,
    borderColor: Colors.glassBorder,
    boxShadow: `inset 1.5px 1.5px 1px ${Colors.glassHighlight}`,
  },
});
