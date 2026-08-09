import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius } from '@/theme';
import { OnboardingData } from '../OnboardingScreen';

interface Props {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
}

// Labels built inside component via t()

const GOAL_ICONS: Record<string, string> = {
  LOSE_FAT: 'fire',
  MAINTAIN: 'scale-balance',
  GAIN_MUSCLE: 'dumbbell',
};

function estimateCalories(data: OnboardingData): number | null {
  if (!data.weightKg || !data.heightCm || !data.dateOfBirth || !data.activityLevel) return null;
  const age = new Date().getFullYear() - new Date(data.dateOfBirth).getFullYear();
  const bmr = data.gender === 'FEMALE'
    ? 10 * data.weightKg + 6.25 * data.heightCm - 5 * age - 161
    : 10 * data.weightKg + 6.25 * data.heightCm - 5 * age + 5;

  const multipliers: Record<string, number> = {
    SEDENTARY: 1.2, LIGHTLY_ACTIVE: 1.375, MODERATELY_ACTIVE: 1.55,
    VERY_ACTIVE: 1.725, EXTRA_ACTIVE: 1.9,
  };
  const tdee = bmr * (multipliers[data.activityLevel] ?? 1.4);
  const goalMultiplier = data.fitnessGoal === 'LOSE_FAT' ? 0.8 : data.fitnessGoal === 'GAIN_MUSCLE' ? 1.1 : 1;
  return Math.round(tdee * goalMultiplier);
}

export default function SummaryStep({ data }: Props) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const GOAL_LABELS: Record<string, string> = {
    LOSE_FAT:    t('onboarding.goalLoseFatFull'),
    MAINTAIN:    t('onboarding.goalMaintainFull'),
    GAIN_MUSCLE: t('onboarding.goalGainMuscleFull'),
  };
  const ACTIVITY_LABELS: Record<string, string> = {
    SEDENTARY:         t('onboarding.levelSedentaryFull'),
    LIGHTLY_ACTIVE:    t('onboarding.levelLightlyActiveFull'),
    MODERATELY_ACTIVE: t('onboarding.levelModeratelyActiveFull'),
    VERY_ACTIVE:       t('onboarding.levelVeryActiveFull'),
    EXTRA_ACTIVE:      t('onboarding.levelExtraActiveFull'),
  };
  const calories = estimateCalories(data);
  const protein = data.weightKg ? Math.round(data.weightKg * 2) : null;
  const fats = calories ? Math.round(calories * 0.25 / 9) : null;
  const carbs = calories && protein && fats
    ? Math.round((calories - protein * 4 - fats * 9) / 4)
    : null;

  const waterL = data.waterGoalMl ? (data.waterGoalMl / 1000).toFixed(1) : '2.5';
  const steps = data.stepsGoal?.toLocaleString() ?? '8,000';

  const goalIcon = GOAL_ICONS[data.fitnessGoal ?? ''] ?? 'lightning-bolt';

  const profileRows = [
    { label: t('onboarding.summaryGoalLabel'),       value: GOAL_LABELS[data.fitnessGoal ?? ''] ?? '—', icon: 'flag-outline' },
    { label: t('onboarding.summaryActivityLabel'),   value: ACTIVITY_LABELS[data.activityLevel ?? ''] ?? '—', icon: 'run' },
    { label: t('onboarding.summaryExperienceLabel'), value: data.trainingExperience ?? '—', icon: 'school-outline' },
    { label: t('onboarding.summaryHeightLabel'),     value: data.heightCm ? `${data.heightCm} cm` : '—', icon: 'human-male-height' },
    { label: t('onboarding.summaryWeightLabel'),     value: data.weightKg ? `${data.weightKg} kg` : '—', icon: 'weight-kilogram' },
    { label: t('onboarding.summaryTargetLabel'),     value: data.targetWeightKg ? `${data.targetWeightKg} kg` : '—', icon: 'target' },
  ];

  return (
    <View style={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroIconRing}>
          <View style={styles.heroIconInner}>
            <Icon name={goalIcon} size={28} color={colors.primary} />
          </View>
        </View>
        <View style={styles.heroBadge}>
          <Icon name="check-bold" size={10} color="#000" />
        </View>
        <Text style={styles.heroTitle}>{t('onboarding.summaryAllSet')}</Text>
        <Text style={styles.heroSub}>{t('onboarding.summaryAllSetDesc')}</Text>
      </View>

      {/* Profile rows */}
      <Text style={styles.sectionTitle}>{t('onboarding.summaryProfile')}</Text>
      <View style={styles.card}>
        {profileRows.map((row, i) => (
          <View key={row.label} style={[styles.row, i < profileRows.length - 1 && styles.rowBorder]}>
            <View style={styles.rowLeft}>
              <Icon name={row.icon} size={14} color={colors.textTertiary} style={styles.rowIcon} />
              <Text style={styles.rowLabel}>{row.label}</Text>
            </View>
            <Text style={styles.rowValue}>{row.value}</Text>
          </View>
        ))}
      </View>

      {/* Daily targets */}
      {calories && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>{t('onboarding.summaryNutrition')}</Text>
          <View style={styles.macrosGrid}>
            <MacroCell label={t('onboarding.summaryCalories')} value={`${calories}`} unit="kcal" accent />
            <MacroCell label={t('onboarding.summaryProtein')} value={`${protein}`} unit="g" />
            <MacroCell label={t('onboarding.summaryCarbs')} value={`${carbs}`} unit="g" />
            <MacroCell label={t('onboarding.summaryFats')} value={`${fats}`} unit="g" />
          </View>
        </>
      )}

      {/* Activity targets */}
      <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>{t('onboarding.summaryActivity')}</Text>
      <View style={styles.activityRow}>
        <View style={[styles.activityCard, { borderColor: '#60A5FA44' }]}>
          <View style={[styles.activityIcon, { backgroundColor: '#1A3A5C' }]}>
            <Icon name="water" size={18} color="#60A5FA" />
          </View>
          <Text style={styles.activityValue}>{waterL} L</Text>
          <Text style={styles.activityLabel}>{t('onboarding.summaryWater')}</Text>
        </View>
        <View style={[styles.activityCard, { borderColor: colors.primary + '44' }]}>
          <View style={[styles.activityIcon, { backgroundColor: colors.primaryDim }]}>
            <Icon name="walk" size={18} color={colors.primary} />
          </View>
          <Text style={styles.activityValue}>{steps}</Text>
          <Text style={styles.activityLabel}>{t('onboarding.summarySteps')}</Text>
        </View>
      </View>

      <Text style={styles.disclaimer}>
        {t('onboarding.summaryDisclaimer')}
      </Text>
    </View>
  );
}

function MacroCell({ label, value, unit, accent }: { label: string; value: string | null; unit: string; accent?: boolean }) {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  return (
    <View style={[styles.macroCell, accent && styles.macroCellAccent]}>
      <Text style={[styles.macroValue, accent && styles.macroValueAccent]}>{value ?? '—'}</Text>
      <Text style={[styles.macroUnit, accent && styles.macroUnitAccent]}>{unit}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { gap: 0 },

    // Hero
    hero: {
      alignItems: 'center',
      paddingVertical: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    heroIconRing: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 2,
      borderColor: c.primary + '44',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.md,
    },
    heroIconInner: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: c.primaryDim,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroBadge: {
      position: 'absolute',
      top: Spacing.lg + 52,
      right: '50%',
      marginRight: -32,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: c.background,
    },
    heroTitle: {
      fontSize: Typography['2xl'],
      fontWeight: Typography.bold,
      color: c.textPrimary,
      marginBottom: Spacing.xs,
    },
    heroSub: {
      fontSize: Typography.sm,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      paddingHorizontal: Spacing.xl,
    },

    sectionTitle: {
      fontSize: Typography.xs,
      fontWeight: Typography.semibold,
      color: c.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: Spacing.sm,
    },

    // Profile card
    card: {
      backgroundColor: c.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      overflow: 'hidden',
      marginBottom: 0,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
    },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: c.surfaceBorder },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    rowIcon: {},
    rowLabel: { fontSize: Typography.sm, color: c.textSecondary },
    rowValue: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: c.textPrimary },

    // Macros
    macrosGrid: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: 0,
    },
    macroCell: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: Spacing.sm,
      alignItems: 'center',
    },
    macroCellAccent: {
      borderColor: c.primary,
      backgroundColor: c.primaryDim,
    },
    macroValue: {
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
      color: c.textPrimary,
    },
    macroValueAccent: { color: c.primary },
    macroUnit: { fontSize: Typography.xs, color: c.textTertiary, marginTop: -2 },
    macroUnitAccent: { color: c.primary },
    macroLabel: { fontSize: Typography.xs, color: c.textSecondary, marginTop: Spacing.xs },

    // Activity
    activityRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    activityCard: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      padding: Spacing.base,
      alignItems: 'center',
      gap: Spacing.xs,
    },
    activityIcon: {
      width: 40,
      height: 40,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xs,
    },
    activityValue: {
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      color: c.textPrimary,
    },
    activityLabel: { fontSize: Typography.xs, color: c.textSecondary },

    disclaimer: {
      fontSize: Typography.xs,
      color: c.textTertiary,
      textAlign: 'center',
      marginTop: Spacing.lg,
      lineHeight: 18,
      paddingHorizontal: Spacing.md,
    },
  });
}
