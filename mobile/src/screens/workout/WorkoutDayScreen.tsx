import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
  ShadowDecorator,
} from 'react-native-draggable-flatlist';

import { useColors, ColorPalette, Spacing, Typography, Radius, TAB_BAR_PADDING } from '@/theme';
import { WorkoutDayExercise, MuscleGroup } from '@/types';
import { WorkoutStackParamList, WorkoutNavigationProp } from '@/navigation/types';
import { workoutApi } from '@/api/workout.api';
import { localDb } from '@/api/mock/localDb';

function starKey(dayId: string) { return `workout:starred:${dayId}`; }

function getStarred(dayId: string): Set<string> {
  return new Set(localDb.get<string[]>(starKey(dayId)) ?? []);
}

function saveStarred(dayId: string, set: Set<string>) {
  localDb.set(starKey(dayId), Array.from(set));
}

type RouteProps = RouteProp<WorkoutStackParamList, 'WorkoutDay'>;

const MUSCLE_COLORS: Partial<Record<MuscleGroup, string>> = {
  CHEST: '#EF4444', BACK: '#3B82F6', SHOULDERS: '#8B5CF6',
  BICEPS: '#06B6D4', TRICEPS: '#F59E0B', FOREARMS: '#F97316',
  CORE: '#EC4899', GLUTES: '#22C55E', QUADRICEPS: '#22C55E',
  HAMSTRINGS: '#10B981', CALVES: '#34D399', FULL_BODY: '#AAFF00',
  CARDIO: '#F97316', OTHER: '#6B7280',
};

const MUSCLE_LABELS: Partial<Record<MuscleGroup, string>> = {
  CHEST: 'Chest', BACK: 'Back', SHOULDERS: 'Shoulders',
  BICEPS: 'Biceps', TRICEPS: 'Triceps', FOREARMS: 'Forearms',
  CORE: 'Core', GLUTES: 'Glutes', QUADRICEPS: 'Quads',
  HAMSTRINGS: 'Hams', CALVES: 'Calves', FULL_BODY: 'Full Body',
  CARDIO: 'Cardio', OTHER: 'Other',
};

export default function WorkoutDayScreen() {
  const navigation = useNavigation<WorkoutNavigationProp>();
  const { params } = useRoute<RouteProps>();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { t } = useTranslation();
  const [exercises, setExercises] = useState<WorkoutDayExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [planId, setPlanId] = useState<string | undefined>();

  // Star state — kept in refs so the Set/Function never enter the
  // DraggableFlatList renderItem closure (Reanimated can't serialize them).
  const starredRef = useRef<Set<string>>(new Set());
  const [starTick, setStarTick] = useState(0);

  // Load persisted starred ids after mount (avoids synchronous MMKV read
  // during the render that triggers the Reanimated worklet registration).
  useEffect(() => {
    starredRef.current = getStarred(params.dayId);
    setStarTick(t => t + 1);
  }, [params.dayId]);

  const toggleStar = useCallback((exerciseId: string) => {
    const s = starredRef.current;
    if (s.has(exerciseId)) s.delete(exerciseId);
    else s.add(exerciseId);
    saveStarred(params.dayId, s);
    setStarTick(t => t + 1);
  }, [params.dayId]);

  // Stable fn ref so renderItem doesn't capture toggleStar in its closure
  const toggleStarRef = useRef(toggleStar);
  toggleStarRef.current = toggleStar;

  // ── Data loading ───────────────────────────────────────────────────────────

  const loadExercises = useCallback(async () => {
    setLoading(true);
    try {
      const plans = await workoutApi.getPlans();
      for (const plan of plans) {
        const day = plan.days.find((d) => d.id === params.dayId);
        if (day) {
          setExercises([...day.exercises].sort((a, b) => a.sortOrder - b.sortOrder));
          setPlanId(plan.id);
          break;
        }
      }
    } catch {
      // retain existing list on transient error
    } finally {
      setLoading(false);
    }
  }, [params.dayId]);

  useFocusEffect(useCallback(() => { loadExercises(); }, [loadExercises]));

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleStartWorkout = useCallback(() => {
    navigation.navigate('ActiveWorkout', {
      planId,
      dayId: params.dayId,
      workoutName: params.dayName,
    });
  }, [navigation, planId, params.dayId, params.dayName]);

  const handleDeleteExercise = useCallback((id: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const handleReorder = useCallback(({ data }: { data: WorkoutDayExercise[] }) => {
    setExercises(data.map((ex, idx) => ({ ...ex, sortOrder: idx })));
  }, []);

  // ── Summary stats ──────────────────────────────────────────────────────────

  const summaryStats = useMemo(() => {
    const totalSets = exercises.reduce((s, ex) => s + (ex.targetSets ?? 0), 0);
    const muscles = [...new Set(exercises.map((ex) => ex.exercise.muscleGroup))];
    const muscleLabels = muscles.map((m) => MUSCLE_LABELS[m] ?? m).slice(0, 3);
    return { totalSets, muscleLabels, muscleCount: muscles.length };
  }, [exercises]);

  // ── Exercise card (rendered by DraggableFlatList) ─────────────────────────

  const renderItem = useCallback(({
    item, drag, isActive, getIndex,
  }: RenderItemParams<WorkoutDayExercise>) => {
    const index       = getIndex() ?? 0;
    const isStarred   = starredRef.current.has(item.exercise.id);
    const muscleLabel = MUSCLE_LABELS[item.exercise.muscleGroup]
      ?? item.exercise.muscleGroup.replace(/_/g, ' ');

    const setsReps =
      item.targetSets && item.targetRepsMin != null
        ? item.targetRepsMax != null
          ? `${item.targetSets} × ${item.targetRepsMin}–${item.targetRepsMax}`
          : `${item.targetSets} × ${item.targetRepsMin}+`
        : item.targetSets
        ? `${item.targetSets} sets`
        : null;

    const restText = item.restSeconds
      ? item.restSeconds >= 60
        ? `${Math.floor(item.restSeconds / 60)}m${item.restSeconds % 60 > 0 ? ` ${item.restSeconds % 60}s` : ''} rest`
        : `${item.restSeconds}s rest`
      : null;

    return (
      <ShadowDecorator>
        <ScaleDecorator activeScale={1.03}>
          <TouchableOpacity
            style={[
              styles.card,
              isActive  && { borderColor: colors.primary, borderWidth: 1.5 },
              isStarred && { borderColor: '#F59E0B60' },
            ]}
            onPress={() => navigation.navigate('ExerciseDetail', { exercise: item.exercise })}
            activeOpacity={0.78}
          >
            {/* Left accent bar — gold when starred, lime otherwise */}
            <View style={[styles.cardBar, { backgroundColor: isStarred ? '#F59E0B' : colors.primary }]} />

            <View style={styles.cardBody}>
              {/* Top row: index circle + name/equipment + star + drag handle + delete */}
              <View style={styles.cardTop}>
                <View style={[
                  styles.numCircle,
                  {
                    backgroundColor: isActive ? colors.primaryDim : colors.surfaceElevated,
                    borderColor: isActive ? colors.primary : colors.surfaceBorder,
                  },
                ]}>
                  <Text style={[styles.numText, { color: isActive ? colors.primary : colors.textPrimary }]}>
                    {index + 1}
                  </Text>
                </View>

                <View style={styles.cardTitleCol}>
                  <Text style={styles.exerciseName} numberOfLines={1}>{item.exercise.name}</Text>
                  <Text style={styles.equipment}>
                    {item.exercise.equipment.replace(/_/g, ' ').toLowerCase()}
                  </Text>
                </View>

                {/* Star button */}
                <TouchableOpacity
                  onPress={() => toggleStarRef.current(item.exercise.id)}
                  hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                  style={[
                    styles.starBtn,
                    { backgroundColor: isStarred ? '#F59E0B18' : colors.surfaceElevated },
                  ]}
                >
                  <Icon
                    name={isStarred ? 'star' : 'star-outline'}
                    size={17}
                    color={isStarred ? '#F59E0B' : colors.textTertiary}
                  />
                </TouchableOpacity>

                {/* Drag handle */}
                <TouchableOpacity
                  onPressIn={drag}
                  disabled={isActive}
                  hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                  style={[styles.handleBtn, { backgroundColor: isActive ? colors.primaryDim : colors.surfaceElevated }]}
                >
                  <Icon
                    name="drag-horizontal-variant"
                    size={18}
                    color={isActive ? colors.primary : colors.textTertiary}
                  />
                </TouchableOpacity>

                {/* Delete */}
                <TouchableOpacity
                  onPress={() => handleDeleteExercise(item.id)}
                  hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                  style={[styles.deleteBtn, { backgroundColor: colors.surfaceElevated }]}
                >
                  <Icon name="trash-can-outline" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>

              {/* Volume pills */}
              <View style={styles.volumeRow}>
                {isStarred && (
                  <View style={[styles.starPill, { backgroundColor: '#F59E0B18', borderColor: '#F59E0B40' }]}>
                    <Icon name="star" size={11} color="#F59E0B" />
                    <Text style={[styles.starPillText, { color: '#F59E0B' }]}>{t('workoutDay.keyMove')}</Text>
                  </View>
                )}
                {setsReps && (
                  <View style={[styles.volumePill, { backgroundColor: colors.primaryDim, borderColor: colors.primary + '40' }]}>
                    <Icon name="layers-triple-outline" size={13} color={colors.primary} />
                    <Text style={[styles.volumeText, { color: colors.primary }]}>{setsReps}</Text>
                  </View>
                )}
                {restText && (
                  <View style={[styles.restPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}>
                    <Icon name="timer-sand" size={13} color={colors.textSecondary} />
                    <Text style={[styles.restPillText, { color: colors.textSecondary }]}>{restText}</Text>
                  </View>
                )}
                <View style={[styles.muscleChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}>
                  <Text style={[styles.muscleChipText, { color: colors.textSecondary }]}>{muscleLabel}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </ScaleDecorator>
      </ShadowDecorator>
    );
  // starredRef and toggleStar are intentionally omitted from deps:
  // starredRef is a stable ref (read via .current at call time), and
  // toggleStar is kept stable via useCallback([params.dayId]). Both
  // avoid capturing a non-Reanimated-serializable Set in the closure.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colors, styles, navigation, handleDeleteExercise, starTick]);

  // ── List header ────────────────────────────────────────────────────────────

  const ListHeader = useMemo(() => (
    <View style={styles.listHeader}>
      {exercises.length > 0 && (
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>{exercises.length}</Text>
            <Text style={styles.summaryLabel}>{t('workoutDay.exercises')}</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.surfaceBorder }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>{summaryStats.totalSets}</Text>
            <Text style={styles.summaryLabel}>{t('workoutDay.totalSets')}</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.surfaceBorder }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>{summaryStats.muscleCount}</Text>
            <Text style={styles.summaryLabel}>{summaryStats.muscleLabels.join(', ')}</Text>
          </View>
        </View>
      )}

      <View style={[styles.actionRow, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <View style={styles.countWrap}>
          <Icon name="dumbbell" size={15} color={colors.textTertiary} />
          <Text style={styles.exerciseCount}>
            {exercises.length} {t('workoutDay.exercises')}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: colors.primary, opacity: exercises.length === 0 ? 0.4 : 1 }]}
          onPress={handleStartWorkout}
          disabled={exercises.length === 0}
          activeOpacity={0.8}
        >
          <Icon name="play" size={14} color="#000" />
          <Text style={styles.startBtnText}>{t('workoutDay.start')}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.addExerciseBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
        onPress={() => navigation.navigate('ExerciseList', { dayId: params.dayId, mode: 'select' })}
        activeOpacity={0.78}
      >
        <View style={[styles.addExerciseIcon, { backgroundColor: colors.primaryDim }]}>
          <Icon name="plus" size={22} color={colors.primary} />
        </View>
        <View style={styles.addExerciseText}>
          <Text style={[styles.addExerciseTitle, { color: colors.textPrimary }]}>{t('workoutDay.addExercise')}</Text>
          <Text style={[styles.addExerciseSub, { color: colors.textTertiary }]}>{t('workoutDay.addExerciseDesc')}</Text>
        </View>
        <Icon name="chevron-right" size={20} color={colors.textTertiary} />
      </TouchableOpacity>

      {/* Drag hint — only visible when there are exercises to reorder */}
      {exercises.length > 1 && (
        <View style={[styles.dragHint, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}>
          <Icon name="drag-horizontal-variant" size={13} color={colors.textTertiary} />
          <Text style={[styles.dragHintText, { color: colors.textTertiary }]}>
            {t('workoutDay.dragHint')}
          </Text>
        </View>
      )}

      {/* Empty state — rendered inline (not via DraggableFlatList's ListEmptyComponent,
          which doesn't account for ListHeaderComponent's height and ends up overlapping
          it instead of stacking below). */}
      {exercises.length === 0 && (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconBox, { backgroundColor: colors.primaryDim }]}>
            <Icon name="dumbbell" size={38} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>{t('workoutDay.emptyTitle')}</Text>
          <Text style={styles.emptySubtitle}>{t('workoutDay.emptyDesc')}</Text>
        </View>
      )}
    </View>
  ), [exercises.length, summaryStats, styles, colors, handleStartWorkout, navigation, params.dayId, t]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <DraggableFlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onDragEnd={handleReorder}
          contentContainerStyle={styles.list}
          ListHeaderComponent={ListHeader}
          showsVerticalScrollIndicator={false}
          activationDistance={5}
        />
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { padding: Spacing.base, gap: Spacing.sm, paddingBottom: TAB_BAR_PADDING },

    // Header
    listHeader: { gap: Spacing.sm, paddingBottom: Spacing.md },
    summaryCard: { flexDirection: 'row', borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden' },
    summaryItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, gap: 2 },
    summaryDivider: { width: 1 },
    summaryValue: { fontSize: Typography.lg, fontWeight: Typography.bold },
    summaryLabel: {
      fontSize: 10, color: c.textTertiary, fontWeight: Typography.medium,
      textAlign: 'center', paddingHorizontal: 4,
    },

    actionRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      borderRadius: Radius.xl, borderWidth: 1,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    },
    countWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    exerciseCount: { fontSize: Typography.base, fontWeight: Typography.semibold, color: c.textSecondary },
    startBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
      borderRadius: Radius.full,
    },
    startBtnText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: '#000' },

    addExerciseBtn: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.md,
    },
    addExerciseIcon: {
      width: 46, height: 46, borderRadius: Radius.lg,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    addExerciseText: { flex: 1 },
    addExerciseTitle: { fontSize: Typography.base, fontWeight: Typography.semibold },
    addExerciseSub: { fontSize: Typography.xs, marginTop: 2 },

    dragHint: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
      borderRadius: Radius.lg, borderWidth: 1, alignSelf: 'center',
    },
    dragHintText: { fontSize: Typography.xs, fontWeight: Typography.medium },

    // Exercise card
    card: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: Radius.xl,
      borderWidth: 1, borderColor: c.surfaceBorder,
      overflow: 'hidden',
    },
    cardBar: { width: 4, flexShrink: 0 },
    cardBody: { flex: 1, padding: Spacing.md, gap: Spacing.sm },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },

    numCircle: {
      width: 30, height: 30, borderRadius: 15, borderWidth: 1,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    numText: { fontSize: Typography.sm, fontWeight: Typography.bold },
    cardTitleCol: { flex: 1 },
    exerciseName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: c.textPrimary },
    equipment: { fontSize: Typography.xs, color: c.textTertiary, textTransform: 'capitalize', marginTop: 1 },

    starBtn: {
      width: 32, height: 32, borderRadius: 16,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    handleBtn: {
      width: 32, height: 32, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    deleteBtn: {
      width: 32, height: 32, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },

    volumeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.xs },
    starPill: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: Spacing.sm, paddingVertical: 4,
      borderRadius: Radius.full, borderWidth: 1,
    },
    starPillText: { fontSize: Typography.xs, fontWeight: Typography.bold },
    volumePill: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: Spacing.md, paddingVertical: 5,
      borderRadius: Radius.full, borderWidth: 1,
    },
    volumeText: { fontSize: Typography.sm, fontWeight: Typography.bold },
    restPill: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: Spacing.md, paddingVertical: 5,
      borderRadius: Radius.full, borderWidth: 1,
    },
    restPillText: { fontSize: Typography.sm, fontWeight: Typography.medium },
    muscleChip: {
      paddingHorizontal: Spacing.sm, paddingVertical: 5,
      borderRadius: Radius.full, borderWidth: 1,
    },
    muscleChipText: { fontSize: Typography.xs, fontWeight: Typography.semibold },

    emptyState: {
      alignItems: 'center', justifyContent: 'center',
      paddingVertical: Spacing.xl, paddingHorizontal: Spacing['2xl'], gap: Spacing.md,
    },
    emptyIconBox: {
      width: 80, height: 80, borderRadius: 40,
      alignItems: 'center', justifyContent: 'center',
    },
    emptyTitle: { fontSize: Typography.lg, fontWeight: Typography.semibold, color: c.textSecondary },
    emptySubtitle: { fontSize: Typography.base, color: c.textTertiary, textAlign: 'center', lineHeight: 22 },
  });
}
