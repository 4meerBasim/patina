import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Caption } from '@/components/editorial/caption';
import { Colors, Fonts } from '@/constants/theme';

export default function NotesScreen() {
  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Caption>Notes · 2 unread</Caption>
          <Caption style={styles.brass}>Rules</Caption>
        </View>

        <View>
          <Caption>
            <Text style={styles.brass}>–</Text> Concentration · Today
          </Caption>
          <Text style={styles.headline}>
            Crypto moved 62% of today&apos;s change while holding 9% of the total.
          </Text>
          <Text style={styles.figures}>Bitcoin −2.4% · Ether −1.9%</Text>
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.push('/editorial/allocation')}>
            <Text style={styles.link}>Review allocation</Text>
          </Pressable>
        </View>

        <View style={styles.divided}>
          <Caption>
            <Text style={styles.brass}>–</Text> Milestone · Yesterday
          </Caption>
          <Text style={styles.headline}>Your Lisbon goal passed the halfway mark.</Text>
          <Text style={styles.figures}>$348,000 of $600,000 · four months early</Text>
        </View>

        <View style={styles.divided}>
          <Caption>Fees · 12 Sept</Caption>
          <Text style={styles.headlineMuted}>
            One fund costs 0.72% a year; a comparable index fund costs 0.03%.
          </Text>
          <Text style={styles.figuresMuted}>About $612 a year on $84,900</Text>
        </View>

        <View style={styles.divided}>
          <Caption>Drift · 3 Sept</Caption>
          <Text style={styles.headlineMuted}>
            Stocks are six points above target; property four below.
          </Text>
        </View>

        <Text style={styles.footer}>August · 3 notes</Text>
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
    gap: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  brass: {
    color: Colors.brass,
  },
  divided: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    paddingTop: 24,
  },
  headline: {
    fontFamily: Fonts.newsreader22,
    fontSize: 22,
    lineHeight: 28,
    color: Colors.bone,
    marginTop: 10,
  },
  headlineMuted: {
    fontFamily: Fonts.newsreader22,
    fontSize: 22,
    lineHeight: 28,
    color: Colors.ash,
    marginTop: 10,
  },
  figures: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.ash,
    marginTop: 10,
    fontVariant: ['tabular-nums'],
  },
  figuresMuted: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.slate,
    marginTop: 10,
    fontVariant: ['tabular-nums'],
  },
  link: {
    fontFamily: Fonts.manrope,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.brass,
    marginTop: 12,
  },
  footer: {
    fontFamily: Fonts.manrope,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.slate,
    textAlign: 'center',
  },
});
