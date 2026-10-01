import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Caption } from '@/components/editorial/caption';
import { Colors, Fonts } from '@/constants/theme';
import { formatCurrency, formatNumber } from '@/lib/money';
import { useGoalProgress, useSettings } from '@/store';

export default function GoalsScreen() {
  const goals = useGoalProgress();
  const { baseCurrency } = useSettings();

  const money = (value: number) =>
    formatCurrency(value, baseCurrency, {
      locale: 'en',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  const lisbon = goals[0];
  const education = goals[1];
  const expenses = goals[2];
  const pct = (percent: number) => `${formatNumber(Math.round(percent))}%`;
  const width = (percent: number): `${number}%` => `${Math.round(percent)}%`;

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Caption>Goals · {formatNumber(goals.length)}</Caption>

        <View>
          <Text style={styles.title}>{lisbon.goal.name}</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: width(lisbon.percent) }]} />
            <View style={styles.marker} />
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amount}>
              {money(lisbon.goal.savedAmount)}{' '}
              <Text style={styles.slate}>of {money(lisbon.goal.target)}</Text>
            </Text>
            <Text style={styles.amount}>{pct(lisbon.percent)}</Text>
          </View>
          <Text style={styles.detail}>
            Target Jun 2028 · projected <Text style={styles.verdigris}>Feb 2028, ahead</Text>
          </Text>
          <Text style={styles.subDetail}>Funded by Savings, VTI</Text>
        </View>

        <View>
          <Text style={styles.title}>{education.goal.name}</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: width(education.percent) }]} />
            <View style={styles.marker} />
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amount}>
              {money(education.goal.savedAmount)}{' '}
              <Text style={styles.slate}>of {money(education.goal.target)}</Text>
            </Text>
            <Text style={styles.amount}>{pct(education.percent)}</Text>
          </View>
          <Text style={styles.detail}>
            Target Sep 2034 · projected <Text style={styles.copper}>Mar 2036, behind</Text>
          </Text>
          <Text style={styles.subDetail}>Add $210 / month to be on pace</Text>
        </View>

        <View>
          <Text style={styles.title}>{expenses.goal.name}</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: width(expenses.percent) }]} />
            <View style={styles.marker} />
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amount}>
              {money(expenses.goal.savedAmount)}{' '}
              <Text style={styles.slate}>of {money(expenses.goal.target)}</Text>
            </Text>
            <Text style={styles.amount}>{pct(expenses.percent)}</Text>
          </View>
          <Text style={styles.detail}>
            No date · <Text style={styles.stone}>on pace</Text>
          </Text>
        </View>

        <Text style={styles.newGoal}>New goal</Text>
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
  },
  track: {
    position: 'relative',
    height: 1,
    backgroundColor: Colors.hairline,
    marginTop: 16,
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: -1,
    height: 3,
    backgroundColor: Colors.bone,
  },
  marker: {
    position: 'absolute',
    right: 0,
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
  },
  subDetail: {
    fontFamily: Fonts.manrope,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.slate,
    marginTop: 4,
  },
  verdigris: {
    color: Colors.verdigris,
  },
  copper: {
    color: Colors.copper,
  },
  stone: {
    color: Colors.stone,
  },
  newGoal: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.brass,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    paddingTop: 16,
  },
});
