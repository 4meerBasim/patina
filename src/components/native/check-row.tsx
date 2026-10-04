import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { RowSeparator } from '@/components/native/grouped-list';
import { Colors } from '@/constants/theme';

type CheckRowProps = {
  id: string;
  label: string;
  sub?: string;
  selected: boolean;
  onToggle: (id: string) => void;
  hasSeparator: boolean;
};

export const CheckRow = memo(function CheckRow({
  id,
  label,
  sub,
  selected,
  onToggle,
  hasSeparator,
}: CheckRowProps) {
  const onPress = useCallback(() => onToggle(id), [id, onToggle]);
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      style={styles.row}
      onPress={onPress}>
      <View style={styles.body}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      </View>
      {selected ? (
        <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
          <Path
            d="M3.5 9.5l3.5 3.5 7.5-8"
            stroke={Colors.brass}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ) : null}
      {hasSeparator ? <RowSeparator inset={16} /> : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 16,
    gap: 12,
  },
  body: {
    flex: 1,
  },
  label: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.bone,
    textAlign: 'auto',
  },
  sub: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: Colors.slate,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
    textAlign: 'auto',
  },
});
