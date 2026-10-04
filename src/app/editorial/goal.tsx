import { router, useLocalSearchParams } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Caption } from '@/components/editorial/caption';
import { MONTH_ABBREV } from '@/components/editorial/months';
import { ScreenHeader } from '@/components/editorial/screen-header';
import { Colors, Fonts } from '@/constants/theme';
import { parseAmount } from '@/lib/amount';
import { formatCurrency, formatNumber } from '@/lib/money';
import {
  useAccountGroups,
  useAccounts,
  useDataActions,
  useGoals,
  useHoldings,
  useSettings,
} from '@/store';

const NOW = new Date();

const Stepper = memo(function Stepper({
  label,
  prevLabel,
  nextLabel,
  onPrev,
  onNext,
}: {
  label: string;
  prevLabel: string;
  nextLabel: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={prevLabel}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={styles.stepperButton}
        onPress={onPrev}>
        <Text style={styles.stepperGlyph}>‹</Text>
      </Pressable>
      <Text style={styles.stepperValue}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={nextLabel}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={styles.stepperButton}
        onPress={onNext}>
        <Text style={styles.stepperGlyph}>›</Text>
      </Pressable>
    </View>
  );
});

type LinkModel = { id: string; label: string; value: string };

const SelectableRow = memo(function SelectableRow({
  model,
  checked,
  hasBorder,
  onToggle,
}: {
  model: LinkModel;
  checked: boolean;
  hasBorder: boolean;
  onToggle: (id: string) => void;
}) {
  const handlePress = useCallback(() => onToggle(model.id), [onToggle, model.id]);
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={`${model.label}, ${model.value}`}
      accessibilityState={{ checked }}
      style={[styles.linkRow, hasBorder && styles.linkRowBorder]}
      onPress={handlePress}>
      <View style={[styles.checkbox, checked && styles.checkboxOn]}>
        {checked ? <Text style={styles.checkmark}>✓</Text> : null}
      </View>
      <Text style={styles.linkLabel}>{model.label}</Text>
      <Text style={styles.linkValue}>{model.value}</Text>
    </Pressable>
  );
});

export default function GoalEditorScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const goals = useGoals();
  const holdings = useHoldings();
  const accounts = useAccounts();
  const accountGroups = useAccountGroups();
  const { baseCurrency } = useSettings();
  const { addGoal, updateGoal, deleteGoal } = useDataActions();

  const existing = useMemo(() => goals.find((goal) => goal.id === id), [goals, id]);

  const [name, setName] = useState(existing?.name ?? '');
  const [target, setTarget] = useState(existing ? String(existing.target) : '');
  const [monthly, setMonthly] = useState(
    existing && existing.monthlyContribution > 0 ? String(existing.monthlyContribution) : '',
  );
  const [hasDate, setHasDate] = useState(existing?.targetDate != null);
  const [month, setMonth] = useState(
    existing?.targetDate ? Number(existing.targetDate.split('-')[1]) - 1 : NOW.getMonth(),
  );
  const [year, setYear] = useState(
    existing?.targetDate ? Number(existing.targetDate.split('-')[0]) : NOW.getFullYear() + 1,
  );
  const [linkedHoldingIds, setLinkedHoldingIds] = useState<string[]>(
    existing?.linkedHoldingIds ?? [],
  );
  const [linkedAccountIds, setLinkedAccountIds] = useState<string[]>(
    existing?.linkedAccountIds ?? [],
  );

  const money0 = useCallback(
    (value: number) =>
      formatCurrency(value, baseCurrency, {
        locale: 'en',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    [baseCurrency],
  );

  const holdingModels = useMemo<LinkModel[]>(
    () =>
      holdings.map((holding) => ({
        id: holding.id,
        label: holding.instrument?.name ?? holding.name ?? holding.instrument?.symbol ?? holding.id,
        value: money0(holding.value),
      })),
    [holdings, money0],
  );
  const accountModels = useMemo<LinkModel[]>(() => {
    const valueById = new Map(accountGroups.map((group) => [group.account.id, group.value]));
    return accounts.map((account) => ({
      id: account.id,
      label: account.name,
      value: money0(valueById.get(account.id) ?? 0),
    }));
  }, [accounts, accountGroups, money0]);

  const savedAmount = useMemo(() => {
    const holdingValue = new Map(holdings.map((holding) => [holding.id, holding.value]));
    const accountValue = new Map(accountGroups.map((group) => [group.account.id, group.value]));
    const fromHoldings = linkedHoldingIds.reduce(
      (sum, holdingId) => sum + (holdingValue.get(holdingId) ?? 0),
      0,
    );
    const fromAccounts = linkedAccountIds.reduce(
      (sum, accountId) => sum + (accountValue.get(accountId) ?? 0),
      0,
    );
    return fromHoldings + fromAccounts;
  }, [holdings, accountGroups, linkedHoldingIds, linkedAccountIds]);

  const targetValue = parseAmount(target);
  const canSave = name.trim().length > 0 && targetValue != null && targetValue > 0;
  const fundedPercent =
    targetValue != null && targetValue > 0
      ? Math.max(0, Math.min(100, Math.round((savedAmount / targetValue) * 100)))
      : 0;

  const goBack = useCallback(() => router.back(), []);
  const toggleHolding = useCallback((holdingId: string) => {
    setLinkedHoldingIds((prev) =>
      prev.includes(holdingId) ? prev.filter((item) => item !== holdingId) : [...prev, holdingId],
    );
  }, []);
  const toggleAccount = useCallback((accountId: string) => {
    setLinkedAccountIds((prev) =>
      prev.includes(accountId) ? prev.filter((item) => item !== accountId) : [...prev, accountId],
    );
  }, []);
  const toggleDate = useCallback(() => setHasDate((prev) => !prev), []);
  const prevMonth = useCallback(() => setMonth((prev) => (prev + 11) % 12), []);
  const nextMonth = useCallback(() => setMonth((prev) => (prev + 1) % 12), []);
  const prevYear = useCallback(() => setYear((prev) => Math.max(1970, prev - 1)), []);
  const nextYear = useCallback(() => setYear((prev) => prev + 1), []);

  const onSave = useCallback(() => {
    const parsedTarget = parseAmount(target);
    if (name.trim().length === 0 || parsedTarget == null || parsedTarget <= 0) return;
    const monthlyValue = parseAmount(monthly) ?? 0;
    const targetDate = hasDate ? `${year}-${String(month + 1).padStart(2, '0')}-01` : null;
    const payload = {
      name: name.trim(),
      target: parsedTarget,
      savedAmount,
      monthlyContribution: Math.max(0, monthlyValue),
      targetDate,
      linkedHoldingIds,
      linkedAccountIds,
    };
    if (existing) {
      void updateGoal({ id: existing.id, ...payload });
    } else {
      void addGoal(payload);
    }
    router.back();
  }, [
    name,
    target,
    monthly,
    hasDate,
    year,
    month,
    savedAmount,
    linkedHoldingIds,
    linkedAccountIds,
    existing,
    updateGoal,
    addGoal,
  ]);

  const onDelete = useCallback(() => {
    if (!existing) return;
    Alert.alert('Delete goal', `${existing.name} will be removed. This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deleteGoal(existing.id);
          router.back();
        },
      },
    ]);
  }, [existing, deleteGoal]);

  const deleteAction = existing ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Delete goal ${existing.name}`}
      hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
      onPress={onDelete}>
      <Text style={styles.delete}>Delete</Text>
    </Pressable>
  ) : undefined;

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScreenHeader onBack={goBack} trailing={deleteAction} />
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.heading}>{existing ? 'Edit goal' : 'New goal'}</Text>

          <View style={styles.field}>
            <Caption>Name</Caption>
            <TextInput
              accessibilityLabel="Goal name"
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="What are you saving toward?"
              placeholderTextColor={Colors.slate}
              cursorColor={Colors.brass}
              selectionColor={Colors.brass}
            />
          </View>

          <View style={styles.pair}>
            <View style={styles.pairColumn}>
              <Caption>Target</Caption>
              <TextInput
                accessibilityLabel="Target amount"
                style={styles.numberInput}
                value={target}
                onChangeText={setTarget}
                placeholder={money0(0)}
                placeholderTextColor={Colors.slate}
                keyboardType="decimal-pad"
                cursorColor={Colors.brass}
                selectionColor={Colors.brass}
              />
            </View>
            <View style={styles.pairColumn}>
              <Caption>Monthly</Caption>
              <TextInput
                accessibilityLabel="Monthly contribution"
                style={styles.numberInput}
                value={monthly}
                onChangeText={setMonthly}
                placeholder={money0(0)}
                placeholderTextColor={Colors.slate}
                keyboardType="decimal-pad"
                cursorColor={Colors.brass}
                selectionColor={Colors.brass}
              />
            </View>
          </View>

          <View style={styles.dateSection}>
            <Pressable
              accessibilityRole="switch"
              accessibilityLabel="Set a target date"
              accessibilityState={{ checked: hasDate }}
              style={styles.dateToggleRow}
              onPress={toggleDate}>
              <Text style={styles.rowLabel}>Target date</Text>
              <View style={[styles.toggleTrack, hasDate && styles.toggleTrackOn]}>
                <View
                  style={[
                    styles.toggleKnob,
                    hasDate ? styles.toggleKnobOn : styles.toggleKnobOff,
                  ]}
                />
              </View>
            </Pressable>
            {hasDate ? (
              <View style={styles.steppers}>
                <Stepper
                  label={MONTH_ABBREV[month]}
                  prevLabel="Previous month"
                  nextLabel="Next month"
                  onPrev={prevMonth}
                  onNext={nextMonth}
                />
                <Stepper
                  label={formatNumber(year)}
                  prevLabel="Previous year"
                  nextLabel="Next year"
                  onPrev={prevYear}
                  onNext={nextYear}
                />
              </View>
            ) : null}
          </View>

          <View style={styles.fundedHeading}>
            <Caption>Funded by</Caption>
          </View>
          <Text style={styles.fundedSummary}>
            {money0(savedAmount)}
            {targetValue != null && targetValue > 0 ? (
              <Text style={styles.slate}> · {formatNumber(fundedPercent)}% of target</Text>
            ) : null}
          </Text>

          {holdingModels.length > 0 ? (
            <View style={styles.linkGroup}>
              <Caption style={styles.linkGroupCaption}>Holdings</Caption>
              {holdingModels.map((model, index) => (
                <SelectableRow
                  key={model.id}
                  model={model}
                  checked={linkedHoldingIds.includes(model.id)}
                  hasBorder={index > 0}
                  onToggle={toggleHolding}
                />
              ))}
            </View>
          ) : null}

          {accountModels.length > 0 ? (
            <View style={styles.linkGroup}>
              <Caption style={styles.linkGroupCaption}>Accounts</Caption>
              {accountModels.map((model, index) => (
                <SelectableRow
                  key={model.id}
                  model={model}
                  checked={linkedAccountIds.includes(model.id)}
                  hasBorder={index > 0}
                  onToggle={toggleAccount}
                />
              ))}
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={existing ? 'Save goal' : 'Create goal'}
            accessibilityState={{ disabled: !canSave }}
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            onPress={onSave}>
            <Text style={styles.saveLabel}>{existing ? 'Save' : 'Create goal'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.ink,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    paddingTop: 8,
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  heading: {
    fontFamily: Fonts.newsreaderLight32,
    fontSize: 32,
    lineHeight: 38,
    color: Colors.bone,
    marginTop: 8,
    textAlign: 'auto',
  },
  field: {
    marginTop: 32,
  },
  textInput: {
    fontFamily: Fonts.newsreader20,
    fontSize: 20,
    lineHeight: 28,
    color: Colors.bone,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
    marginTop: 8,
    textAlign: 'auto',
  },
  pair: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 28,
  },
  pairColumn: {
    flex: 1,
  },
  numberInput: {
    fontFamily: Fonts.newsreaderLight32,
    fontSize: 28,
    lineHeight: 36,
    color: Colors.bone,
    fontVariant: ['tabular-nums'],
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
    marginTop: 8,
    textAlign: 'auto',
  },
  dateSection: {
    marginTop: 28,
  },
  dateToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  rowLabel: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    color: Colors.bone,
    textAlign: 'auto',
  },
  toggleTrack: {
    width: 46,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.hairline,
    padding: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  toggleTrackOn: {
    borderColor: Colors.brass,
    justifyContent: 'flex-end',
  },
  toggleKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  toggleKnobOn: {
    backgroundColor: Colors.brass,
  },
  toggleKnobOff: {
    backgroundColor: Colors.slate,
  },
  steppers: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  stepper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 48,
  },
  stepperButton: {
    width: 32,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperGlyph: {
    fontFamily: Fonts.manrope,
    fontSize: 22,
    color: Colors.brass,
  },
  stepperValue: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    color: Colors.bone,
    fontVariant: ['tabular-nums'],
  },
  fundedHeading: {
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    paddingTop: 16,
  },
  fundedSummary: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.bone,
    fontVariant: ['tabular-nums'],
    marginTop: 8,
    textAlign: 'auto',
  },
  slate: {
    color: Colors.slate,
  },
  linkGroup: {
    marginTop: 20,
  },
  linkGroupCaption: {
    marginBottom: 4,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 48,
  },
  linkRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.slate,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    borderColor: Colors.brass,
    backgroundColor: Colors.brass,
  },
  checkmark: {
    fontFamily: Fonts.manropeSemiBold,
    fontSize: 12,
    color: Colors.ink,
  },
  linkLabel: {
    flex: 1,
    fontFamily: Fonts.manrope,
    fontSize: 15,
    color: Colors.bone,
    textAlign: 'auto',
  },
  linkValue: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    color: Colors.ash,
    fontVariant: ['tabular-nums'],
    textAlign: 'auto',
  },
  saveButton: {
    height: 52,
    backgroundColor: Colors.brass,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.disabled,
  },
  saveLabel: {
    fontFamily: Fonts.manropeSemiBold,
    fontSize: 15,
    color: Colors.ink,
  },
  delete: {
    fontFamily: Fonts.manrope,
    fontSize: 13,
    color: Colors.destructive,
  },
});
