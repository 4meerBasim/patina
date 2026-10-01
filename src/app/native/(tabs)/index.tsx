import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { Glass } from '@/components/native/glass';
import { SegmentedControl } from '@/components/native/segmented-control';
import { AssetClassColors, Colors } from '@/constants/theme';
import type { AssetClass } from '@/data/types';
import { formatCurrency, formatPercent } from '@/lib/money';
import { useAllocation, useNetWorth, usePeriodDelta, useSettings, useTodayDelta } from '@/store';

const CLASS_LABELS: Record<AssetClass, string> = {
  stocks: 'Stocks',
  crypto: 'Crypto',
  property: 'Property',
  cash: 'Cash',
  savings: 'Savings',
};

export default function NativeHome() {
  const [period, setPeriod] = useState(1);
  const settings = useSettings();
  const netWorth = useNetWorth();
  const allocationSlices = useAllocation();
  const monthDelta = usePeriodDelta(30);
  const todayDelta = useTodayDelta();

  const hero = formatCurrency(netWorth.total, settings.baseCurrency);
  const decimalAt = hero.lastIndexOf('.');
  const heroWhole = decimalAt >= 0 ? hero.slice(0, decimalAt) : hero;
  const heroCents = decimalAt >= 0 ? hero.slice(decimalAt) : '';

  const allocation = useMemo(
    () =>
      allocationSlices.map((slice) => ({
        assetClass: slice.assetClass,
        label: CLASS_LABELS[slice.assetClass],
        color: AssetClassColors[slice.assetClass],
        percent: formatPercent(slice.weight, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
        flex: Math.round(slice.weight),
      })),
    [allocationSlices],
  );

  const monthGain = monthDelta.amount >= 0;
  const todayGain = todayDelta.amount >= 0;

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.largeTitle}>Net Worth</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Profile"
            accessibilityHint="Long press to switch style"
            hitSlop={8}
            onPress={() => router.push('/native/settings')}
            onLongPress={() => router.dismissTo('/')}>
            <Glass radius={22} style={styles.avatar}>
              <Text style={styles.avatarLetter}>R</Text>
            </Glass>
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Total · Updated 9:12 AM</Text>
          <Text style={styles.heroValue}>
            {heroWhole}
            <Text style={styles.heroCents}>{heroCents}</Text>
          </Text>
          <View style={styles.chips}>
            <View style={[styles.chip, monthGain ? styles.gainChip : styles.lossChip]}>
              <Text style={[styles.chipText, monthGain ? styles.gainText : styles.lossText]}>
                {`${monthGain ? '▲' : '▼'} ${formatPercent(Math.abs(monthDelta.percent))} · 1M`}
              </Text>
            </View>
            <View style={[styles.chip, todayGain ? styles.gainChip : styles.lossChip]}>
              <Text style={[styles.chipText, todayGain ? styles.gainText : styles.lossText]}>
                {`${todayGain ? '▲' : '▼'} ${formatPercent(Math.abs(todayDelta.percent))} · Today`}
              </Text>
            </View>
          </View>
          <Svg viewBox="0 0 322 88" style={styles.heroChart}>
            <Defs>
              <LinearGradient id="n1" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={Colors.bone} stopOpacity={0.12} />
                <Stop offset="1" stopColor={Colors.bone} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Path
              d="M0 64 C28 60 46 68 74 54 S118 36 146 44 S192 26 218 30 S264 14 292 18 L322 10 V88 H0Z"
              fill="url(#n1)"
            />
            <Path
              d="M0 64 C28 60 46 68 74 54 S118 36 146 44 S192 26 218 30 S264 14 292 18 L322 10"
              fill="none"
              stroke={Colors.bone}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </Svg>
          <SegmentedControl
            options={['1W', '1M', '1Y', 'All']}
            selectedIndex={period}
            onSelect={setPeriod}
            style={styles.heroSegment}
          />
        </View>

        <Text style={styles.sectionHeader}>Allocation</Text>
        <View style={styles.allocationCard}>
          <View style={styles.bar}>
            {allocation.map((item) => (
              <View key={item.assetClass} style={{ flex: item.flex, backgroundColor: item.color }} />
            ))}
          </View>
          <View style={styles.legend}>
            {[0, 1, 2].map((column) => (
              <View key={column} style={styles.legendColumn}>
                {allocation
                  .filter((_, index) => index % 3 === column)
                  .map((item) => (
                    <View key={item.assetClass} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                      <Text style={styles.legendLabel}>{item.label}</Text>
                      <Text style={[styles.legendLabel, styles.legendPercent]}>{item.percent}</Text>
                    </View>
                  ))}
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.sectionHeader}>Today&apos;s note</Text>
        <View style={styles.noteCard}>
          <View style={styles.noteIcon}>
            <Svg
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke={Colors.brass}
              strokeWidth={2}
              strokeLinecap="round">
              <Circle cx={12} cy={12} r={9} />
              <Path d="M12 8v5M12 16h.01" />
            </Svg>
          </View>
          <View style={styles.noteBody}>
            <Text style={styles.noteTitle}>Crypto drove 62% of today&apos;s change</Text>
            <Text style={styles.noteSub}>It holds 9% of your total. Review allocation.</Text>
          </View>
          <Svg width={8} height={14} viewBox="0 0 8 14" style={styles.noteChevron}>
            <Path
              d="M1 1l6 6-6 6"
              stroke={Colors.disabled}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
            />
          </Svg>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.ink,
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 44,
  },
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: Colors.bone,
  },
  avatar: {
    width: 45,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.bone,
  },
  heroCard: {
    marginTop: 20,
    backgroundColor: Colors.surface1,
    borderRadius: 26,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  heroLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: Colors.slate,
  },
  heroValue: {
    fontSize: 44,
    lineHeight: 52,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: Colors.bone,
    fontVariant: ['tabular-nums'],
    marginTop: 4,
  },
  heroCents: {
    color: Colors.slate,
    fontWeight: '500',
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  gainChip: {
    backgroundColor: Colors.gainTint,
  },
  lossChip: {
    backgroundColor: Colors.lossTint,
  },
  chipText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  gainText: {
    color: Colors.verdigris,
  },
  lossText: {
    color: Colors.copper,
  },
  heroChart: {
    width: '100%',
    maxWidth: 322,
    aspectRatio: 322 / 88,
    marginTop: 18,
  },
  heroSegment: {
    marginTop: 14,
  },
  sectionHeader: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    textTransform: 'uppercase',
    color: Colors.slate,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 16,
  },
  allocationCard: {
    backgroundColor: Colors.surface1,
    borderRadius: 26,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  bar: {
    flexDirection: 'row',
    gap: 3,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 14,
  },
  legendColumn: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
    color: Colors.bone,
    fontVariant: ['tabular-nums'],
  },
  legendPercent: {
    color: Colors.slate,
  },
  noteCard: {
    backgroundColor: Colors.surface1,
    borderRadius: 26,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  noteIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.brassTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteBody: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: Colors.bone,
  },
  noteSub: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: Colors.ash,
    marginTop: 2,
  },
  noteChevron: {
    marginTop: 4,
  },
});
