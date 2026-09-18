import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Glass } from '@/components/native/glass';
import { GroupedCard, RowSeparator } from '@/components/native/grouped-list';
import { SegmentedControl } from '@/components/native/segmented-control';
import { Colors } from '@/constants/theme';

type Delta = { text: string; isGain: boolean };

function HouseIcon() {
  return (
    <Svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke={Colors.bone}
      strokeWidth={2}
      strokeLinecap="round">
      <Path d="M3 12l9-8 9 8M5 10v10h14V10" />
    </Svg>
  );
}

function HoldingRow({
  ticker,
  icon,
  name,
  sub,
  value,
  delta,
  onPress,
  hasSeparator,
}: {
  ticker?: string;
  icon?: 'house';
  name: string;
  sub: string;
  value: string;
  delta?: Delta;
  onPress?: () => void;
  hasSeparator: boolean;
}) {
  const content = (
    <>
      <View style={styles.avatar}>
        {icon === 'house' ? <HouseIcon /> : <Text style={styles.avatarText}>{ticker}</Text>}
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowName}>{name}</Text>
        <Text style={styles.rowSub}>{sub}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowValue}>{value}</Text>
        {delta ? (
          <View style={[styles.deltaChip, delta.isGain ? styles.gainChip : styles.lossChip]}>
            <Text style={[styles.deltaText, delta.isGain ? styles.gainText : styles.lossText]}>
              {delta.text}
            </Text>
          </View>
        ) : null}
      </View>
      {hasSeparator ? <RowSeparator inset={64} /> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${value}${delta ? `, ${delta.text}` : ''}`}
        style={styles.row}
        onPress={onPress}>
        {content}
      </Pressable>
    );
  }
  return <View style={styles.row}>{content}</View>;
}

export default function NativePortfolio() {
  const [grouping, setGrouping] = useState(0);

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.largeTitle}>Portfolio</Text>
          <Glass radius={22} style={styles.editPill}>
            <Text style={styles.editText}>Edit</Text>
          </Glass>
        </View>

        <SegmentedControl
          options={['By class', 'By account', 'By holding']}
          selectedIndex={grouping}
          onSelect={setGrouping}
          style={styles.segment}
        />

        <Text style={styles.sectionHeader}>Stocks · $591,068</Text>
        <GroupedCard>
          <HoldingRow
            ticker="AAPL"
            name="Apple"
            sub="600 shares"
            value="$148,920"
            delta={{ text: '▲ 1.8%', isGain: true }}
            onPress={() => router.push('/native/holding')}
            hasSeparator
          />
          <HoldingRow
            ticker="MSFT"
            name="Microsoft"
            sub="240 shares"
            value="$121,340"
            delta={{ text: '▲ 0.6%', isGain: true }}
            hasSeparator
          />
          <HoldingRow
            ticker="VTI"
            name="Vanguard Total"
            sub="312 shares"
            value="$98,410"
            delta={{ text: '▼ 0.4%', isGain: false }}
            hasSeparator
          />
          <View style={styles.showMoreRow}>
            <Text style={styles.showMoreText}>Show 8 more</Text>
          </View>
        </GroupedCard>

        <Text style={styles.sectionHeader}>Crypto · $115,644</Text>
        <GroupedCard>
          <HoldingRow
            ticker="BTC"
            name="Bitcoin"
            sub="0.82 BTC"
            value="$86,100"
            delta={{ text: '▼ 2.4%', isGain: false }}
            hasSeparator
          />
          <HoldingRow
            ticker="ETH"
            name="Ether"
            sub="8.6 ETH"
            value="$29,544"
            delta={{ text: '▼ 1.9%', isGain: false }}
            hasSeparator={false}
          />
        </GroupedCard>

        <Text style={styles.sectionHeader}>Real estate · $398,328</Text>
        <GroupedCard>
          <HoldingRow
            icon="house"
            name="Lisbon flat"
            sub="Valued Sept 1"
            value="$412,000"
            hasSeparator={false}
          />
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
  editPill: {
    height: 45,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editText: {
    fontSize: 17,
    fontWeight: '400',
    color: Colors.brass,
  },
  segment: {
    marginTop: 16,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.bone,
  },
  rowBody: {
    flex: 1,
  },
  rowName: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.bone,
  },
  rowSub: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: Colors.slate,
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  rowValue: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.bone,
    fontVariant: ['tabular-nums'],
  },
  deltaChip: {
    borderRadius: 6,
    paddingHorizontal: 6,
  },
  gainChip: {
    backgroundColor: Colors.gainTint,
  },
  lossChip: {
    backgroundColor: Colors.lossTint,
  },
  deltaText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  gainText: {
    color: Colors.verdigris,
  },
  lossText: {
    color: Colors.copper,
  },
  showMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  showMoreText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: Colors.brass,
  },
});
