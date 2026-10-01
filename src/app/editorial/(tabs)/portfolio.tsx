import { router } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';

import { Caption } from '@/components/editorial/caption';
import { Monogram } from '@/components/editorial/monogram';
import { AssetClassColors, Colors, Fonts } from '@/constants/theme';
import type { AssetClass } from '@/data/types';
import { formatCurrency } from '@/lib/money';
import { useAllocation, useHoldings, useNetWorth, useSettings } from '@/store';

function Sparkline({
  d,
  stroke,
  hasBaseline = false,
}: {
  d: string;
  stroke: string;
  hasBaseline?: boolean;
}) {
  return (
    <Svg width={48} height={16} viewBox="0 0 48 16">
      <Path d={d} fill="none" stroke={stroke} strokeWidth={1} />
      {hasBaseline && (
        <Line x1={0} y1={6} x2={48} y2={6} stroke={Colors.slate} strokeDasharray="1 2" />
      )}
    </Svg>
  );
}

function HoldingRow({
  name,
  ticker,
  value,
  sparkline,
  hasBorder = false,
  onPress,
}: {
  name: string;
  ticker: string;
  value: string;
  sparkline: ReactNode;
  hasBorder?: boolean;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View style={styles.holdingName}>
        <Text style={styles.holdingLabel}>{name}</Text>
        <Text style={styles.holdingTicker}>{ticker}</Text>
      </View>
      {sparkline}
      <Text style={styles.holdingValue}>{value}</Text>
    </>
  );
  const rowStyle = [
    styles.holdingRow,
    hasBorder && styles.rowBorder,
    hasBorder && styles.holdingRowDivided,
  ];
  if (onPress) {
    return (
      <Pressable accessibilityRole="button" style={rowStyle} onPress={onPress}>
        {content}
      </Pressable>
    );
  }
  return <View style={rowStyle}>{content}</View>;
}

function ClassRow({
  label,
  isSelected = false,
  name,
  detail,
  detailColor,
  value,
  delta,
  deltaColor,
  accessibilityState,
  onPress,
}: {
  label: string;
  isSelected?: boolean;
  name: string;
  detail: string;
  detailColor: string;
  value: string;
  delta: string;
  deltaColor: string;
  accessibilityState?: { expanded?: boolean };
  onPress?: () => void;
}) {
  const content = (
    <>
      <Monogram label={label} isSelected={isSelected} />
      <View style={styles.classMiddle}>
        <Text style={styles.className}>{name}</Text>
        <Text style={[styles.classDetail, { color: detailColor }]}>{detail}</Text>
      </View>
      <View style={styles.classRight}>
        <Text style={styles.classValue}>{value}</Text>
        <Text style={[styles.classDelta, { color: deltaColor }]}>{delta}</Text>
      </View>
    </>
  );
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${detail}, ${value}, ${delta}`}
        accessibilityState={accessibilityState}
        style={styles.classRow}
        onPress={onPress}>
        {content}
      </Pressable>
    );
  }
  return <View style={styles.classRow}>{content}</View>;
}

export default function PortfolioScreen() {
  const [isStocksExpanded, setIsStocksExpanded] = useState(true);
  const otherSegmentOpacity = isStocksExpanded ? 0.32 : 1;

  const netWorth = useNetWorth();
  const allocation = useAllocation();
  const holdings = useHoldings();
  const { baseCurrency } = useSettings();

  const money = (value: number) =>
    formatCurrency(value, baseCurrency, {
      locale: 'en',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  const sliceOf = (assetClass: AssetClass) =>
    allocation.find((slice) => slice.assetClass === assetClass);
  const weightOf = (assetClass: AssetClass) => Math.round(sliceOf(assetClass)?.weight ?? 0);
  const valueOf = (assetClass: AssetClass) => sliceOf(assetClass)?.value ?? 0;
  const inClass = (assetClass: AssetClass) =>
    holdings.filter((holding) => holding.assetClass === assetClass);

  const stockHoldings = inClass('stocks');
  const topStocks = stockHoldings.slice(0, 3);
  const moreStocks = stockHoldings.length - topStocks.length;
  const propertyCount = inClass('property').length;
  const cashAccounts = new Set(inClass('cash').map((holding) => holding.accountId)).size;

  const stockSparklines = [
    <Sparkline key="s0" d="M0 12 L8 10 L16 11 L24 7 L32 8 L40 4 L48 3" stroke={Colors.verdigris} />,
    <Sparkline key="s1" d="M0 10 L8 8 L16 9 L24 6 L32 7 L40 5 L48 5" stroke={Colors.verdigris} />,
    <Sparkline
      key="s2"
      d="M0 6 L8 7 L16 6 L24 9 L32 8 L40 11 L48 10"
      stroke={Colors.copper}
      hasBaseline
    />,
  ];

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Caption>Portfolio · 5 classes · 23 holdings</Caption>
        <Text style={styles.total}>{money(netWorth.total)}</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Allocation breakdown"
          hitSlop={{ top: 20, bottom: 20 }}
          style={styles.allocationBar}
          onPress={() => router.push('/editorial/allocation')}>
          {allocation.map((slice) => (
            <View
              key={slice.assetClass}
              style={{
                flex: Math.round(slice.weight),
                backgroundColor: AssetClassColors[slice.assetClass],
                opacity: slice.assetClass === 'stocks' ? 1 : otherSegmentOpacity,
              }}
            />
          ))}
        </Pressable>

        <View style={styles.list}>
          <ClassRow
            label="S"
            isSelected={isStocksExpanded}
            name="Stocks"
            detail={`${weightOf('stocks')}% · ${stockHoldings.length} holdings`}
            detailColor={Colors.slate}
            value={money(valueOf('stocks'))}
            delta="▲ 1.4%"
            deltaColor={Colors.verdigris}
            accessibilityState={{ expanded: isStocksExpanded }}
            onPress={() => setIsStocksExpanded((prev) => !prev)}
          />

          {isStocksExpanded && (
            <View style={styles.holdings}>
              {topStocks.map((holding, index) => (
                <HoldingRow
                  key={holding.id}
                  name={holding.instrument?.name ?? ''}
                  ticker={holding.instrument?.symbol ?? ''}
                  value={money(holding.value)}
                  hasBorder={index > 0}
                  sparkline={stockSparklines[index]}
                  onPress={index === 0 ? () => router.push('/editorial/holding') : undefined}
                />
              ))}
              <View style={[styles.moreRow, styles.rowBorder]}>
                <Text style={styles.moreText}>{moreStocks} more holdings</Text>
              </View>
            </View>
          )}

          <ClassRow
            label="C"
            name="Crypto"
            detail={`${weightOf('crypto')}% · 4pt above target`}
            detailColor={Colors.copper}
            value={money(valueOf('crypto'))}
            delta="▼ 2.1%"
            deltaColor={Colors.copper}
          />
          <ClassRow
            label="RE"
            name="Real estate"
            detail={`${weightOf('property')}% · ${propertyCount} properties`}
            detailColor={Colors.slate}
            value={money(valueOf('property'))}
            delta="— valued Jun"
            deltaColor={Colors.stone}
          />
          <ClassRow
            label="$"
            name="Cash"
            detail={`${weightOf('cash')}% · ${cashAccounts} accounts`}
            detailColor={Colors.slate}
            value={money(valueOf('cash'))}
            delta="— unchanged"
            deltaColor={Colors.stone}
          />
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
  allocationBar: {
    flexDirection: 'row',
    gap: 4,
    height: 6,
    marginTop: 24,
    borderRadius: 1,
    overflow: 'hidden',
  },
  list: {
    marginTop: 28,
  },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    height: 65,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
  },
  classMiddle: {
    flex: 1,
  },
  className: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.bone,
  },
  classDetail: {
    fontFamily: Fonts.manrope,
    fontSize: 13,
    lineHeight: 18,
  },
  classRight: {
    alignItems: 'flex-end',
  },
  classValue: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.bone,
    fontVariant: ['tabular-nums'],
  },
  classDelta: {
    fontFamily: Fonts.manrope,
    fontSize: 13,
    lineHeight: 18,
    fontVariant: ['tabular-nums'],
  },
  holdings: {
    paddingLeft: 46,
  },
  holdingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
  },
  holdingRowDivided: {
    height: 53,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
  },
  holdingName: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  holdingLabel: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    color: Colors.bone,
  },
  holdingTicker: {
    fontFamily: Fonts.plexMono,
    fontSize: 12,
    color: Colors.slate,
    marginLeft: 6,
  },
  holdingValue: {
    width: 96,
    textAlign: 'right',
    fontFamily: Fonts.manrope,
    fontSize: 15,
    color: Colors.bone,
    fontVariant: ['tabular-nums'],
  },
  moreRow: {
    height: 45,
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreText: {
    fontFamily: Fonts.manrope,
    fontSize: 13,
    color: Colors.slate,
  },
});
