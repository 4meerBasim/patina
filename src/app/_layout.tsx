import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, FontFiles, Fonts } from '@/constants/theme';
import { applyAppearance, useIsLightAppearance, usePalette } from '@/lib/appearance';
import { BiometricGate } from '@/lib/biometric-gate';
import { PrivacyBlurGate } from '@/lib/privacy-blur';
import { useDataStore, useHydrateStore } from '@/store';

SplashScreen.preventAutoHideAsync();

function useAppTheme(): Theme {
  const palette = usePalette();
  const base = useIsLightAppearance() ? DefaultTheme : DarkTheme;
  return {
    ...base,
    colors: { ...base.colors, background: palette.ink, card: palette.ink },
  };
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FontFiles);
  const { ready, error } = useHydrateStore();
  const theme = useAppTheme();
  const isLight = useIsLightAppearance();

  useEffect(() => {
    if ((fontsLoaded || fontError) && (ready || error)) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError, ready, error]);

  // The stored appearance has to reach the native layer before anything renders, which is
  // also what makes the DynamicColorIOS tokens resolve the way the user chose.
  useEffect(() => {
    if (ready) applyAppearance(useDataStore.getState().settings.appearance);
  }, [ready]);

  if (!fontsLoaded && !fontError) return null;
  if (!ready && !error) return null;

  if (error) {
    return (
      <ThemeProvider value={theme}>
        <StatusBar style={isLight ? 'dark' : 'light'} />
        <View style={styles.errorScreen}>
          <Text style={styles.errorTitle}>Patina could not open your data</Text>
          <Text style={styles.errorBody}>Please reopen the app to try again.</Text>
        </View>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={theme}>
      <StatusBar style={isLight ? 'dark' : 'light'} />
      <BiometricGate>
        <PrivacyBlurGate>
          <Stack
            screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.ink } }}
          />
        </PrivacyBlurGate>
      </BiometricGate>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  errorScreen: {
    flex: 1,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  errorTitle: {
    fontFamily: Fonts.newsreaderLight32,
    fontSize: 24,
    lineHeight: 30,
    color: Colors.bone,
    textAlign: 'center',
  },
  errorBody: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.ash,
    textAlign: 'center',
  },
});
