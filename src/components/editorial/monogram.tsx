import { StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

type MonogramProps = {
  label: string;
  isSelected?: boolean;
};

export function Monogram({ label, isSelected = false }: MonogramProps) {
  return (
    <View style={[styles.ring, { borderColor: isSelected ? Colors.brass : Colors.slate }]}>
      <Text style={[styles.label, label.length > 1 && styles.pair]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Fonts.newsreader15,
    fontSize: 15,
    color: Colors.bone,
  },
  pair: {
    fontFamily: Fonts.newsreader13,
    fontSize: 13,
  },
});
