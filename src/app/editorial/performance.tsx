import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path, Text as SvgText } from 'react-native-svg';

import { Caption } from '@/components/editorial/caption';
import { Colors, Fonts, TintRgb } from '@/constants/theme';
import { formatCurrency, formatNumber, formatPercent, formatSignedCurrency } from '@/lib/money';
import { contributionsVsMarket, timeWeightedReturn } from '@/lib/returns';
import { useNetWorth, useSettings, useSnapshots, useTransactions } from '@/store';

const MONTH_ABBREV = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function dayMonthYear(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${Number(day)} ${MONTH_ABBREV[Number(month) - 1]} ${year}`;
}

function monthShortYear(iso: string): string {
  const [year, month] = iso.split('-');
  return `${MONTH_ABBREV[Number(month) - 1].toUpperCase()} ${year.slice(2)}`;
}

type MonthlyCell = { key: string; label: string; percent: number };

export default function PerformanceScreen() {
  const [gridWidth, setGridWidth] = useState(0);
  const cellWidth = gridWidth > 0 ? (gridWidth - 5 * 6) / 6 : 0;
  const snapshots = useSnapshots();
  const transactions = useTransactions();
  const netWorth = useNetWorth();
  const { baseCurrency } = useSettings();

  const performance = useMemo(() => {
    const marks = [...snapshots].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    const first = marks[0] ?? null;
    const last = marks[marks.length - 1] ?? null;
    const windowStart = first ? Date.parse(first.date) : 0;
    const windowEnd = last ? Date.parse(last.date) : 0;

    const flows = transactions
      .filter((tx) => tx.type === 'deposit' || tx.type === 'withdrawal')
      .filter((tx) => {
        const t = Date.parse(tx.date);
        return t > windowStart && t <= windowEnd;
      })
      .map((tx) => ({ date: tx.date, amount: tx.amount }));

    const valuations = marks.map((snapshot) => ({
      date: snapshot.date,
      value: snapshot.totalNetWorth,
    }));
    const startValue = first?.totalNetWorth ?? 0;
    const endValue = last?.totalNetWorth ?? 0;
    const { contributions, market } = contributionsVsMarket(startValue, endValue, flows);

    const byMonth = new Map<string, { date: string; value: number }[]>();
    for (const snapshot of marks) {
      const key = snapshot.date.slice(0, 7);
      const bucket = byMonth.get(key);
      const point = { date: snapshot.date, value: snapshot.totalNetWorth };
      if (bucket) bucket.push(point);
      else byMonth.set(key, [point]);
    }
    const monthly: MonthlyCell[] = [...byMonth.entries()]
      .filter(([, points]) => points.length >= 2)
      .map(([key, points]) => ({
        key,
        label: MONTH_ABBREV[Number(key.slice(5, 7)) - 1],
        percent: timeWeightedReturn(points, flows) * 100,
      }));

    return {
      firstDate: first?.date ?? null,
      twr: timeWeightedReturn(valuations, flows),
      startValue,
      totalChange: endValue - startValue,
      contributions,
      market,
      monthly,
      xLabels: marks.length
        ? [
            monthShortYear(marks[0].date),
            monthShortYear(marks[Math.floor((marks.length - 1) / 3)].date),
            monthShortYear(marks[Math.floor((2 * (marks.length - 1)) / 3)].date),
            'NOW',
          ]
        : [],
    };
  }, [snapshots, transactions]);

  const money0 = (value: number) =>
    formatCurrency(value, baseCurrency, {
      locale: 'en',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  const signed0 = (value: number) =>
    formatSignedCurrency(value, baseCurrency, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const gain = performance.totalChange >= 0;
  const changeColor = gain ? Colors.verdigris : Colors.copper;
  const sinceLabel = performance.firstDate ? dayMonthYear(performance.firstDate) : '—';

  const summaryRows: { label: string; value: string; valueColor: string }[] = [
    { label: 'Start value', value: money0(performance.startValue), valueColor: Colors.bone },
    { label: 'Contributed', value: signed0(performance.contributions), valueColor: Colors.bone },
    {
      label: 'Market',
      value: signed0(performance.market),
      valueColor: performance.market >= 0 ? Colors.verdigris : Colors.copper,
    },
    {
      label: 'End value',
      value: money0(netWorth.total),
      valueColor: Colors.bone,
    },
  ];
  const summaryLabel = summaryRows.map((row) => `${row.label}, ${row.value}`).join('. ');

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Caption>Performance · since {sinceLabel}</Caption>
        <Text style={styles.total}>{signed0(performance.totalChange)}</Text>
        <Text style={[styles.change, { color: changeColor }]}>
          {gain ? '▲' : '▼'}{' '}
          {formatPercent(performance.twr * 100, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{' '}
          time-weighted
        </Text>

        <View style={styles.chart}>
          <Svg width="100%" height="100%" viewBox="0 0 354 200">
            <Path
              d="M0 180 C40 176 70 168 100 150 S160 120 200 110 S260 70 300 60 L354 30"
              fill="none"
              stroke={Colors.bone}
              strokeWidth={1.5}
            />
            <Path
              d="M0 182 H40 V170 H90 V158 H140 V146 H190 V134 H240 V122 H290 V110 H354"
              fill="none"
              stroke={Colors.ash}
              strokeWidth={1}
              strokeDasharray="2 3"
            />
            <Line x1={0} y1={199.5} x2={354} y2={199.5} stroke={Colors.hairline} />
            <SvgText
              x={354}
              y={24}
              textAnchor="end"
              fontFamily={Fonts.manrope}
              fontSize={11}
              fill={Colors.slate}
              letterSpacing={1}>
              VALUE
            </SvgText>
            <SvgText
              x={354}
              y={104}
              textAnchor="end"
              fontFamily={Fonts.manrope}
              fontSize={11}
              fill={Colors.slate}
              letterSpacing={1}>
              CONTRIBUTED
            </SvgText>
          </Svg>
        </View>

        <View style={styles.xLabels}>
          {performance.xLabels.map((label, index) => (
            <Text key={`${label}-${index}`} style={styles.xLabel}>
              {label}
            </Text>
          ))}
        </View>

        <View style={styles.summary} accessible accessibilityLabel={summaryLabel}>
          <View style={styles.summaryLabels}>
            {summaryRows.map((row) => (
              <Text key={row.label} style={styles.summaryLabel}>
                {row.label}
              </Text>
            ))}
          </View>
          <View style={styles.summaryValues}>
            {summaryRows.map((row) => (
              <Text key={row.label} style={[styles.summaryValue, { color: row.valueColor }]}>
                {row.value}
              </Text>
            ))}
          </View>
        </View>

        {performance.monthly.length > 0 ? (
          <>
            <View style={styles.monthlyHeading}>
              <Caption>Monthly · time-weighted</Caption>
            </View>
            <View
              style={styles.monthlyGrid}
              onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}>
              {performance.monthly.map((cell) => {
                const flat = Math.abs(cell.percent) < 0.1;
                const rgb = cell.percent >= 0 ? TintRgb.gain : TintRgb.loss;
                const opacity = Math.min(0.12 + Math.abs(cell.percent) * 0.08, 0.4);
                const text = `${cell.percent >= 0 ? '+' : '−'}${formatNumber(
                  Math.abs(cell.percent),
                  { minimumFractionDigits: 1, maximumFractionDigits: 1 },
                )}`;
                return (
                  <View
                    key={cell.key}
                    accessible
                    accessibilityLabel={`${cell.label}, ${text} percent`}
                    style={[
                      styles.monthCell,
                      { width: cellWidth },
                      flat ? styles.monthCellOutline : { backgroundColor: `rgba(${rgb},${opacity})` },
                    ]}>
                    <Text style={styles.monthLabel}>{cell.label}</Text>
                    <Text style={[styles.monthValue, flat && styles.monthValueOutline]}>{text}</Text>
                  </View>
                );
              })}
            </View>
          </>
        ) : null}
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
    paddingTop: 68,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  total: {
    fontFamily: Fonts.newsreaderLight36,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.72,
    color: Colors.bone,
    marginTop: 14,
    fontVariant: ['tabular-nums'],
  },
  change: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 20,
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
  chart: {
    width: '100%',
    aspectRatio: 354 / 200,
    marginTop: 28,
  },
  xLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  xLabel: {
    fontFamily: Fonts.manropeMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.1,
    color: Colors.slate,
  },
  summary: {
    flexDirection: 'row',
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    paddingTop: 16,
  },
  summaryLabels: {
    flex: 1,
    gap: 12,
  },
  summaryValues: {
    gap: 12,
  },
  summaryLabel: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.ash,
  },
  summaryValue: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
  },
  monthlyHeading: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    paddingTop: 12,
    marginTop: 28,
  },
  monthlyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
  },
  monthCell: {
    height: 44,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  monthCellOutline: {
    height: 46,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  monthLabel: {
    fontFamily: Fonts.manropeMedium,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.6,
    color: Colors.slate,
    textTransform: 'uppercase',
  },
  monthValue: {
    fontFamily: Fonts.manropeMedium,
    fontSize: 11,
    lineHeight: 14,
    color: Colors.bone,
    fontVariant: ['tabular-nums'],
  },
  monthValueOutline: {
    color: Colors.slate,
  },
});
