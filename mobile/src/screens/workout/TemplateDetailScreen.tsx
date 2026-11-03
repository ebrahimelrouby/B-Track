import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius, TAB_BAR_PADDING } from '@/theme';
import { workoutApi } from '@/api/workout.api';
import { WORKOUT_TEMPLATES, EXERCISE_SEED } from '@/api/mock/exerciseSeed';
import { exerciseIcon } from '@/utils/exerciseIcon';
import { exercisePictogram } from '@/utils/exercisePictogram';
import { muscleAnatomyIcon } from '@/utils/muscleAnatomyIcon';
import { Exercise, MuscleGroup } from '@/types';
import { WorkoutStackParamList, WorkoutNavigationProp } from '@/navigation/types';
import { USE_MOCK_API } from '@/constants/config';
import apiClient from '@/api/client';

type RouteProps = RouteProp<WorkoutStackParamList, 'TemplateDetail'>;

const DIFF_COLOR: Record<string, string> = {
  BEGINNER: '#22C55E', INTERMEDIATE: '#F59E0B', ADVANCED: '#EF4444',
};

// Matches ExerciseListScreen's palette so an exercise reads the same color
// here as it does in the real exercise library.
const MUSCLE_COLORS: Record<MuscleGroup, string> = {
  CHEST: '#EF4444', BACK: '#3B82F6', SHOULDERS: '#8B5CF6',
  BICEPS: '#06B6D4', TRICEPS: '#F59E0B', FOREARMS: '#F97316',
  CORE: '#EC4899', GLUTES: '#22C55E', QUADRICEPS: '#22C55E',
  HAMSTRINGS: '#22C55E', CALVES: '#22C55E', FULL_BODY: '#AAFF00',
  CARDIO: '#F97316', OTHER: '#6B6B6B',
};

const EXERCISE_BY_NAME = new Map(EXERCISE_SEED.map((e) => [e.name.toLowerCase(), e]));

export default function TemplateDetailScreen() {
  const navigation = useNavigation<WorkoutNavigationProp>();
  const { params } = useRoute<RouteProps>();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { t } = useTranslation();

  const tpl = useMemo(
    () => WORKOUT_TEMPLATES.find((x) => x.id === params.templateId),
    [params.templateId],
  );

  const { data: allExercises } = useQuery<Exercise[]>({
    queryKey: ['exercises'],
    queryFn: async (): Promise<Exercise[]> => {
      if (USE_MOCK_API) return EXERCISE_SEED;
      const r = await apiClient.get('/exercises', { params: { size: 2000 } });
      return r.data.data?.content as Exercise[];
    },
    staleTime: Infinity,
  });

  const realByName = useMemo(() => {
    const map = new Map<string, Exercise>();
    const list: Exercise[] = allExercises ?? [];
    list.forEach((e: Exercise) => map.set(e.name.toLowerCase(), e));
    return map;
  }, [allExercises]);

  const importMutation = useMutation({
    mutationFn: () => workoutApi.importTemplate(tpl!.id, allExercises ?? []),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-plans'] });
      Alert.alert(t('templateDetail.addedTitle'), t('templateDetail.addedMsg', { name: tpl?.name }));
      navigation.goBack();
    },
  });

  const handleAdd = () => {
    if (!tpl) return;
    Alert.alert(
      t('workoutPlans.addTemplateTitle', { name: tpl.name }),
      t('workoutPlans.addTemplateMsg', { n: tpl.daysPerWeek }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('workoutPlans.addToMyPlans'), onPress: () => importMutation.mutate() },
      ],
    );
  };

  if (!tpl) {
    return (
      <View style={[styles.root, styles.notFound]}>
        <Icon name="file-question-outline" size={40} color={colors.textTertiary} />
        <Text style={styles.notFoundText}>{t('templateDetail.notFound')}</Text>
      </View>
    );
  }

  const diffColor = DIFF_COLOR[tpl.difficulty] ?? colors.primary;
  const totalExercises = tpl.days.reduce((sum, d) => sum + d.exercises.length, 0);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.heroIconBox, { backgroundColor: diffColor + '20', borderColor: diffColor + '40' }]}>
            <Icon name={tpl.icon} size={32} color={diffColor} />
          </View>
          <Text style={styles.heroName}>{tpl.name}</Text>
          <Text style={styles.heroDesc}>{tpl.description}</Text>
        </View>

        {/* Stats */}
        <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.statItem}>
            <View style={[styles.statDiffDot, { backgroundColor: diffColor }]} />
            <Text style={styles.statValue}>{getDiffLabel(t, tpl.difficulty)}</Text>
            <Text style={styles.statLabel}>{t('templateDetail.statDifficulty')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.surfaceBorder }]} />
          <View style={styles.statItem}>
            <Icon name="calendar-outline" size={15} color={colors.primary} />
            <Text style={styles.statValue}>{tpl.daysPerWeek}</Text>
            <Text style={styles.statLabel}>{t('templateDetail.statDaysWeek')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.surfaceBorder }]} />
          <View style={styles.statItem}>
            <Icon name="dumbbell" size={15} color={colors.primary} />
            <Text style={styles.statValue}>{totalExercises}</Text>
            <Text style={styles.statLabel}>{t('templateDetail.statExercises')}</Text>
          </View>
        </View>

        {/* Days */}
        {tpl.days.map((day, dayIdx) => (
          <View key={dayIdx} style={styles.dayBlock}>
            <View style={styles.dayHeaderRow}>
              <View style={[styles.dayNum, { backgroundColor: colors.primary }]}>
                <Text style={styles.dayNumText}>{dayIdx + 1}</Text>
              </View>
              <Text style={styles.dayTitle}>{day.name}</Text>
              <View style={[styles.dayCountBadge, { backgroundColor: colors.primaryDim }]}>
                <Text style={[styles.dayCountText, { color: colors.primary }]}>
                  {day.exercises.length} {t('templateDetail.exercisesLower')}
                </Text>
              </View>
            </View>

            <View style={[styles.dayCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              {day.exercises.map((ex, exIdx) => {
                const real = realByName.get(ex.exerciseName.toLowerCase());
                const mock = EXERCISE_BY_NAME.get(ex.exerciseName.toLowerCase());
                const muscle = real?.muscleGroup ?? mock?.muscleGroup ?? 'OTHER';
                const mColor = MUSCLE_COLORS[muscle];
                const pictogram = exercisePictogram(ex.exerciseName) ?? muscleAnatomyIcon(muscle);
                return (
                  <View
                    key={exIdx}
                    style={[styles.exRow, exIdx > 0 && { borderTopWidth: 1, borderTopColor: colors.surfaceBorder }]}
                  >
                    {/* Icon only here — no stock photos, so every exercise in a template reads consistently. */}
                    {pictogram ? (
                      <View style={[styles.exIconBox, { backgroundColor: mColor + '1A' }]}>
                        <Image source={pictogram} resizeMode="contain" style={{ width: 20, height: 20, tintColor: mColor }} />
                      </View>
                    ) : (
                      <View style={[styles.exIconBox, { backgroundColor: mColor + '1A' }]}>
                        <Icon name={exerciseIcon(ex.exerciseName, muscle)} size={16} color={mColor} />
                      </View>
                    )}
                    <View style={styles.exInfo}>
                      <Text style={styles.exName} numberOfLines={1}>{ex.exerciseName}</Text>
                      <Text style={styles.exMeta}>
                        {ex.targetSets} {t('templateDetail.sets')} · {ex.targetRepsMin}-{ex.targetRepsMax} {t('templateDetail.reps')} · {ex.restSeconds}{t('templateDetail.restAbbrev')}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.ctaPanel, { backgroundColor: colors.surface, borderTopColor: colors.surfaceBorder, paddingBottom: insets.bottom + Spacing.base }]}>
        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: colors.primary }, importMutation.isPending && { opacity: 0.6 }]}
          onPress={handleAdd}
          activeOpacity={0.85}
          disabled={importMutation.isPending}
        >
          <Icon name="plus" size={18} color="#000" />
          <Text style={styles.ctaBtnText}>
            {importMutation.isPending ? t('templateDetail.adding') : t('workoutPlans.addToMyPlans')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getDiffLabel(t: (k: string) => string, diff: string) {
  if (diff === 'BEGINNER') return t('workoutPlans.diffBeginner');
  if (diff === 'INTERMEDIATE') return t('workoutPlans.diffIntermediate');
  return t('workoutPlans.diffAdvanced');
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    notFound: { alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
    notFoundText: { fontSize: Typography.base, color: c.textTertiary },

    scrollContent: { paddingHorizontal: Spacing.base, paddingTop: Spacing.md, paddingBottom: Spacing['2xl'] + 72 },

    // ── Hero ──────────────────────────────────────────────────────────────────
    hero: { alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
    heroIconBox: {
      width: 72, height: 72, borderRadius: 36, borderWidth: 1.5,
      alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs,
    },
    heroName: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: c.textPrimary, textAlign: 'center' },
    heroDesc: {
      fontSize: Typography.sm, color: c.textSecondary, lineHeight: 20,
      textAlign: 'center', paddingHorizontal: Spacing.sm,
    },

    // ── Stats ─────────────────────────────────────────────────────────────────
    statsRow: {
      flexDirection: 'row', borderRadius: Radius.xl, borderWidth: 1,
      overflow: 'hidden', marginBottom: Spacing.lg,
    },
    statItem: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      gap: 4, paddingVertical: Spacing.md,
    },
    statDiffDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 2 },
    statDivider: { width: 1 },
    statValue: { fontSize: Typography.base, fontWeight: Typography.bold, color: c.textPrimary },
    statLabel: { fontSize: Typography.xs, color: c.textTertiary, fontWeight: Typography.medium },

    // ── Day block ─────────────────────────────────────────────────────────────
    dayBlock: { marginBottom: Spacing.lg },
    dayHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
    dayNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    dayNumText: { fontSize: Typography.xs, fontWeight: Typography.bold, color: '#000' },
    dayTitle: { flex: 1, fontSize: Typography.base, fontWeight: Typography.bold, color: c.textPrimary },
    dayCountBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full },
    dayCountText: { fontSize: Typography.xs, fontWeight: Typography.semibold },

    dayCard: { borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden' },
    exRow: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm + 2,
    },
    exIconBox: {
      width: 30, height: 30, borderRadius: Radius.md, flexShrink: 0,
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    exInfo: { flex: 1 },
    exName: { fontSize: Typography.sm, fontWeight: Typography.medium, color: c.textPrimary },
    exMeta: { fontSize: Typography.xs, color: c.textTertiary, marginTop: 2 },

    // ── CTA ───────────────────────────────────────────────────────────────────
    ctaPanel: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingHorizontal: Spacing.base, paddingTop: Spacing.sm,
      borderTopWidth: 1,
    },
    ctaBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      borderRadius: Radius.full, paddingVertical: Spacing.md,
    },
    ctaBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: '#000' },
  });
}
