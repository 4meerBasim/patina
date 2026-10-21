import { router } from 'expo-router';
import { memo, useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Caption } from '@/components/editorial/caption';
import { monthAbbrevYear } from '@/components/editorial/months';
import { Colors, Fonts } from '@/constants/theme';
import { formatCurrency, formatNumber } from '@/lib/money';
import { useAccounts, useGoalProgress, useHoldings, useSettings } from '@/store';
import type { GoalPace, GoalProgress } from '@/store';

const PACE_WORD: Record<GoalPace, string> = {
  ahead: 'ahead',
  behind: 'behind',
  'on-pace': 'on pace',
};

const PACE_COLOR: Record<GoalPace, string> = {
  ahead: Colors.verdigris,
  behind: Colors.copper,
  'on-pace': Colors.stone,
};

type GoalCardModel = {
  id: string;
  name: string;
  saved: string;
  target: string;
  percentLabel: string;
  fillWidth: `${number}%`;
  detailPrefix: string;
  paceWord: string;
  paceColor: string;
  fundedBy: string | null;
};

const GoalCard = memo(function GoalCard({
  model,
  onPress,
}: {
  model: GoalCardModel;
  onPress: (id: string) => void;
}) {
  const handlePress = useCallback(() => onPress(model.id), [onPress, model.id]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${model.name}, ${model.saved} of ${model.target}, ${model.percentLabel}. Edit goal`}
      onPress={handlePress}>
      <Text style={styles.title}>{model.name}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: model.fillWidth }]} />
        <View style={styles.marker} />
      </View>
      <View style={styles.amountRow}>
        <Text style={styles.amount}>
          {model.saved} <Text style={styles.slate}>of {model.target}</Text>
        </Text>
        <Text style={styles.amount}>{model.percentLabel}</Text>
      </View>
      <Text style={styles.detail}>
        {model.detailPrefix}
        <Text style={{ color: model.paceColor }}>{model.paceWord}</Text>
      </Text>
      {model.fundedBy ? <Text style={styles.subDetail}>Funded by {model.fundedBy}</Text> : null}
    </Pressable>
  );
});

export default function GoalsScreen() {
  const goals = useGoalProgress();
  const holdings = useHoldings();
  const accounts = useAccounts();
  const { baseCurrency } = useSettings();

  const models = useMemo<GoalCardModel[]>(() => {
    const money = (value: number) =>
      formatCurrency(value, baseCurrency, {
        locale: 'en',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    const holdingName = (id: string) => {
      const holding = holdings.find((item) => item.id === id);
      return holding?.instrument?.symbol ?? holding?.name ?? null;
    };
    const accountName = (id: string) => accounts.find((item) => item.id === id)?.name ?? null;

    const toModel = (progress: GoalProgress): GoalCardModel => {
      const { goal, percent, pace, projectedDate } = progress;
      const clamped = Math.max(0, Math.min(100, Math.round(percent)));
      const funded = [
        ...goal.linkedHoldingIds.map(holdingName),
        ...goal.linkedAccountIds.map(accountName),
      ].filter((name): name is string => name !== null);
      const detailPrefix = goal.targetDate
        ? `Target ${monthAbbrevYear(goal.targetDate)} · projected ${
            projectedDate ? monthAbbrevYear(projectedDate) : '—'
          }, `
        : 'No date · ';
      return {
        id: goal.id,
        name: goal.name,
        saved: money(goal.savedAmount),
        target: money(goal.target),
        percentLabel: `${formatNumber(clamped)}%`,
        fillWidth: `${clamped}%`,
        detailPrefix,
        paceWord: PACE_WORD[pace],
        paceColor: PACE_COLOR[pace],
        fundedBy: funded.length > 0 ? funded.join(', ') : null,
      };
    };

    return goals.map(toModel);
  }, [goals, holdings, accounts, baseCurrency]);

  const openGoal = useCallback(
    (id: string) => router.push({ pathname: '/editorial/goal', params: { id } }),
    [],
  );
  const createGoal = useCallback(() => router.push('/editorial/goal'), []);

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Caption>Goals · {formatNumber(models.length)}</Caption>

        {models.length > 0 ? (
          models.map((model) => <GoalCard key={model.id} model={model} onPress={openGoal} />)
        ) : (
          <Text style={styles.empty}>
            No goals yet. Name something you are saving toward and watch it fill.
          </Text>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="New goal"
          hitSlop={{ top: 12, bottom: 12 }}
          onPress={createGoal}>
          <Text style={styles.newGoal}>New goal</Text>
        </Pressable>
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
    gap: 36,
  },
  title: {
    fontFamily: Fonts.newsreader24,
    fontSize: 24,
    lineHeight: 30,
    color: Colors.bone,
    textAlign: 'auto',
  },
  track: {
    position: 'relative',
    height: 1,
    backgroundColor: Colors.hairline,
    marginTop: 16,
  },
  fill: {
    position: 'absolute',
    start: 0,
    top: -1,
    height: 3,
    backgroundColor: Colors.bone,
  },
  marker: {
    position: 'absolute',
    end: 0,
    top: -6,
    width: 1,
    height: 13,
    backgroundColor: Colors.brass,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  amount: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.bone,
    fontVariant: ['tabular-nums'],
    textAlign: 'auto',
  },
  slate: {
    color: Colors.slate,
  },
  detail: {
    fontFamily: Fonts.manrope,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.ash,
    marginTop: 6,
    textAlign: 'auto',
  },
  subDetail: {
    fontFamily: Fonts.manrope,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.slate,
    marginTop: 4,
    textAlign: 'auto',
  },
  empty: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.slate,
    textAlign: 'auto',
  },
  newGoal: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.brass,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    paddingTop: 16,
    textAlign: 'auto',
  },
});
