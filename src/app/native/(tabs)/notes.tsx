import { memo, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { GroupedCard, RowSeparator } from '@/components/native/grouped-list';
import { Colors } from '@/constants/theme';
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

const MONTHS = [
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
  return `${Number(day)} ${MONTHS[Number(month) - 1]}`;
}

const NoteRow = memo(function NoteRow({ note, hasSeparator }: { note: Note; hasSeparator: boolean }) {
  return (
    <View style={styles.noteRow}>
      <View style={styles.noteHeader}>
        <Text style={styles.kind}>
          {note.read ? null : <Text style={styles.unread}>• </Text>}
          {KIND_LABEL[note.kind]}
        </Text>
        <Text style={styles.date}>{dayMonth(note.createdAt)}</Text>
      </View>
      <Text style={note.read ? styles.bodyRead : styles.body}>{note.body}</Text>
      {note.detail ? <Text style={styles.detail}>{note.detail}</Text> : null}
      {hasSeparator ? <RowSeparator inset={16} /> : null}
    </View>
  );
});

export default function NativeNotes() {
  const notes = useNotes();
  const { regenerateInsights } = useDataActions();

  useEffect(() => {
    void regenerateInsights();
  }, [regenerateInsights]);

  const unread = notes.filter((note) => !note.read).length;

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.largeTitle}>Notes</Text>
        </View>
        <Text style={styles.subtitle}>
          {notes.length === 0
            ? 'Nothing to report'
            : `${formatNumber(unread)} unread of ${formatNumber(notes.length)}`}
        </Text>

        {notes.length === 0 ? (
          <GroupedCard style={styles.card}>
            <View style={styles.noteRow}>
              <Text style={styles.body}>No notes yet.</Text>
              <Text style={styles.detail}>They arrive as your portfolio shifts.</Text>
            </View>
          </GroupedCard>
        ) : (
          <GroupedCard style={styles.card}>
            {notes.map((note, index) => (
              <NoteRow key={note.id} note={note} hasSeparator={index < notes.length - 1} />
            ))}
          </GroupedCard>
        )}
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
  subtitle: {
    fontSize: 15,
    lineHeight: 20,
    color: Colors.ash,
    marginTop: 2,
    marginBottom: 16,
  },
  card: {
    marginTop: 0,
  },
  noteRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kind: {
    fontSize: 13,
    lineHeight: 18,
    textTransform: 'uppercase',
    color: Colors.slate,
  },
  unread: {
    color: Colors.brass,
  },
  date: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.slate,
  },
  body: {
    fontSize: 17,
    lineHeight: 24,
    color: Colors.bone,
  },
  bodyRead: {
    fontSize: 17,
    lineHeight: 24,
    color: Colors.ash,
  },
  detail: {
    fontSize: 15,
    lineHeight: 21,
    color: Colors.slate,
  },
});
