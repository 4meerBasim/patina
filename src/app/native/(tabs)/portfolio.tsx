import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Glass } from '@/components/native/glass';
import { GroupedCard, RowSeparator } from '@/components/native/grouped-list';
import { SegmentedControl } from '@/components/native/segmented-control';
import { Colors } from '@/constants/theme';
import type { AssetClass } from '@/data/types';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/money';
import { useAllocation, useDataStore, useHoldings, useSettings, useTopMovers } from '@/store';

type Delta = { text: string; isGain: boolean };

const SECTIONS: { assetClass: AssetClass; label: string }[] = [
  { assetClass: 'stocks', label: 'Stocks' },
  { assetClass: 'crypto', label: 'Crypto' },
  { assetClass: 'property', label: 'Real estate' },
];

const VISIBLE_ROWS = 3;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

function valuedCaption(iso: string): string {
  const [, month, day] = iso.split('-');
  return `Valued ${MONTHS[Number(month) - 1]} ${Number(day)}`;
}

function HouseIcon() {
  return (
    <Svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke={Colors.bone}
      strokeWidth={2}
      strokeLinecap="round">
      <Path d="M3 12l9-8 9 8M5 10v10h14V10" />
    </Svg>
  );
}

function HoldingRow({
  ticker,
  icon,
  name,
  sub,
  value,
  delta,
  onPress,
  hasSeparator,
}: {
  ticker?: string;
  icon?: 'house';
  name: string;
  sub: string;
  value: string;
  delta?: Delta;
  onPress?: () => void;
  hasSeparator: boolean;
}) {
  const content = (
    <>
      <View style={styles.avatar}>
        {icon === 'house' ? <HouseIcon /> : <Text style={styles.avatarText}>{ticker}</Text>}
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowName}>{name}</Text>
        <Text style={styles.rowSub}>{sub}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowValue}>{value}</Text>
        {delta ? (
          <View style={[styles.deltaChip, delta.isGain ? styles.gainChip : styles.lossChip]}>
            <Text style={[styles.deltaText, delta.isGain ? styles.gainText : styles.lossText]}>
              {delta.text}
            </Text>
          </View>
        ) : null}
      </View>
      {hasSeparator ? <RowSeparator inset={64} /> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${value}${delta ? `, ${delta.text}` : ''}`}
        style={styles.row}
        onPress={onPress}>
        {content}
      </Pressable>
    );
  }
  return <View style={styles.row}>{content}</View>;
}

export default function NativePortfolio() {
  const [grouping, setGrouping] = useState(0);
  const settings = useSettings();
  const holdings = useHoldings();
  const allocation = useAllocation();
  const movers = useTopMovers(holdings.length);
  const valuations = useDataStore((state) => state.valuations);

  const moverPercent = useMemo(() => {
    const map = new Map<string, number>();
    for (const mover of movers) map.set(mover.holding.id, mover.percentChange);
    return map;
  }, [movers]);

  const latestValuationDate = useMemo(() => {
    const map = new Map<string, string>();
    for (const valuation of valuations) {
      if (!map.has(valuation.holdingId)) map.set(valuation.holdingId, valuation.date);
    }
    return map;
  }, [valuations]);

  const sections = useMemo(
    () =>
      SECTIONS.map((section) => {
        const rows = holdings.filter((holding) => holding.assetClass === section.assetClass);
        const total = allocation.find((slice) => slice.assetClass === section.assetClass)?.value ?? 0;
        return { ...section, rows, total };
      }).filter((section) => section.rows.length > 0),
    [holdings, allocation],
  );

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.largeTitle}>Portfolio</Text>
          <Glass radius={22} style={styles.editPill}>
            <Text style={styles.editText}>Edit</Text>
          </Glass>
        </View>

        <SegmentedControl
          options={['By class', 'By account', 'By holding']}
          selectedIndex={grouping}
          onSelect={setGrouping}
          style={styles.segment}
        />

        {sections.map((section) => {
          const visible = section.rows.slice(0, VISIBLE_ROWS);
          const hidden = section.rows.length - visible.length;
          return (
            <View key={section.assetClass}>
              <Text style={styles.sectionHeader}>
                {`${section.label} · ${formatCurrency(section.total, settings.baseCurrency)}`}
              </Text>
              <GroupedCard>
                {visible.map((holding, index) => {
                  const symbol = holding.instrument?.symbol;
                  const isProperty = holding.assetClass === 'property';
                  const unit = holding.assetClass === 'crypto' ? symbol : 'shares';
                  const valuationDate = latestValuationDate.get(holding.id);
                  let sub = `${formatNumber(holding.quantity)} ${unit}`;
                  if (isProperty) sub = valuationDate ? valuedCaption(valuationDate) : '';
                  const percent = moverPercent.get(holding.id);
                  let delta: Delta | undefined;
                  if (percent !== undefined) {
                    delta = {
                      text: `${percent >= 0 ? '▲' : '▼'} ${formatPercent(Math.abs(percent), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`,
                      isGain: percent >= 0,
                    };
                  }
                  return (
                    <HoldingRow
                      key={holding.id}
                      ticker={symbol}
                      icon={isProperty ? 'house' : undefined}
                      name={holding.instrument?.name ?? holding.name ?? ''}
                      sub={sub}
                      value={formatCurrency(holding.value, settings.baseCurrency)}
                      delta={delta}
                      onPress={
                        symbol === 'AAPL' ? () => router.push('/native/holding') : undefined
                      }
                      hasSeparator={index < visible.length - 1 || hidden > 0}
                    />
                  );
                })}
                {hidden > 0 ? (
                  <View style={styles.showMoreRow}>
                    <Text style={styles.showMoreText}>{`Show ${formatNumber(hidden)} more`}</Text>
                  </View>
                ) : null}
              </GroupedCard>
            </View>
          );
        })}
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
  editPill: {
    height: 45,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editText: {
    fontSize: 17,
    fontWeight: '400',
    color: Colors.brass,
  },
  segment: {
    marginTop: 16,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.bone,
  },
  rowBody: {
    flex: 1,
  },
  rowName: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.bone,
  },
  rowSub: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: Colors.slate,
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  rowValue: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.bone,
    fontVariant: ['tabular-nums'],
  },
  deltaChip: {
    borderRadius: 6,
    paddingHorizontal: 6,
  },
  gainChip: {
    backgroundColor: Colors.gainTint,
  },
  lossChip: {
    backgroundColor: Colors.lossTint,
  },
  deltaText: {
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
  showMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  showMoreText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.brass,
  },
});
