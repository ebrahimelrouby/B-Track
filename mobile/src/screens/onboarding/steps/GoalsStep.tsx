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

interface StepperProps {
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onDecrement: () => void;
  onIncrement: () => void;
}

function Stepper({ value, min, max, format, onDecrement, onIncrement }: StepperProps) {
  const colors = useColors();
  const st = useMemo(() => getStyles(colors), [colors]);
  return (
    <View style={st.stepperRow}>
      <TouchableOpacity
        style={[st.stepBtn, value <= min && st.stepBtnDisabled]}
        onPress={onDecrement}
        disabled={value <= min}
        activeOpacity={0.7}
      >
        <Icon name="minus" size={18} color={value <= min ? colors.textTertiary : colors.textPrimary} />
      </TouchableOpacity>
      <Text style={st.stepValue}>{format(value)}</Text>
      <TouchableOpacity
        style={[st.stepBtn, value >= max && st.stepBtnDisabled]}
        onPress={onIncrement}
        disabled={value >= max}
        activeOpacity={0.7}
      >
        <Icon name="plus" size={18} color={value >= max ? colors.textTertiary : colors.textPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const WATER_DEFAULT = 2500;
const STEPS_DEFAULT = 8000;
const SLEEP_DEFAULT = 8;

export default function GoalsStep({ data, onChange }: Props) {
  const { t } = useTranslation();
  const colors = useColors();
  const st = useMemo(() => getStyles(colors), [colors]);
  const water = data.waterGoalMl ?? WATER_DEFAULT;
  const steps = data.stepsGoal ?? STEPS_DEFAULT;
  const sleepHours = data.sleepGoalHours ?? SLEEP_DEFAULT;

  return (
    <View style={st.container}>
      {/* Water */}
      <View style={st.card}>
        <View style={st.cardHeader}>
          <View style={[st.iconWrap, { backgroundColor: '#1A3A5C' }]}>
            <Icon name="water" size={22} color="#60A5FA" />
          </View>
          <View style={st.cardText}>
            <Text style={st.cardTitle}>{t('onboarding.waterGoalTitle')}</Text>
            <Text style={st.cardSub}>{t('onboarding.waterGoalDesc')}</Text>
          </View>
        </View>
        <Stepper
          value={water}
          min={500}
          max={6000}
          step={250}
          format={(v) => `${(v / 1000).toFixed(1)} L`}
          onDecrement={() => onChange({ waterGoalMl: Math.max(500, water - 250) })}
          onIncrement={() => onChange({ waterGoalMl: Math.min(6000, water + 250) })}
        />
        <View style={st.presets}>
          {[1500, 2000, 2500, 3000, 3500].map((v) => (
            <TouchableOpacity
              key={v}
              style={[st.preset, water === v && st.presetSelected]}
              onPress={() => onChange({ waterGoalMl: v })}
            >
              <Text style={[st.presetText, water === v && st.presetTextSelected]}>
                {v / 1000}L
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Steps */}
      <View style={st.card}>
        <View style={st.cardHeader}>
          <View style={[st.iconWrap, { backgroundColor: '#1A3A1A' }]}>
            <Icon name="walk" size={22} color={colors.primary} />
          </View>
          <View style={st.cardText}>
            <Text style={st.cardTitle}>{t('onboarding.stepsGoalTitle')}</Text>
            <Text style={st.cardSub}>{t('onboarding.stepsGoalDesc')}</Text>
          </View>
        </View>
        <Stepper
          value={steps}
          min={2000}
          max={25000}
          step={500}
          format={(v) => `${v.toLocaleString()} steps`}
          onDecrement={() => onChange({ stepsGoal: Math.max(2000, steps - 500) })}
          onIncrement={() => onChange({ stepsGoal: Math.min(25000, steps + 500) })}
        />
        <View style={st.presets}>
          {[5000, 7500, 10000, 12500, 15000].map((v) => (
            <TouchableOpacity
              key={v}
              style={[st.preset, steps === v && st.presetSelected]}
              onPress={() => onChange({ stepsGoal: v })}
            >
              <Text style={[st.presetText, steps === v && st.presetTextSelected]}>
                {v >= 1000 ? `${v / 1000}k` : v}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Sleep */}
      <View style={st.card}>
        <View style={st.cardHeader}>
          <View style={[st.iconWrap, { backgroundColor: '#2E1A5C' }]}>
            <Icon name="moon-waning-crescent" size={22} color="#A78BFA" />
          </View>
          <View style={st.cardText}>
            <Text style={st.cardTitle}>{t('onboarding.sleepGoalTitle')}</Text>
            <Text style={st.cardSub}>{t('onboarding.sleepGoalDesc')}</Text>
          </View>
        </View>
        <Stepper
          value={sleepHours}
          min={5}
          max={10}
          step={0.5}
          format={(v) => `${v}h`}
          onDecrement={() => onChange({ sleepGoalHours: Math.max(5, Math.round((sleepHours - 0.5) * 2) / 2) })}
          onIncrement={() => onChange({ sleepGoalHours: Math.min(10, Math.round((sleepHours + 0.5) * 2) / 2) })}
        />
        <View style={st.presets}>
          {[6, 7, 7.5, 8, 9].map((v) => (
            <TouchableOpacity
              key={v}
              style={[st.preset, sleepHours === v && st.presetSelected]}
              onPress={() => onChange({ sleepGoalHours: v })}
            >
              <Text style={[st.presetText, sleepHours === v && st.presetTextSelected]}>
                {v}h
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { gap: Spacing.base },
    card: {
      backgroundColor: c.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      padding: Spacing.base,
      gap: Spacing.md,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    iconWrap: {
      width: 46,
      height: 46,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardText: { flex: 1 },
    cardTitle: {
      fontSize: Typography.md,
      fontWeight: Typography.semibold,
      color: c.textPrimary,
    },
    cardSub: { fontSize: Typography.xs, color: c.textTertiary, marginTop: 2 },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.surfaceElevated,
      borderRadius: Radius.md,
      padding: Spacing.sm,
    },
    stepBtn: {
      width: 40,
      height: 40,
      borderRadius: Radius.md,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepBtnDisabled: { opacity: 0.4 },
    stepValue: {
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      color: c.textPrimary,
    },
    presets: { flexDirection: 'row', gap: Spacing.xs },
    preset: {
      flex: 1,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.sm,
      backgroundColor: c.surfaceElevated,
      alignItems: 'center',
    },
    presetSelected: { backgroundColor: c.primaryDim },
    presetText: { fontSize: Typography.xs, color: c.textSecondary, fontWeight: Typography.medium },
    presetTextSelected: { color: c.primary, fontWeight: Typography.semibold },
  });
}
