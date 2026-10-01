import { router } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Glass } from '@/components/native/glass';
import { GroupedCard, RowSeparator } from '@/components/native/grouped-list';
import { SegmentedControl } from '@/components/native/segmented-control';
import { Colors } from '@/constants/theme';
import type { AssetClass, Ownership } from '@/data/types';
import { formatCurrency, formatNumber, formatPercent, formatSignedCurrency } from '@/lib/money';
import {
  useAccountGroups,
  useAllocation,
  useDataStore,
  useHoldingMetrics,
  useHoldings,
  useOwnerGroups,
  useSettings,
  useTopMovers,
} from '@/store';

type RowDelta = { text: string; isGain: boolean };

type HoldingRowData = {
  id: string;
  ticker?: string;
  icon?: 'house';
  name: string;
  sub: string;
  value: string;
  delta?: RowDelta;
  hasSeparator: boolean;
};

type SummaryRowData = {
  key: string;
  title: string;
  sub?: string;
  value: string;
  hasSeparator: boolean;
};

const SECTIONS: { assetClass: AssetClass; label: string }[] = [
  { assetClass: 'stocks', label: 'Stocks' },
  { assetClass: 'crypto', label: 'Crypto' },
  { assetClass: 'property', label: 'Real estate' },
];

const OWNERSHIP_LABELS: Record<Ownership, string> = {
  me: 'Me',
  spouse: 'Spouse',
  joint: 'Joint',
  entity: 'Entity',
};

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

const HoldingRow = memo(function HoldingRow({
  data,
  onPress,
}: {
  data: HoldingRowData;
  onPress: (id: string) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${data.name}, ${data.value}${data.delta ? `, ${data.delta.text}` : ''}`}
      style={styles.row}
      onPress={() => onPress(data.id)}>
      <View style={styles.avatar}>
        {data.icon === 'house' ? <HouseIcon /> : <Text style={styles.avatarText}>{data.ticker}</Text>}
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowName}>{data.name}</Text>
        {data.sub ? <Text style={styles.rowSub}>{data.sub}</Text> : null}
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowValue}>{data.value}</Text>
        {data.delta ? (
          <View style={[styles.deltaChip, data.delta.isGain ? styles.gainChip : styles.lossChip]}>
            <Text style={[styles.deltaText, data.delta.isGain ? styles.gainText : styles.lossText]}>
              {data.delta.text}
            </Text>
          </View>
        ) : null}
      </View>
      {data.hasSeparator ? <RowSeparator inset={64} /> : null}
    </Pressable>
  );
});

const SummaryRow = memo(function SummaryRow({ data }: { data: SummaryRowData }) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.rowBody}>
        <Text style={styles.rowName}>{data.title}</Text>
        {data.sub ? <Text style={styles.rowSub}>{data.sub}</Text> : null}
      </View>
      <Text style={styles.rowValue}>{data.value}</Text>
      {data.hasSeparator ? <RowSeparator inset={16} /> : null}
    </View>
  );
});

const ShowMoreRow = memo(function ShowMoreRow({
  assetClass,
  overflow,
  expanded,
  onToggle,
}: {
  assetClass: AssetClass;
  overflow: number;
  expanded: boolean;
  onToggle: (assetClass: AssetClass) => void;
}) {
  const label = expanded ? 'Show less' : `Show ${formatNumber(overflow)} more`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ expanded }}
      style={styles.showMoreRow}
      onPress={() => onToggle(assetClass)}>
      <Text style={styles.showMoreText}>{label}</Text>
    </Pressable>
  );
});

export default function NativePortfolio() {
  const [grouping, setGrouping] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const settings = useSettings();
  const holdings = useHoldings();
  const allocation = useAllocation();
  const movers = useTopMovers(holdings.length);
  const positions = useHoldingMetrics();
  const accountGroups = useAccountGroups();
  const ownerGroups = useOwnerGroups();
  const valuations = useDataStore((state) => state.valuations);

  const openHolding = useCallback(
    (id: string) => router.push({ pathname: '/native/holding', params: { id } }),
    [],
  );
  const toggleSection = useCallback(
    (assetClass: AssetClass) =>
      setExpanded((prev) => ({ ...prev, [assetClass]: !prev[assetClass] })),
    [],
  );

  const moverPercent = useMemo(() => {
    const map = new Map<string, number>();
    for (const mover of movers) map.set(mover.holding.id, mover.percentChange);
    return map;
  }, [movers]);

  const positionById = useMemo(
    () => new Map(positions.map((position) => [position.holdingId, position] as const)),
    [positions],
  );

  const latestValuationDate = useMemo(() => {
    const map = new Map<string, string>();
    for (const valuation of valuations) {
      if (!map.has(valuation.holdingId)) map.set(valuation.holdingId, valuation.date);
    }
    return map;
  }, [valuations]);

  const baseCurrency = settings.baseCurrency;

  const classSections = useMemo(
    () =>
      SECTIONS.map((section) => {
        const sectionHoldings = holdings.filter((holding) => holding.assetClass === section.assetClass);
        const total =
          allocation.find((slice) => slice.assetClass === section.assetClass)?.value ?? 0;

        const allRows = sectionHoldings.map((holding) => {
          const symbol = holding.instrument?.symbol;
          const isProperty = holding.assetClass === 'property';
          const unit = holding.assetClass === 'crypto' ? (symbol ?? '') : 'shares';
          const position = positionById.get(holding.id);
          const isForeign = position ? position.currency !== baseCurrency : false;
          const valuationDate = latestValuationDate.get(holding.id);

          let sub = `${formatNumber(holding.quantity)} ${unit}`;
          if (isProperty) sub = valuationDate ? valuedCaption(valuationDate) : '';
          else if (isForeign && position) {
            sub = `${formatNumber(holding.quantity)} ${unit} · ${formatCurrency(position.valueNative, position.currency)}`;
          }

          let delta: RowDelta | undefined;
          if (isForeign && position && position.currencyGain != null) {
            delta = {
              text: `FX ${formatSignedCurrency(position.currencyGain, baseCurrency)}`,
              isGain: position.currencyGain >= 0,
            };
          } else {
            const percent = moverPercent.get(holding.id);
            if (percent !== undefined) {
              delta = {
                text: `${percent >= 0 ? '▲' : '▼'} ${formatPercent(Math.abs(percent), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`,
                isGain: percent >= 0,
              };
            }
          }

          return {
            id: holding.id,
            ticker: symbol,
            icon: isProperty ? ('house' as const) : undefined,
            name: holding.instrument?.name ?? holding.name ?? '',
            sub,
            value: formatCurrency(holding.value, baseCurrency),
            delta,
          };
        });

        const isExpanded = !!expanded[section.assetClass];
        const overflow = Math.max(allRows.length - VISIBLE_ROWS, 0);
        const hasToggle = overflow > 0;
        const shown = isExpanded ? allRows : allRows.slice(0, VISIBLE_ROWS);
        const visible: HoldingRowData[] = shown.map((row, index) => ({
          ...row,
          hasSeparator: index < shown.length - 1 || hasToggle,
        }));

        return { ...section, total, visible, overflow, hasToggle, isExpanded };
      }).filter((section) => section.visible.length > 0),
    [holdings, allocation, positionById, moverPercent, latestValuationDate, baseCurrency, expanded],
  );

  const accountRows = useMemo<SummaryRowData[]>(
    () =>
      accountGroups.map((group, index) => ({
        key: group.account.id,
        title: group.account.institution ?? group.account.name,
        sub: OWNERSHIP_LABELS[group.account.ownership],
        value: formatCurrency(group.value, baseCurrency),
        hasSeparator: index < accountGroups.length - 1,
      })),
    [accountGroups, baseCurrency],
  );

  const ownerRows = useMemo<SummaryRowData[]>(
    () =>
      ownerGroups.map((group, index) => ({
        key: group.ownership,
        title: OWNERSHIP_LABELS[group.ownership],
        value: formatCurrency(group.value, baseCurrency),
        hasSeparator: index < ownerGroups.length - 1,
      })),
    [ownerGroups, baseCurrency],
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
          options={['By class', 'By account', 'By owner']}
          selectedIndex={grouping}
          onSelect={setGrouping}
          style={styles.segment}
        />

        {grouping === 0
          ? classSections.map((section) => (
              <View key={section.assetClass}>
                <Text style={styles.sectionHeader}>
                  {`${section.label} · ${formatCurrency(section.total, baseCurrency)}`}
                </Text>
                <GroupedCard>
                  {section.visible.map((data) => (
                    <HoldingRow key={data.id} data={data} onPress={openHolding} />
                  ))}
                  {section.hasToggle ? (
                    <ShowMoreRow
                      assetClass={section.assetClass}
                      overflow={section.overflow}
                      expanded={section.isExpanded}
                      onToggle={toggleSection}
                    />
                  ) : null}
                </GroupedCard>
              </View>
            ))
          : null}

        {grouping === 1 ? (
          <>
            <Text style={styles.sectionHeader}>Accounts</Text>
            <GroupedCard>
              {accountRows.map((data) => (
                <SummaryRow key={data.key} data={data} />
              ))}
            </GroupedCard>
          </>
        ) : null}

        {grouping === 2 ? (
          <>
            <Text style={styles.sectionHeader}>Owners</Text>
            <GroupedCard>
              {ownerRows.map((data) => (
                <SummaryRow key={data.key} data={data} />
              ))}
            </GroupedCard>
          </>
        ) : null}
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
    marginStart: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    paddingHorizontal: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
