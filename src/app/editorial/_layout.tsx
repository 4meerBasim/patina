import { Stack } from 'expo-router';

import { LocaleProvider } from '@/components/editorial/locale';
import { Colors } from '@/constants/theme';

export default function EditorialLayout() {
  return (
    <LocaleProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.ink } }}>
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="link" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen
          name="add"
          options={{
            presentation: 'transparentModal',
            animation: 'fade',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
      </Stack>
    </LocaleProvider>
  );
}
