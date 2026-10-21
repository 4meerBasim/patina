import { router } from 'expo-router';
import { memo, useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Caption } from '@/components/editorial/caption';
import { monthAbbrev } from '@/components/editorial/months';
import { ScreenHeader } from '@/components/editorial/screen-header';
import { Colors, Fonts } from '@/constants/theme';
import type { DividendMonth } from '@/lib/dividends';
import { formatCurrency, formatPercent } from '@/lib/money';
import {
  useDividendCalendar,
  useDividendForecast,
  useHoldings,
  useSettings,
  useYieldOnCost,
} from '@/store';

const LABEL_INDICES = [0, 4, 8, 11];

const Bar = memo(function Bar({ heightPct, color }: { heightPct: number; color: string }) {
  return <View style={[styles.bar, { height: `${heightPct}%`, backgroundColor: color }]} />;
});

const Chart = memo(function Chart({
  data,
  color,
  lastLabel,
  summary,
}: {
  data: DividendMonth[];
  color: string;
  lastLabel: string;
  summary: string;
}) {
  const max = data.reduce((peak, point) => Math.max(peak, point.amount), 0);
  const labels = LABEL_INDICES.map((index, position) =>
    position === LABEL_INDICES.length - 1 ? lastLabel : monthAbbrev(data[index].month),
  );
  return (
    <View>
      <View style={styles.chart} accessible accessibilityLabel={summary}>
        {data.map((point) => (
          <Bar
            key={point.month}
            heightPct={max > 0 ? Math.max(1.5, (point.amount / max) * 100) : 1.5}
            color={point.amount > 0 ? color : Colors.hairline}
          />
        ))}
      </View>
      <View style={styles.axis}>
        {labels.map((label, index) => (
          <Text key={`${label}-${index}`} style={styles.axisLabel}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
});

const YieldRow = memo(function YieldRow({
  name,
  yieldLabel,
  incomeLabel,
  hasBorder,
}: {
  name: string;
  yieldLabel: string;
  incomeLabel: string;
  hasBorder: boolean;
}) {
  return (
    <View
      style={[styles.yieldRow, hasBorder && styles.yieldRowBorder]}
      accessible
      accessibilityLabel={`${name}, yield on cost ${yieldLabel}, ${incomeLabel} trailing income`}>
      <Text style={styles.yieldName}>{name}</Text>
      <View style={styles.yieldRight}>
        <Text style={styles.yieldValue}>{yieldLabel}</Text>
        <Text style={styles.yieldIncome}>{incomeLabel}</Text>
      </View>
    </View>
  );
});

export default function DividendsScreen() {
  const calendar = useDividendCalendar();
  const forecast = useDividendForecast();
  const yieldOnCost = useYieldOnCost();
  const holdings = useHoldings();
  const { baseCurrency } = useSettings();

  const goBack = useCallback(() => router.back(), []);

  const money0 = useCallback(
    (value: number) =>
      formatCurrency(value, baseCurrency, {
        locale: 'en',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    [baseCurrency],
  );

  const trailingTotal = useMemo(
    () => calendar.reduce((sum, point) => sum + point.amount, 0),
    [calendar],
  );
  const trailingMonths = useMemo(
    () => calendar.filter((point) => point.amount > 0).length,
    [calendar],
  );
  const forecastTotal = useMemo(
    () => forecast.reduce((sum, point) => sum + point.amount, 0),
    [forecast],
  );

  const yieldRows = useMemo(() => {
    const nameOf = (id: string) => {
      const holding = holdings.find((item) => item.id === id);
      return holding?.instrument?.name ?? holding?.name ?? holding?.instrument?.symbol ?? id;
    };
    return yieldOnCost.map((row) => ({
      id: row.holdingId,
      name: nameOf(row.holdingId),
      yieldLabel: formatPercent(row.yieldOnCost, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      incomeLabel: money0(row.trailingIncome),
    }));
  }, [yieldOnCost, holdings, money0]);

  const hasAny = trailingTotal > 0 || forecastTotal > 0 || yieldRows.length > 0;

  return (
    <View style={styles.screen}>
      <ScreenHeader onBack={goBack} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Caption>Income · trailing 12 months</Caption>

        {hasAny ? (
          <>
            <Text style={styles.total}>{money0(trailingTotal)}</Text>
            <Text style={styles.subline}>
              {trailingMonths > 0
                ? `received across ${trailingMonths} month${trailingMonths === 1 ? '' : 's'}`
                : 'no income recorded in the last 12 months'}
            </Text>

            {trailingTotal > 0 ? (
              <View style={styles.chartBlock}>
                <Chart
                  data={calendar}
                  color={Colors.verdigris}
                  lastLabel="NOW"
                  summary={`Dividend income by month, ${money0(trailingTotal)} over twelve months`}
                />
              </View>
            ) : null}

            {forecastTotal > 0 ? (
              <View style={styles.section}>
                <View style={styles.sectionDivider}>
                  <Caption>Next 12 months · projected</Caption>
                </View>
                <Text style={styles.forecastTotal}>{money0(forecastTotal)}</Text>
                <Text style={styles.subline}>repeating each holding&apos;s own recorded cadence</Text>
                <View style={styles.chartBlock}>
                  <Chart
                    data={forecast}
                    color={Colors.verdigrisDim}
                    lastLabel={monthAbbrev(forecast[forecast.length - 1].month)}
                    summary={`Projected dividend income by month, ${money0(forecastTotal)} over the next twelve months`}
                  />
                </View>
              </View>
            ) : null}

            {yieldRows.length > 0 ? (
              <View style={styles.section}>
                <View style={styles.sectionDivider}>
                  <Caption>Yield on cost</Caption>
                </View>
                <View style={styles.yieldList}>
                  {yieldRows.map((row, index) => (
                    <YieldRow
                      key={row.id}
                      name={row.name}
                      yieldLabel={row.yieldLabel}
                      incomeLabel={row.incomeLabel}
                      hasBorder={index > 0}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </>
        ) : (
          <Text style={styles.empty}>
            No dividends recorded yet. Income will chart here as you log it.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.ink,
  },
  scroll: {
    paddingTop: 8,
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  total: {
    fontFamily: Fonts.newsreaderLight36,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.72,
    color: Colors.bone,
    marginTop: 14,
    fontVariant: ['tabular-nums'],
    textAlign: 'auto',
  },
  subline: {
    fontFamily: Fonts.manrope,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.slate,
    marginTop: 6,
    textAlign: 'auto',
  },
  chartBlock: {
    marginTop: 24,
  },
  chart: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  bar: {
    flex: 1,
    borderRadius: 1,
  },
  axis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  axisLabel: {
    fontFamily: Fonts.manropeMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.1,
    color: Colors.slate,
    textTransform: 'uppercase',
  },
  section: {
    marginTop: 36,
  },
  sectionDivider: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    paddingTop: 12,
  },
  forecastTotal: {
    fontFamily: Fonts.newsreaderLight32,
    fontSize: 28,
    lineHeight: 34,
    color: Colors.bone,
    marginTop: 12,
    fontVariant: ['tabular-nums'],
    textAlign: 'auto',
  },
  yieldList: {
    marginTop: 14,
  },
  yieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingVertical: 8,
  },
  yieldRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
  },
  yieldName: {
    flex: 1,
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.bone,
    textAlign: 'auto',
  },
  yieldRight: {
    alignItems: 'flex-end',
  },
  yieldValue: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.bone,
    fontVariant: ['tabular-nums'],
  },
  yieldIncome: {
    fontFamily: Fonts.manrope,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.slate,
    fontVariant: ['tabular-nums'],
  },
  empty: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.slate,
    marginTop: 14,
    textAlign: 'auto',
  },
});
