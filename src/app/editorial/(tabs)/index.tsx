import { router } from 'expo-router';
import { useState } from 'react';
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

const CHART_AREA =
  'M0 70 C30 66 50 74 80 60 S130 40 160 48 S210 30 240 34 S290 18 320 22 L354 14 V96 H0Z';
const CHART_LINE = 'M0 70 C30 66 50 74 80 60 S130 40 160 48 S210 30 240 34 S290 18 320 22 L354 14';

const allocation = [
  { flex: 46, color: AssetClassColors.stocks },
  { flex: 9, color: AssetClassColors.crypto },
  { flex: 31, color: AssetClassColors.property },
  { flex: 6, color: AssetClassColors.cash },
  { flex: 8, color: AssetClassColors.savings },
];

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

function EnglishHome() {
  const [period, setPeriod] = useState(1);
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
          $1,284,930<Text style={styles.heroDecimal}>.42</Text>
        </Text>
        <View style={styles.deltas}>
          <Text style={[styles.delta, styles.gain]}>▲ +$12,410 · 0.98% · past 30 days</Text>
          <Text style={[styles.delta, styles.loss]}>▼ −$3,102 · 0.24% · today</Text>
        </View>
      </View>

      <View>
        <PeriodSelector
          options={['1W', '1M', '1Y', 'All']}
          selectedIndex={period}
          onSelect={setPeriod}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Performance"
          style={styles.chartWrap}
          onPress={() => router.push('/editorial/performance')}>
          <HomeChart gradientId="homeChartEn" />
        </Pressable>
      </View>

      <Pressable accessibilityRole="button" onPress={() => router.push('/editorial/allocation')}>
        <Caption style={styles.sectionCaption}>Allocation</Caption>
        <View style={styles.allocationBar}>
          {allocation.map((segment, index) => (
            <View key={index} style={{ flex: segment.flex, backgroundColor: segment.color }} />
          ))}
        </View>
        <View style={styles.allocationLegend}>
          <Text style={styles.legend}>Stocks 46</Text>
          <Text style={styles.legend}>Crypto 9</Text>
          <Text style={styles.legend}>Property 31</Text>
          <Text style={styles.legend}>Cash 6</Text>
          <Text style={styles.legend}>Savings 8</Text>
        </View>
      </Pressable>

      <View>
        <Caption style={styles.sectionCaption}>Note · Today</Caption>
        <Text style={styles.note}>
          Crypto moved 62% of today&apos;s change while holding 9% of the total.
        </Text>
        <Text style={styles.noteMeta}>
          Concentration ·{' '}
          <Text
            accessibilityRole="link"
            style={styles.link}
            onPress={() => router.push('/editorial/allocation')}>
            Review allocation
          </Text>
        </Text>
      </View>

      <View>
        <Caption style={styles.sectionCaption}>Recent</Caption>
        <Pressable
          accessibilityRole="button"
          style={styles.recentRow}
          onPress={() => router.push('/editorial/activity')}>
          <Text style={styles.recentText}>Dividend · MSFT</Text>
          <Text style={styles.recentText}>+$184.20</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={[styles.recentRow, styles.recentRowDivided]}
          onPress={() => router.push('/editorial/activity')}>
          <Text style={styles.recentText}>Buy · 50 AAPL</Text>
          <Text style={styles.recentText}>−$12,410.00</Text>
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
            {'⁦'}١٬٢٨٤٬٩٣٠<Text style={styles.heroDecimal}>٫٤٢</Text>{' '}
            <Text style={styles.arHeroCurrency}>$</Text>
            {'⁩'}
          </Text>
          <View style={styles.deltas}>
            <Text style={[styles.arDelta, styles.gain]}>
              ▲ ارتفاع ٠٫٩٨٪ · ‎+$12,410‎ · آخر ٣٠ يومًا
            </Text>
            <Text style={[styles.arDelta, styles.loss]}>▼ انخفاض ٠٫٢٤٪ · ‎−$3,102‎ · اليوم</Text>
          </View>
        </View>

        <View>
          <PeriodSelector
            options={['أسبوع', 'شهر', 'سنة', 'الكل']}
            selectedIndex={period}
            onSelect={setPeriod}
            isArabic
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Performance"
            style={styles.chartWrap}
            onPress={() => router.push('/editorial/performance')}>
            <HomeChart gradientId="homeChartAr" isMirrored />
          </Pressable>
        </View>

        <Pressable accessibilityRole="button" onPress={() => router.push('/editorial/allocation')}>
          <ArabicCaption style={styles.sectionCaption}>التوزيع</ArabicCaption>
          <View style={styles.allocationBar}>
            {allocation.map((segment, index) => (
              <View key={index} style={{ flex: segment.flex, backgroundColor: segment.color }} />
            ))}
          </View>
          <View style={styles.allocationLegend}>
            <Text style={styles.arLegend}>أسهم ٤٦</Text>
            <Text style={styles.arLegend}>عملات ٩</Text>
            <Text style={styles.arLegend}>عقارات ٣١</Text>
            <Text style={styles.arLegend}>نقد ٦</Text>
            <Text style={styles.arLegend}>مدخرات ٨</Text>
          </View>
        </Pressable>

        <View>
          <ArabicCaption style={styles.sectionCaption}>ملاحظة · اليوم</ArabicCaption>
          <Text style={styles.arNote}>
            العملات الرقمية تسببت في ٦٢٪ من تغيّر اليوم بينما تشكّل ٩٪ من المجموع.
          </Text>
          <Text style={styles.arNoteMeta}>
            تركّز ·{' '}
            <Text
              accessibilityRole="link"
              style={styles.link}
              onPress={() => router.push('/editorial/allocation')}>
              مراجعة التوزيع
            </Text>
          </Text>
        </View>

        <View>
          <ArabicCaption style={styles.sectionCaption}>الأحدث</ArabicCaption>
          <Pressable
            accessibilityRole="button"
            style={styles.recentRow}
            onPress={() => router.push('/editorial/activity')}>
            <Text style={styles.arRecentText}>
              توزيعات أرباح · <Text style={styles.ticker}>MSFT</Text>
            </Text>
            <Text style={styles.arRecentText}>‎+$184.20‎</Text>
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
