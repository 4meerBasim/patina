import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Caption } from '@/components/editorial/caption';
import { useLocale } from '@/components/editorial/locale';
import { Colors, Fonts } from '@/constants/theme';

export default function OnboardingScreen() {
  const { locale, setLocale } = useLocale();
  const isEnglish = locale === 'en';

  return (
    <View style={styles.screen}>
      <View style={styles.progress} />

      <Caption style={styles.eyebrow}>Patina · I</Caption>
      <Text style={styles.title}>{'Wealth is a\nslow number.'}</Text>
      <Text style={styles.body}>
        Patina shows every holding you own — stocks, crypto, property, cash — as one quiet figure
        that you watch, not chase.
      </Text>

      <View style={styles.spacer} />

      <Caption style={styles.languageLabel}>Language · Numerals</Caption>
      <View style={styles.languageRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: isEnglish }}
          style={[styles.languageButton, isEnglish ? styles.selected : styles.unselected]}
          onPress={() => setLocale('en')}>
          <Text
            style={[styles.languageEn, isEnglish ? styles.selectedText : styles.unselectedText]}>
            English · 0–9
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: !isEnglish }}
          style={[styles.languageButton, !isEnglish ? styles.selected : styles.unselected]}
          onPress={() => setLocale('ar')}>
          <Text
            style={[styles.languageAr, !isEnglish ? styles.selectedText : styles.unselectedText]}>
            العربية · ٠–٩
          </Text>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        style={styles.continueButton}
        onPress={() => router.push('/editorial/link')}>
        <Text style={styles.continueLabel}>Continue</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        hitSlop={{ top: 13, bottom: 13, left: 24, right: 24 }}
        onPress={() => router.replace('/editorial')}>
        <Text style={styles.skip}>Skip and add holdings by hand</Text>
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
  progress: {
    position: 'absolute',
    top: 60,
    left: 24,
    width: 118,
    height: 1,
    backgroundColor: Colors.brass,
  },
  eyebrow: {
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
  body: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.ash,
    marginTop: 20,
    maxWidth: 300,
  },
  spacer: {
    flex: 1,
  },
  languageLabel: {
    marginBottom: 12,
  },
  languageRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
  },
  languageButton: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    borderColor: Colors.brass,
  },
  unselected: {
    borderColor: Colors.hairline,
  },
  selectedText: {
    color: Colors.bone,
  },
  unselectedText: {
    color: Colors.ash,
  },
  languageEn: {
    fontFamily: Fonts.manropeMedium,
    fontSize: 15,
  },
  languageAr: {
    fontFamily: Fonts.plexArabicMedium,
    fontSize: 16,
  },
  continueButton: {
    height: 56,
    backgroundColor: Colors.brass,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueLabel: {
    fontFamily: Fonts.manropeSemiBold,
    fontSize: 15,
    color: Colors.ink,
  },
  skip: {
    textAlign: 'center',
    fontFamily: Fonts.manrope,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.slate,
    marginTop: 16,
  },
});
