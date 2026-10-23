import { memo, useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { Caption } from '@/components/editorial/caption';
import { AssetClassColors, Colors, Fonts } from '@/constants/theme';
import type { AllocationTargets, AssetClass } from '@/data/types';
import { formatCurrency } from '@/lib/money';
import { targetTotal, type RebalanceHint } from '@/lib/rebalance';
import { useAllocation, useAllocationTargets, useDataActions, useRebalanceHints, useSettings } from '@/store';

type ClassMeta = {
  key: AssetClass;
  name: string;
  color: string;
  dashArray: string;
  dashOffset: number;
};

const CLASS_META: ClassMeta[] = [
  { key: 'stocks', name: 'Stocks', color: AssetClassColors.stocks, dashArray: '299 691', dashOffset: 0 },
  { key: 'crypto', name: 'Crypto', color: AssetClassColors.crypto, dashArray: '59 691', dashOffset: -307 },
  { key: 'property', name: 'Real estate', color: AssetClassColors.property, dashArray: '202 691', dashOffset: -374 },
  { key: 'cash', name: 'Cash', color: AssetClassColors.cash, dashArray: '39 691', dashOffset: -584 },
  { key: 'savings', name: 'Savings', color: AssetClassColors.savings, dashArray: '52 691', dashOffset: -631 },
];

const NAME_BY_KEY: Record<AssetClass, string> = {
  stocks: 'Stocks',
  crypto: 'Crypto',
  property: 'Real estate',
  cash: 'Cash',
  savings: 'Savings',
};

function formatDrift(actual: number, target: number): string {
  const drift = actual - target;
  return `${drift >= 0 ? '+' : '−'}${Math.abs(drift)}pt`;
}

const LegendRow = memo(function LegendRow({
  item,
  isSelected,
  isLast,
  onSelect,
}: {
  item: { key: AssetClass; name: string; color: string; actual: number; target: number };
  isSelected: boolean;
  isLast: boolean;
  onSelect: (key: AssetClass) => void;
}) {
  const handlePress = useCallback(() => onSelect(item.key), [onSelect, item.key]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${item.name}, actual ${item.actual} percent, target ${item.target} percent`}
      onPress={handlePress}
      style={[
        styles.legendRow,
        { borderTopColor: isSelected ? Colors.brass : Colors.hairline },
        isLast && styles.legendRowLast,
      ]}>
      <View style={[styles.swatch, { backgroundColor: item.color }]} />
      <Text style={[styles.legendName, { color: isSelected ? Colors.bone : Colors.ash }]}>
        {item.name}
      </Text>
      <Text style={[styles.legendActual, { color: isSelected ? Colors.bone : Colors.ash }]}>
        {item.actual}%
      </Text>
      <Text style={styles.legendTarget}>{item.target}</Text>
    </Pressable>
  );
});

const RebalanceRow = memo(function RebalanceRow({
  hint,
  money,
}: {
  hint: RebalanceHint;
  money: (value: number) => string;
}) {
  const isBuy = hint.action === 'buy';
  return (
    <View style={styles.rebalanceRow}>
      <Text style={styles.rebalanceName}>{NAME_BY_KEY[hint.assetClass]}</Text>
      <Text style={styles.rebalanceDrift}>{formatDrift(Math.round(hint.actualPercent), hint.targetPercent)}</Text>
      <Text style={[styles.rebalanceAction, { color: isBuy ? Colors.verdigris : Colors.copper }]}>
        {isBuy ? 'Buy' : 'Sell'} {money(Math.abs(hint.deltaValue))}
      </Text>
    </View>
  );
});

const TargetEditorRow = memo(function TargetEditorRow({
  meta,
  value,
  onAdjust,
}: {
  meta: ClassMeta;
  value: number;
  onAdjust: (key: AssetClass, delta: number) => void;
}) {
  const decrease = useCallback(() => onAdjust(meta.key, -1), [onAdjust, meta.key]);
  const increase = useCallback(() => onAdjust(meta.key, 1), [onAdjust, meta.key]);
  return (
    <View style={styles.editorRow}>
      <View style={[styles.swatch, { backgroundColor: meta.color }]} />
      <Text style={styles.editorName}>{meta.name}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${meta.name} target`}
        accessibilityValue={{ text: `${value}%` }}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={styles.stepper}
        onPress={decrease}>
        <Text style={styles.stepperGlyph}>−</Text>
      </Pressable>
      <Text style={styles.editorValue}>{value}%</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Increase ${meta.name} target`}
        accessibilityValue={{ text: `${value}%` }}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={styles.stepper}
        onPress={increase}>
        <Text style={styles.stepperGlyph}>+</Text>
      </Pressable>
    </View>
  );
});

export default function AllocationScreen() {
  const [selectedKey, setSelectedKey] = useState<AssetClass>('stocks');
  const [isEditing, setIsEditing] = useState(false);
  const allocation = useAllocation();
  const targets = useAllocationTargets();
  const hints = useRebalanceHints();
  const { baseCurrency } = useSettings();
  const { setAllocationTargets } = useDataActions();
  const [draft, setDraft] = useState<AllocationTargets>(targets);

  const money = useCallback(
    (value: number) =>
      formatCurrency(value, baseCurrency, {
        locale: 'en',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    [baseCurrency],
  );

  const classes = CLASS_META.map((meta) => ({
    ...meta,
    actual: Math.round(allocation.find((slice) => slice.assetClass === meta.key)?.weight ?? 0),
    target: targets[meta.key],
  }));
  const selected = classes.find((item) => item.key === selectedKey) ?? classes[0];
  const actionable = hints
    .filter((hint) => hint.action !== 'hold')
    .sort((a, b) => Math.abs(b.deltaValue) - Math.abs(a.deltaValue));

  const openEditor = useCallback(() => {
    setDraft(targets);
    setIsEditing(true);
  }, [targets]);
  const cancelEditor = useCallback(() => setIsEditing(false), []);
  const adjust = useCallback((key: AssetClass, delta: number) => {
    setDraft((prev) => ({ ...prev, [key]: Math.max(0, Math.min(100, prev[key] + delta)) }));
  }, []);
  const draftTotal = CLASS_META.reduce((sum, meta) => sum + draft[meta.key], 0);
  const canSave = draftTotal <= 100;
  const save = useCallback(() => {
    if (draftTotal > 100) return;
    void setAllocationTargets(draft);
    setIsEditing(false);
  }, [setAllocationTargets, draft, draftTotal]);

  const storedTotal = targetTotal(targets);

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Caption>
          Allocation · <Text style={styles.brass}>All</Text>
        </Caption>

        <View style={styles.ring}>
          <Svg width={260} height={260} viewBox="0 0 260 260">
            <G transform="rotate(-90 130 130)">
              <Circle
                cx={130}
                cy={130}
                r={122}
                fill="none"
                stroke={Colors.slate}
                strokeWidth={1}
                strokeDasharray="2 4"
              />
              {classes.map((item) => {
                const isSelected = item.key === selectedKey;
                return (
                  <Circle
                    key={item.key}
                    cx={130}
                    cy={130}
                    r={110}
                    fill="none"
                    stroke={item.color}
                    strokeWidth={isSelected ? 10 : 4}
                    strokeDasharray={item.dashArray}
                    strokeDashoffset={item.dashOffset}
                    opacity={isSelected ? 1 : 0.32}
                  />
                );
              })}
            </G>
          </Svg>
          <View style={styles.ringLabel}>
            <Caption>{selected.name}</Caption>
            <Text style={styles.ringPercent}>{selected.actual}%</Text>
            <Text style={styles.ringTarget}>
              target {selected.target} ·{' '}
              <Text style={styles.copper}>{formatDrift(selected.actual, selected.target)}</Text>
            </Text>
          </View>
        </View>

        <View style={styles.legend}>
          {classes.map((item, index) => (
            <LegendRow
              key={item.key}
              item={item}
              isSelected={item.key === selectedKey}
              isLast={index === classes.length - 1}
              onSelect={setSelectedKey}
            />
          ))}
          <View style={styles.legendHeader}>
            <Caption>Class</Caption>
            <Caption>Actual · Target</Caption>
          </View>
        </View>

        {storedTotal > 100 ? (
          <View style={styles.rebalance}>
            <View style={styles.sectionDivider}>
              <Caption>To reach target</Caption>
            </View>
            <Text style={styles.unfundable}>
              Targets add up to {storedTotal}% of net worth. Lower them to 100% to see what to
              trade.
            </Text>
          </View>
        ) : actionable.length > 0 ? (
          <View style={styles.rebalance}>
            <View style={styles.sectionDivider}>
              <Caption>To reach target</Caption>
            </View>
            {actionable.map((hint) => (
              <RebalanceRow key={hint.assetClass} hint={hint} money={money} />
            ))}
          </View>
        ) : null}

        {isEditing ? (
          <View style={styles.editor}>
            <View style={styles.sectionDivider}>
              <Caption>
                Targets · {draftTotal}% assigned{draftTotal > 100 ? ' · over 100%' : ''}
              </Caption>
            </View>
            {CLASS_META.map((meta) => (
              <TargetEditorRow key={meta.key} meta={meta} value={draft[meta.key]} onAdjust={adjust} />
            ))}
            <View style={styles.editorActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                onPress={cancelEditor}>
                <Text style={styles.cancel}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Save targets"
                accessibilityState={{ disabled: !canSave }}
                disabled={!canSave}
                style={[styles.saveButton, canSave ? null : styles.saveButtonDisabled]}
                onPress={save}>
                <Text style={styles.saveLabel}>Save targets</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Set targets"
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            onPress={openEditor}>
            <Text style={styles.setTargets}>Set targets</Text>
          </Pressable>
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
  content: {
    paddingTop: 68,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  brass: {
    color: Colors.brass,
  },
  copper: {
    color: Colors.copper,
  },
  ring: {
    marginTop: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringLabel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPercent: {
    fontFamily: Fonts.newsreaderLight40,
    fontSize: 40,
    lineHeight: 44,
    color: Colors.bone,
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
  ringTarget: {
    fontFamily: Fonts.manrope,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.ash,
    marginTop: 4,
  },
  legend: {
    marginTop: 40,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 53,
    gap: 14,
    borderTopWidth: 1,
  },
  legendRowLast: {
    height: 54,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
  },
  swatch: {
    width: 14,
    height: 3,
  },
  legendName: {
    flex: 1,
    fontFamily: Fonts.manrope,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  legendActual: {
    width: 64,
    textAlign: 'right',
    fontFamily: Fonts.manrope,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  legendTarget: {
    width: 56,
    textAlign: 'right',
    fontFamily: Fonts.manrope,
    fontSize: 13,
    color: Colors.slate,
    fontVariant: ['tabular-nums'],
  },
  legendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sectionDivider: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    paddingTop: 12,
  },
  rebalance: {
    marginTop: 32,
  },
  rebalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    gap: 14,
  },
  rebalanceName: {
    flex: 1,
    fontFamily: Fonts.manrope,
    fontSize: 15,
    color: Colors.bone,
  },
  rebalanceDrift: {
    fontFamily: Fonts.manrope,
    fontSize: 13,
    color: Colors.slate,
    fontVariant: ['tabular-nums'],
  },
  rebalanceAction: {
    width: 120,
    textAlign: 'right',
    fontFamily: Fonts.manrope,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  editor: {
    marginTop: 32,
  },
  editorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    gap: 14,
  },
  editorName: {
    flex: 1,
    fontFamily: Fonts.manrope,
    fontSize: 15,
    color: Colors.bone,
  },
  stepper: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperGlyph: {
    fontFamily: Fonts.newsreaderLight32,
    fontSize: 24,
    lineHeight: 28,
    color: Colors.brass,
  },
  editorValue: {
    width: 52,
    textAlign: 'center',
    fontFamily: Fonts.manrope,
    fontSize: 15,
    color: Colors.bone,
    fontVariant: ['tabular-nums'],
  },
  editorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 24,
    marginTop: 24,
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
  saveButtonDisabled: {
    opacity: 0.4,
  },
  unfundable: {
    fontFamily: Fonts.manrope,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.ash,
    paddingVertical: 12,
  },
  saveLabel: {
    fontFamily: Fonts.manropeSemiBold,
    fontSize: 15,
    color: Colors.ink,
  },
  setTargets: {
    textAlign: 'center',
    fontFamily: Fonts.manrope,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.brass,
    marginTop: 32,
  },
});
