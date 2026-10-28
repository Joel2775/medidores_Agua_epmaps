import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { COLORS, RADIUS, SHADOWS } from '@/constants/epmaps-theme';

type ClayCardProps = PropsWithChildren<{ style?: ViewStyle }>;

export function ClayCard({ children, style }: ClayCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.large,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 20,
    ...SHADOWS.soft,
  },
});
