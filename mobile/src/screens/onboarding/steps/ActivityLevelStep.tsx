import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius } from '@/theme';
import { OnboardingData } from '../OnboardingScreen';

interface Props {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
}

export default function ActivityLevelStep({ data, onChange }: Props) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const LEVELS = [
    { value: 'SEDENTARY',          label: t('onboarding.levelSedentary'),         description: t('onboarding.levelSedentaryDesc') },
    { value: 'LIGHTLY_ACTIVE',     label: t('onboarding.levelLightlyActive'),     description: t('onboarding.levelLightlyActiveDesc') },
    { value: 'MODERATELY_ACTIVE',  label: t('onboarding.levelModeratelyActive'),  description: t('onboarding.levelModeratelyActiveDesc') },
    { value: 'VERY_ACTIVE',        label: t('onboarding.levelVeryActive'),        description: t('onboarding.levelVeryActiveDesc') },
    { value: 'EXTRA_ACTIVE',       label: t('onboarding.levelExtraActive'),       description: t('onboarding.levelExtraActiveDesc') },
  ];
  return (
    <View style={styles.container}>
      {LEVELS.map((level, index) => {
        const selected = data.activityLevel === level.value;
        return (
          <TouchableOpacity
            key={level.value}
            style={[styles.row, selected && styles.rowSelected]}
            onPress={() => onChange({ activityLevel: level.value })}
            activeOpacity={0.8}
          >
            <View style={[styles.dot, selected && styles.dotSelected]}>
              <Text style={[styles.dotText, selected && styles.dotTextSelected]}>
                {index + 1}
              </Text>
            </View>
            <View style={styles.text}>
              <Text style={[styles.label, selected && styles.labelSelected]}>{level.label}</Text>
              <Text style={styles.desc}>{level.description}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { gap: Spacing.sm },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      backgroundColor: c.surface,
    },
    rowSelected: { borderColor: c.primary, backgroundColor: c.primaryDim },
    dot: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    dotSelected: { backgroundColor: c.primary },
    dotText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: c.textSecondary },
    dotTextSelected: { color: c.textInverse },
    text: { flex: 1 },
    label: {
      fontSize: Typography.base,
      fontWeight: Typography.semibold,
      color: c.textPrimary,
      marginBottom: 2,
    },
    labelSelected: { color: c.primary },
    desc: { fontSize: Typography.xs, color: c.textTertiary },
  });
}
