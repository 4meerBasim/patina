import { View, type ViewProps } from 'react-native';

export function DirectionView({ isRtl, style, ...props }: ViewProps & { isRtl: boolean }) {
  return <View {...props} style={[style, { direction: isRtl ? 'rtl' : 'ltr' }]} />;
}
