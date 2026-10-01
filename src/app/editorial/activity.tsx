import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Caption } from '@/components/editorial/caption';
import { Colors, Fonts } from '@/constants/theme';
import type { Transaction, TransactionType } from '@/data/types';
import { formatNumber, formatSignedCurrency } from '@/lib/money';
import { useAccounts, useHoldings, useSettings, useTransactions } from '@/store';

type FilterKey = 'all' | 'buys' | 'dividends' | 'deposits';

const FILTERS: { key: FilterKey; label: string; type?: TransactionType }[] = [
  { key: 'all', label: 'All' },
  { key: 'buys', label: 'Buys', type: 'buy' },
  { key: 'dividends', label: 'Dividends', type: 'dividend' },
  { key: 'deposits', label: 'Deposits', type: 'deposit' },
];

const MONTH_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sept',
  'Oct',
  'Nov',
  'Dec',
];

function monthTitle(iso: string): string {
  const [year, month] = iso.split('-');
  return `${MONTH_FULL[Number(month) - 1]} ${year}`;
}

function shortDate(iso: string): string {
  const [, month, day] = iso.split('-');
  return `${Number(day)} ${MONTH_SHORT[Number(month) - 1]}`;
}

function typeLabel(type: TransactionType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function csvField(value: string) {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export default function ActivityScreen() {
  const [filter, setFilter] = useState<FilterKey>('all');
  const transactions = useTransactions();
  const holdings = useHoldings();
  const accounts = useAccounts();
  const { baseCurrency } = useSettings();

  const activeType = FILTERS.find((item) => item.key === filter)?.type;
  const visible = activeType
    ? transactions.filter((tx) => tx.type === activeType)
    : transactions;

  const subjectOf = (tx: Transaction) => {
    if (tx.holdingId) {
      const holding = holdings.find((item) => item.id === tx.holdingId);
      return holding?.instrument?.name ?? holding?.name ?? '';
    }
    return accounts.find((item) => item.id === tx.accountId)?.name ?? '';
  };
  const accountOf = (tx: Transaction) => {
    const account = accounts.find((item) => item.id === tx.accountId);
    return account?.institution ?? account?.name ?? '';
  };
  const detailOf = (tx: Transaction) => {
    if ((tx.type === 'buy' || tx.type === 'sell') && tx.quantity != null && tx.price != null) {
      return `${formatNumber(tx.quantity)} @ ${formatNumber(tx.price, { maximumFractionDigits: 2 })}`;
    }
    return tx.note ?? '';
  };
  const amountOf = (tx: Transaction) =>
    formatNumber(tx.amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const subtitleOf = (tx: Transaction) =>
    [shortDate(tx.date), accountOf(tx), detailOf(tx)].filter(Boolean).join(' · ');

  const groups: { key: string; rows: Transaction[] }[] = [];
  for (const tx of visible) {
    const key = tx.date.slice(0, 7);
    const existing = groups.find((group) => group.key === key);
    if (existing) existing.rows.push(tx);
    else groups.push({ key, rows: [tx] });
  }

  const onExport = () => {
    const lines = visible.map((tx) =>
      [tx.date, typeLabel(tx.type), subjectOf(tx), accountOf(tx), detailOf(tx), tx.amount.toFixed(2)]
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

        <Caption style={styles.entries}>Activity · {formatNumber(transactions.length)} entries</Caption>

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

        {groups.map((group) => {
          const net = group.rows.reduce((sum, tx) => sum + tx.amount, 0);
          return (
            <View key={group.key}>
              <View style={styles.monthHeader}>
                <Caption>{monthTitle(group.key)}</Caption>
                <Caption style={styles.net}>
                  net {formatSignedCurrency(net, baseCurrency, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Caption>
              </View>
              {group.rows.map((tx) => (
                <View key={tx.id} style={styles.row}>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>
                      {typeLabel(tx.type)} · {subjectOf(tx)}
                    </Text>
                    <Text style={styles.rowSub}>{subtitleOf(tx)}</Text>
                  </View>
                  <Text style={styles.rowAmount}>{amountOf(tx)}</Text>
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
});
