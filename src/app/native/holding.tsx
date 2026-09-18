import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { Glass } from '@/components/native/glass';
import { GroupedCard, RowSeparator } from '@/components/native/grouped-list';
import { SegmentedControl } from '@/components/native/segmented-control';
import { Colors } from '@/constants/theme';

function PositionRow({
  label,
  value,
  valueColor,
  hasSeparator,
}: {
  label: string;
  value: string;
  valueColor: string;
  hasSeparator: boolean;
}) {
  return (
    <View style={styles.positionRow}>
      <Text style={styles.positionLabel}>{label}</Text>
      <Text style={[styles.positionValue, { color: valueColor }]}>{value}</Text>
      {hasSeparator ? <RowSeparator inset={16} /> : null}
    </View>
  );
}

export default function NativeHolding() {
  const [period, setPeriod] = useState(2);

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.topSection}>
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              hitSlop={8}
              onPress={() => router.back()}>
              <Glass radius={22} style={styles.pill}>
                <Svg width={12} height={20} viewBox="0 0 12 20" fill="none">
                  <Path
                    d="M10 2L2 10l8 8"
                    stroke={Colors.bone}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </Glass>
            </Pressable>
            <Glass radius={22} style={styles.pill}>
              <Svg width={22} height={6} viewBox="0 0 22 6">
                <Circle cx={3} cy={3} r={2.5} fill={Colors.bone} />
                <Circle cx={11} cy={3} r={2.5} fill={Colors.bone} />
                <Circle cx={19} cy={3} r={2.5} fill={Colors.bone} />
              </Svg>
            </Glass>
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.largeTitle}>Apple</Text>
            <Text style={styles.meta}>AAPL · NASDAQ · Interactive Brokers</Text>
          </View>

          <View style={styles.heroBlock}>
            <Text style={styles.date}>Mar 14, 2026</Text>
            <Text style={styles.heroValue}>
              $131,204<Text style={styles.heroCents}>.50</Text>
            </Text>
            <View style={styles.deltaChip}>
              <Text style={styles.deltaText}>▼ $17,715 · 11.9% below today</Text>
            </View>
          </View>
        </View>

        <Svg viewBox="0 0 402 220" style={styles.chart}>
          <Defs>
            <LinearGradient id="n2" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={Colors.bone} stopOpacity={0.12} />
              <Stop offset="1" stopColor={Colors.bone} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path
            d="M0 160 C40 150 60 168 100 140 S150 110 180 130 S220 80 260 90 S320 50 360 56 L402 40 V220 H0Z"
            fill="url(#n2)"
          />
          <Path
            d="M0 160 C40 150 60 168 100 140 S150 110 180 130 S220 80 260 90 S320 50 360 56 L402 40"
            fill="none"
            stroke={Colors.bone}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <Line x1={150} y1={10} x2={150} y2={210} stroke={Colors.slate} strokeWidth={1} />
          <Circle cx={150} cy={121} r={6} fill={Colors.ink} stroke={Colors.bone} strokeWidth={2} />
        </Svg>

        <View style={styles.bottomSection}>
          <SegmentedControl
            options={['1W', '1M', '1Y', 'All']}
            selectedIndex={period}
            onSelect={setPeriod}
          />
          <Text style={styles.sectionHeader}>Position</Text>
          <GroupedCard>
            <PositionRow label="Shares" value="600" valueColor={Colors.ash} hasSeparator />
            <PositionRow
              label="Cost basis"
              value="$98,640 · $164.40"
              valueColor={Colors.ash}
              hasSeparator
            />
            <PositionRow
              label="Unrealized gain"
              value="+$50,280 · 51.0%"
              valueColor={Colors.verdigris}
              hasSeparator
            />
            <PositionRow
              label="Weight"
              value="11.6%"
              valueColor={Colors.ash}
              hasSeparator={false}
            />
          </GroupedCard>
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
    paddingBottom: 120,
  },
  topSection: {
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 44,
  },
  pill: {
    width: 45,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    marginTop: 16,
  },
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: Colors.bone,
  },
  meta: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
    color: Colors.slate,
  },
  heroBlock: {
    marginTop: 20,
  },
  date: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: Colors.slate,
  },
  heroValue: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: Colors.bone,
    fontVariant: ['tabular-nums'],
  },
  heroCents: {
    color: Colors.slate,
    fontWeight: '500',
  },
  deltaChip: {
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: Colors.lossTint,
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  deltaText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: Colors.copper,
    fontVariant: ['tabular-nums'],
  },
  chart: {
    width: '100%',
    aspectRatio: 402 / 220,
    marginTop: 12,
  },
  bottomSection: {
    paddingTop: 8,
    paddingHorizontal: 16,
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
  positionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  positionLabel: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.bone,
  },
  positionValue: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    fontVariant: ['tabular-nums'],
  },
});
