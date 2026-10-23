import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { DirectionView } from '@/components/editorial/direction-view';
import { useLocale } from '@/components/editorial/locale';
import { Colors, Fonts, TypeCap } from '@/constants/theme';
import { useIsLargeType } from '@/lib/type-scale';

const labels: Record<string, string> = {
  index: 'Home',
  portfolio: 'Portfolio',
  goals: 'Goals',
  notes: 'Notes',
};

function TabIcon({ name, color }: { name: string; color: string }) {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round">
      {name === 'index' && (
        <>
          <Circle cx={12} cy={12} r={8} />
          <Circle cx={12} cy={12} r={2} />
        </>
      )}
      {name === 'portfolio' && <Path d="M4 18h16M4 12h10M4 6h13" />}
      {name === 'goals' && <Path d="M6 20V5l12 4-12 4" />}
      {name === 'notes' && <Path d="M5 6h14M5 12h14M5 18h9" />}
    </Svg>
  );
}

export function EditorialTabBar({ state, navigation }: BottomTabBarProps) {
  const { locale } = useLocale();
  const isLargeType = useIsLargeType();

  const tabs = state.routes.map((route, index) => {
    const isFocused = state.index === index;
    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
    };
    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityLabel={labels[route.name]}
        accessibilityState={{ selected: isFocused }}
        hitSlop={10}
        style={styles.tab}
        onPress={onPress}>
        <TabIcon name={route.name} color={isFocused ? Colors.bone : Colors.slate} />
        {isLargeType ? (
          <Text
            style={[styles.label, { color: isFocused ? Colors.bone : Colors.slate }]}
            maxFontSizeMultiplier={TypeCap.heading}>
            {labels[route.name]}
          </Text>
        ) : null}
      </Pressable>
    );
  });

  tabs.splice(
    2,
    0,
    <Pressable
      key="add"
      accessibilityRole="button"
      accessibilityLabel="Add holding"
      hitSlop={2}
      style={styles.add}
      onPress={() => router.push('/editorial/add')}>
      <Svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke={Colors.brass}
        strokeWidth={1.5}
        strokeLinecap="round">
        <Path d="M12 5v14M5 12h14" />
      </Svg>
    </Pressable>,
  );

  return (
    <DirectionView isRtl={locale === 'ar'} style={styles.bar}>
      {tabs}
    </DirectionView>
  );
}

const styles = StyleSheet.create({
  tab: {
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontFamily: Fonts.manropeMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.44,
  },
  bar: {
    height: 99,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingTop: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface1,
  },
  add: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: Colors.brass,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -8,
  },
});
