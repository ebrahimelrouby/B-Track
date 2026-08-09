import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { useColors, ColorPalette, Radius, Spacing, Shadows } from '@/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  elevated?: boolean;
  accent?: boolean;
}

export default function Card({ children, style, onPress, elevated, accent }: CardProps) {
  const colors = useColors();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const content = (
    <View style={[styles.card, elevated && Shadows.md, accent && styles.accentBorder, style]}>
      {children}
    </View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.8}>{content}</TouchableOpacity>;
  }
  return content;
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface, borderRadius: Radius.lg,
      padding: Spacing.base, borderWidth: 1, borderColor: c.surfaceBorder,
    },
    accentBorder: { borderColor: c.primary, borderWidth: 1 },
  });
}
