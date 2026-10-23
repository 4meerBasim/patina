export const Colors = {
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
  inkScrim: 'rgba(14,15,13,0.55)',
} as const;

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
