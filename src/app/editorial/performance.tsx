import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path, Text as SvgText } from 'react-native-svg';

import { Caption } from '@/components/editorial/caption';
import { Colors, Fonts, TintRgb } from '@/constants/theme';

const monthlyCells: { value: string; tint?: string; isOutline?: boolean }[] = [
  { value: '+2.1', tint: `rgba(${TintRgb.gain},0.22)` },
  { value: '−3.4', tint: `rgba(${TintRgb.loss},0.3)` },
  { value: '+0.8', tint: `rgba(${TintRgb.gain},0.12)` },
  { value: '+4.6', tint: `rgba(${TintRgb.gain},0.36)` },
  { value: '0.0', isOutline: true },
  { value: '−1.2', tint: `rgba(${TintRgb.loss},0.14)` },
  { value: '+3.0', tint: `rgba(${TintRgb.gain},0.28)` },
  { value: '+1.4', tint: `rgba(${TintRgb.gain},0.16)` },
  { value: '+0.9', tint: `rgba(${TintRgb.gain},0.1)` },
];

const summaryRows: { label: string; value: string; valueColor: string }[] = [
  { label: 'Start value', value: '$872,330', valueColor: Colors.bone },
  { label: 'Contributed', value: '$186,000', valueColor: Colors.bone },
  { label: 'Market', value: '+$226,600', valueColor: Colors.verdigris },
  { label: 'End value', value: '$1,284,930', valueColor: Colors.bone },
];

export default function PerformanceScreen() {
  const [gridWidth, setGridWidth] = useState(0);
  const cellWidth = gridWidth > 0 ? (gridWidth - 5 * 6) / 6 : 0;
  const summaryLabel = summaryRows.map((row) => `${row.label}, ${row.value}`).join('. ');

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Caption>Performance · since Jan 2023</Caption>
        <Text style={styles.total}>+$412,600</Text>
        <Text style={styles.change}>▲ 47.3% · 11.2% annualised</Text>

        <View style={styles.chart}>
          <Svg width="100%" height="100%" viewBox="0 0 354 200">
            <Path
              d="M0 180 C40 176 70 168 100 150 S160 120 200 110 S260 70 300 60 L354 30"
              fill="none"
              stroke={Colors.bone}
              strokeWidth={1.5}
            />
            <Path
              d="M0 182 H40 V170 H90 V158 H140 V146 H190 V134 H240 V122 H290 V110 H354"
              fill="none"
              stroke={Colors.ash}
              strokeWidth={1}
              strokeDasharray="2 3"
            />
            <Line x1={0} y1={199.5} x2={354} y2={199.5} stroke={Colors.hairline} />
            <SvgText
              x={354}
              y={24}
              textAnchor="end"
              fontFamily={Fonts.manrope}
              fontSize={11}
              fill={Colors.slate}
              letterSpacing={1}>
              VALUE
            </SvgText>
            <SvgText
              x={354}
              y={104}
              textAnchor="end"
              fontFamily={Fonts.manrope}
              fontSize={11}
              fill={Colors.slate}
              letterSpacing={1}>
              CONTRIBUTED
            </SvgText>
          </Svg>
        </View>

        <View style={styles.xLabels}>
          <Text style={styles.xLabel}>JAN 23</Text>
          <Text style={styles.xLabel}>JAN 24</Text>
          <Text style={styles.xLabel}>JAN 25</Text>
          <Text style={styles.xLabel}>NOW</Text>
        </View>

        <View style={styles.summary} accessible accessibilityLabel={summaryLabel}>
          <View style={styles.summaryLabels}>
            {summaryRows.map((row) => (
              <Text key={row.label} style={styles.summaryLabel}>
                {row.label}
              </Text>
            ))}
          </View>
          <View style={styles.summaryValues}>
            {summaryRows.map((row) => (
              <Text key={row.label} style={[styles.summaryValue, { color: row.valueColor }]}>
                {row.value}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.monthlyHeading}>
          <Caption>Monthly · 2026</Caption>
        </View>
        <View
          style={styles.monthlyGrid}
          onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}>
          {monthlyCells.map((cell, index) => (
            <View
              key={index}
              style={[
                styles.monthCell,
                { width: cellWidth },
                cell.isOutline ? styles.monthCellOutline : { backgroundColor: cell.tint },
              ]}>
              <Text style={[styles.monthValue, cell.isOutline && styles.monthValueOutline]}>
                {cell.value}
              </Text>
            </View>
          ))}
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
    paddingTop: 68,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  total: {
    fontFamily: Fonts.newsreaderLight36,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.72,
    color: Colors.bone,
    marginTop: 14,
    fontVariant: ['tabular-nums'],
  },
  change: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.verdigris,
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
  chart: {
    width: '100%',
    aspectRatio: 354 / 200,
    marginTop: 28,
  },
  xLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  xLabel: {
    fontFamily: Fonts.manropeMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.1,
    color: Colors.slate,
  },
  summary: {
    flexDirection: 'row',
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    paddingTop: 16,
  },
  summaryLabels: {
    flex: 1,
    gap: 12,
  },
  summaryValues: {
    gap: 12,
  },
  summaryLabel: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.ash,
  },
  summaryValue: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
  },
  monthlyHeading: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    paddingTop: 12,
    marginTop: 28,
  },
  monthlyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
  },
  monthCell: {
    height: 44,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCellOutline: {
    height: 46,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  monthValue: {
    fontFamily: Fonts.manropeMedium,
    fontSize: 11,
    lineHeight: 14,
    color: Colors.bone,
    fontVariant: ['tabular-nums'],
  },
  monthValueOutline: {
    color: Colors.slate,
  },
});
