import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Caption } from '@/components/editorial/caption';
import { Colors, Fonts } from '@/constants/theme';
import { formatNumber } from '@/lib/money';
import { useNotes } from '@/store';

export default function NotesScreen() {
  const notes = useNotes();
  const unreadCount = notes.filter((note) => !note.read).length;
  const concentration = notes[0];
  const milestone = notes[1];
  const fees = notes[2];
  const drift = notes[3];

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Caption>Notes · {formatNumber(unreadCount)} unread</Caption>
          <Caption style={styles.brass}>Rules</Caption>
        </View>

        <View>
          <Caption>
            {!concentration.read ? <Text style={styles.brass}>– </Text> : null}Concentration · Today
          </Caption>
          <Text style={concentration.read ? styles.headlineMuted : styles.headline}>
            {concentration.body}
          </Text>
          {concentration.detail ? (
            <Text style={concentration.read ? styles.figuresMuted : styles.figures}>
              {concentration.detail}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.push('/editorial/allocation')}>
            <Text style={styles.link}>Review allocation</Text>
          </Pressable>
        </View>

        <View style={styles.divided}>
          <Caption>
            {!milestone.read ? <Text style={styles.brass}>– </Text> : null}Milestone · Yesterday
          </Caption>
          <Text style={milestone.read ? styles.headlineMuted : styles.headline}>
            {milestone.body}
          </Text>
          {milestone.detail ? (
            <Text style={milestone.read ? styles.figuresMuted : styles.figures}>
              {milestone.detail}
            </Text>
          ) : null}
        </View>

        <View style={styles.divided}>
          <Caption>
            {!fees.read ? <Text style={styles.brass}>– </Text> : null}Fees · 12 Sept
          </Caption>
          <Text style={fees.read ? styles.headlineMuted : styles.headline}>{fees.body}</Text>
          {fees.detail ? (
            <Text style={fees.read ? styles.figuresMuted : styles.figures}>{fees.detail}</Text>
          ) : null}
        </View>

        <View style={styles.divided}>
          <Caption>
            {!drift.read ? <Text style={styles.brass}>– </Text> : null}Drift · 3 Sept
          </Caption>
          <Text style={drift.read ? styles.headlineMuted : styles.headline}>{drift.body}</Text>
          {drift.detail ? (
            <Text style={drift.read ? styles.figuresMuted : styles.figures}>{drift.detail}</Text>
          ) : null}
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
