import { router } from 'expo-router';
import { memo, useCallback, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Caption } from '@/components/editorial/caption';
import { Colors, Fonts } from '@/constants/theme';
import type { Note, NoteKind } from '@/data/types';
import { formatNumber } from '@/lib/money';
import { useDataActions, useNotes } from '@/store';

const KIND_LABEL: Record<NoteKind, string> = {
  concentration: 'Concentration',
  drift: 'Drift',
  fees: 'Fees',
  milestone: 'Milestone',
  pace: 'Pace',
};

const MONTH_ABBREV = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function dayMonth(iso: string): string {
  const [, month, day] = iso.split('-');
  return `${Number(day)} ${MONTH_ABBREV[Number(month) - 1]}`;
}

const NoteBlock = memo(function NoteBlock({
  note,
  isFirst,
  onReviewAllocation,
}: {
  note: Note;
  isFirst: boolean;
  onReviewAllocation: () => void;
}) {
  return (
    <View style={isFirst ? undefined : styles.divided}>
      <Caption>
        {!note.read ? <Text style={styles.brass}>– </Text> : null}
        {KIND_LABEL[note.kind]} · {dayMonth(note.createdAt)}
      </Caption>
      <Text style={note.read ? styles.headlineMuted : styles.headline}>{note.body}</Text>
      {note.detail ? (
        <Text style={note.read ? styles.figuresMuted : styles.figures}>{note.detail}</Text>
      ) : null}
      {note.kind === 'concentration' ? (
        <Pressable
          accessibilityRole="button"
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          onPress={onReviewAllocation}>
          <Text style={styles.link}>Review allocation</Text>
        </Pressable>
      ) : null}
    </View>
  );
});

export default function NotesScreen() {
  const notes = useNotes();
  const { regenerateInsights } = useDataActions();

  useEffect(() => {
    void regenerateInsights();
  }, [regenerateInsights]);

  const unreadCount = notes.filter((note) => !note.read).length;
  const reviewAllocation = useCallback(() => router.push('/editorial/allocation'), []);

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Caption>Notes · {formatNumber(unreadCount)} unread</Caption>
          <Caption style={styles.brass}>Rules</Caption>
        </View>

        {notes.length === 0 ? (
          <Text style={styles.empty}>No notes yet. They arrive as your portfolio shifts.</Text>
        ) : (
          notes.map((note, index) => (
            <NoteBlock
              key={note.id}
              note={note}
              isFirst={index === 0}
              onReviewAllocation={reviewAllocation}
            />
          ))
        )}

        {notes.length > 0 ? (
          <Text style={styles.footer}>
            {formatNumber(notes.length)} {notes.length === 1 ? 'note' : 'notes'} in all
          </Text>
        ) : null}
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
  empty: {
    fontFamily: Fonts.newsreader20,
    fontSize: 20,
    lineHeight: 28,
    color: Colors.ash,
  },
  footer: {
    fontFamily: Fonts.manrope,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.slate,
    textAlign: 'center',
  },
});
