import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius } from '@/theme';
import { OnboardingData } from '../OnboardingScreen';

interface Props {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
}

export default function FitnessGoalStep({ data, onChange }: Props) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const GOALS = [
    {
      value: 'LOSE_FAT',
      label: t('onboarding.goalLoseFat'),
      icon: 'fire',
      description: t('onboarding.goalLoseFatDesc'),
    },
    {
      value: 'MAINTAIN',
      label: t('onboarding.goalMaintain'),
      icon: 'scale-balance',
      description: t('onboarding.goalMaintainDesc'),
    },
    {
      value: 'GAIN_MUSCLE',
      label: t('onboarding.goalGainMuscle'),
      icon: 'dumbbell',
      description: t('onboarding.goalGainMuscleDesc'),
    },
  ];
  return (
    <View style={styles.container}>
      {GOALS.map((goal) => {
        const selected = data.fitnessGoal === goal.value;
        return (
          <TouchableOpacity
            key={goal.value}
            style={[styles.card, selected && styles.cardSelected]}
            onPress={() => onChange({ fitnessGoal: goal.value })}
            activeOpacity={0.8}
          >
            <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
              <Icon name={goal.icon} size={22} color={selected ? colors.primary : colors.textSecondary} />
            </View>
            <View style={styles.textGroup}>
              <Text style={[styles.label, selected && styles.labelSelected]}>{goal.label}</Text>
              <Text style={styles.description}>{goal.description}</Text>
            </View>
            {selected && (
              <View style={styles.checkWrap}>
                <Icon name="check-circle" size={20} color={colors.primary} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { gap: Spacing.md },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.base,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      backgroundColor: c.surface,
    },
    cardSelected: {
      borderColor: c.primary,
      backgroundColor: c.primaryDim,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: Radius.md,
      backgroundColor: c.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.base,
    },
    iconWrapSelected: { backgroundColor: c.primaryDim },
    textGroup: { flex: 1 },
    label: {
      fontSize: Typography.md,
      fontWeight: Typography.semibold,
      color: c.textPrimary,
      marginBottom: 2,
    },
    labelSelected: { color: c.primary },
    description: { fontSize: Typography.sm, color: c.textSecondary },
    checkWrap: { marginLeft: Spacing.sm },
  });
}
