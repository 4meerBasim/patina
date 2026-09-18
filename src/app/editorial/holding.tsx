import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { Caption } from '@/components/editorial/caption';
import { PeriodSelector } from '@/components/editorial/period-selector';
import { Colors, Fonts } from '@/constants/theme';

const chartPath =
  'M0 170 C40 160 60 178 100 150 S150 120 180 140 S220 90 260 100 S320 60 360 66 L402 50';

const provenanceRows: { label: string; value: string; valueColor: string }[] = [
  { label: 'Quantity', value: '600 shares', valueColor: Colors.bone },
  { label: 'Cost basis', value: '$98,640 · $164.40 avg', valueColor: Colors.bone },
  { label: 'Unrealised', value: '▲ +$50,280 · 51.0%', valueColor: Colors.verdigris },
  { label: 'First acquired', value: 'Nov 2021', valueColor: Colors.bone },
  { label: 'Weight', value: '11.6% of net worth', valueColor: Colors.bone },
];

export default function HoldingScreen() {
  const [periodIndex, setPeriodIndex] = useState(2);
  const provenanceLabel = provenanceRows.map((row) => `${row.label}, ${row.value}`).join('. ');

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={() => router.back()}>
            <Svg
              width={24}
              height={24}
              viewBox="0 0 24 24"
              fill="none"
              stroke={Colors.ash}
              strokeWidth={1.5}
              strokeLinecap="round">
              <Path d="M15 5l-7 7 7 7" />
            </Svg>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            onPress={() => router.push('/editorial/add')}>
            <Text style={styles.edit}>Edit</Text>
          </Pressable>
        </View>

        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLabel}>S</Text>
          </View>
          <View>
            <Text style={styles.name}>Apple</Text>
            <Text style={styles.ticker}>AAPL · NASDAQ · IBKR</Text>
          </View>
        </View>

        <View style={styles.priceBlock}>
          <Text style={styles.date}>14 March 2026</Text>
          <Text style={styles.price}>
            $131,204<Text style={styles.priceFraction}>.50</Text>
          </Text>
          <Text style={styles.change}>▼ −$17,715 · 11.9% below today</Text>
        </View>

        <View style={styles.chart}>
          <Svg width="100%" height="100%" viewBox="0 0 402 240">
            <Defs>
              <LinearGradient id="holdingChart" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={Colors.bone} stopOpacity={0.08} />
                <Stop offset="1" stopColor={Colors.bone} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Path d={`${chartPath} V240 H0Z`} fill="url(#holdingChart)" />
            <Path d={chartPath} fill="none" stroke={Colors.bone} strokeWidth={1.5} />
            <Line x1={150} y1={20} x2={150} y2={230} stroke={Colors.slate} strokeWidth={1} />
            <Circle cx={150} cy={131} r={4} fill={Colors.bone} />
            <Line x1={292} y1={60} x2={292} y2={230} stroke={Colors.brass} strokeWidth={1} />
            <SvgText x={298} y={72} fontFamily={Fonts.manrope} fontSize={11} fill={Colors.brass}>
              bought the dip
            </SvgText>
            <Line x1={0} y1={239.5} x2={402} y2={239.5} stroke={Colors.hairline} />
          </Svg>
        </View>

        <PeriodSelector
          options={['1W', '1M', '1Y', 'All']}
          selectedIndex={periodIndex}
          onSelect={setPeriodIndex}
          style={styles.periods}
        />

        <View style={styles.provenance}>
          <View style={styles.sectionDivider}>
            <Caption>Provenance</Caption>
          </View>
          <View style={styles.defList} accessible accessibilityLabel={provenanceLabel}>
            <View style={styles.defLabels}>
              {provenanceRows.map((row) => (
                <Text key={row.label} style={styles.defLabel}>
                  {row.label}
                </Text>
              ))}
            </View>
            <View style={styles.defValues}>
              {provenanceRows.map((row) => (
                <Text key={row.label} style={[styles.defValue, { color: row.valueColor }]}>
                  {row.value}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.ink,
  },
  scroll: {
    paddingTop: 64,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  edit: {
    fontFamily: Fonts.manrope,
    fontSize: 13,
    color: Colors.brass,
  },
  identity: {
    paddingHorizontal: 24,
    marginTop: 24,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: Colors.slate,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    fontFamily: Fonts.newsreader18,
    fontSize: 18,
    color: Colors.bone,
  },
  name: {
    fontFamily: Fonts.manrope,
    fontSize: 18,
    lineHeight: 24,
    color: Colors.bone,
  },
  ticker: {
    fontFamily: Fonts.plexMono,
    fontSize: 12,
    color: Colors.slate,
  },
  priceBlock: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  date: {
    fontFamily: Fonts.newsreaderItalic13,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.slate,
  },
  price: {
    fontFamily: Fonts.newsreaderLight36,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.72,
    color: Colors.bone,
    fontVariant: ['tabular-nums'],
    marginTop: 4,
  },
  priceFraction: {
    color: Colors.slate,
  },
  change: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.copper,
    fontVariant: ['tabular-nums'],
    marginTop: 6,
  },
  chart: {
    width: '100%',
    aspectRatio: 402 / 240,
    marginTop: 16,
  },
  periods: {
    paddingHorizontal: 24,
    marginTop: 12,
  },
  provenance: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sectionDivider: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    paddingTop: 12,
  },
  defList: {
    flexDirection: 'row',
    marginTop: 14,
  },
  defLabels: {
    flex: 1,
    gap: 12,
  },
  defValues: {
    gap: 12,
  },
  defLabel: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.ash,
  },
  defValue: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
  },
});
