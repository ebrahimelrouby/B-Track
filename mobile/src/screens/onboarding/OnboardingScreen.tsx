import React, { useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius } from '@/theme';
import Button from '@/components/common/Button';
import ProgressBar from '@/components/common/ProgressBar';
import { userApi } from '@/api/user.api';
import { useAuthStore } from '@/store/auth.store';

import PersonalInfoStep from './steps/PersonalInfoStep';
import FitnessGoalStep from './steps/FitnessGoalStep';
import ActivityLevelStep from './steps/ActivityLevelStep';
import ExperienceStep from './steps/ExperienceStep';
import GoalsStep from './steps/GoalsStep';
import SummaryStep from './steps/SummaryStep';

const { width } = Dimensions.get('window');

export interface OnboardingData {
  gender?: string;
  dateOfBirth?: string;
  heightCm?: number;
  weightKg?: number;
  targetWeightKg?: number;
  fitnessGoal?: string;
  activityLevel?: string;
  trainingExperience?: string;
  dietaryPreference?: string;
  waterGoalMl?: number;
  stepsGoal?: number;
  sleepGoalHours?: number;
}

const STEPS = [
  { key: 'personal', titleKey: 'onboarding.stepPersonalTitle', component: PersonalInfoStep },
  { key: 'goal', titleKey: 'onboarding.stepGoalTitle', component: FitnessGoalStep },
  { key: 'activity', titleKey: 'onboarding.stepActivityTitle', component: ActivityLevelStep },
  { key: 'experience', titleKey: 'onboarding.stepExperienceTitle', component: ExperienceStep },
  { key: 'goals', titleKey: 'onboarding.stepTargetsTitle', component: GoalsStep },
  { key: 'summary', titleKey: 'onboarding.stepSummaryTitle', component: SummaryStep },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { setAuth, user } = useAuthStore();
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({});
  const [saving, setSaving] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const isLastStep = currentStep === STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleFinish();
    } else {
      const next = currentStep + 1;
      setCurrentStep(next);
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
    }
  };

  const handleBack = () => {
    if (currentStep === 0) return;
    const prev = currentStep - 1;
    setCurrentStep(prev);
    flatListRef.current?.scrollToIndex({ index: prev, animated: true });
  };

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await userApi.updateProfile({
        ...data,
        heightCm: data.heightCm,
        weightKg: data.weightKg,
        targetWeightKg: data.targetWeightKg,
        fitnessGoal: data.fitnessGoal,
        activityLevel: data.activityLevel,
        trainingExperience: data.trainingExperience,
        dietaryPreference: data.dietaryPreference,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        targetWaterMl: data.waterGoalMl ?? 2500,
        targetSteps: data.stepsGoal ?? 8000,
        targetSleepHours: data.sleepGoalHours ?? 8,
      });
      if (user) {
        setAuth({ ...user, onboardingComplete: true });
      }
    } catch (err) {
      Alert.alert(t('onboarding.errorTitle'), t('onboarding.errorMsg'));
    } finally {
      setSaving(false);
    }
  };

  const StepComponent = STEPS[currentStep].component;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Progress */}
      <View style={styles.progressContainer}>
        <Text style={styles.stepCount}>{currentStep + 1} / {STEPS.length}</Text>
        <ProgressBar
          progress={(currentStep + 1) / STEPS.length}
          style={{ flex: 1, marginLeft: Spacing.md }}
        />
      </View>

      {/* Step title */}
      <Text style={styles.stepTitle}>{t(STEPS[currentStep].titleKey as any)}</Text>

      {/* Step content */}
      <ScrollView
        style={styles.stepContent}
        contentContainerStyle={styles.stepContentInner}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <StepComponent data={data} onChange={updateData} />
      </ScrollView>

      {/* Navigation */}
      <View style={[styles.nav, { paddingBottom: insets.bottom + Spacing.base }]}>
        {currentStep > 0 && (
          <Button
            title={t('onboarding.backBtn')}
            variant="secondary"
            onPress={handleBack}
            style={styles.backButton}
          />
        )}
        <Button
          title={isLastStep ? t('onboarding.getStartedBtn') : t('onboarding.continueBtn')}
          onPress={handleNext}
          loading={saving}
          style={styles.nextButton}
        />
      </View>
    </View>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background,
      padding: Spacing['2xl'],
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    stepCount: {
      fontSize: Typography.sm,
      color: c.textTertiary,
      fontWeight: Typography.medium,
      minWidth: 36,
    },
    stepTitle: {
      fontSize: Typography['2xl'],
      fontWeight: Typography.bold,
      color: c.textPrimary,
      marginBottom: Spacing['2xl'],
      lineHeight: 34,
    },
    stepContent: {
      flex: 1,
    },
    stepContentInner: {
      paddingBottom: Spacing.base,
    },
    nav: {
      flexDirection: 'row',
      gap: Spacing.md,
      paddingTop: Spacing.base,
    },
    backButton: {
      flex: 1,
    },
    nextButton: {
      flex: 2,
    },
  });
}
