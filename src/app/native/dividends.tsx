import { router } from 'expo-router';
import { memo, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Glass } from '@/components/native/glass';
import { GroupedCard, KeyValueRow, RowSeparator } from '@/components/native/grouped-list';
import { Colors } from '@/constants/theme';
import type { CurrencyCode } from '@/data/types';
import type { DividendMonth } from '@/lib/dividends';
import { formatCurrency } from '@/lib/money';
import {
  useDividendCalendar,
  useDividendForecast,
  useHoldings,
  useSettings,
  useYieldOnCost,
} from '@/store';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
const BAR_AREA = 104;

function monthYear(iso: string): string {
  const [year, month] = iso.split('-');
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

function monthInitial(iso: string): string {
  const month = Number(iso.split('-')[1]);
  return MONTHS[month - 1].charAt(0);
}

function sumMonths(months: DividendMonth[]): number {
  return months.reduce((total, item) => total + item.amount, 0);
}

const BarColumn = memo(function BarColumn({
  height,
  label,
  tint,
  accessibilityLabel,
}: {
  height: number;
  label: string;
  tint: string;
  accessibilityLabel: string;
}) {
  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={styles.barColumn}>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { height, backgroundColor: tint }]} />
      </View>
      <Text style={styles.barLabel}>{label}</Text>
    </View>
  );
});

const YieldRow = memo(function YieldRow({
  name,
  yieldLabel,
  sub,
  hasSeparator,
}: {
  name: string;
  yieldLabel: string;
  sub: string;
  hasSeparator: boolean;
}) {
  return (
    <View style={styles.yieldRow}>
      <View style={styles.yieldBody}>
        <Text style={styles.yieldName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.yieldSub}>{sub}</Text>
      </View>
      <Text style={styles.yieldValue}>{yieldLabel}</Text>
      {hasSeparator ? <RowSeparator inset={16} /> : null}
    </View>
  );
});

function DividendBars({
  months,
  tint,
  baseCurrency,
}: {
  months: DividendMonth[];
  tint: string;
  baseCurrency: CurrencyCode;
}) {
  const max = months.reduce((value, item) => Math.max(value, item.amount), 0);
  return (
    <View style={styles.bars}>
      {months.map((item) => (
        <BarColumn
          key={item.month}
          height={max > 0 ? Math.round((item.amount / max) * BAR_AREA) : 0}
          tint={tint}
          label={monthInitial(item.month)}
          accessibilityLabel={`${monthYear(item.month)}: ${formatCurrency(item.amount, baseCurrency)}`}
        />
      ))}
    </View>
  );
}

export default function NativeDividends() {
  const calendar = useDividendCalendar();
  const forecast = useDividendForecast();
  const yields = useYieldOnCost();
  const holdings = useHoldings();
  const settings = useSettings();

  const baseCurrency = settings.baseCurrency;

  const holdingLabels = useMemo(() => {
    const map = new Map<string, string>();
    for (const holding of holdings) {
      map.set(
        holding.id,
        holding.instrument?.name ?? holding.name ?? holding.instrument?.symbol ?? 'Holding',
      );
    }
    return map;
  }, [holdings]);

  const calendarTotal = useMemo(() => sumMonths(calendar), [calendar]);
  const forecastTotal = useMemo(() => sumMonths(forecast), [forecast]);

  const yieldRows = useMemo(
    () =>
      yields.map((entry) => ({
        id: entry.holdingId,
        name: holdingLabels.get(entry.holdingId) ?? 'Holding',
        yieldLabel: `${entry.yieldOnCost.toFixed(2)}%`,
        sub: `${formatCurrency(entry.trailingIncome, baseCurrency)} on ${formatCurrency(entry.costBasis, baseCurrency)}`,
      })),
    [yields, holdingLabels, baseCurrency],
  );

  const hasAny = calendarTotal > 0 || forecastTotal > 0 || yieldRows.length > 0;

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
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
        </View>

        <Text style={styles.largeTitle}>Dividends</Text>

        {!hasAny ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              No dividend income recorded yet. Dividend transactions appear here as a 12-month
              history, a forecast, and yield on cost.
            </Text>
          </View>
        ) : null}

        {calendarTotal > 0 ? (
          <>
            <Text style={styles.sectionHeader}>Trailing 12 months</Text>
            <GroupedCard>
              <View style={styles.chart}>
                <DividendBars months={calendar} tint={Colors.brass} baseCurrency={baseCurrency} />
              </View>
              <RowSeparator inset={16} />
              <KeyValueRow
                label="Received"
                value={formatCurrency(calendarTotal, baseCurrency)}
                valueColor={Colors.bone}
                hasSeparator={false}
              />
            </GroupedCard>
          </>
        ) : null}

        {forecastTotal > 0 ? (
          <>
            <Text style={styles.sectionHeader}>Next 12 months</Text>
            <GroupedCard>
              <View style={styles.chart}>
                <DividendBars months={forecast} tint={Colors.stone} baseCurrency={baseCurrency} />
              </View>
              <RowSeparator inset={16} />
              <KeyValueRow
                label="Projected"
                value={formatCurrency(forecastTotal, baseCurrency)}
                valueColor={Colors.bone}
                hasSeparator={false}
              />
            </GroupedCard>
            <Text style={styles.caption}>Projected from each holding&apos;s recorded cadence.</Text>
          </>
        ) : null}

        {yieldRows.length > 0 ? (
          <>
            <Text style={styles.sectionHeader}>Yield on cost</Text>
            <GroupedCard>
              {yieldRows.map((row, index) => (
                <YieldRow
                  key={row.id}
                  name={row.name}
                  yieldLabel={row.yieldLabel}
                  sub={row.sub}
                  hasSeparator={index < yieldRows.length - 1}
                />
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
  pill: {
    width: 45,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: Colors.bone,
    marginTop: 16,
  },
  empty: {
    marginTop: 48,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '400',
    color: Colors.slate,
    textAlign: 'center',
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
  chart: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  barTrack: {
    width: '100%',
    height: BAR_AREA,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400',
    color: Colors.slate,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: Colors.slate,
    marginTop: 8,
    marginStart: 16,
  },
  yieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 60,
    paddingHorizontal: 16,
    gap: 12,
  },
  yieldBody: {
    flex: 1,
  },
  yieldName: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.bone,
    textAlign: 'auto',
  },
  yieldSub: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: Colors.slate,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
    textAlign: 'auto',
  },
  yieldValue: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.verdigris,
    fontVariant: ['tabular-nums'],
  },
});
