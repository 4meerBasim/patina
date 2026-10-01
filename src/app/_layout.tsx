import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, FontFiles, Fonts } from '@/constants/theme';
import { useHydrateStore } from '@/store';

SplashScreen.preventAutoHideAsync();

const theme: Theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: Colors.ink, card: Colors.ink },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FontFiles);
  const { ready, error } = useHydrateStore();

  useEffect(() => {
    if ((fontsLoaded || fontError) && (ready || error)) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError, ready, error]);

  if (!fontsLoaded && !fontError) return null;
  if (!ready && !error) return null;

  if (error) {
    return (
      <ThemeProvider value={theme}>
        <StatusBar style="light" />
        <View style={styles.errorScreen}>
          <Text style={styles.errorTitle}>Patina could not open your data</Text>
          <Text style={styles.errorBody}>Please reopen the app to try again.</Text>
        </View>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={theme}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.ink } }}
      />
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
