import { router } from 'expo-router';
import { memo, useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import Svg, { Defs, LinearGradient, Line, Path, Stop } from 'react-native-svg';

import { Caption } from '@/components/editorial/caption';
import { DirectionView } from '@/components/editorial/direction-view';
import { useLocale } from '@/components/editorial/locale';
import { PeriodSelector } from '@/components/editorial/period-selector';
import { AssetClassColors, Colors, Fonts } from '@/constants/theme';
import type { AssetClass, CurrencyCode } from '@/data/types';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatSignedCurrency,
} from '@/lib/money';
import type { Recap } from '@/lib/recap';
import {
  useAllocation,
  useHoldings,
  useNetWorth,
  useNotes,
  usePeriodDelta,
  useRecap,
  useRecentActivity,
  useSettings,
  useTodayDelta,
  useTopMovers,
  type Delta,
  type TopMover,
} from '@/store';

const CHART_AREA =
  'M0 70 C30 66 50 74 80 60 S130 40 160 48 S210 30 240 34 S290 18 320 22 L354 14 V96 H0Z';
const CHART_LINE = 'M0 70 C30 66 50 74 80 60 S130 40 160 48 S210 30 240 34 S290 18 320 22 L354 14';

const PERIOD_DAYS = 30;
const EN_PERIODS = ['1W', '1M', '1Y', 'All'];
const AR_PERIODS = ['أسبوع', 'شهر', 'سنة', 'الكل'];
const PERIOD_DAYS_MAP = [7, 30, 365, 3650];

const EN_CLASS_LABEL: Record<AssetClass, string> = {
  stocks: 'Stocks',
  crypto: 'Crypto',
  property: 'Property',
  cash: 'Cash',
  savings: 'Savings',
};

const AR_CLASS_LABEL: Record<AssetClass, string> = {
  stocks: 'أسهم',
  crypto: 'عملات',
  property: 'عقارات',
  cash: 'نقد',
  savings: 'مدخرات',
};

function leadingClass(recap: Recap): { assetClass: AssetClass; change: number } | null {
  let top: { assetClass: AssetClass; change: number } | null = null;
  for (const entry of recap.perClass) {
    if (entry.change === 0) continue;
    if (!top || Math.abs(entry.change) > Math.abs(top.change)) top = entry;
  }
  return top;
}

function HomeChart({ gradientId, isMirrored }: { gradientId: string; isMirrored?: boolean }) {
  return (
    <Svg viewBox="0 0 354 96" style={[styles.chart, isMirrored && styles.mirrored]}>
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={Colors.bone} stopOpacity={0.08} />
          <Stop offset="1" stopColor={Colors.bone} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={CHART_AREA} fill={`url(#${gradientId})`} />
      <Path
        d={CHART_LINE}
        fill="none"
        stroke={Colors.bone}
        strokeWidth={1.5}
        strokeLinejoin={isMirrored ? undefined : 'round'}
      />
      <Line x1={0} y1={95.5} x2={354} y2={95.5} stroke={Colors.hairline} />
    </Svg>
  );
}

function Avatar({ label }: { label: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Profile"
      accessibilityHint="Long press to switch style"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      onPress={() => router.push('/editorial/settings')}
      onLongPress={() => router.dismissTo('/')}>
      <View style={styles.avatar}>
        <Text style={label === 'R' ? styles.avatarLetter : styles.avatarLetterAr}>{label}</Text>
      </View>
    </Pressable>
  );
}

const MovedRow = memo(function MovedRow({
  label,
  value,
  color,
  isArabic,
}: {
  label: string;
  value: string;
  color: string;
  isArabic: boolean;
}) {
  return (
    <View style={styles.movedRow}>
      <Text style={isArabic ? styles.arRecentText : styles.recentText}>{label}</Text>
      <Text style={[isArabic ? styles.arRecentText : styles.recentText, { color }]}>{value}</Text>
    </View>
  );
});

const MoverRow = memo(function MoverRow({
  holdingId,
  name,
  ticker,
  value,
  color,
  isArabic,
  hasBorder,
  onPress,
}: {
  holdingId: string;
  name: string;
  ticker: string;
  value: string;
  color: string;
  isArabic: boolean;
  hasBorder: boolean;
  onPress: (id: string) => void;
}) {
  const handlePress = useCallback(() => onPress(holdingId), [onPress, holdingId]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name} ${ticker}, ${value}`}
      style={[styles.recentRow, hasBorder && styles.recentRowDivided]}
      onPress={handlePress}>
      <Text style={isArabic ? styles.arRecentText : styles.recentText}>
        {name} <Text style={styles.ticker}>{ticker}</Text>
      </Text>
      <Text style={[isArabic ? styles.arRecentText : styles.recentText, { color }]}>{value}</Text>
    </Pressable>
  );
});

function deltaEn(delta: Delta, currency: CurrencyCode, label: string): string {
  const arrow = delta.amount >= 0 ? '▲' : '▼';
  const amount = formatSignedCurrency(delta.amount, currency, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const percent = formatPercent(Math.abs(delta.percent));
  return `${arrow} ${amount} · ${percent} · ${label}`;
}

function deltaAr(delta: Delta, currency: CurrencyCode, label: string): string {
  const arrow = delta.amount >= 0 ? '▲' : '▼';
  const word = delta.amount >= 0 ? 'ارتفاع' : 'انخفاض';
  const percent = formatPercent(Math.abs(delta.percent), { numeralSystem: 'arabic' });
  const amount = formatSignedCurrency(delta.amount, currency, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${arrow} ${word} ${percent} · ‎${amount}‎ · ${label}`;
}

function EnglishHome() {
  const [period, setPeriod] = useState(1);
  const { baseCurrency } = useSettings();
  const netWorth = useNetWorth();
  const periodDelta = usePeriodDelta(PERIOD_DAYS);
  const todayDelta = useTodayDelta();
  const allocation = useAllocation();
  const notes = useNotes();
  const recent = useRecentActivity(2);
  const holdings = useHoldings();
  const recap = useRecap(PERIOD_DAYS_MAP[period]);
  const movers = useTopMovers(3);

  const hero = formatCurrency(netWorth.total, baseCurrency, {
    locale: 'en',
    numeralSystem: 'latin',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const dot = hero.lastIndexOf('.');
  const heroWhole = hero.slice(0, dot);
  const heroFraction = hero.slice(dot);

  const concentration = notes.find((note) => note.kind === 'concentration');
  const symbolOf = (holdingId: string | null) =>
    holdings.find((holding) => holding.id === holdingId)?.instrument?.symbol ?? '';
  const dividend = recent.find((tx) => tx.type === 'dividend');
  const buy = recent.find((tx) => tx.type === 'buy');

  const openHolding = useCallback(
    (id: string) => router.push({ pathname: '/editorial/holding', params: { id } }),
    [],
  );
  const openAllocation = useCallback(() => router.push('/editorial/allocation'), []);
  const openActivity = useCallback(() => router.push('/editorial/activity'), []);
  const openPerformance = useCallback(() => router.push('/editorial/performance'), []);
  const openDividends = useCallback(() => router.push('/editorial/dividends'), []);

  const signed0 = (value: number) =>
    formatSignedCurrency(value, baseCurrency, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const moverValue = (mover: TopMover) =>
    `${signed0(mover.valueChange)} · ${formatPercent(mover.percentChange, {
      signed: true,
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}`;

  const lead = leadingClass(recap);
  const hasRecap = recap.netWorthChange !== 0 || recap.market !== 0 || recap.contributions !== 0;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <View>
        <View style={styles.headerRow}>
          <Caption>Net worth · as of 09:12</Caption>
          <Avatar label="R" />
        </View>
        <View style={styles.brassRule} />
        <Text style={styles.hero}>
          {heroWhole}
          <Text style={styles.heroDecimal}>{heroFraction}</Text>
        </Text>
        <View style={styles.deltas}>
          <Text style={[styles.delta, periodDelta.amount >= 0 ? styles.gain : styles.loss]}>
            {deltaEn(periodDelta, baseCurrency, 'past 30 days')}
          </Text>
          <Text style={[styles.delta, todayDelta.amount >= 0 ? styles.gain : styles.loss]}>
            {deltaEn(todayDelta, baseCurrency, 'today')}
          </Text>
        </View>
      </View>

      <View>
        <PeriodSelector options={EN_PERIODS} selectedIndex={period} onSelect={setPeriod} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Performance"
          style={styles.chartWrap}
          onPress={openPerformance}>
          <HomeChart gradientId="homeChartEn" />
        </Pressable>
      </View>

      {hasRecap ? (
        <View>
          <Caption style={styles.sectionCaption}>What moved · {EN_PERIODS[period]}</Caption>
          <View style={styles.movedList}>
            <MovedRow
              label="Market"
              value={signed0(recap.market)}
              color={recap.market >= 0 ? Colors.verdigris : Colors.copper}
              isArabic={false}
            />
            <MovedRow
              label="Contributions"
              value={signed0(recap.contributions)}
              color={Colors.bone}
              isArabic={false}
            />
          </View>
          {lead ? (
            <Text style={styles.noteMeta}>
              {EN_CLASS_LABEL[lead.assetClass]} led · {signed0(lead.change)}
            </Text>
          ) : null}
        </View>
      ) : null}

      {movers.length > 0 ? (
        <View>
          <Caption style={styles.sectionCaption}>Top movers</Caption>
          {movers.map((mover, index) => (
            <MoverRow
              key={mover.holding.id}
              holdingId={mover.holding.id}
              name={mover.instrument?.name ?? mover.holding.name ?? ''}
              ticker={mover.instrument?.symbol ?? ''}
              value={moverValue(mover)}
              color={mover.valueChange >= 0 ? Colors.verdigris : Colors.copper}
              isArabic={false}
              hasBorder={index > 0}
              onPress={openHolding}
            />
          ))}
        </View>
      ) : null}

      <Pressable accessibilityRole="button" onPress={openAllocation}>
        <Caption style={styles.sectionCaption}>Allocation</Caption>
        <View style={styles.allocationBar}>
          {allocation.map((slice) => (
            <View
              key={slice.assetClass}
              style={{
                flex: Math.round(slice.weight),
                backgroundColor: AssetClassColors[slice.assetClass],
              }}
            />
          ))}
        </View>
        <View style={styles.allocationLegend}>
          {allocation.map((slice) => (
            <Text key={slice.assetClass} style={styles.legend}>
              {EN_CLASS_LABEL[slice.assetClass]} {formatNumber(Math.round(slice.weight))}
            </Text>
          ))}
        </View>
      </Pressable>

      {concentration ? (
        <View>
          <Caption style={styles.sectionCaption}>Note · Today</Caption>
          <Text style={styles.note}>{concentration.body}</Text>
          <Text style={styles.noteMeta}>
            Concentration ·{' '}
            <Text accessibilityRole="link" style={styles.link} onPress={openAllocation}>
              Review allocation
            </Text>
          </Text>
        </View>
      ) : null}

      <View>
        <Caption style={styles.sectionCaption}>Recent</Caption>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dividend income"
          style={styles.recentRow}
          onPress={openDividends}>
          <Text style={styles.recentText}>Dividend · {symbolOf(dividend?.holdingId ?? null)}</Text>
          <Text style={styles.recentText}>
            {dividend
              ? formatSignedCurrency(dividend.amount, baseCurrency, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : ''}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={[styles.recentRow, styles.recentRowDivided]}
          onPress={openActivity}>
          <Text style={styles.recentText}>
            Buy · {formatNumber(buy?.quantity ?? 0)} {symbolOf(buy?.holdingId ?? null)}
          </Text>
          <Text style={styles.recentText}>
            {buy
              ? formatSignedCurrency(buy.amount, baseCurrency, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : ''}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function ArabicCaption({ children, style }: { children: string; style?: StyleProp<TextStyle> }) {
  return (
    <Text style={[styles.arCaption, style]}>
      <Text style={styles.brassDash}>–</Text> {children}
    </Text>
  );
}

function ArabicHome() {
  const [period, setPeriod] = useState(1);
  const { baseCurrency } = useSettings();
  const netWorth = useNetWorth();
  const periodDelta = usePeriodDelta(PERIOD_DAYS);
  const todayDelta = useTodayDelta();
  const allocation = useAllocation();
  const recent = useRecentActivity(2);
  const holdings = useHoldings();
  const recap = useRecap(PERIOD_DAYS_MAP[period]);
  const movers = useTopMovers(3);

  const heroNumber = formatNumber(netWorth.total, {
    numeralSystem: 'arabic',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sep = heroNumber.lastIndexOf('٫');
  const heroWhole = heroNumber.slice(0, sep);
  const heroFraction = heroNumber.slice(sep);
  const heroCurrency = formatCurrency(netWorth.total, baseCurrency, {
    locale: 'ar',
    numeralSystem: 'arabic',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const symbol = heroCurrency.slice(heroCurrency.lastIndexOf(' ') + 1);

  const periodLabel = `آخر ${formatNumber(PERIOD_DAYS, { numeralSystem: 'arabic' })} يومًا`;
  const symbolOf = (holdingId: string | null) =>
    holdings.find((holding) => holding.id === holdingId)?.instrument?.symbol ?? '';
  const dividend = recent.find((tx) => tx.type === 'dividend');

  const openHolding = useCallback(
    (id: string) => router.push({ pathname: '/editorial/holding', params: { id } }),
    [],
  );
  const openAllocation = useCallback(() => router.push('/editorial/allocation'), []);
  const openActivity = useCallback(() => router.push('/editorial/activity'), []);
  const openPerformance = useCallback(() => router.push('/editorial/performance'), []);

  const signedAr = (value: number) =>
    `⁦${formatSignedCurrency(value, baseCurrency, {
      locale: 'ar',
      numeralSystem: 'arabic',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}⁩`;
  const moverValue = (mover: TopMover) =>
    `⁦${formatSignedCurrency(mover.valueChange, baseCurrency, {
      locale: 'ar',
      numeralSystem: 'arabic',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })} · ${formatPercent(mover.percentChange, {
      numeralSystem: 'arabic',
      signed: true,
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}⁩`;

  const lead = leadingClass(recap);
  const hasRecap = recap.netWorthChange !== 0 || recap.market !== 0 || recap.contributions !== 0;

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <DirectionView isRtl style={styles.content}>
        <View>
          <View style={styles.headerRow}>
            <ArabicCaption>صافي الثروة · حتى ٠٩:١٢</ArabicCaption>
            <Avatar label="ر" />
          </View>
          <View style={styles.brassRule} />
          <Text style={styles.arHero}>
            {'⁦'}
            {heroWhole}
            <Text style={styles.heroDecimal}>{heroFraction}</Text>{' '}
            <Text style={styles.arHeroCurrency}>{symbol}</Text>
            {'⁩'}
          </Text>
          <View style={styles.deltas}>
            <Text style={[styles.arDelta, periodDelta.amount >= 0 ? styles.gain : styles.loss]}>
              {deltaAr(periodDelta, baseCurrency, periodLabel)}
            </Text>
            <Text style={[styles.arDelta, todayDelta.amount >= 0 ? styles.gain : styles.loss]}>
              {deltaAr(todayDelta, baseCurrency, 'اليوم')}
            </Text>
          </View>
        </View>

        <View>
          <PeriodSelector
            options={AR_PERIODS}
            selectedIndex={period}
            onSelect={setPeriod}
            isArabic
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Performance"
            style={styles.chartWrap}
            onPress={openPerformance}>
            <HomeChart gradientId="homeChartAr" isMirrored />
          </Pressable>
        </View>

        {hasRecap ? (
          <View>
            <ArabicCaption style={styles.sectionCaption}>
              {`ما الذي تحرّك · ${AR_PERIODS[period]}`}
            </ArabicCaption>
            <View style={styles.movedList}>
              <MovedRow
                label="السوق"
                value={signedAr(recap.market)}
                color={recap.market >= 0 ? Colors.verdigris : Colors.copper}
                isArabic
              />
              <MovedRow label="الإضافات" value={signedAr(recap.contributions)} color={Colors.bone} isArabic />
            </View>
            {lead ? (
              <Text style={styles.arNoteMeta}>
                {`${AR_CLASS_LABEL[lead.assetClass]} · `}
                {signedAr(lead.change)}
              </Text>
            ) : null}
          </View>
        ) : null}

        {movers.length > 0 ? (
          <View>
            <ArabicCaption style={styles.sectionCaption}>الأكثر تحرّكًا</ArabicCaption>
            {movers.map((mover, index) => (
              <MoverRow
                key={mover.holding.id}
                holdingId={mover.holding.id}
                name={mover.instrument?.name ?? mover.holding.name ?? ''}
                ticker={mover.instrument?.symbol ?? ''}
                value={moverValue(mover)}
                color={mover.valueChange >= 0 ? Colors.verdigris : Colors.copper}
                isArabic
                hasBorder={index > 0}
                onPress={openHolding}
              />
            ))}
          </View>
        ) : null}

        <Pressable accessibilityRole="button" onPress={openAllocation}>
          <ArabicCaption style={styles.sectionCaption}>التوزيع</ArabicCaption>
          <View style={styles.allocationBar}>
            {allocation.map((slice) => (
              <View
                key={slice.assetClass}
                style={{
                  flex: Math.round(slice.weight),
                  backgroundColor: AssetClassColors[slice.assetClass],
                }}
              />
            ))}
          </View>
          <View style={styles.allocationLegend}>
            {allocation.map((slice) => (
              <Text key={slice.assetClass} style={styles.arLegend}>
                {AR_CLASS_LABEL[slice.assetClass]}{' '}
                {formatNumber(Math.round(slice.weight), { numeralSystem: 'arabic' })}
              </Text>
            ))}
          </View>
        </Pressable>

        <View>
          <ArabicCaption style={styles.sectionCaption}>ملاحظة · اليوم</ArabicCaption>
          <Text style={styles.arNote}>
            العملات الرقمية تسببت في ٦٢٪ من تغيّر اليوم بينما تشكّل ٩٪ من المجموع.
          </Text>
          <Text style={styles.arNoteMeta}>
            تركّز ·{' '}
            <Text accessibilityRole="link" style={styles.link} onPress={openAllocation}>
              مراجعة التوزيع
            </Text>
          </Text>
        </View>

        <View>
          <ArabicCaption style={styles.sectionCaption}>الأحدث</ArabicCaption>
          <Pressable accessibilityRole="button" style={styles.recentRow} onPress={openActivity}>
            <Text style={styles.arRecentText}>
              توزيعات أرباح · <Text style={styles.ticker}>{symbolOf(dividend?.holdingId ?? null)}</Text>
            </Text>
            <Text style={styles.arRecentText}>
              {dividend
                ? `‎${formatSignedCurrency(dividend.amount, baseCurrency, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}‎`
                : ''}
            </Text>
          </Pressable>
        </View>
      </DirectionView>
    </ScrollView>
  );
}

export default function HomeScreen() {
  const { locale } = useLocale();
  return locale === 'ar' ? <ArabicHome /> : <EnglishHome />;
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
    gap: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: Fonts.newsreader13,
    fontSize: 13,
    color: Colors.ash,
  },
  avatarLetterAr: {
    fontFamily: Fonts.naskh,
    fontSize: 14,
    color: Colors.ash,
  },
  brassRule: {
    height: 1,
    width: 64,
    backgroundColor: Colors.brass,
    marginTop: 12,
    marginBottom: 18,
  },
  hero: {
    fontFamily: Fonts.newsreaderLight56,
    fontSize: 56,
    lineHeight: 60,
    letterSpacing: -1.12,
    color: Colors.bone,
    fontVariant: ['tabular-nums'],
  },
  arHero: {
    fontFamily: Fonts.newsreaderLight56,
    fontSize: 56,
    lineHeight: 72,
    letterSpacing: -1.12,
    color: Colors.bone,
    fontVariant: ['tabular-nums'],
    writingDirection: 'ltr',
    textAlign: 'right',
  },
  heroDecimal: {
    color: Colors.slate,
  },
  arHeroCurrency: {
    fontFamily: Fonts.plexArabic,
    fontSize: 22,
    color: Colors.ash,
  },
  deltas: {
    flexDirection: 'column',
    gap: 4,
    marginTop: 14,
  },
  delta: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
  },
  arDelta: {
    fontFamily: Fonts.plexArabic,
    fontSize: 15,
    lineHeight: 22,
    fontVariant: ['tabular-nums'],
  },
  gain: {
    color: Colors.verdigris,
  },
  loss: {
    color: Colors.copper,
  },
  chartWrap: {
    marginTop: 12,
  },
  chart: {
    width: '100%',
    aspectRatio: 354 / 96,
  },
  mirrored: {
    transform: [{ scaleX: -1 }],
  },
  sectionCaption: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    paddingTop: 12,
  },
  allocationBar: {
    flexDirection: 'row',
    gap: 4,
    height: 6,
    marginTop: 14,
    borderRadius: 1,
    overflow: 'hidden',
  },
  allocationLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  legend: {
    fontFamily: Fonts.manrope,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.ash,
    fontVariant: ['tabular-nums'],
  },
  arLegend: {
    fontFamily: Fonts.plexArabic,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.ash,
    fontVariant: ['tabular-nums'],
  },
  movedList: {
    marginTop: 12,
  },
  note: {
    fontFamily: Fonts.newsreader20,
    fontSize: 20,
    lineHeight: 26,
    color: Colors.bone,
    marginTop: 10,
  },
  arNote: {
    fontFamily: Fonts.naskh,
    fontSize: 21,
    lineHeight: 34,
    color: Colors.bone,
    marginTop: 10,
  },
  noteMeta: {
    fontFamily: Fonts.manrope,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.slate,
    marginTop: 8,
  },
  arNoteMeta: {
    fontFamily: Fonts.plexArabic,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.slate,
    marginTop: 8,
  },
  link: {
    color: Colors.brass,
  },
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
  },
  recentRowDivided: {
    height: 49,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
  },
  movedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 40,
  },
  recentText: {
    fontFamily: Fonts.manrope,
    fontSize: 15,
    color: Colors.bone,
    fontVariant: ['tabular-nums'],
  },
  arRecentText: {
    fontFamily: Fonts.plexArabic,
    fontSize: 15,
    color: Colors.bone,
    fontVariant: ['tabular-nums'],
  },
  ticker: {
    fontFamily: Fonts.plexMono,
    fontSize: 12,
    writingDirection: 'ltr',
  },
  arCaption: {
    fontFamily: Fonts.plexArabicMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    color: Colors.slate,
  },
  brassDash: {
    color: Colors.brass,
  },
});
