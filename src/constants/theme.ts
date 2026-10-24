import { DynamicColorIOS, Platform, type ColorValue } from 'react-native';

// The two palettes the design document specifies. Light is Paper rather than white: the
// app is meant to read like printed stock in either appearance.
export const DarkPalette = {
  ink: '#0E0F0D',
  surface1: '#161714',
  surface2: '#1E201C',
  hairline: '#2A2D28',
  bone: '#ECE8DF',
  ash: '#A8A499',
  slate: '#7E7B72',
  disabled: '#55544D',
  brass: '#C9A961',
  verdigris: '#7FB3A3',
  copper: '#C98A6B',
  stone: '#8E8B82',
  umber: '#8C6A4F',
  verdigrisDim: '#5F8A7E',
  destructive: '#A8654A',
  inkScrim: 'rgba(14,15,13,0.55)',
} as const;

export const LightPalette: Record<keyof typeof DarkPalette, string> = {
  ink: '#F4F1EA',
  surface1: '#EBE7DE',
  surface2: '#E2DDD2',
  hairline: '#D9D4C8',
  bone: '#1A1A17',
  ash: '#4A4740',
  slate: '#6E6B61',
  disabled: '#9A978D',
  brass: '#8F7434',
  verdigris: '#3D7A69',
  copper: '#A85E3E',
  stone: '#6E6B61',
  umber: '#7A5A41',
  verdigrisDim: '#4E7A6E',
  destructive: '#8E4F38',
  inkScrim: 'rgba(244,241,234,0.55)',
};

// DynamicColorIOS resolves per appearance inside a StyleSheet created at module scope, so
// the palette can flip without every screen rebuilding its styles. Appearance.setColorScheme
// is what the in-app picker drives, and iOS resolves these against it. Android has no
// equivalent that works from a static stylesheet, so it stays on the dark palette.
function themedPalette(): Record<keyof typeof DarkPalette, ColorValue> {
  if (Platform.OS !== 'ios') return { ...DarkPalette };
  const palette = {} as Record<keyof typeof DarkPalette, ColorValue>;
  for (const token of Object.keys(DarkPalette) as (keyof typeof DarkPalette)[]) {
    palette[token] = DynamicColorIOS({ dark: DarkPalette[token], light: LightPalette[token] });
  }
  return palette;
}

// Values that are the same in both appearances: translucent furniture, the two pure
// endpoints, and the tints. These stay plain strings because some are interpolated into
// boxShadow, which needs a colour it can read.
const Fixed = {
  black: '#000000',
  white: '#FFFFFF',
  glassFill: 'rgba(120,120,128,0.28)',
  segmentTrack: 'rgba(120,120,128,0.24)',
  glassBorder: 'rgba(255,255,255,0.15)',
  glassHighlight: 'rgba(255,255,255,0.15)',
  gainTint: 'rgba(127,179,163,0.16)',
  lossTint: 'rgba(201,138,107,0.16)',
  brassTint: 'rgba(201,169,97,0.18)',
  shadow: 'rgba(0,0,0,0.3)',
} as const;

export const Colors = { ...themedPalette(), ...Fixed };

// The design document allows two curves only: Settle for entrances and layout, Drift for
// state changes. Durations in ms, matching its stated ranges.
export const Motion = {
  settleEasing: [0.2, 0.8, 0.2, 1] as const,
  driftEasing: [0.4, 0, 0.2, 1] as const,
  settle: 320,
  drift: 220,
  reveal: 480,
  rule: 240,
  stagger: 40,
  rise: 12,
  digitDrift: 24,
} as const;

// Dynamic Type caps per role, from the design document: body, secondary, caption and data
// scale all the way; titles and headings to 1.6x; the hero and display figures stop at 1.3x
// and abbreviate instead. LARGE is the scale at which layouts respond rather than only grow.
export const TypeCap = {
  title: 1.6,
  heading: 1.6,
  hero: 1.3,
  display: 1.3,
  large: 1.2,
} as const;

export const TintRgb = {
  gain: '127,179,163',
  loss: '201,138,107',
} as const;

export const AssetClassColors = {
  stocks: Colors.bone,
  crypto: Colors.brass,
  property: Colors.umber,
  cash: Colors.ash,
  savings: Colors.verdigrisDim,
} as const;

export const Fonts = {
  newsreaderLight56: 'Newsreader-Light-56',
  newsreaderLight44: 'Newsreader-Light-44',
  newsreaderLight40: 'Newsreader-Light-40',
  newsreaderLight36: 'Newsreader-Light-36',
  newsreaderLight32: 'Newsreader-Light-32',
  newsreader24: 'Newsreader-Regular-24',
  newsreader22: 'Newsreader-Regular-22',
  newsreader20: 'Newsreader-Regular-20',
  newsreader18: 'Newsreader-Regular-18',
  newsreader15: 'Newsreader-Regular-15',
  newsreader13: 'Newsreader-Regular-13',
  newsreaderItalic13: 'Newsreader-Italic-13',
  manrope: 'Manrope-Regular',
  manropeMedium: 'Manrope-Medium',
  manropeSemiBold: 'Manrope-SemiBold',
  plexMono: 'IBMPlexMono-Regular',
  naskh: 'NotoNaskhArabic-Regular',
  plexArabic: 'IBMPlexSansArabic-Regular',
  plexArabicMedium: 'IBMPlexSansArabic-Medium',
} as const;

export const FontFiles = {
  [Fonts.newsreaderLight56]: require('@/assets/fonts/Newsreader-Light-56.ttf'),
  [Fonts.newsreaderLight44]: require('@/assets/fonts/Newsreader-Light-44.ttf'),
  [Fonts.newsreaderLight40]: require('@/assets/fonts/Newsreader-Light-40.ttf'),
  [Fonts.newsreaderLight36]: require('@/assets/fonts/Newsreader-Light-36.ttf'),
  [Fonts.newsreaderLight32]: require('@/assets/fonts/Newsreader-Light-32.ttf'),
  [Fonts.newsreader24]: require('@/assets/fonts/Newsreader-Regular-24.ttf'),
  [Fonts.newsreader22]: require('@/assets/fonts/Newsreader-Regular-22.ttf'),
  [Fonts.newsreader20]: require('@/assets/fonts/Newsreader-Regular-20.ttf'),
  [Fonts.newsreader18]: require('@/assets/fonts/Newsreader-Regular-18.ttf'),
  [Fonts.newsreader15]: require('@/assets/fonts/Newsreader-Regular-15.ttf'),
  [Fonts.newsreader13]: require('@/assets/fonts/Newsreader-Regular-13.ttf'),
  [Fonts.newsreaderItalic13]: require('@/assets/fonts/Newsreader-Italic-13.ttf'),
  [Fonts.manrope]: require('@/assets/fonts/Manrope-Regular.ttf'),
  [Fonts.manropeMedium]: require('@/assets/fonts/Manrope-Medium.ttf'),
  [Fonts.manropeSemiBold]: require('@/assets/fonts/Manrope-SemiBold.ttf'),
  [Fonts.plexMono]: require('@/assets/fonts/IBMPlexMono-Regular.ttf'),
  [Fonts.naskh]: require('@/assets/fonts/NotoNaskhArabic-Regular.ttf'),
  [Fonts.plexArabic]: require('@/assets/fonts/IBMPlexSansArabic-Regular.ttf'),
  [Fonts.plexArabicMedium]: require('@/assets/fonts/IBMPlexSansArabic-Medium.ttf'),
};
