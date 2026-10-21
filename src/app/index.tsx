import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

export default function StyleChooser() {
  return (
    <View style={styles.screen}>
      <Text style={styles.caption}>Patina · Screens</Text>
      <Text style={styles.title}>Choose a style.</Text>
      <View style={styles.spacer} />
      <Pressable
        accessibilityRole="button"
        style={styles.option}
        onPress={() => router.push('/editorial/onboarding')}>
        <Text style={styles.optionTitle}>Editorial</Text>
        <Text style={styles.optionDetail}>Turn 1 · 13 screens</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        style={styles.option}
        onPress={() => router.push('/native')}>
        <Text style={styles.optionTitle}>Native</Text>
        <Text style={styles.optionDetail}>Turn 2 · 6 screens</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.ink,
    paddingTop: 72,
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  caption: {
    fontFamily: Fonts.manropeMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.32,
    textTransform: 'uppercase',
    color: Colors.slate,
    marginTop: 24,
  },
  title: {
    fontFamily: Fonts.newsreaderLight44,
    fontSize: 44,
    lineHeight: 48.4,
    letterSpacing: -0.88,
    color: Colors.bone,
    marginTop: 20,
  },
  spacer: {
    flex: 1,
  },
  option: {
    height: 64,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 6,
    paddingHorizontal: 16,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionTitle: {
    fontFamily: Fonts.manropeMedium,
    fontSize: 15,
    color: Colors.bone,
  },
  optionDetail: {
    fontFamily: Fonts.manrope,
    fontSize: 13,
    color: Colors.slate,
  },
});
