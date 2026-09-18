import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Caption } from '@/components/editorial/caption';
import { Colors, Fonts } from '@/constants/theme';

type ActivityRow = {
  type: string;
  holding: string;
  date: string;
  isoDate: string;
  account: string;
  detail: string;
  amount: string;
  amountValue: number | null;
  isMuted?: boolean;
};

type ActivityMonth = {
  name: string;
  net: string;
  rows: ActivityRow[];
};

const MONTHS: ActivityMonth[] = [
  {
    name: 'September',
    net: 'net −$9,118.60',
    rows: [
      {
        type: 'Buy',
        holding: 'Apple',
        date: '17 Sept',
        isoDate: '2026-09-17',
        account: 'IBKR',
        detail: '50 @ 248.20',
        amount: '−12,410.00',
        amountValue: -12410,
      },
      {
        type: 'Dividend',
        holding: 'Microsoft',
        date: '12 Sept',
        isoDate: '2026-09-12',
        account: 'IBKR',
        detail: '',
        amount: '184.20',
        amountValue: 184.2,
      },
      {
        type: 'Deposit',
        holding: 'Savings',
        date: '1 Sept',
        isoDate: '2026-09-01',
        account: 'Marcus',
        detail: 'monthly',
        amount: '2,500.00',
        amountValue: 2500,
      },
      {
        type: 'Valuation',
        holding: 'Lisbon flat',
        date: '1 Sept',
        isoDate: '2026-09-01',
        account: 'manual',
        detail: '412,000',
        amount: '—',
        amountValue: null,
        isMuted: true,
      },
      {
        type: 'Fee',
        holding: 'Fidelity',
        date: '1 Sept',
        isoDate: '2026-09-01',
        account: '',
        detail: 'quarterly',
        amount: '−392.80',
        amountValue: -392.8,
      },
    ],
  },
  {
    name: 'August',
    net: 'net +$4,212.40',
    rows: [
      {
        type: 'Sell',
        holding: 'Ether',
        date: '28 Aug',
        isoDate: '2026-08-28',
        account: 'Coinbase',
        detail: '1.2 @ 3,410',
        amount: '4,092.00',
        amountValue: 4092,
      },
    ],
  },
];

type FilterKey = 'all' | 'buys' | 'dividends' | 'deposits';

const FILTERS: { key: FilterKey; label: string; type?: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'buys', label: 'Buys', type: 'Buy' },
  { key: 'dividends', label: 'Dividends', type: 'Dividend' },
  { key: 'deposits', label: 'Deposits', type: 'Deposit' },
];

function rowSubtitle(row: ActivityRow) {
  return [row.date, row.account, row.detail].filter(Boolean).join(' · ');
}

function csvField(value: string) {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export default function ActivityScreen() {
  const [filter, setFilter] = useState<FilterKey>('all');
  const activeType = FILTERS.find((item) => item.key === filter)?.type;

  const visibleRows = (month: ActivityMonth) =>
    activeType ? month.rows.filter((row) => row.type === activeType) : month.rows;

  const onExport = () => {
    const lines = MONTHS.flatMap(visibleRows).map((row) =>
      [
        row.isoDate,
        row.type,
        row.holding,
        row.account,
        row.detail,
        row.amountValue === null ? '' : row.amountValue.toFixed(2),
      ]
        .map(csvField)
        .join(','),
    );
    const message = ['date,type,holding,account,detail,amount', ...lines].join('\n');
    Share.share({ message });
  };

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={12}
            onPress={() => router.back()}>
            <Svg
              width={24}
              height={24}
              viewBox="0 0 24 24"
              fill="none"
              stroke={Colors.ash}
              strokeWidth={1.5}
              strokeLinecap="round">
              <Path d="M15 5l-7 7 7 7" />
            </Svg>
          </Pressable>
          <Pressable accessibilityRole="button" hitSlop={16} onPress={onExport}>
            <Text style={styles.export}>Export</Text>
          </Pressable>
        </View>

        <Caption style={styles.entries}>Activity · 148 entries</Caption>

        <View style={styles.chips}>
          {FILTERS.map((item) => {
            const isSelected = item.key === filter;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                hitSlop={{ top: 5, bottom: 5 }}
                onPress={() => setFilter(item.key)}
                style={[styles.chip, { borderColor: isSelected ? Colors.brass : Colors.hairline }]}>
                <Text style={[styles.chipText, { color: isSelected ? Colors.bone : Colors.ash }]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {MONTHS.map((month) => {
          const rows = visibleRows(month);
          if (rows.length === 0) return null;
          return (
            <View key={month.name}>
              <View style={styles.monthHeader}>
                <Caption>{month.name}</Caption>
                <Caption style={styles.net}>{month.net}</Caption>
              </View>
              {rows.map((row) => (
                <View key={`${month.name}-${row.type}-${row.holding}`} style={styles.row}>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>
                      {row.type} · {row.holding}
                    </Text>
                    <Text style={styles.rowSub}>{rowSubtitle(row)}</Text>
                  </View>
                  <Text style={[styles.rowAmount, row.isMuted && styles.rowAmountMuted]}>
                    {row.amount}
                  </Text>
                </View>
              ))}
            </View>
          );
        })}
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
    paddingTop: 64,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  export: {
    fontFamily: Fonts.manrope,
    fontSize: 13,
    color: Colors.brass,
  },
  entries: {
    marginTop: 24,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  chip: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipText: {
    fontFamily: Fonts.manropeMedium,
    fontSize: 13,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bone,
  },
  net: {
    fontVariant: ['tabular-nums'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 61,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.bone,
  },
  rowSub: {
    fontFamily: Fonts.manrope,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.slate,
    fontVariant: ['tabular-nums'],
  },
  rowAmount: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    color: Colors.bone,
    fontVariant: ['tabular-nums'],
  },
  rowAmountMuted: {
    color: Colors.stone,
  },
});
