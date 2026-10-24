import { router } from 'expo-router';
import { type ReactNode, memo, useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ColorValue } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';

import { Caption } from '@/components/editorial/caption';
import { Monogram } from '@/components/editorial/monogram';
import { PeriodSelector } from '@/components/editorial/period-selector';
import { AssetClassColors, Colors, Fonts } from '@/constants/theme';
import { ASSET_CLASSES, type AccountKind, type AssetClass, type Ownership } from '@/data/types';
import { formatCurrency, formatSignedCurrency } from '@/lib/money';
import {
  useAccountGroups,
  useAllocation,
  useHoldingMetrics,
  useHoldings,
  useNetWorth,
  useOwnerGroups,
  useSettings,
} from '@/store';

const VIEW_OPTIONS = ['Class', 'Accounts', 'Owners'];

const KIND_LABEL: Record<AccountKind, string> = {
  brokerage: 'Brokerage',
  exchange: 'Exchange',
  bank: 'Bank',
  manual: 'Manual',
};

const OWNERSHIP_LABEL: Record<Ownership, string> = {
  me: 'Me',
  spouse: 'Spouse',
  joint: 'Joint',
  entity: 'Entity',
};

function Sparkline({
  d,
  stroke,
  hasBaseline = false,
}: {
  d: string;
  stroke: ColorValue;
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

const STOCK_SPARKLINES: ReactNode[] = [
  <Sparkline key="s0" d="M0 12 L8 10 L16 11 L24 7 L32 8 L40 4 L48 3" stroke={Colors.verdigris} />,
  <Sparkline key="s1" d="M0 10 L8 8 L16 9 L24 6 L32 7 L40 5 L48 5" stroke={Colors.verdigris} />,
  <Sparkline key="s2" d="M0 6 L8 7 L16 6 L24 9 L32 8 L40 11 L48 10" stroke={Colors.copper} hasBaseline />,
];

const HoldingRow = memo(function HoldingRow({
  holdingId,
  name,
  ticker,
  value,
  subline,
  sublineColor,
  sparkline,
  hasBorder = false,
  onPress,
}: {
  holdingId: string;
  name: string;
  ticker: string;
  value: string;
  subline?: string;
  sublineColor?: ColorValue;
  sparkline?: ReactNode;
  hasBorder?: boolean;
  onPress: (id: string) => void;
}) {
  const handlePress = useCallback(() => onPress(holdingId), [onPress, holdingId]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}${ticker ? `, ${ticker}` : ''}, ${value}`}
      style={[styles.holdingBlock, hasBorder && styles.rowBorder]}
      onPress={handlePress}>
      <View style={styles.holdingRow}>
        <View style={styles.holdingName}>
          <Text style={styles.holdingLabel}>{name}</Text>
          {ticker ? <Text style={styles.holdingTicker}>{ticker}</Text> : null}
        </View>
        {sparkline}
        <Text style={styles.holdingValue}>{value}</Text>
      </View>
      {subline ? <Text style={[styles.holdingSub, { color: sublineColor }]}>{subline}</Text> : null}
    </Pressable>
  );
});

const ClassRow = memo(function ClassRow({
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
  detailColor: ColorValue;
  value: string;
  delta: string;
  deltaColor: ColorValue;
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
});

const GroupRow = memo(function GroupRow({
  name,
  detail,
  value,
}: {
  name: string;
  detail: string;
  value: string;
}) {
  return (
    <View style={styles.groupRow} accessible accessibilityLabel={`${name}, ${detail}, ${value}`}>
      <View style={styles.classMiddle}>
        <Text style={styles.className}>{name}</Text>
        <Text style={[styles.classDetail, { color: Colors.slate }]}>{detail}</Text>
      </View>
      <Text style={styles.classValue}>{value}</Text>
    </View>
  );
});

export default function PortfolioScreen() {
  const [viewIndex, setViewIndex] = useState(0);
  const [isStocksExpanded, setIsStocksExpanded] = useState(true);
  const [isPropertyExpanded, setIsPropertyExpanded] = useState(false);

  const netWorth = useNetWorth();
  const allocation = useAllocation();
  const holdings = useHoldings();
  const positions = useHoldingMetrics();
  const accountGroups = useAccountGroups();
  const ownerGroups = useOwnerGroups();
  const { baseCurrency } = useSettings();

  const positionById = useMemo(
    () => new Map(positions.map((position) => [position.holdingId, position])),
    [positions],
  );

  const money = useCallback(
    (value: number) =>
      formatCurrency(value, baseCurrency, {
        locale: 'en',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    [baseCurrency],
  );

  const toggleStocks = useCallback(() => setIsStocksExpanded((prev) => !prev), []);
  const toggleProperty = useCallback(() => setIsPropertyExpanded((prev) => !prev), []);
  const openHolding = useCallback(
    (id: string) => router.push({ pathname: '/editorial/holding', params: { id } }),
    [],
  );
  const openAllocation = useCallback(() => router.push('/editorial/allocation'), []);

  const sliceOf = (assetClass: AssetClass) =>
    allocation.find((slice) => slice.assetClass === assetClass);
  const weightOf = (assetClass: AssetClass) => Math.round(sliceOf(assetClass)?.weight ?? 0);
  const valueOf = (assetClass: AssetClass) => sliceOf(assetClass)?.value ?? 0;
  const inClass = (assetClass: AssetClass) =>
    holdings.filter((holding) => holding.assetClass === assetClass);

  const sublineFor = (holdingId: string, currency: typeof baseCurrency) => {
    if (currency === baseCurrency) return null;
    const position = positionById.get(holdingId);
    if (!position) return null;
    const native = formatCurrency(position.valueNative, currency, {
      locale: 'en',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    if (position.currencyGain == null) return { text: native, color: Colors.slate };
    const gain = formatSignedCurrency(position.currencyGain, baseCurrency, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return {
      text: `${native} · currency ${gain}`,
      color: position.currencyGain >= 0 ? Colors.verdigris : Colors.copper,
    };
  };

  const stockHoldings = inClass('stocks');
  const topStocks = stockHoldings.slice(0, 3);
  const foreignStocks = stockHoldings
    .slice(3)
    .filter((holding) => holding.currency !== baseCurrency);
  const shownStocks = topStocks.length + foreignStocks.length;
  const moreStocks = stockHoldings.length - shownStocks;
  const propertyHoldings = inClass('property');
  const cashAccounts = new Set(inClass('cash').map((holding) => holding.accountId)).size;

  const otherSegmentOpacity = viewIndex === 0 && isStocksExpanded ? 0.32 : 1;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Caption>
          Portfolio · {ASSET_CLASSES.length} classes · {holdings.length} holdings
        </Caption>
        <Text style={styles.total}>{money(netWorth.total)}</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Allocation breakdown"
          hitSlop={{ top: 20, bottom: 20 }}
          style={styles.allocationBar}
          onPress={openAllocation}>
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

        <PeriodSelector
          options={VIEW_OPTIONS}
          selectedIndex={viewIndex}
          onSelect={setViewIndex}
          style={styles.segment}
        />

        {viewIndex === 0 ? (
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
              onPress={toggleStocks}
            />

            {isStocksExpanded && (
              <View style={styles.holdings}>
                {topStocks.map((holding, index) => (
                  <HoldingRow
                    key={holding.id}
                    holdingId={holding.id}
                    name={holding.instrument?.name ?? holding.name ?? ''}
                    ticker={holding.instrument?.symbol ?? ''}
                    value={money(holding.value)}
                    sparkline={STOCK_SPARKLINES[index]}
                    hasBorder={index > 0}
                    onPress={openHolding}
                  />
                ))}
                {foreignStocks.map((holding) => {
                  const sub = sublineFor(holding.id, holding.currency);
                  return (
                    <HoldingRow
                      key={holding.id}
                      holdingId={holding.id}
                      name={holding.instrument?.name ?? holding.name ?? ''}
                      ticker={holding.instrument?.symbol ?? ''}
                      value={money(holding.value)}
                      subline={sub?.text}
                      sublineColor={sub?.color}
                      hasBorder
                      onPress={openHolding}
                    />
                  );
                })}
                {moreStocks > 0 ? (
                  <View style={[styles.moreRow, styles.rowBorder]}>
                    <Text style={styles.moreText}>{moreStocks} more holdings</Text>
                  </View>
                ) : null}
              </View>
            )}

            <ClassRow
              label="C"
              name="Crypto"
              detail={`${weightOf('crypto')}% · ${inClass('crypto').length} holdings`}
              detailColor={Colors.copper}
              value={money(valueOf('crypto'))}
              delta="▼ 2.1%"
              deltaColor={Colors.copper}
            />
            <ClassRow
              label="RE"
              isSelected={isPropertyExpanded}
              name="Real estate"
              detail={`${weightOf('property')}% · ${propertyHoldings.length} properties`}
              detailColor={Colors.slate}
              value={money(valueOf('property'))}
              delta="— valued Jun"
              deltaColor={Colors.stone}
              accessibilityState={{ expanded: isPropertyExpanded }}
              onPress={toggleProperty}
            />
            {isPropertyExpanded && (
              <View style={styles.holdings}>
                {propertyHoldings.map((holding, index) => (
                  <HoldingRow
                    key={holding.id}
                    holdingId={holding.id}
                    name={holding.name ?? ''}
                    ticker=""
                    value={money(holding.value)}
                    hasBorder={index > 0}
                    onPress={openHolding}
                  />
                ))}
              </View>
            )}
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
        ) : null}

        {viewIndex === 1 ? (
          <View style={styles.list}>
            {accountGroups.map((group) => (
              <GroupRow
                key={group.account.id}
                name={group.account.name}
                detail={group.account.institution ?? KIND_LABEL[group.account.kind]}
                value={money(group.value)}
              />
            ))}
          </View>
        ) : null}

        {viewIndex === 2 ? (
          <View style={styles.list}>
            {ownerGroups.map((group) => (
              <GroupRow
                key={group.ownership}
                name={OWNERSHIP_LABEL[group.ownership]}
                detail={`${Math.round((group.value / (netWorth.assets || 1)) * 100)}% of assets`}
                value={money(group.value)}
              />
            ))}
          </View>
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
  allocationBar: {
    flexDirection: 'row',
    gap: 4,
    height: 6,
    marginTop: 24,
    borderRadius: 1,
    overflow: 'hidden',
  },
  segment: {
    marginTop: 24,
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
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    height: 65,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
  },
  holdings: {
    paddingLeft: 46,
  },
  holdingBlock: {
    justifyContent: 'center',
    paddingVertical: 8,
    minHeight: 52,
  },
  holdingRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  holdingSub: {
    fontFamily: Fonts.manrope,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
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
