import { Tabs } from 'expo-router/js-tabs';

import { EditorialTabBar } from '@/components/editorial/tab-bar';
import { Colors } from '@/constants/theme';

export default function EditorialTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <EditorialTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: Colors.ink } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="portfolio" />
      <Tabs.Screen name="goals" />
      <Tabs.Screen name="notes" />
    </Tabs>
  );
}
