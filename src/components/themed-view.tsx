import { StyleSheet, View, type ViewProps } from 'react-native';

import { COLORS } from '@/constants/epmaps-theme';
import { ThemeColor } from '@/constants/theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  return <View style={[styles[type ?? 'background'], style]} {...otherProps} />;
}

const styles = StyleSheet.create({
  text: { backgroundColor: COLORS.textPrimary },
  background: { backgroundColor: COLORS.background },
  backgroundElement: { backgroundColor: COLORS.surface },
  backgroundSelected: { backgroundColor: COLORS.surfaceSecondary },
  textSecondary: { backgroundColor: COLORS.textSecondary },
});
