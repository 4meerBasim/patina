import { View, type ViewProps } from 'react-native';

export function DirectionView({ isRtl, ...props }: ViewProps & { isRtl: boolean }) {
  return <View {...props} {...{ dir: isRtl ? 'rtl' : 'ltr' }} />;
}
