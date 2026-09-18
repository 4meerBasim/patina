import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Caption } from '@/components/editorial/caption';
import { Colors, Fonts } from '@/constants/theme';

export default function GoalsScreen() {
  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Caption>Goals · 3</Caption>

        <View>
          <Text style={styles.title}>Second home, Lisbon</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: '58%' }]} />
            <View style={styles.marker} />
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amount}>
              $348,000 <Text style={styles.slate}>of $600,000</Text>
            </Text>
            <Text style={styles.amount}>58%</Text>
          </View>
          <Text style={styles.detail}>
            Target Jun 2028 · projected <Text style={styles.verdigris}>Feb 2028, ahead</Text>
          </Text>
          <Text style={styles.subDetail}>Funded by Savings, VTI</Text>
        </View>

        <View>
          <Text style={styles.title}>Children&apos;s education</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: '31%' }]} />
            <View style={styles.marker} />
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amount}>
              $62,000 <Text style={styles.slate}>of $200,000</Text>
            </Text>
            <Text style={styles.amount}>31%</Text>
          </View>
          <Text style={styles.detail}>
            Target Sep 2034 · projected <Text style={styles.copper}>Mar 2036, behind</Text>
          </Text>
          <Text style={styles.subDetail}>Add $210 / month to be on pace</Text>
        </View>

        <View>
          <Text style={styles.title}>Twelve months of expenses</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: '86%' }]} />
            <View style={styles.marker} />
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amount}>
              $77,096 <Text style={styles.slate}>of $90,000</Text>
            </Text>
            <Text style={styles.amount}>86%</Text>
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
