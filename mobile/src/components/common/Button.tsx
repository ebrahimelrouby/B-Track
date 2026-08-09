import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useColors, ColorPalette, Radius, Spacing, Typography } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export default function Button({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const handlePress = () => {
    if (disabled || loading) return;
    ReactNativeHapticFeedback.trigger('impactLight');
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.75}
      disabled={disabled || loading}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.textInverse : colors.primary}
        />
      ) : (
        <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`], textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    base: {
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    fullWidth: {
      width: '100%',
    },
    disabled: {
      opacity: 0.4,
    },

    // Variants
    primary: {
      backgroundColor: c.primary,
    },
    secondary: {
      backgroundColor: c.surfaceElevated,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    danger: {
      backgroundColor: c.error,
    },

    // Sizes
    size_sm: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
    size_md: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.base },
    size_lg: { paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.lg },

    // Text
    text: {
      fontWeight: Typography.semibold,
    },
    text_primary: { color: c.textInverse },
    text_secondary: { color: c.textPrimary },
    text_ghost: { color: c.primary },
    text_danger: { color: c.textPrimary },

    textSize_sm: { fontSize: Typography.sm },
    textSize_md: { fontSize: Typography.base },
    textSize_lg: { fontSize: Typography.md },
  });
}
