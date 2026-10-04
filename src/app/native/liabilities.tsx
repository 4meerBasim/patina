import { router } from 'expo-router';
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
import Animated, { Easing, SlideInDown } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { CheckRow } from '@/components/native/check-row';
import { FieldRow } from '@/components/native/field-row';
import { Glass } from '@/components/native/glass';
import { GroupedCard, RowSeparator } from '@/components/native/grouped-list';
import { SegmentedControl } from '@/components/native/segmented-control';
import { Colors } from '@/constants/theme';
import { CURRENCIES, type CurrencyCode, type Liability, type LiabilityKind } from '@/data/types';
import { parseAmount } from '@/lib/amount';
import { formatCurrency } from '@/lib/money';
import { useDataActions, useLiabilities, useSettings } from '@/store';

const KIND_ORDER: LiabilityKind[] = ['mortgage', 'loan', 'credit', 'other'];
const KIND_LABELS: Record<LiabilityKind, string> = {
  mortgage: 'Mortgage',
  loan: 'Loan',
  credit: 'Credit',
  other: 'Other',
};
const KIND_OPTIONS = KIND_ORDER.map((kind) => KIND_LABELS[kind]);
const sheetEnter = SlideInDown.duration(360).easing(Easing.bezier(0.2, 0.8, 0.2, 1));

type LiabilityFields = {
  name: string;
  kind: LiabilityKind;
  balance: number;
  currency: CurrencyCode;
};

const LiabilityRow = memo(function LiabilityRow({
  id,
  name,
  kindLabel,
  balance,
  onOpen,
  hasSeparator,
}: {
  id: string;
  name: string;
  kindLabel: string;
  balance: string;
  onOpen: (id: string) => void;
  hasSeparator: boolean;
}) {
  const onPress = useCallback(() => onOpen(id), [id, onOpen]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${kindLabel}, ${balance}`}
      style={styles.row}
      onPress={onPress}>
      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.rowSub}>{kindLabel}</Text>
      </View>
      <Text style={styles.rowValue}>{balance}</Text>
      <Svg width={8} height={14} viewBox="0 0 8 14" fill="none">
        <Path
          d="M1 1l6 6-6 6"
          stroke={Colors.disabled}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      {hasSeparator ? <RowSeparator inset={16} /> : null}
    </Pressable>
  );
});

const LiabilityEditor = memo(function LiabilityEditor({
  liability,
  baseCurrency,
  onCancel,
  onSubmit,
  onDelete,
}: {
  liability: Liability | null;
  baseCurrency: CurrencyCode;
  onCancel: () => void;
  onSubmit: (fields: LiabilityFields) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(liability?.name ?? '');
  const [kindIndex, setKindIndex] = useState(
    liability ? Math.max(KIND_ORDER.indexOf(liability.kind), 0) : 0,
  );
  const [balance, setBalance] = useState(liability ? String(liability.balance) : '');
  const [currency, setCurrency] = useState<CurrencyCode>(liability?.currency ?? baseCurrency);
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const canSave = name.trim() !== '' && (parseAmount(balance) ?? 0) > 0;

  const toggleCurrency = useCallback(() => setCurrencyOpen((open) => !open), []);
  const selectCurrency = useCallback((code: string) => {
    setCurrency(code as CurrencyCode);
    setCurrencyOpen(false);
  }, []);

  const submit = useCallback(() => {
    const trimmed = name.trim();
    const balanceValue = parseAmount(balance) ?? 0;
    if (trimmed === '' || balanceValue <= 0) return;
    onSubmit({ name: trimmed, kind: KIND_ORDER[kindIndex], balance: balanceValue, currency });
  }, [name, balance, kindIndex, currency, onSubmit]);

  return (
    <View style={styles.overlay}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss editor"
        style={styles.scrim}
        onPress={onCancel}
      />
      <Animated.View entering={sheetEnter} style={styles.sheet}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={24}
          style={styles.sheetInner}>
          <View style={styles.grabber} />
          <View style={styles.navRow}>
            <Pressable accessibilityRole="button" hitSlop={12} onPress={onCancel}>
              <Text style={styles.navAction}>Cancel</Text>
            </Pressable>
            <Text style={styles.navTitle}>{liability ? 'Edit Liability' : 'New Liability'}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save liability"
              accessibilityState={{ disabled: !canSave }}
              hitSlop={12}
              disabled={!canSave}
              onPress={submit}>
              <Text style={[styles.navAction, !canSave && styles.navActionDisabled]}>Save</Text>
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}>
            <SegmentedControl
              options={KIND_OPTIONS}
              selectedIndex={kindIndex}
              onSelect={setKindIndex}
              style={styles.segment}
            />

            <GroupedCard style={styles.editorCard}>
              <FieldRow
                label="Name"
                value={name}
                onChangeText={setName}
                accessibilityLabel="Liability name"
                placeholder="Home mortgage"
                autoFocus={!liability}
                autoCapitalize="words"
                hasSeparator
              />
              <FieldRow
                label="Balance"
                value={balance}
                onChangeText={setBalance}
                accessibilityLabel="Balance owed"
                placeholder={formatCurrency(0, currency)}
                keyboardType="decimal-pad"
                hasSeparator
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Currency"
                accessibilityState={{ expanded: currencyOpen }}
                style={styles.row}
                onPress={toggleCurrency}>
                <Text style={styles.rowLabel}>Currency</Text>
                <Text style={styles.rowValueMuted}>{currency}</Text>
                {currencyOpen ? <RowSeparator inset={16} /> : null}
              </Pressable>
              {currencyOpen
                ? CURRENCIES.map((code, index) => (
                    <CheckRow
                      key={code}
                      id={code}
                      label={code}
                      selected={code === currency}
                      onToggle={selectCurrency}
                      hasSeparator={index < CURRENCIES.length - 1}
                    />
                  ))
                : null}
            </GroupedCard>

            {liability ? (
              <GroupedCard style={styles.editorCard}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Delete liability"
                  style={styles.deleteRow}
                  onPress={onDelete}>
                  <Text style={styles.deleteText}>Delete liability</Text>
                </Pressable>
              </GroupedCard>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
});

export default function NativeLiabilities() {
  const liabilities = useLiabilities();
  const settings = useSettings();
  const { addLiability, updateLiability, deleteLiability } = useDataActions();
  const [editing, setEditing] = useState<{ id: string | null } | null>(null);

  const rows = useMemo(
    () =>
      liabilities.map((liability) => ({
        id: liability.id,
        name: liability.name,
        kindLabel: KIND_LABELS[liability.kind],
        balance: formatCurrency(liability.balance, liability.currency),
      })),
    [liabilities],
  );

  const editingLiability = useMemo(
    () => (editing?.id ? (liabilities.find((item) => item.id === editing.id) ?? null) : null),
    [editing, liabilities],
  );

  const openNew = useCallback(() => setEditing({ id: null }), []);
  const openEdit = useCallback((id: string) => setEditing({ id }), []);
  const closeEditor = useCallback(() => setEditing(null), []);

  const onSubmit = useCallback(
    async (fields: LiabilityFields) => {
      if (editing?.id) await updateLiability({ id: editing.id, ...fields });
      else await addLiability(fields);
      setEditing(null);
    },
    [editing, addLiability, updateLiability],
  );

  const onDelete = useCallback(() => {
    if (!editing?.id) return;
    const current = liabilities.find((item) => item.id === editing.id);
    if (!current) return;
    Alert.alert('Delete liability', `Delete “${current.name}”? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteLiability(current.id);
          setEditing(null);
        },
      },
    ]);
  }, [editing, liabilities, deleteLiability]);

  return (
    <View style={styles.rootScreen}>
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add liability"
            hitSlop={8}
            onPress={openNew}>
            <Glass radius={22} style={styles.pill}>
              <Svg
                width={20}
                height={20}
                viewBox="0 0 24 24"
                fill="none"
                stroke={Colors.brass}
                strokeWidth={2.2}
                strokeLinecap="round">
                <Path d="M12 5v14M5 12h14" />
              </Svg>
            </Glass>
          </Pressable>
        </View>

        <Text style={styles.largeTitle}>Liabilities</Text>

        {rows.length > 0 ? (
          <>
            <GroupedCard style={styles.listCard}>
              {rows.map((data, index) => (
                <LiabilityRow
                  key={data.id}
                  id={data.id}
                  name={data.name}
                  kindLabel={data.kindLabel}
                  balance={data.balance}
                  onOpen={openEdit}
                  hasSeparator={index < rows.length - 1}
                />
              ))}
            </GroupedCard>
            <Text style={styles.caption}>Subtracted from your net worth.</Text>
          </>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              No liabilities yet. Add a mortgage, loan, or card to track your true net worth.
            </Text>
          </View>
        )}
      </ScrollView>

      {editing ? (
        <LiabilityEditor
          key={editing.id ?? 'new'}
          liability={editingLiability}
          baseCurrency={settings.baseCurrency}
          onCancel={closeEditor}
          onSubmit={onSubmit}
          onDelete={onDelete}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  rootScreen: {
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
  listCard: {
    marginTop: 24,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: Colors.slate,
    marginTop: 8,
    marginStart: 16,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 60,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowBody: {
    flex: 1,
  },
  rowName: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.bone,
    textAlign: 'auto',
  },
  rowSub: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: Colors.slate,
    textAlign: 'auto',
  },
  rowValue: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.bone,
    fontVariant: ['tabular-nums'],
  },
  rowLabel: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.bone,
  },
  rowValueMuted: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.ash,
    fontVariant: ['tabular-nums'],
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.shadow,
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: Colors.surface2,
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sheetInner: {
    flexShrink: 1,
  },
  grabber: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.disabled,
    marginTop: 8,
    alignSelf: 'center',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
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
  segment: {
    marginTop: 8,
  },
  editorCard: {
    marginTop: 24,
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
