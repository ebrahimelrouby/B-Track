import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useColors, Radius } from '@/theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
  style?: ViewStyle;
  height?: number;
}

export default function ProgressBar({
  progress,
  color,
  style,
  height = 6,
}: ProgressBarProps) {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors.surfaceBorder), [colors.surfaceBorder]);
  const clampedProgress = Math.max(0, Math.min(1, progress));

  return (
    <View style={[styles.track, { height }, style]}>
      <View
        style={[
          styles.fill,
          { width: `${clampedProgress * 100}%`, backgroundColor: color ?? colors.primary, height },
        ]}
      />
    </View>
  );
}

function getStyles(trackColor: string) {
  return StyleSheet.create({
    track: {
      backgroundColor: trackColor,
      borderRadius: Radius.full,
      overflow: 'hidden',
    },
    fill: {
      borderRadius: Radius.full,
    },
  });
}
