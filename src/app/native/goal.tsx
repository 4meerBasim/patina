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
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { CheckRow } from '@/components/native/check-row';
import { FieldRow } from '@/components/native/field-row';
import { GroupedCard, RowSeparator } from '@/components/native/grouped-list';
import { Switch } from '@/components/native/switch';
import { Colors } from '@/constants/theme';
import { parseAmount } from '@/lib/amount';
import { formatCurrency } from '@/lib/money';
import { useAccountGroups, useDataActions, useGoals, useHoldings, useSettings } from '@/store';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
const TODAY = new Date();
const CURRENT_YEAR = TODAY.getFullYear();

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

const Chevron = memo(function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <Svg width={9} height={16} viewBox="0 0 9 16" fill="none">
      <Path
        d={direction === 'left' ? 'M7 2L2 8l5 6' : 'M2 2l5 6-5 6'}
        stroke={Colors.brass}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
});

const StepperRow = memo(function StepperRow({
  label,
  value,
  onDecrement,
  onIncrement,
  decrementLabel,
  incrementLabel,
  hasSeparator,
}: {
  label: string;
  value: string;
  onDecrement: () => void;
  onIncrement: () => void;
  decrementLabel: string;
  incrementLabel: string;
  hasSeparator: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={decrementLabel}
          hitSlop={8}
          style={styles.stepButton}
          onPress={onDecrement}>
          <Chevron direction="left" />
        </Pressable>
        <Text style={styles.stepValue}>{value}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={incrementLabel}
          hitSlop={8}
          style={styles.stepButton}
          onPress={onIncrement}>
          <Chevron direction="right" />
        </Pressable>
      </View>
      {hasSeparator ? <RowSeparator inset={16} /> : null}
    </View>
  );
});

export default function NativeGoalEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const goals = useGoals();
  const holdings = useHoldings();
  const accountGroups = useAccountGroups();
  const settings = useSettings();
  const { addGoal, updateGoal, deleteGoal } = useDataActions();

  const baseCurrency = settings.baseCurrency;
  const existing = useMemo(() => goals.find((goal) => goal.id === id) ?? null, [goals, id]);

  const [name, setName] = useState(existing?.name ?? '');
  const [target, setTarget] = useState(existing && existing.target > 0 ? String(existing.target) : '');
  const [monthly, setMonthly] = useState(
    existing && existing.monthlyContribution > 0 ? String(existing.monthlyContribution) : '',
  );
  const [hasDate, setHasDate] = useState(existing?.targetDate != null);
  const [month, setMonth] = useState(
    existing?.targetDate ? Number(existing.targetDate.slice(5, 7)) - 1 : TODAY.getMonth(),
  );
  const [year, setYear] = useState(
    existing?.targetDate ? Number(existing.targetDate.slice(0, 4)) : CURRENT_YEAR + 1,
  );
  const [linkedHoldingIds, setLinkedHoldingIds] = useState<string[]>(
    existing?.linkedHoldingIds ?? [],
  );
  const [linkedAccountIds, setLinkedAccountIds] = useState<string[]>(
    existing?.linkedAccountIds ?? [],
  );

  const holdingOptions = useMemo(
    () =>
      holdings.map((holding) => ({
        id: holding.id,
        label: holding.instrument?.name ?? holding.name ?? holding.instrument?.symbol ?? 'Holding',
        sub: formatCurrency(holding.value, baseCurrency),
      })),
    [holdings, baseCurrency],
  );
  const accountOptions = useMemo(
    () =>
      accountGroups.map((group) => ({
        id: group.account.id,
        label: group.account.institution ?? group.account.name,
        sub: formatCurrency(group.value, baseCurrency),
      })),
    [accountGroups, baseCurrency],
  );

  const canSave = name.trim() !== '' && (parseAmount(target) ?? 0) > 0;

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

  const decrementMonth = useCallback(() => {
    setMonth((prev) => {
      if (prev === 0) {
        setYear((current) => Math.max(CURRENT_YEAR, current - 1));
        return 11;
      }
      return prev - 1;
    });
  }, []);
  const incrementMonth = useCallback(() => {
    setMonth((prev) => {
      if (prev === 11) {
        setYear((current) => current + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);
  const decrementYear = useCallback(() => setYear((prev) => Math.max(CURRENT_YEAR, prev - 1)), []);
  const incrementYear = useCallback(() => setYear((prev) => prev + 1), []);

  const onSave = useCallback(async () => {
    const trimmed = name.trim();
    const targetValue = parseAmount(target) ?? 0;
    if (trimmed === '' || targetValue <= 0) return;
    const monthlyValue = Math.max(parseAmount(monthly) ?? 0, 0);
    const targetDate = hasDate ? `${year}-${pad2(month + 1)}-01` : null;
    if (existing) {
      await updateGoal({
        ...existing,
        name: trimmed,
        target: targetValue,
        monthlyContribution: monthlyValue,
        targetDate,
        linkedHoldingIds,
        linkedAccountIds,
      });
    } else {
      await addGoal({
        name: trimmed,
        target: targetValue,
        savedAmount: 0,
        monthlyContribution: monthlyValue,
        targetDate,
        linkedHoldingIds,
        linkedAccountIds,
      });
    }
    router.back();
  }, [
    name,
    target,
    monthly,
    hasDate,
    year,
    month,
    existing,
    linkedHoldingIds,
    linkedAccountIds,
    addGoal,
    updateGoal,
  ]);

  const onDelete = useCallback(() => {
    if (!existing) return;
    Alert.alert('Delete goal', `Delete “${existing.name}”? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteGoal(existing.id);
          router.back();
        },
      },
    ]);
  }, [existing, deleteGoal]);

  const amountPlaceholder = formatCurrency(0, baseCurrency);

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <View style={styles.nav}>
          <Pressable accessibilityRole="button" hitSlop={12} onPress={() => router.back()}>
            <Text style={styles.navAction}>Cancel</Text>
          </Pressable>
          <Text style={styles.navTitle}>{existing ? 'Edit Goal' : 'New Goal'}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save goal"
            accessibilityState={{ disabled: !canSave }}
            hitSlop={12}
            disabled={!canSave}
            onPress={onSave}>
            <Text style={[styles.navAction, !canSave && styles.navActionDisabled]}>Save</Text>
          </Pressable>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}>
          <GroupedCard>
            <FieldRow
              label="Name"
              value={name}
              onChangeText={setName}
              accessibilityLabel="Goal name"
              placeholder="House deposit"
              autoFocus={!existing}
              autoCapitalize="words"
              hasSeparator
            />
            <FieldRow
              label="Target"
              value={target}
              onChangeText={setTarget}
              accessibilityLabel="Target amount"
              placeholder={amountPlaceholder}
              keyboardType="decimal-pad"
              hasSeparator
            />
            <FieldRow
              label="Monthly"
              value={monthly}
              onChangeText={setMonthly}
              accessibilityLabel="Monthly contribution"
              placeholder={amountPlaceholder}
              keyboardType="decimal-pad"
              hasSeparator={false}
            />
          </GroupedCard>

          <GroupedCard style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Target date</Text>
              <Switch
                value={hasDate}
                onValueChange={setHasDate}
                accessibilityLabel="Set a target date"
              />
              {hasDate ? <RowSeparator inset={16} /> : null}
            </View>
            {hasDate ? (
              <>
                <StepperRow
                  label="Month"
                  value={MONTHS[month]}
                  onDecrement={decrementMonth}
                  onIncrement={incrementMonth}
                  decrementLabel="Previous month"
                  incrementLabel="Next month"
                  hasSeparator
                />
                <StepperRow
                  label="Year"
                  value={String(year)}
                  onDecrement={decrementYear}
                  onIncrement={incrementYear}
                  decrementLabel="Previous year"
                  incrementLabel="Next year"
                  hasSeparator={false}
                />
              </>
            ) : null}
          </GroupedCard>

          {holdingOptions.length > 0 ? (
            <>
              <Text style={styles.sectionHeader}>Linked holdings</Text>
              <GroupedCard>
                {holdingOptions.map((option, index) => (
                  <CheckRow
                    key={option.id}
                    id={option.id}
                    label={option.label}
                    sub={option.sub}
                    selected={linkedHoldingIds.includes(option.id)}
                    onToggle={toggleHolding}
                    hasSeparator={index < holdingOptions.length - 1}
                  />
                ))}
              </GroupedCard>
            </>
          ) : null}

          {accountOptions.length > 0 ? (
            <>
              <Text style={styles.sectionHeader}>Linked accounts</Text>
              <GroupedCard>
                {accountOptions.map((option, index) => (
                  <CheckRow
                    key={option.id}
                    id={option.id}
                    label={option.label}
                    sub={option.sub}
                    selected={linkedAccountIds.includes(option.id)}
                    onToggle={toggleAccount}
                    hasSeparator={index < accountOptions.length - 1}
                  />
                ))}
              </GroupedCard>
            </>
          ) : null}

          {existing ? (
            <GroupedCard style={styles.card}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete goal"
                style={styles.deleteRow}
                onPress={onDelete}>
                <Text style={styles.deleteText}>Delete goal</Text>
              </Pressable>
            </GroupedCard>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.ink,
  },
  flex: {
    flex: 1,
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  navAction: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.brass,
  },
  navActionDisabled: {
    color: Colors.disabled,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.bone,
  },
  content: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  card: {
    marginTop: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowLabel: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.bone,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    minWidth: 56,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    color: Colors.bone,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
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
  deleteRow: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  deleteText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.destructive,
  },
});
