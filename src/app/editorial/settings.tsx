import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Caption } from '@/components/editorial/caption';
import { useLocale } from '@/components/editorial/locale';
import { Colors, Fonts } from '@/constants/theme';

const timing = { duration: 200, easing: Easing.bezier(0.4, 0, 0.2, 1) };

function Toggle({ isOn, onToggle, label }: { isOn: boolean; onToggle: () => void; label: string }) {
  const progress = useSharedValue(isOn ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isOn ? 1 : 0, timing);
  }, [isOn, progress]);

  const knobStyle = useAnimatedStyle(() => ({ transform: [{ translateX: progress.value * 20 }] }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: isOn }}
      hitSlop={{ top: 9, bottom: 9, left: 9, right: 9 }}
      onPress={onToggle}>
      <View style={[styles.track, { borderColor: isOn ? Colors.brass : Colors.hairline }]}>
        <Animated.View
          style={[styles.knob, { backgroundColor: isOn ? Colors.brass : Colors.slate }, knobStyle]}
        />
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { locale, setLocale } = useLocale();
  const [isBlurOn, setIsBlurOn] = useState(true);
  const [isFaceIdOn, setIsFaceIdOn] = useState(true);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <View style={styles.profile}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarLetter}>R</Text>
        </View>
        <View>
          <Text style={styles.profileName}>Rania Haddad</Text>
          <Text style={styles.profileMeta}>Member since 2023 · USD base</Text>
        </View>
      </View>

      <Caption style={[styles.sectionCaption, styles.firstSection]}>Linked accounts</Caption>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Interactive Brokers</Text>
        <Text style={styles.rowValueSmall}>synced 09:12</Text>
      </View>
      <View style={[styles.row, styles.rowDivided]}>
        <Text style={styles.rowLabel}>Coinbase</Text>
        <Text style={styles.rowValueSmall}>synced 09:12</Text>
      </View>
      <View style={[styles.row, styles.rowDivided]}>
        <Text style={styles.rowLabel}>Chase</Text>
        <Text style={styles.rowValueReconnect}>reconnect</Text>
      </View>

      <Caption style={styles.sectionCaption}>Language & numbers</Caption>
      <Pressable
        accessibilityRole="button"
        style={styles.row}
        onPress={() => setLocale(locale === 'en' ? 'ar' : 'en')}>
        <Text style={styles.rowLabel}>Language</Text>
        <Text style={locale === 'en' ? styles.rowValue : styles.rowValueAr}>
          {locale === 'en' ? 'English' : 'العربية'}
        </Text>
      </Pressable>
      <View style={[styles.row, styles.rowDivided]}>
        <Text style={styles.rowLabel}>Numerals</Text>
        <Text style={styles.rowValue}>0 1 2 3 · ٠ ١ ٢ ٣</Text>
      </View>
      <View style={[styles.row, styles.rowDivided]}>
        <Text style={styles.rowLabel}>Base currency</Text>
        <Text style={styles.rowValue}>USD</Text>
      </View>

      <Caption style={styles.sectionCaption}>Appearance & privacy</Caption>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Appearance</Text>
        <Text style={styles.rowValue}>Dark</Text>
      </View>
      <View style={[styles.row, styles.rowDivided]}>
        <Text style={styles.rowLabel}>Blur figures on launch</Text>
        <Toggle
          isOn={isBlurOn}
          onToggle={() => setIsBlurOn((v) => !v)}
          label="Blur figures on launch"
        />
      </View>
      <View style={[styles.row, styles.rowDivided]}>
        <Text style={styles.rowLabel}>Face ID</Text>
        <Toggle isOn={isFaceIdOn} onToggle={() => setIsFaceIdOn((v) => !v)} label="Face ID" />
      </View>

      <View style={styles.spacer} />
      <Text style={styles.danger}>Export all data · Delete account</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.ink,
  },
  content: {
    flexGrow: 1,
    paddingTop: 68,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  profile: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  profileAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: Colors.brass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarLetter: {
    fontFamily: Fonts.newsreader24,
    fontSize: 24,
    color: Colors.bone,
  },
  profileName: {
    fontFamily: Fonts.newsreader24,
    fontSize: 24,
    lineHeight: 30,
    color: Colors.bone,
  },
  profileMeta: {
    fontFamily: Fonts.manrope,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.slate,
  },
  sectionCaption: {
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    paddingTop: 12,
  },
  firstSection: {
    marginTop: 40,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 52,
  },
  rowDivided: {
    height: 53,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
  },
  rowLabel: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    color: Colors.bone,
  },
  rowValue: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    color: Colors.ash,
  },
  rowValueAr: {
    fontFamily: Fonts.plexArabic,
    fontSize: 15,
    color: Colors.ash,
  },
  rowValueSmall: {
    fontFamily: Fonts.manrope,
    fontSize: 13,
    color: Colors.slate,
  },
  rowValueReconnect: {
    fontFamily: Fonts.manrope,
    fontSize: 13,
    color: Colors.copper,
  },
  track: {
    width: 46,
    height: 28,
    borderRadius: 13,
    borderWidth: 1,
    justifyContent: 'center',
  },
  knob: {
    position: 'absolute',
    left: 3,
    top: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  spacer: {
    flex: 1,
  },
  danger: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.destructive,
  },
});
