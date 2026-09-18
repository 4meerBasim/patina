import { ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Glass } from '@/components/native/glass';
import { Colors } from '@/constants/theme';

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

        <GoalCard
          percent="58%"
          dashLength={131}
          title="Second home, Lisbon"
          current="$348,000 of $600,000"
          status="Ahead · projected Feb 2028"
          statusColor={Colors.verdigris}
          style={styles.firstCard}
        />
        <GoalCard
          percent="31%"
          dashLength={70}
          title="Children's education"
          current="$62,000 of $200,000"
          status="Behind · add $210/mo to be on pace"
          statusColor={Colors.copper}
          style={styles.nextCard}
        />
        <GoalCard
          percent="86%"
          dashLength={194}
          title="12 months of expenses"
          current="$77,096 of $90,000"
          status="On pace · no date"
          statusColor={Colors.stone}
          style={styles.nextCard}
        />
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
