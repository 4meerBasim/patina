import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Caption } from '@/components/editorial/caption';
import { Monogram } from '@/components/editorial/monogram';
import { Colors, Fonts } from '@/constants/theme';

type Institution = { label: string; name: string; status: string; isLinked?: boolean };
type Group = { caption: string; marginTop: number; rows: Institution[] };

const groups: Group[] = [
  {
    caption: 'Brokerages',
    marginTop: 28,
    rows: [
      { label: 'S', name: 'Interactive Brokers', status: 'Linked · 2 accounts', isLinked: true },
      { label: 'S', name: 'Fidelity', status: 'Link' },
    ],
  },
  { caption: 'Exchanges', marginTop: 24, rows: [{ label: 'C', name: 'Coinbase', status: 'Link' }] },
  { caption: 'Banks', marginTop: 24, rows: [{ label: '$', name: 'Chase', status: 'Link' }] },
];

export default function LinkScreen() {
  const [query, setQuery] = useState('');
  const term = query.trim().toLowerCase();

  return (
    <View style={styles.screen}>
      <View style={styles.faded}>
        <Caption>Patina · III</Caption>
        <Text style={styles.heroTitle}>Bring in what you hold.</Text>
      </View>

      <View style={styles.sheet}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={{ top: 22, bottom: 22, left: 22, right: 22 }}
          style={styles.grabber}
          onPress={() => {
            router.dismissAll();
            router.replace('/editorial');
          }}
        />
        <Text style={styles.sheetTitle}>Link an institution</Text>

        <View style={styles.searchRow}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Circle
              cx={11}
              cy={11}
              r={7}
              stroke={Colors.slate}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
            <Path
              d="M20 20l-3.5-3.5"
              stroke={Colors.slate}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          </Svg>
          <TextInput
            accessibilityLabel="Search institutions"
            style={styles.searchInput}
            placeholder="Search brokers, banks, exchanges"
            placeholderTextColor={Colors.slate}
            value={query}
            onChangeText={setQuery}
            cursorColor={Colors.brass}
            selectionColor={Colors.brass}
          />
        </View>

        {groups.map((group) => {
          const captionMatches = group.caption.toLowerCase().includes(term);
          const rows = captionMatches
            ? group.rows
            : group.rows.filter((row) => row.name.toLowerCase().includes(term));
          if (rows.length === 0) return null;
          return (
            <View key={group.caption}>
              <Caption style={[styles.groupCaption, { marginTop: group.marginTop }]}>
                {group.caption}
              </Caption>
              {rows.map((row) => (
                <View key={row.name} style={styles.row}>
                  <Monogram label={row.label} />
                  <Text style={styles.rowName}>{row.name}</Text>
                  <Text style={[styles.rowStatus, row.isLinked && styles.rowStatusLinked]}>
                    {row.status}
                  </Text>
                </View>
              ))}
            </View>
          );
        })}

        <View style={styles.spacer} />
        <Text style={styles.footer}>
          Property, cash and savings are added by hand —{' '}
          <Text
            accessibilityRole="link"
            style={styles.footerLink}
            onPress={() => router.push('/editorial/add')}>
            add a holding
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.ink,
    overflow: 'hidden',
  },
  faded: {
    paddingTop: 72,
    paddingHorizontal: 24,
    opacity: 0.35,
  },
  heroTitle: {
    fontFamily: Fonts.newsreaderLight36,
    fontSize: 36,
    lineHeight: 39.6,
    color: Colors.bone,
    marginTop: 16,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 180,
    backgroundColor: Colors.surface2,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 14,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.hairline,
    alignSelf: 'center',
    marginBottom: 22,
  },
  sheetTitle: {
    fontFamily: Fonts.newsreader24,
    fontSize: 24,
    lineHeight: 30,
    color: Colors.bone,
  },
  searchRow: {
    height: 49,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.manrope,
    fontSize: 15,
    color: Colors.bone,
    padding: 0,
  },
  groupCaption: {
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 57,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
    gap: 14,
  },
  rowName: {
    flex: 1,
    fontFamily: Fonts.manrope,
    fontSize: 15,
    color: Colors.bone,
  },
  rowStatus: {
    fontFamily: Fonts.manrope,
    fontSize: 13,
    color: Colors.slate,
  },
  rowStatusLinked: {
    color: Colors.verdigris,
  },
  spacer: {
    flex: 1,
  },
  footer: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.ash,
    textAlign: 'center',
  },
  footerLink: {
    color: Colors.brass,
  },
});
