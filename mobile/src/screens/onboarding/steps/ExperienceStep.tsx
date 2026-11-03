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

export default function ExperienceStep({ data, onChange }: Props) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const EXPERIENCES = [
    { value: 'BEGINNER',     label: t('onboarding.expBeginner'),     icon: 'sprout',   description: t('onboarding.expBeginnerDesc') },
    { value: 'INTERMEDIATE', label: t('onboarding.expIntermediate'), icon: 'dumbbell', description: t('onboarding.expIntermediateDesc') },
    { value: 'ADVANCED',     label: t('onboarding.expAdvanced'),     icon: 'trophy',   description: t('onboarding.expAdvancedDesc') },
  ];
  return (
    <View style={styles.container}>
      {EXPERIENCES.map((exp) => {
        const selected = data.trainingExperience === exp.value;
        return (
          <TouchableOpacity
            key={exp.value}
            style={[styles.card, selected && styles.cardSelected]}
            onPress={() => onChange({ trainingExperience: exp.value })}
            activeOpacity={0.8}
          >
            <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
              <Icon name={exp.icon} size={22} color={selected ? colors.primary : colors.textSecondary} />
            </View>
            <View style={styles.textGroup}>
              <Text style={[styles.label, selected && styles.labelSelected]}>{exp.label}</Text>
              <Text style={styles.description}>{exp.description}</Text>
            </View>
            <View style={[styles.radio, selected && styles.radioSelected]}>
              {selected && <View style={styles.radioDot} />}
            </View>
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
    cardSelected: { borderColor: c.primary, backgroundColor: c.primaryDim },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: Radius.md,
      backgroundColor: c.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
      marginEnd: Spacing.base,
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
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: c.surfaceBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioSelected: { borderColor: c.primary },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.primary },
  });
}
