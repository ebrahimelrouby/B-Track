import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, ViewStyle, KeyboardAvoidingView, Platform, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, ColorPalette } from '@/theme';

interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  onRefresh?: () => void;
  refreshing?: boolean;
  keyboardAvoiding?: boolean;
}

export default function Screen({
  children,
  scrollable = false,
  style,
  contentStyle,
  onRefresh,
  refreshing = false,
  keyboardAvoiding = false,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const container = (
    <View style={[styles.root, { paddingBottom: insets.bottom }, style]}>
      {scrollable ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, contentStyle]}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, contentStyle]}>{children}</View>
      )}
    </View>
  );

  if (keyboardAvoiding) {
    return (
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {container}
      </KeyboardAvoidingView>
    );
  }

  return container;
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
  });
}
