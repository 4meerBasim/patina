import { Tabs } from 'expo-router/js-tabs';

import { NativeTabBar } from '@/components/native/tab-bar';
import { Colors } from '@/constants/theme';

export default function NativeTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <NativeTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: Colors.ink } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="portfolio" />
      <Tabs.Screen name="goals" />
      <Tabs.Screen name="notes" />
    </Tabs>
  );
}
