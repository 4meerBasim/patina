import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

type PeriodSelectorProps = {
  options: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  isArabic?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PeriodSelector({
  options,
  selectedIndex,
  onSelect,
  isArabic = false,
  style,
}: PeriodSelectorProps) {
  return (
    <View style={[styles.row, style]}>
      {options.map((option, index) => {
        const isSelected = index === selectedIndex;
        return (
          <Pressable
            key={option}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            hitSlop={{ top: 13, bottom: 13, left: 10, right: 10 }}
            style={[styles.option, isSelected && styles.selectedOption]}
            onPress={() => onSelect(index)}>
            <Text
              style={[styles.label, isArabic && styles.arabic, isSelected && styles.selectedLabel]}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },
  option: {
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
    paddingBottom: 2,
  },
  selectedOption: {
    borderBottomColor: Colors.brass,
  },
  label: {
    fontFamily: Fonts.manropeMedium,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.slate,
  },
  arabic: {
    fontFamily: Fonts.plexArabicMedium,
  },
  selectedLabel: {
    color: Colors.bone,
  },
});
