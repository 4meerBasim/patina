import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { Glass } from '@/components/native/glass';
import { GroupedCard, RowSeparator } from '@/components/native/grouped-list';
import { SegmentedControl } from '@/components/native/segmented-control';
import { Colors } from '@/constants/theme';
import { formatCurrency, formatNumber, formatPercent, formatSignedCurrency } from '@/lib/money';
import { moneyWeightedReturn } from '@/lib/returns';
import { useAccounts, useHoldings, useLots, useNetWorth, useSettings, useTransactions } from '@/store';

const TODAY_ISO = new Date().toISOString().slice(0, 10);

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
  const settings = useSettings();
  const holdings = useHoldings();
  const lots = useLots();
  const netWorth = useNetWorth();
  const accounts = useAccounts();
  const transactions = useTransactions();

  const holding = holdings.find((item) => item.instrument?.symbol === 'AAPL');
  const account = accounts.find((item) => item.id === holding?.accountId);

  const shares = holding?.quantity ?? 0;
  const value = holding?.value ?? 0;
  const costBasis = lots
    .filter((lot) => lot.holdingId === holding?.id)
    .reduce((sum, lot) => sum + lot.remainingQuantity * lot.costPerUnit, 0);
  const perUnit = shares === 0 ? 0 : costBasis / shares;
  const gain = value - costBasis;
  const gainPercent = costBasis === 0 ? 0 : (gain / costBasis) * 100;
  const weightPercent = netWorth.total === 0 ? 0 : (value / netWorth.total) * 100;
  const annualised = holding
    ? moneyWeightedReturn(
        transactions
          .filter((tx) => tx.holdingId === holding.id)
          .map((tx) => ({ date: tx.date, amount: -tx.amount })),
        { date: TODAY_ISO, value },
      )
    : null;

  const title = holding?.instrument?.name ?? '';
  const meta = holding?.instrument
    ? `${holding.instrument.symbol} · NASDAQ · ${account?.institution ?? ''}`
    : '';

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
            <Text style={styles.largeTitle}>{title}</Text>
            <Text style={styles.meta}>{meta}</Text>
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
            <PositionRow
              label="Shares"
              value={formatNumber(shares)}
              valueColor={Colors.ash}
              hasSeparator
            />
            <PositionRow
              label="Cost basis"
              value={`${formatCurrency(costBasis, settings.baseCurrency)} · ${formatCurrency(perUnit, settings.baseCurrency, { minimumFractionDigits: 2 })}`}
              valueColor={Colors.ash}
              hasSeparator
            />
            <PositionRow
              label="Unrealized gain"
              value={`${formatSignedCurrency(gain, settings.baseCurrency)} · ${formatPercent(gainPercent, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`}
              valueColor={gain >= 0 ? Colors.verdigris : Colors.copper}
              hasSeparator
            />
            {annualised !== null ? (
              <PositionRow
                label="Annualized return"
                value={formatPercent(annualised * 100, {
                  signed: true,
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
                valueColor={annualised >= 0 ? Colors.verdigris : Colors.copper}
                hasSeparator
              />
            ) : null}
            <PositionRow
              label="Weight"
              value={formatPercent(weightPercent, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
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
