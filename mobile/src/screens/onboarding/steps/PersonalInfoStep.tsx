import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius } from '@/theme';
import Input from '@/components/common/Input';
import { OnboardingData } from '../OnboardingScreen';

interface Props {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
}

// GENDERS built inside component with t()

const MAX_DATE = new Date();
const MIN_DATE = new Date(1920, 0, 1);

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function PersonalInfoStep({ data, onChange }: Props) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const GENDERS = [
    { label: t('onboarding.genderMale'), value: 'MALE' },
    { label: t('onboarding.genderFemale'), value: 'FEMALE' },
  ];
  const [showPicker, setShowPicker] = useState(false);

  const pickerDate = data.dateOfBirth
    ? new Date(data.dateOfBirth)
    : new Date(2000, 0, 1);

  const handleDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    setShowPicker(false);
    if (event.type === 'set' && selected) {
      const iso = selected.toISOString().split('T')[0];
      onChange({ dateOfBirth: iso });
    }
  };

  return (
    <View>
      {/* Gender */}
      <Text style={styles.label}>{t('onboarding.genderLabel')}</Text>
      <View style={styles.chipRow}>
        {GENDERS.map((g) => (
          <TouchableOpacity
            key={g.value}
            style={[styles.chip, data.gender === g.value && styles.chipSelected]}
            onPress={() => onChange({ gender: g.value })}
          >
            <Text style={[styles.chipText, data.gender === g.value && styles.chipTextSelected]}>
              {g.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date of birth */}
      <Text style={styles.label}>{t('onboarding.dateOfBirth')}</Text>
      <TouchableOpacity
        style={[styles.dateField, showPicker && styles.dateFieldActive]}
        onPress={() => setShowPicker(v => !v)}
        activeOpacity={0.8}
      >
        <Icon name="calendar-month-outline" size={18} color={colors.textSecondary} style={styles.dateIcon} />
        <Text style={[styles.dateText, !data.dateOfBirth && styles.datePlaceholder]}>
          {data.dateOfBirth ? formatDate(data.dateOfBirth) : t('onboarding.selectDate')}
        </Text>
        <Icon name="chevron-down" size={18} color={colors.textTertiary} />
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={MAX_DATE}
          minimumDate={MIN_DATE}
          onChange={handleDateChange}
        />
      )}

      {/* Height */}
      <Input
        label={t('onboarding.heightLabel')}
        placeholder={t('onboarding.heightPlaceholder')}
        value={data.heightCm?.toString() ?? ''}
        onChangeText={(v) => onChange({ heightCm: parseFloat(v) || undefined })}
        keyboardType="decimal-pad"
      />

      {/* Weight */}
      <Input
        label={t('onboarding.currentWeightLabel')}
        placeholder={t('onboarding.currentWeightPlaceholder')}
        value={data.weightKg?.toString() ?? ''}
        onChangeText={(v) => onChange({ weightKg: parseFloat(v) || undefined })}
        keyboardType="decimal-pad"
      />

      {/* Target weight */}
      <Input
        label={t('onboarding.targetWeightLabel')}
        placeholder={t('onboarding.targetWeightPlaceholder')}
        value={data.targetWeightKg?.toString() ?? ''}
        onChangeText={(v) => onChange({ targetWeightKg: parseFloat(v) || undefined })}
        keyboardType="decimal-pad"
      />
    </View>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    label: {
      fontSize: Typography.sm,
      fontWeight: Typography.medium,
      color: c.textSecondary,
      marginBottom: Spacing.sm,
    },
    chipRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.base,
    },
    chip: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      backgroundColor: c.surfaceElevated,
      alignItems: 'center',
    },
    chipSelected: {
      borderColor: c.primary,
      backgroundColor: c.primaryDim,
    },
    chipText: {
      fontSize: Typography.base,
      color: c.textSecondary,
      fontWeight: Typography.medium,
    },
    chipTextSelected: {
      color: c.primary,
      fontWeight: Typography.semibold,
    },
    dateField: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surfaceElevated,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
      marginBottom: Spacing.base,
    },
    dateFieldActive: {
      borderColor: c.primary,
    },
    dateIcon: {
      marginEnd: Spacing.sm,
    },
    dateText: {
      flex: 1,
      fontSize: Typography.base,
      color: c.textPrimary,
    },
    datePlaceholder: {
      color: c.textTertiary,
    },
  });
}
