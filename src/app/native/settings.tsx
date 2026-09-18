import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { GroupedCard, RowSeparator } from '@/components/native/grouped-list';
import { Switch } from '@/components/native/switch';
import { Colors } from '@/constants/theme';

function Chevron() {
  return (
    <Svg width={8} height={14} viewBox="0 0 8 14">
      <Path
        d="M1 1l6 6-6 6"
        stroke={Colors.disabled}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function LinkedRow({
  color,
  name,
  status,
  statusColor,
  hasSeparator,
}: {
  color: string;
  name: string;
  status: string;
  statusColor: string;
  hasSeparator: boolean;
}) {
  return (
    <View style={styles.linkedRow}>
      <View style={[styles.square, { backgroundColor: color }]} />
      <Text style={styles.linkedName}>{name}</Text>
      <Text style={[styles.linkedStatus, { color: statusColor }]}>{status}</Text>
      <Chevron />
      {hasSeparator ? <RowSeparator inset={58} /> : null}
    </View>
  );
}

function NavRow({
  label,
  value,
  hasSeparator,
}: {
  label: string;
  value: string;
  hasSeparator: boolean;
}) {
  return (
    <View style={styles.navRow}>
      <Text style={styles.navLabel}>{label}</Text>
      <Text style={styles.navValue}>{value}</Text>
      <Chevron />
      {hasSeparator ? <RowSeparator inset={16} /> : null}
    </View>
  );
}

export default function NativeSettings() {
  const [isBlurFiguresOn, setIsBlurFiguresOn] = useState(true);
  const [isFaceIdOn, setIsFaceIdOn] = useState(true);

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.largeTitle}>Settings</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileLetter}>R</Text>
          </View>
          <View style={styles.profileBody}>
            <Text style={styles.profileName}>Rania Haddad</Text>
            <Text style={styles.profileSub}>Apple ID, iCloud sync, USD base</Text>
          </View>
          <Chevron />
        </View>

        <Text style={styles.sectionHeader}>Linked accounts</Text>
        <GroupedCard>
          <LinkedRow
            color={Colors.verdigris}
            name="Interactive Brokers"
            status="9:12 AM"
            statusColor={Colors.ash}
            hasSeparator
          />
          <LinkedRow
            color={Colors.brass}
            name="Coinbase"
            status="9:12 AM"
            statusColor={Colors.ash}
            hasSeparator
          />
          <LinkedRow
            color={Colors.umber}
            name="Chase"
            status="Reconnect"
            statusColor={Colors.copper}
            hasSeparator={false}
          />
        </GroupedCard>

        <Text style={styles.sectionHeader}>Language &amp; numbers</Text>
        <GroupedCard>
          <NavRow label="Language" value="English" hasSeparator />
          <NavRow label="Numerals" value="0 1 2 3" hasSeparator />
          <NavRow label="Base currency" value="USD" hasSeparator={false} />
        </GroupedCard>

        <Text style={styles.sectionHeader}>Privacy</Text>
        <GroupedCard>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Blur figures on launch</Text>
            <Switch
              value={isBlurFiguresOn}
              onValueChange={setIsBlurFiguresOn}
              accessibilityLabel="Blur figures on launch"
            />
            <RowSeparator inset={16} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Face ID</Text>
            <Switch value={isFaceIdOn} onValueChange={setIsFaceIdOn} accessibilityLabel="Face ID" />
          </View>
        </GroupedCard>
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
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
  profileCard: {
    marginTop: 20,
    backgroundColor: Colors.surface1,
    borderRadius: 26,
    padding: 16,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileLetter: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.bone,
  },
  profileBody: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '600',
    color: Colors.bone,
  },
  profileSub: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
    color: Colors.ash,
  },
  sectionHeader: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    textTransform: 'uppercase',
    color: Colors.slate,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 16,
  },
  linkedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  square: {
    width: 30,
    height: 30,
    borderRadius: 7,
  },
  linkedName: {
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.bone,
  },
  linkedStatus: {
    fontSize: 15,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  navLabel: {
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.bone,
  },
  navValue: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.ash,
    marginRight: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  switchLabel: {
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.bone,
  },
});
