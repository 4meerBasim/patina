import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors } from '@/constants/theme';

type SegmentedControlProps = {
  options: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  style?: StyleProp<ViewStyle>;
};

export function SegmentedControl({
  options,
  selectedIndex,
  onSelect,
  style,
}: SegmentedControlProps) {
  return (
    <View style={[styles.track, style]}>
      {options.map((option, index) => {
        const isSelected = index === selectedIndex;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            hitSlop={8}
            style={[styles.segment, isSelected && styles.segmentSelected]}
            onPress={() => onSelect(index)}>
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: Colors.segmentTrack,
    borderRadius: 9,
    padding: 2,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    borderRadius: 7,
  },
  segmentSelected: {
    backgroundColor: Colors.hairline,
    boxShadow: `0 1px 3px ${Colors.shadow}`,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: Colors.ash,
  },
  labelSelected: {
    color: Colors.bone,
  },
});
