import React, { forwardRef, useMemo } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { useColors, ColorPalette, Radius, Spacing, Typography } from '@/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  rightElement?: React.ReactNode;
}

const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, containerStyle, rightElement, style, ...props }, ref) => {
    const colors = useColors();
    const styles = useMemo(() => getStyles(colors), [colors]);

    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View style={[styles.inputWrapper, error && styles.inputError]}>
          <TextInput
            ref={ref}
            style={[styles.input, style]}
            placeholderTextColor={colors.textTertiary}
            selectionColor={colors.primary}
            {...props}
          />
          {rightElement}
        </View>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    );
  }
);

Input.displayName = 'Input';
export default Input;

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      marginBottom: Spacing.base,
    },
    label: {
      fontSize: Typography.sm,
      fontWeight: Typography.medium,
      color: c.textSecondary,
      marginBottom: Spacing.xs,
    },
    inputWrapper: {
      backgroundColor: c.surfaceElevated,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      flexDirection: 'row',
      alignItems: 'center',
    },
    inputError: {
      borderColor: c.error,
    },
    input: {
      flex: 1,
      color: c.textPrimary,
      fontSize: Typography.base,
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
      minHeight: 50,
    },
    error: {
      fontSize: Typography.xs,
      color: c.error,
      marginTop: Spacing.xs,
    },
  });
}
