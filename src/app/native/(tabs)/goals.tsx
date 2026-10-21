import { ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Glass } from '@/components/native/glass';
import { Colors } from '@/constants/theme';
import { formatCurrency, formatPercent } from '@/lib/money';
import { useGoalProgress, useSettings, type GoalPace, type GoalProgress } from '@/store';

const RING_CIRCUMFERENCE = 226;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

const PACE_WORD: Record<GoalPace, string> = {
  ahead: 'Ahead',
  behind: 'Behind',
  'on-pace': 'On pace',
};

const PACE_COLOR: Record<GoalPace, string> = {
  ahead: Colors.verdigris,
  behind: Colors.copper,
  'on-pace': Colors.stone,
};

// useGoalProgress exposes pace, projected date and remaining, but not the monthly
// shortfall the "behind" copy quotes, and money.ts has no date formatter — so this
// tail stays presentational. See the handoff report.
const BEHIND_TAIL: Record<string, string> = {
  'goal-education': ' · add $210/mo to be on pace',
};

function monthYear(iso: string): string {
  const [year, month] = iso.split('-');
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

function statusText(progress: GoalProgress): string {
  const word = PACE_WORD[progress.pace];
  if (progress.pace === 'behind') return `${word}${BEHIND_TAIL[progress.goal.id] ?? ''}`;
  if (progress.projectedDate) return `${word} · projected ${monthYear(progress.projectedDate)}`;
  return `${word} · no date`;
}

function GoalCard({
  percent,
  dashLength,
  title,
  current,
  status,
  statusColor,
  style,
}: {
  percent: string;
  dashLength: number;
  title: string;
  current: string;
  status: string;
  statusColor: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.ring}>
        <Svg width={84} height={84} viewBox="0 0 84 84">
          <Circle cx={42} cy={42} r={36} fill="none" stroke={Colors.hairline} strokeWidth={10} />
          <Circle
            cx={42}
            cy={42}
            r={36}
            fill="none"
            stroke={Colors.brass}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={`${dashLength} 226`}
            transform="rotate(-90 42 42)"
          />
        </Svg>
        <View style={styles.ringLabel}>
          <Text style={styles.ringPercent}>{percent}</Text>
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.current}>{current}</Text>
        <Text style={[styles.status, { color: statusColor }]}>{status}</Text>
      </View>
      <Svg width={8} height={14} viewBox="0 0 8 14">
        <Path
          d="M1 1l6 6-6 6"
          stroke={Colors.disabled}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

export default function NativeGoals() {
  const settings = useSettings();
  const goals = useGoalProgress();

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.largeTitle}>Goals</Text>
          <Glass radius={22} style={styles.addPill}>
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
        </View>

        {goals.map((progress, index) => (
          <GoalCard
            key={progress.goal.id}
            percent={formatPercent(progress.percent, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
            dashLength={Math.round((progress.percent / 100) * RING_CIRCUMFERENCE)}
            title={progress.goal.name}
            current={`${formatCurrency(progress.goal.savedAmount, settings.baseCurrency)} of ${formatCurrency(progress.goal.target, settings.baseCurrency)}`}
            status={statusText(progress)}
            statusColor={PACE_COLOR[progress.pace]}
            style={index === 0 ? styles.firstCard : styles.nextCard}
          />
        ))}
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
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: Colors.bone,
  },
  addPill: {
    width: 45,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    width: 84,
    height: 84,
  },
  ringLabel: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPercent: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.bone,
  },
  card: {
    backgroundColor: Colors.surface1,
    borderRadius: 26,
    padding: 20,
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
  },
  firstCard: {
    marginTop: 20,
  },
  nextCard: {
    marginTop: 12,
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    color: Colors.bone,
  },
  current: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
    color: Colors.ash,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  status: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    marginTop: 6,
  },
});
