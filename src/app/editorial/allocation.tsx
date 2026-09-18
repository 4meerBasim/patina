import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { Caption } from '@/components/editorial/caption';
import { AssetClassColors, Colors, Fonts } from '@/constants/theme';

type AllocationClass = {
  key: string;
  name: string;
  color: string;
  actual: number;
  target: number;
  dashArray: string;
  dashOffset: number;
};

const CLASSES: AllocationClass[] = [
  {
    key: 'stocks',
    name: 'Stocks',
    color: AssetClassColors.stocks,
    actual: 46,
    target: 40,
    dashArray: '299 691',
    dashOffset: 0,
  },
  {
    key: 'crypto',
    name: 'Crypto',
    color: AssetClassColors.crypto,
    actual: 9,
    target: 5,
    dashArray: '59 691',
    dashOffset: -307,
  },
  {
    key: 'property',
    name: 'Real estate',
    color: AssetClassColors.property,
    actual: 31,
    target: 35,
    dashArray: '202 691',
    dashOffset: -374,
  },
  {
    key: 'cash',
    name: 'Cash',
    color: AssetClassColors.cash,
    actual: 6,
    target: 10,
    dashArray: '39 691',
    dashOffset: -584,
  },
  {
    key: 'savings',
    name: 'Savings',
    color: AssetClassColors.savings,
    actual: 8,
    target: 10,
    dashArray: '52 691',
    dashOffset: -631,
  },
];

function formatDrift(actual: number, target: number) {
  const drift = actual - target;
  return `${drift >= 0 ? '+' : '−'}${Math.abs(drift)}pt`;
}

export default function AllocationScreen() {
  const [selectedKey, setSelectedKey] = useState('stocks');
  const selected = CLASSES.find((item) => item.key === selectedKey) ?? CLASSES[0];

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Caption>
          Allocation · <Text style={styles.brass}>All</Text>
        </Caption>

        <View style={styles.ring}>
          <Svg width={260} height={260} viewBox="0 0 260 260">
            <G transform="rotate(-90 130 130)">
              <Circle
                cx={130}
                cy={130}
                r={122}
                fill="none"
                stroke={Colors.slate}
                strokeWidth={1}
                strokeDasharray="2 4"
              />
              {CLASSES.map((item) => {
                const isSelected = item.key === selectedKey;
                return (
                  <Circle
                    key={item.key}
                    cx={130}
                    cy={130}
                    r={110}
                    fill="none"
                    stroke={item.color}
                    strokeWidth={isSelected ? 10 : 4}
                    strokeDasharray={item.dashArray}
                    strokeDashoffset={item.dashOffset}
                    opacity={isSelected ? 1 : 0.32}
                  />
                );
              })}
            </G>
          </Svg>
          <View style={styles.ringLabel}>
            <Caption>{selected.name}</Caption>
            <Text style={styles.ringPercent}>{selected.actual}%</Text>
            <Text style={styles.ringTarget}>
              target {selected.target} ·{' '}
              <Text style={styles.copper}>{formatDrift(selected.actual, selected.target)}</Text>
            </Text>
          </View>
        </View>

        <View style={styles.legend}>
          {CLASSES.map((item, index) => {
            const isSelected = item.key === selectedKey;
            const isLast = index === CLASSES.length - 1;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => setSelectedKey(item.key)}
                style={[
                  styles.legendRow,
                  { borderTopColor: isSelected ? Colors.brass : Colors.hairline },
                  isLast && styles.legendRowLast,
                ]}>
                <View style={[styles.swatch, { backgroundColor: item.color }]} />
                <Text style={[styles.legendName, { color: isSelected ? Colors.bone : Colors.ash }]}>
                  {item.name}
                </Text>
                <Text
                  style={[styles.legendActual, { color: isSelected ? Colors.bone : Colors.ash }]}>
                  {item.actual}%
                </Text>
                <Text style={styles.legendTarget}>{item.target}</Text>
              </Pressable>
            );
          })}
          <View style={styles.legendHeader}>
            <Caption>Class</Caption>
            <Caption>Actual · Target</Caption>
          </View>
        </View>

        <Text style={styles.setTargets}>Set targets</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.ink,
  },
  content: {
    paddingTop: 68,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  brass: {
    color: Colors.brass,
  },
  copper: {
    color: Colors.copper,
  },
  ring: {
    marginTop: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringLabel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPercent: {
    fontFamily: Fonts.newsreaderLight40,
    fontSize: 40,
    lineHeight: 44,
    color: Colors.bone,
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
  ringTarget: {
    fontFamily: Fonts.manrope,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.ash,
    marginTop: 4,
  },
  legend: {
    marginTop: 40,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 53,
    gap: 14,
    borderTopWidth: 1,
  },
  legendRowLast: {
    height: 54,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
  },
  swatch: {
    width: 14,
    height: 3,
  },
  legendName: {
    flex: 1,
    fontFamily: Fonts.manrope,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  legendActual: {
    width: 64,
    textAlign: 'right',
    fontFamily: Fonts.manrope,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  legendTarget: {
    width: 56,
    textAlign: 'right',
    fontFamily: Fonts.manrope,
    fontSize: 13,
    color: Colors.slate,
    fontVariant: ['tabular-nums'],
  },
  legendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  setTargets: {
    textAlign: 'center',
    fontFamily: Fonts.manrope,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.brass,
    marginTop: 32,
  },
});
