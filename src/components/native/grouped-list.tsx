import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors } from '@/constants/theme';

type GroupedCardProps = {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

export function GroupedCard({ style, children }: GroupedCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function RowSeparator({ inset }: { inset: number }) {
  return <View style={[styles.separator, { left: inset }]} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface1,
    borderRadius: 26,
    overflow: 'hidden',
  },
  separator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    height: 0.5,
    backgroundColor: Colors.hairline,
  },
});
