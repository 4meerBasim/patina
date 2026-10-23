import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { Caption } from '@/components/editorial/caption';
import { PeriodSelector } from '@/components/editorial/period-selector';
import { Colors, Fonts } from '@/constants/theme';
import type { AssetClass } from '@/data/types';
import { parseAmount } from '@/lib/amount';
import { formatCurrency, formatNumber, formatPercent, formatSignedCurrency } from '@/lib/money';
import { moneyWeightedReturn } from '@/lib/returns';
import { useIsLargeType } from '@/lib/type-scale';
import {
  useAccounts,
  useDataActions,
  useDataStore,
  useFeeAnalysis,
  useHoldingMetrics,
  useHoldings,
  useLots,
  useNetWorth,
  useSettings,
  useTransactions,
  useYieldOnCost,
} from '@/store';

const TODAY_ISO = new Date().toISOString().slice(0, 10);

const chartPath =
  'M0 170 C40 160 60 178 100 150 S150 120 180 140 S220 90 260 100 S320 60 360 66 L402 50';

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

const CLASS_LABEL: Record<AssetClass, string> = {
  stocks: 'Stocks',
  crypto: 'Crypto',
  property: 'Real estate',
  cash: 'Cash',
  savings: 'Savings',
};

function monthYear(iso: string): string {
  const [year, month] = iso.split('-');
  return `${MONTH_ABBREV[Number(month) - 1]} ${year}`;
}

function dayMonthYear(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${Number(day)} ${MONTH_ABBREV[Number(month) - 1]} ${year}`;
}

function splitFraction(formatted: string): [string, string] {
  const dot = formatted.lastIndexOf('.');
  if (dot < 0) return [formatted, ''];
  return [formatted.slice(0, dot), formatted.slice(dot)];
}

type Row = { label: string; value: string; valueColor: string };

export default function HoldingScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [periodIndex, setPeriodIndex] = useState(2);
  const [isAdding, setIsAdding] = useState(false);
  const [markInput, setMarkInput] = useState('');

  const holdings = useHoldings();
  const positions = useHoldingMetrics();
  const lots = useLots();
  const netWorth = useNetWorth();
  const transactions = useTransactions();
  const feeAnalysis = useFeeAnalysis();
  const isLargeType = useIsLargeType();
  const yieldOnCost = useYieldOnCost();
  const accounts = useAccounts();
  const valuations = useDataStore((state) => state.valuations);
  const priceQuotes = useDataStore((state) => state.priceQuotes);
  const { baseCurrency } = useSettings();
  const { addValuation } = useDataActions();

  const holding =
    (id ? holdings.find((item) => item.id === id) : undefined) ??
    holdings.find((item) => item.instrument?.symbol === 'AAPL') ??
    holdings[0];

  const position = positions.find((item) => item.holdingId === holding?.id);
  const account = accounts.find((item) => item.id === holding?.accountId);
  const isManual = holding ? holding.instrumentId == null : false;

  const money0 = useCallback(
    (value: number, currency = baseCurrency) =>
      formatCurrency(value, currency, {
        locale: 'en',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    [baseCurrency],
  );
  const money2 = useCallback(
    (value: number) =>
      formatCurrency(value, baseCurrency, {
        locale: 'en',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [baseCurrency],
  );

  const holdingLots = useMemo(
    () => lots.filter((lot) => lot.holdingId === holding?.id),
    [lots, holding?.id],
  );
  const holdingMarks = useMemo(
    () =>
      valuations
        .filter((valuation) => valuation.holdingId === holding?.id)
        .sort((a, b) => Date.parse(b.date) - Date.parse(a.date)),
    [valuations, holding?.id],
  );

  const fee = feeAnalysis.holdings.find((item) => item.holdingId === holding?.id);
  const yoc = yieldOnCost.find((item) => item.holdingId === holding?.id);

  const moneyWeighted = useMemo(() => {
    if (!holding || isManual) return null;
    return moneyWeightedReturn(
      transactions
        .filter((tx) => tx.holdingId === holding.id)
        .map((tx) => ({ date: tx.date, amount: -tx.amount })),
      { date: TODAY_ISO, value: holding.value },
    );
  }, [holding, isManual, transactions]);

  const toggleAdding = useCallback(() => {
    setIsAdding((prev) => !prev);
    setMarkInput('');
  }, []);
  const saveMark = useCallback(() => {
    if (!holding) return;
    const value = parseAmount(markInput);
    if (value == null || value <= 0) return;
    void addValuation({
      holdingId: holding.id,
      date: TODAY_ISO,
      value,
      currency: holding.currency,
    });
    setIsAdding(false);
    setMarkInput('');
  }, [holding, markInput, addValuation]);
  const goBack = useCallback(() => router.back(), []);
  const goEdit = useCallback(() => router.push('/editorial/add'), []);

  if (!holding) {
    return <View style={styles.screen} />;
  }

  const name = holding.instrument?.name ?? holding.name ?? '';
  const avatarLabel = name.slice(0, 1).toUpperCase();
  const subtitle = holding.instrument
    ? `${holding.instrument.symbol} · ${account?.institution ?? account?.name ?? ''}`
    : `${CLASS_LABEL[holding.assetClass]} · ${account?.name ?? ''}`;

  const quoteDate =
    priceQuotes.find((quote) => quote.instrumentId === holding.instrumentId)?.asOf ?? TODAY_ISO;
  const heroDate = isManual
    ? holdingMarks[0]
      ? dayMonthYear(holdingMarks[0].date)
      : dayMonthYear(TODAY_ISO)
    : dayMonthYear(quoteDate);
  const [heroWhole, heroFraction] = splitFraction(money2(holding.value));

  let heroChange: { text: string; color: string } | null = null;
  if (!isManual && position?.unrealisedGain != null && position.unrealisedPercent != null) {
    const up = position.unrealisedGain >= 0;
    heroChange = {
      text: `${up ? '▲' : '▼'} ${formatSignedCurrency(position.unrealisedGain, baseCurrency, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })} · ${formatPercent(position.unrealisedPercent, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}`,
      color: up ? Colors.verdigris : Colors.copper,
    };
  } else if (isManual && holdingMarks.length >= 2) {
    const change = holdingMarks[0].value - holdingMarks[1].value;
    const percent = holdingMarks[1].value !== 0 ? (change / holdingMarks[1].value) * 100 : 0;
    const up = change >= 0;
    heroChange = {
      text: `${up ? '▲' : '▼'} ${formatSignedCurrency(change, holding.currency, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })} · ${formatPercent(percent, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })} since ${monthYear(holdingMarks[1].date)}`,
      color: up ? Colors.verdigris : Colors.copper,
    };
  }

  const rows: Row[] = [];
  if (!isManual) {
    rows.push({ label: 'Quantity', value: `${formatNumber(holding.quantity)} shares`, valueColor: Colors.bone });
  }
  if (position?.costBasis != null && position.averageCost != null) {
    rows.push({
      label: 'Cost basis',
      value: `${money0(position.costBasis)} · ${money2(position.averageCost)} avg`,
      valueColor: Colors.bone,
    });
  }
  if (position?.unrealisedGain != null && position.unrealisedPercent != null) {
    rows.push({
      label: 'Unrealised',
      value: `${position.unrealisedGain >= 0 ? '▲' : '▼'} ${formatSignedCurrency(
        position.unrealisedGain,
        baseCurrency,
        { minimumFractionDigits: 0, maximumFractionDigits: 0 },
      )} · ${formatPercent(position.unrealisedPercent, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}`,
      valueColor: position.unrealisedGain >= 0 ? Colors.verdigris : Colors.copper,
    });
  }
  if (position && position.realisedGain !== 0) {
    rows.push({
      label: 'Realised',
      value: formatSignedCurrency(position.realisedGain, baseCurrency, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
      valueColor: position.realisedGain >= 0 ? Colors.verdigris : Colors.copper,
    });
  }
  if (position && position.unmatchedSellQuantity > 0) {
    rows.push({
      label: 'Sold without a purchase',
      value: `${formatNumber(position.unmatchedSellQuantity)} units`,
      valueColor: Colors.copper,
    });
  }
  if (
    holding.currency !== baseCurrency &&
    position?.marketGain != null &&
    position.currencyGain != null
  ) {
    rows.push({
      label: 'Market gain',
      value: formatSignedCurrency(position.marketGain, baseCurrency, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
      valueColor: position.marketGain >= 0 ? Colors.verdigris : Colors.copper,
    });
    rows.push({
      label: 'Currency gain',
      value: formatSignedCurrency(position.currencyGain, baseCurrency, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
      valueColor: position.currencyGain >= 0 ? Colors.verdigris : Colors.copper,
    });
  }
  if (moneyWeighted !== null) {
    rows.push({
      label: moneyWeighted.annualised ? 'Annualised return' : 'Return so far',
      value: formatPercent(moneyWeighted.rate * 100, {
        signed: true,
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
      valueColor: moneyWeighted.rate >= 0 ? Colors.verdigris : Colors.copper,
    });
  }
  if (fee) {
    rows.push({
      label: 'Expense ratio',
      value: `${(fee.ratio * 100).toFixed(2)}% · ${money0(fee.annualCost)}/yr`,
      valueColor: Colors.bone,
    });
  }
  if (yoc) {
    rows.push({
      label: 'Yield on cost',
      value: formatPercent(yoc.yieldOnCost, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      valueColor: Colors.bone,
    });
  }
  if (!isManual && holdingLots.length > 0) {
    const firstAcquired = holdingLots.reduce<string | null>(
      (earliest, lot) => (earliest === null || lot.acquiredAt < earliest ? lot.acquiredAt : earliest),
      null,
    );
    if (firstAcquired) {
      rows.push({ label: 'First acquired', value: monthYear(firstAcquired), valueColor: Colors.bone });
    }
  }
  if (netWorth.total > 0) {
    rows.push({
      label: 'Weight',
      value: `${formatPercent((holding.value / netWorth.total) * 100, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })} of net worth`,
      valueColor: Colors.bone,
    });
  }
  const rowsLabel = rows.map((row) => `${row.label}, ${row.value}`).join('. ');

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={goBack}>
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
          <Pressable
            accessibilityRole="button"
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            onPress={goEdit}>
            <Text style={styles.edit}>Edit</Text>
          </Pressable>
        </View>

        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLabel}>{avatarLabel}</Text>
          </View>
          <View>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.ticker}>{subtitle}</Text>
          </View>
        </View>

        <View style={styles.priceBlock}>
          <Text style={styles.date}>{heroDate}</Text>
          <Text style={styles.price}>
            {heroWhole}
            <Text style={styles.priceFraction}>{heroFraction}</Text>
          </Text>
          {heroChange ? (
            <Text style={[styles.change, { color: heroChange.color }]}>{heroChange.text}</Text>
          ) : null}
        </View>

        {!isManual ? (
          <>
            <View style={styles.chart}>
              <Svg width="100%" height="100%" viewBox="0 0 402 240">
                <Defs>
                  <LinearGradient id="holdingChart" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={Colors.bone} stopOpacity={0.08} />
                    <Stop offset="1" stopColor={Colors.bone} stopOpacity={0} />
                  </LinearGradient>
                </Defs>
                <Path d={`${chartPath} V240 H0Z`} fill="url(#holdingChart)" />
                <Path d={chartPath} fill="none" stroke={Colors.bone} strokeWidth={1.5} />
                <Line x1={0} y1={239.5} x2={402} y2={239.5} stroke={Colors.hairline} />
              </Svg>
            </View>
            <PeriodSelector
              options={['1W', '1M', '1Y', 'All']}
              selectedIndex={periodIndex}
              onSelect={setPeriodIndex}
              style={styles.periods}
            />
          </>
        ) : null}

        {isManual ? (
          <View style={styles.section}>
            <View style={styles.sectionDivider}>
              <Caption>Valuations</Caption>
            </View>
            {holdingMarks.length > 0 ? (
              <View style={styles.marks}>
                {holdingMarks.map((mark, index) => (
                  <View key={mark.id} style={styles.markRow}>
                    <Text style={styles.markDate}>{monthYear(mark.date)}</Text>
                    <Text style={[styles.markValue, index === 0 ? styles.markLatest : null]}>
                      {money0(mark.value, mark.currency)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.empty}>No marks yet.</Text>
            )}

            {isAdding ? (
              <View style={styles.addForm}>
                <TextInput
                  accessibilityLabel="New valuation amount"
                  style={styles.addInput}
                  value={markInput}
                  onChangeText={setMarkInput}
                  placeholder={money0(holding.value, holding.currency)}
                  placeholderTextColor={Colors.slate}
                  keyboardType="decimal-pad"
                  autoFocus
                  cursorColor={Colors.brass}
                  selectionColor={Colors.brass}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  onPress={toggleAdding}>
                  <Text style={styles.cancel}>Cancel</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Save valuation mark"
                  style={styles.saveButton}
                  onPress={saveMark}>
                  <Text style={styles.saveLabel}>Save</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add a valuation mark"
                hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                onPress={toggleAdding}>
                <Text style={styles.addMark}>Add a valuation mark</Text>
              </Pressable>
            )}
          </View>
        ) : null}

        {rows.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionDivider}>
              <Caption>{isManual ? 'Position' : 'Provenance'}</Caption>
            </View>
            {isLargeType ? (
              <View style={styles.defStack} accessible accessibilityLabel={rowsLabel}>
                {rows.map((row) => (
                  <View key={row.label} style={styles.defPair}>
                    <Text style={styles.defLabel}>{row.label}</Text>
                    <Text style={[styles.defValue, { color: row.valueColor }]}>{row.value}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.defList} accessible accessibilityLabel={rowsLabel}>
                <View style={styles.defLabels}>
                  {rows.map((row) => (
                    <Text key={row.label} style={styles.defLabel}>
                      {row.label}
                    </Text>
                  ))}
                </View>
                <View style={styles.defValues}>
                  {rows.map((row) => (
                    <Text key={row.label} style={[styles.defValue, { color: row.valueColor }]}>
                      {row.value}
                    </Text>
                  ))}
                </View>
              </View>
            )}
          </View>
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
    paddingTop: 64,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  edit: {
    fontFamily: Fonts.manrope,
    fontSize: 13,
    color: Colors.brass,
  },
  identity: {
    paddingHorizontal: 24,
    marginTop: 24,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: Colors.slate,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    fontFamily: Fonts.newsreader18,
    fontSize: 18,
    color: Colors.bone,
  },
  name: {
    fontFamily: Fonts.manrope,
    fontSize: 18,
    lineHeight: 24,
    color: Colors.bone,
  },
  ticker: {
    fontFamily: Fonts.plexMono,
    fontSize: 12,
    color: Colors.slate,
  },
  priceBlock: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  date: {
    fontFamily: Fonts.newsreaderItalic13,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.slate,
  },
  price: {
    fontFamily: Fonts.newsreaderLight36,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.72,
    color: Colors.bone,
    fontVariant: ['tabular-nums'],
    marginTop: 4,
  },
  priceFraction: {
    color: Colors.slate,
  },
  change: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
    marginTop: 6,
  },
  chart: {
    width: '100%',
    aspectRatio: 402 / 240,
    marginTop: 16,
  },
  periods: {
    paddingHorizontal: 24,
    marginTop: 12,
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sectionDivider: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    paddingTop: 12,
  },
  marks: {
    marginTop: 14,
    gap: 12,
  },
  markRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  markDate: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.ash,
  },
  markValue: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.ash,
    fontVariant: ['tabular-nums'],
  },
  markLatest: {
    color: Colors.bone,
  },
  empty: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.slate,
    marginTop: 14,
  },
  addForm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 20,
  },
  addInput: {
    flex: 1,
    fontFamily: Fonts.newsreaderLight32,
    fontSize: 28,
    lineHeight: 36,
    color: Colors.bone,
    fontVariant: ['tabular-nums'],
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.brass,
  },
  cancel: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    color: Colors.ash,
  },
  saveButton: {
    height: 48,
    paddingHorizontal: 22,
    backgroundColor: Colors.brass,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLabel: {
    fontFamily: Fonts.manropeSemiBold,
    fontSize: 15,
    color: Colors.ink,
  },
  addMark: {
    fontFamily: Fonts.manrope,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.brass,
    marginTop: 20,
  },
  defList: {
    flexDirection: 'row',
    marginTop: 14,
  },
  defStack: {
    marginTop: 14,
    gap: 12,
  },
  defPair: {
    gap: 2,
  },
  defLabels: {
    flex: 1,
    gap: 12,
  },
  defValues: {
    gap: 12,
  },
  defLabel: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.ash,
  },
  defValue: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
  },
});
