import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Glass } from '@/components/native/glass';
import { Colors } from '@/constants/theme';

const tabs = [
  { name: 'index', label: 'Home', d: 'M3 12l9-8 9 8M5 10v10h14V10' },
  { name: 'portfolio', label: 'Portfolio', d: 'M4 19h16M4 14l4-4 4 3 8-8' },
  { name: 'goals', label: 'Goals', d: 'M6 21V4l12 4-12 4' },
  {
    name: 'notes',
    label: 'Notes',
    d: 'M12 3l1.5 3.5L17 8l-3.5 1.5L12 13l-1.5-3.5L7 8l3.5-1.5zM5 15l.8 1.7 1.7.8-1.7.8L5 20l-.8-1.7-1.7-.8 1.7-.8zM18 14l1 2 2 1-2 1-1 2-1-2-2-1 2-1z',
  },
];

export function NativeTabBar({ state, navigation }: BottomTabBarProps) {
  const focusedName = state.routes[state.index].name;

  return (
    <View style={styles.row}>
      <Glass radius={32} isFloating style={styles.pill}>
        {tabs.map((tab) => {
          const route = state.routes.find((r) => r.name === tab.name);
          const isFocused = focusedName === tab.name;
          const color = isFocused ? Colors.bone : Colors.ash;
          const onPress = () => {
            if (!route) return;
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented)
              navigation.navigate(route.name, route.params);
          };
          return (
            <Pressable
              key={tab.name}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: isFocused, disabled: !route }}
              disabled={!route}
              hitSlop={8}
              style={styles.item}
              onPress={onPress}>
              <Svg
                width={24}
                height={24}
                viewBox="0 0 24 24"
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round">
                <Path d={tab.d} />
              </Svg>
              <Text style={[styles.label, { color }]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </Glass>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add holding"
        onPress={() => router.push('/native/add')}>
        <Glass radius={32} isFloating style={styles.add}>
          <Svg
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke={Colors.brass}
            strokeWidth={2.2}
            strokeLinecap="round">
            <Path d="M12 5v14M5 12h14" />
          </Svg>
        </Glass>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 28,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  pill: {
    flex: 1,
    height: 65,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  item: {
    alignItems: 'center',
    gap: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
  },
  add: {
    width: 65,
    height: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
