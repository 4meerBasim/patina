import { router, useLocalSearchParams } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ColorValue } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { Glass } from '@/components/native/glass';
import { GroupedCard, KeyValueRow } from '@/components/native/grouped-list';
import { SegmentedControl } from '@/components/native/segmented-control';
import { Colors } from '@/constants/theme';
import type { CurrencyCode, Valuation } from '@/data/types';
import { formatCurrency, formatNumber, formatPercent, formatSignedCurrency, parseAmount } from '@/lib/money';
import { moneyWeightedReturn } from '@/lib/returns';
import {
  useAccounts,
  useDataActions,
  useDataStore,
  useFeeAnalysis,
  useHoldingMetrics,
  useHoldings,
  useNetWorth,
  useSettings,
  useTransactions,
  useYieldOnCost,
} from '@/store';

const TODAY_ISO = new Date().toISOString().slice(0, 10);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

type MetricRowData = { key: string; label: string; value: string; color: ColorValue };

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${MONTHS[Number(month) - 1]} ${Number(day)}, ${year}`;
}

function valuedCaption(iso: string): string {
  const [, month, day] = iso.split('-');
  return `Valued ${MONTHS[Number(month) - 1]} ${Number(day)}`;
}

const AddValuationRow = memo(function AddValuationRow({
  holdingId,
  currency,
  onAdd,
}: {
  holdingId: string;
  currency: CurrencyCode;
  onAdd: (input: Omit<Valuation, 'id'>) => Promise<string>;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  const openInput = useCallback(() => setOpen(true), []);
  const submit = useCallback(async () => {
    const parsed = parseAmount(text);
    setText('');
    setOpen(false);
    if (parsed == null || parsed <= 0) return;
    await onAdd({ holdingId, date: TODAY_ISO, value: parsed, currency });
  }, [text, holdingId, currency, onAdd]);

  if (!open) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add valuation"
        style={styles.addRow}
        onPress={openInput}>
        <Text style={styles.addText}>Add valuation</Text>
      </Pressable>
    );
  }
  return (
    <View style={styles.addInputRow}>
      <TextInput
        accessibilityLabel="Valuation amount"
        style={styles.addInput}
        value={text}
        onChangeText={setText}
        autoFocus
        keyboardType="decimal-pad"
        placeholder="New value today"
        placeholderTextColor={Colors.disabled}
        cursorColor={Colors.brass}
        selectionColor={Colors.brass}
        onSubmitEditing={submit}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Save valuation"
        hitSlop={12}
        onPress={submit}>
        <Text style={styles.addText}>Add</Text>
      </Pressable>
    </View>
  );
});

export default function NativeHolding() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [period, setPeriod] = useState(2);
  const settings = useSettings();
  const holdings = useHoldings();
  const accounts = useAccounts();
  const netWorth = useNetWorth();
  const transactions = useTransactions();
  const positions = useHoldingMetrics();
  const feeAnalysis = useFeeAnalysis();
  const yields = useYieldOnCost();
  const allValuations = useDataStore((state) => state.valuations);
  const { addValuation } = useDataActions();

  const baseCurrency = settings.baseCurrency;

  const holding = useMemo(
    () =>
      holdings.find((item) => item.id === id) ??
      holdings.find((item) => item.instrument?.symbol === 'AAPL') ??
      null,
    [holdings, id],
  );
  const position = useMemo(
    () => positions.find((item) => item.holdingId === holding?.id) ?? null,
    [positions, holding],
  );

  const account = accounts.find((item) => item.id === holding?.accountId);
  const fee = feeAnalysis.holdings.find((item) => item.holdingId === holding?.id);
  const yoc = yields.find((item) => item.holdingId === holding?.id);

  const isManual = holding ? holding.instrumentId == null : false;
  const isForeign = position ? position.currency !== baseCurrency : false;
  const value = position?.value ?? holding?.value ?? 0;
  const weightPercent = netWorth.total === 0 ? 0 : (value / netWorth.total) * 100;

  const holdingValuations = useMemo(
    () =>
      allValuations
        .filter((item) => item.holdingId === holding?.id)
        .sort((a, b) => Date.parse(b.date) - Date.parse(a.date)),
    [allValuations, holding],
  );

  const moneyWeighted = useMemo(() => {
    if (!holding) return null;
    const flows = transactions
      .filter((tx) => tx.holdingId === holding.id)
      .map((tx) => ({ date: tx.date, amount: -tx.amount }));
    if (flows.length === 0) return null;
    return moneyWeightedReturn(flows, { date: TODAY_ISO, value });
  }, [holding, transactions, value]);

  const positionRows = useMemo<MetricRowData[]>(() => {
    const rows: MetricRowData[] = [];
    if (!position) return rows;
    if (!isManual) {
      rows.push({ key: 'shares', label: 'Shares', value: formatNumber(position.quantity), color: Colors.ash });
    }
    if (position.costBasis != null) {
      rows.push({ key: 'cost', label: 'Cost basis', value: formatCurrency(position.costBasis, baseCurrency), color: Colors.ash });
    }
    if (position.averageCost != null) {
      rows.push({
        key: 'avg',
        label: 'Average cost',
        value: formatCurrency(position.averageCost, position.currency, { minimumFractionDigits: 2 }),
        color: Colors.ash,
      });
    }
    if (position.unrealisedGain != null && position.unrealisedPercent != null) {
      rows.push({
        key: 'unreal',
        label: 'Unrealized gain',
        value: `${formatSignedCurrency(position.unrealisedGain, baseCurrency)} · ${formatPercent(position.unrealisedPercent, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`,
        color: position.unrealisedGain >= 0 ? Colors.verdigris : Colors.copper,
      });
    }
    if (position.realisedGain !== 0) {
      rows.push({
        key: 'real',
        label: 'Realized gain',
        value: formatSignedCurrency(position.realisedGain, baseCurrency),
        color: position.realisedGain >= 0 ? Colors.verdigris : Colors.copper,
      });
    }
    if (position.unmatchedSellQuantity > 0) {
      rows.push({
        key: 'unmatched',
        label: 'Sold without a purchase',
        value: `${formatNumber(position.unmatchedSellQuantity)} units`,
        color: Colors.copper,
      });
    }
    if (isForeign && position.marketGain != null) {
      rows.push({
        key: 'market',
        label: 'Market gain',
        value: formatSignedCurrency(position.marketGain, baseCurrency),
        color: position.marketGain >= 0 ? Colors.verdigris : Colors.copper,
      });
    }
    if (isForeign && position.currencyGain != null) {
      rows.push({
        key: 'fx',
        label: 'Currency gain',
        value: formatSignedCurrency(position.currencyGain, baseCurrency),
        color: position.currencyGain >= 0 ? Colors.verdigris : Colors.copper,
      });
    }
    if (moneyWeighted !== null) {
      rows.push({
        key: 'irr',
        label: moneyWeighted.annualised ? 'Annualized return' : 'Return so far',
        value: formatPercent(moneyWeighted.rate * 100, { signed: true, minimumFractionDigits: 1, maximumFractionDigits: 1 }),
        color: moneyWeighted.rate >= 0 ? Colors.verdigris : Colors.copper,
      });
    }
    rows.push({
      key: 'weight',
      label: 'Weight',
      value: formatPercent(weightPercent, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
      color: Colors.ash,
    });
    return rows;
  }, [position, isManual, isForeign, moneyWeighted, weightPercent, baseCurrency]);

  const hero = formatCurrency(value, baseCurrency);
  const decimalAt = hero.lastIndexOf('.');
  const heroWhole = decimalAt >= 0 ? hero.slice(0, decimalAt) : hero;
  const heroCents = decimalAt >= 0 ? hero.slice(decimalAt) : '';

  let sublabel = '';
  if (isForeign && position) sublabel = formatCurrency(position.valueNative, position.currency);
  else if (isManual && holdingValuations.length > 0) sublabel = valuedCaption(holdingValuations[0].date);

  const unrealisedGain = position?.unrealisedGain ?? null;
  const unrealisedPercent = position?.unrealisedPercent ?? null;
  const heroChip =
    unrealisedGain !== null && unrealisedPercent !== null
      ? {
          text: `${formatSignedCurrency(unrealisedGain, baseCurrency)} · ${formatPercent(unrealisedPercent, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`,
          isGain: unrealisedGain >= 0,
        }
      : null;

  const title = holding?.instrument?.name ?? holding?.name ?? '';
  const accountLabel = account ? (account.institution ?? account.name) : '';
  const meta = holding?.instrument ? `${holding.instrument.symbol} · ${accountLabel}` : accountLabel;

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
            {meta ? <Text style={styles.meta}>{meta}</Text> : null}
          </View>

          <View style={styles.heroBlock}>
            {sublabel ? <Text style={styles.date}>{sublabel}</Text> : null}
            <Text style={styles.heroValue}>
              {heroWhole}
              <Text style={styles.heroCents}>{heroCents}</Text>
            </Text>
            {heroChip ? (
              <View style={[styles.chip, heroChip.isGain ? styles.gainChip : styles.lossChip]}>
                <Text style={[styles.chipText, heroChip.isGain ? styles.gainText : styles.lossText]}>
                  {heroChip.text}
                </Text>
              </View>
            ) : null}
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
            {positionRows.map((row, index) => (
              <KeyValueRow
                key={row.key}
                label={row.label}
                value={row.value}
                valueColor={row.color}
                hasSeparator={index < positionRows.length - 1}
              />
            ))}
          </GroupedCard>

          {yoc ? (
            <>
              <Text style={styles.sectionHeader}>Income</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Dividend income"
                onPress={() => router.push('/native/dividends')}>
                <GroupedCard>
                  <KeyValueRow
                    label="Yield on cost"
                    value={formatPercent(yoc.yieldOnCost, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    valueColor={Colors.bone}
                    hasSeparator
                  />
                  <KeyValueRow
                    label="Trailing 12-mo income"
                    value={formatCurrency(yoc.trailingIncome, baseCurrency)}
                    hasSeparator={false}
                  />
                </GroupedCard>
              </Pressable>
            </>
          ) : null}

          {fee ? (
            <>
              <Text style={styles.sectionHeader}>Fees</Text>
              <GroupedCard>
                <KeyValueRow
                  label="Expense ratio"
                  value={formatPercent(fee.ratio * 100, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  hasSeparator
                />
                <KeyValueRow
                  label="Annual cost"
                  value={formatCurrency(fee.annualCost, baseCurrency)}
                  valueColor={Colors.copper}
                  hasSeparator
                />
                <KeyValueRow
                  label="Projected 10-year cost"
                  value={formatCurrency(fee.drag10, baseCurrency)}
                  valueColor={Colors.copper}
                  hasSeparator={false}
                />
              </GroupedCard>
            </>
          ) : null}

          {holding && isManual ? (
            <>
              <Text style={styles.sectionHeader}>Valuations</Text>
              <GroupedCard>
                {holdingValuations.map((valuation) => (
                  <KeyValueRow
                    key={valuation.id}
                    label={formatDate(valuation.date)}
                    value={formatCurrency(valuation.value, valuation.currency)}
                    valueColor={Colors.bone}
                    hasSeparator
                  />
                ))}
                <AddValuationRow
                  holdingId={holding.id}
                  currency={holding.currency}
                  onAdd={addValuation}
                />
              </GroupedCard>
            </>
          ) : null}
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
  chip: {
    alignSelf: 'flex-start',
    marginTop: 6,
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  gainChip: {
    backgroundColor: Colors.gainTint,
  },
  lossChip: {
    backgroundColor: Colors.lossTint,
  },
  chipText: {
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
    marginStart: 16,
  },
  addRow: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  addInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 16,
  },
  addInput: {
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.bone,
    padding: 0,
    fontVariant: ['tabular-nums'],
  },
  addText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.brass,
  },
});
