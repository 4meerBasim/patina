import { memo } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
} from 'react-native';

import { RowSeparator } from '@/components/native/grouped-list';
import { Colors } from '@/constants/theme';

type FieldRowProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  accessibilityLabel: string;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  autoFocus?: boolean;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  hasSeparator: boolean;
};

export const FieldRow = memo(function FieldRow({
  label,
  value,
  onChangeText,
  accessibilityLabel,
  placeholder,
  keyboardType,
  autoFocus,
  autoCapitalize = 'sentences',
  hasSeparator,
}: FieldRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.disabled}
        keyboardType={keyboardType}
        autoFocus={autoFocus}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        cursorColor={Colors.brass}
        selectionColor={Colors.brass}
      />
      {hasSeparator ? <RowSeparator inset={16} /> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
    gap: 12,
  },
  label: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.bone,
  },
  input: {
    flex: 1,
    textAlign: 'right',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.bone,
    padding: 0,
    marginStart: 16,
    fontVariant: ['tabular-nums'],
  },
});
