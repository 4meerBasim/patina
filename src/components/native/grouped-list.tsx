import { memo, type ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

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

type KeyValueRowProps = {
  label: string;
  value: string;
  valueColor?: string;
  hasSeparator: boolean;
};

export const KeyValueRow = memo(function KeyValueRow({
  label,
  value,
  valueColor = Colors.ash,
  hasSeparator,
}: KeyValueRowProps) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={[styles.kvValue, { color: valueColor }]}>{value}</Text>
      {hasSeparator ? <RowSeparator inset={16} /> : null}
    </View>
  );
});

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
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
    gap: 12,
  },
  kvLabel: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.bone,
  },
  kvValue: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
    flexShrink: 1,
  },
});
