import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius } from '@/theme';
import { HealthStackParamList } from '@/navigation/types';
import { recoveryApi } from '@/api/recovery.api';

type Route = RouteProp<HealthStackParamList, 'RecoveryCheckIn'>;

interface Question {
  key: keyof State;
  label: string;
  icon: string;
  helpText: string;
  lowLabel: string;
  highLabel: string;
  isInverse?: boolean; // higher = worse (soreness, stress)
}

interface State {
  energyLevel:     number;
  sorenessLevel:   number;
  stressLevel:     number;
  moodLevel:       number;
  motivationLevel: number;
}

// QUESTIONS defined inside component to use t()

function ScaleSelector({ value, onChange, isInverse, colors }: {
  value: number; onChange: (v: number) => void; isInverse?: boolean; colors: ColorPalette;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(n => {
        const selected = n === value;
        let selColor: string;
        if (isInverse) {
          selColor = n <= 2 ? '#22C55E' : n === 3 ? '#F59E0B' : '#EF4444';
        } else {
          selColor = n >= 4 ? '#22C55E' : n === 3 ? '#F59E0B' : '#EF4444';
        }
        return (
          <TouchableOpacity
            key={n}
            onPress={() => onChange(n)}
            style={[
              scaleStyles.btn,
              { borderColor: selected ? selColor : colors.surfaceBorder,
                backgroundColor: selected ? selColor + '25' : colors.surfaceElevated },
            ]}
            activeOpacity={0.7}
          >
            <Text style={[
              scaleStyles.num,
              { color: selected ? selColor : colors.textTertiary,
                fontWeight: selected ? Typography.bold : Typography.regular },
            ]}>
              {n}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const scaleStyles = StyleSheet.create({
  btn: { flex: 1, height: 44, borderRadius: Radius.md, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  num: { fontSize: Typography.base },
});

export default function RecoveryCheckInScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const qc = useQueryClient();
  const { t } = useTranslation();

  const QUESTIONS: Question[] = [
    { key: 'energyLevel',     label: t('recoveryCheckIn.qEnergy'),    icon: 'lightning-bolt',  helpText: t('recoveryCheckIn.helpEnergy'),    lowLabel: t('recoveryCheckIn.lowExhausted'),  highLabel: t('recoveryCheckIn.highEnergised') },
    { key: 'sorenessLevel',   label: t('recoveryCheckIn.qSoreness'),  icon: 'human-handsdown', helpText: t('recoveryCheckIn.helpSoreness'),  lowLabel: t('recoveryCheckIn.lowNoSoreness'), highLabel: t('recoveryCheckIn.highVerySore'),  isInverse: true },
    { key: 'stressLevel',     label: t('recoveryCheckIn.qStress'),    icon: 'brain',           helpText: t('recoveryCheckIn.helpStress'),    lowLabel: t('recoveryCheckIn.lowRelaxed'),    highLabel: t('recoveryCheckIn.highVeryStressed'), isInverse: true },
    { key: 'moodLevel',       label: t('recoveryCheckIn.qMood'),      icon: 'emoticon-outline', helpText: t('recoveryCheckIn.helpMood'),     lowLabel: t('recoveryCheckIn.lowLowMood'),    highLabel: t('recoveryCheckIn.highGreatMood') },
    { key: 'motivationLevel', label: t('recoveryCheckIn.qMotivation'),icon: 'fire',            helpText: t('recoveryCheckIn.helpMotivation'),lowLabel: t('recoveryCheckIn.lowNoMotivation'),highLabel: t('recoveryCheckIn.highHighlyMotivated') },
  ];

  const date = route.params?.date ?? new Date().toISOString().split('T')[0];

  const [values, setValues] = useState<State>({
    energyLevel: 3, sorenessLevel: 2, stressLevel: 2, moodLevel: 3, motivationLevel: 3,
  });
  const [notes, setNotes] = useState('');

  const { data: existing } = useQuery({
    queryKey: ['recovery-check-in-today'],
    queryFn:  recoveryApi.getTodayCheckIn,
  });

  const createMut = useMutation({
    mutationFn: recoveryApi.createCheckIn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recovery-today'] });
      qc.invalidateQueries({ queryKey: ['recovery-check-in-today'] });
      navigation.goBack();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, req }: { id: string; req: Parameters<typeof recoveryApi.updateCheckIn>[1] }) =>
      recoveryApi.updateCheckIn(id, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recovery-today'] });
      qc.invalidateQueries({ queryKey: ['recovery-check-in-today'] });
      navigation.goBack();
    },
  });

  const submit = () => {
    const req = { date, ...values, notes: notes.trim() || undefined };
    if (existing?.id) {
      updateMut.mutate({ id: existing.id, req });
    } else {
      createMut.mutate(req);
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;

  // Overall wellness preview
  const preview = useMemo(() => {
    const raw = (
      values.energyLevel +
      (6 - values.sorenessLevel) +
      (6 - values.stressLevel) +
      values.moodLevel +
      values.motivationLevel
    ) / 25 * 100;
    return Math.round(raw);
  }, [values]);

  const previewColor = preview >= 70 ? '#22C55E' : preview >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Icon name="close" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t('recoveryCheckIn.title')}</Text>
          <Text style={styles.subtitle}>{date}</Text>
        </View>
        {/* Live preview */}
        <View style={[styles.previewBox, { backgroundColor: previewColor + '20', borderColor: previewColor + '40' }]}>
          <Text style={[styles.previewScore, { color: previewColor }]}>{preview}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.helperText}>{t('recoveryCheckIn.subtitle')}</Text>

        {QUESTIONS.map(q => (
          <View key={q.key} style={[styles.questionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={styles.questionHeader}>
              <Icon name={q.icon} size={16} color={colors.primary} />
              <Text style={styles.questionLabel}>{q.label}</Text>
              {q.isInverse && (
                <View style={[styles.inverseBadge, { backgroundColor: colors.surfaceElevated }]}>
                  <Text style={[styles.inverseBadgeText, { color: colors.textTertiary }]}>inverse</Text>
                </View>
              )}
            </View>
            <Text style={styles.helpText}>{q.helpText}</Text>
            <ScaleSelector
              value={values[q.key]}
              onChange={v => setValues(prev => ({ ...prev, [q.key]: v }))}
              isInverse={q.isInverse}
              colors={colors}
            />
            <View style={styles.scaleLabels}>
              <Text style={[styles.scaleLabel, { color: colors.textTertiary }]}>{q.lowLabel}</Text>
              <Text style={[styles.scaleLabel, { color: colors.textTertiary }]}>{q.highLabel}</Text>
            </View>
          </View>
        ))}

        {/* Notes */}
        <View style={[styles.questionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.questionHeader}>
            <Icon name="note-outline" size={16} color={colors.primary} />
            <Text style={styles.questionLabel}>{t('recoveryCheckIn.notes')}</Text>
          </View>
          <TextInput
            style={[styles.notesInput, { color: colors.textPrimary, borderColor: colors.surfaceBorder }]}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('recoveryCheckIn.notesPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={300}
          />
        </View>

        <Text style={styles.disclaimer}>{t('recoveryCheckIn.disclaimer')}</Text>
      </ScrollView>

      {/* Submit button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary }]}
          onPress={submit}
          disabled={isPending}
          activeOpacity={0.85}
        >
          <Text style={styles.submitText}>
            {isPending ? t('recoveryCheckIn.savingBtn') : existing ? t('recoveryCheckIn.updateBtn') : t('recoveryCheckIn.submitBtn')}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    root:   { flex: 1, backgroundColor: c.background },
    scroll: { padding: Spacing.base, gap: Spacing.md },
    header: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
      borderBottomWidth: 1, borderBottomColor: c.surfaceBorder,
    },
    closeBtn:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    title:     { fontSize: Typography.lg, fontWeight: Typography.bold, color: c.textPrimary },
    subtitle:  { fontSize: Typography.xs, color: c.textTertiary },
    previewBox: {
      width: 48, height: 48, borderRadius: 24,
      borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    },
    previewScore: { fontSize: Typography.lg, fontWeight: Typography.bold },

    helperText: { fontSize: Typography.xs, color: c.textTertiary, lineHeight: 16 },

    questionCard: {
      borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.base, gap: Spacing.md,
    },
    questionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    questionLabel:  { fontSize: Typography.sm, fontWeight: Typography.semibold, color: c.textPrimary, flex: 1 },
    inverseBadge:   { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    inverseBadgeText: { fontSize: 9, fontWeight: Typography.medium },
    helpText:       { fontSize: Typography.xs, color: c.textTertiary },
    scaleLabels:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    scaleLabel:     { fontSize: 10 },

    notesInput: {
      borderWidth: 1, borderRadius: Radius.md,
      padding: Spacing.md, fontSize: Typography.sm,
      minHeight: 80, textAlignVertical: 'top',
    },

    disclaimer: {
      fontSize: Typography.xs, color: c.textTertiary,
      textAlign: 'center', fontStyle: 'italic',
    },

    footer: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingHorizontal: Spacing.base, paddingTop: Spacing.md,
      backgroundColor: c.background,
      borderTopWidth: 1, borderTopColor: c.surfaceBorder,
    },
    submitBtn: {
      borderRadius: Radius.lg, padding: Spacing.base,
      alignItems: 'center', justifyContent: 'center',
    },
    submitText: { fontSize: Typography.base, fontWeight: Typography.bold, color: c.textInverse },
  });
}
