import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView, Modal, Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius, TAB_BAR_PADDING } from '@/theme';
import { workoutApi } from '@/api/workout.api';
import { WorkoutPlan, WorkoutSession } from '@/types';
import { WorkoutNavigationProp } from '@/navigation/types';
import { useAuthStore } from '@/store/auth.store';
import { useActiveWorkoutStore } from '@/store/activeWorkout.store';
import { WORKOUT_TEMPLATES, WorkoutTemplate, EXERCISE_SEED } from '@/api/mock/exerciseSeed';

type Tab = 'my-plans' | 'templates' | 'library';

const DIFF_COLOR: Record<string, string> = {
  BEGINNER: '#22C55E', INTERMEDIATE: '#F59E0B', ADVANCED: '#EF4444',
};
const DIFF_LABEL: Record<string, string> = {
  BEGINNER: 'Beginner', INTERMEDIATE: 'Intermediate', ADVANCED: 'Advanced',
};

const MUSCLE_META = [
  { key: 'CHEST',      label: 'Chest',      icon: 'weight-lifter', color: '#EF4444' },
  { key: 'BACK',       label: 'Back',        icon: 'human-handsup', color: '#3B82F6' },
  { key: 'SHOULDERS',  label: 'Shoulders',   icon: 'arm-flex',      color: '#8B5CF6' },
  { key: 'BICEPS',     label: 'Biceps',      icon: 'arm-flex',      color: '#06B6D4' },
  { key: 'TRICEPS',    label: 'Triceps',     icon: 'arm-flex',      color: '#F59E0B' },
  { key: 'CORE',       label: 'Core',        icon: 'yoga',          color: '#EC4899' },
  { key: 'QUADRICEPS', label: 'Quads',       icon: 'run',           color: '#22C55E' },
  { key: 'HAMSTRINGS', label: 'Hamstrings',  icon: 'run',           color: '#10B981' },
  { key: 'GLUTES',     label: 'Glutes',      icon: 'run',           color: '#14B8A6' },
  { key: 'CALVES',     label: 'Calves',      icon: 'run-fast',      color: '#F97316' },
  { key: 'FULL_BODY',  label: 'Full Body',   icon: 'human',         color: '#AAFF00' },
  { key: 'CARDIO',     label: 'Cardio',      icon: 'heart-pulse',   color: '#FB923C' },
];

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'my-plans',  label: 'My Plans',  icon: 'clipboard-list-outline' },
  { key: 'templates', label: 'Templates', icon: 'lightning-bolt-outline'  },
  { key: 'library',   label: 'Library',   icon: 'bookshelf'               },
];

export default function WorkoutPlansScreen() {
  const navigation = useNavigation<WorkoutNavigationProp>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const entitlements = useAuthStore((s) => s.entitlements);
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('my-plans');
  const [menuPlan, setMenuPlan] = useState<WorkoutPlan | null>(null);

  const getDiffLabel = (d: string) => ({
    BEGINNER: t('workoutPlans.diffBeginner'),
    INTERMEDIATE: t('workoutPlans.diffIntermediate'),
    ADVANCED: t('workoutPlans.diffAdvanced'),
  }[d] ?? d);

  const getMuscleLabel = (key: string) => ({
    CHEST: t('workoutPlans.muscleChest'),
    BACK: t('workoutPlans.muscleBack'),
    SHOULDERS: t('workoutPlans.muscleShoulders'),
    BICEPS: t('workoutPlans.muscleBiceps'),
    TRICEPS: t('workoutPlans.muscleTriceps'),
    CORE: t('workoutPlans.muscleCore'),
    QUADRICEPS: t('workoutPlans.muscleQuads'),
    HAMSTRINGS: t('workoutPlans.muscleHamstrings'),
    GLUTES: t('workoutPlans.muscleGlutes'),
    CALVES: t('workoutPlans.muscleCalves'),
    FULL_BODY: t('workoutPlans.muscleFullBody'),
    CARDIO: t('workoutPlans.muscleCardio'),
  }[key] ?? key);

  const { isWorkoutActive, activeWorkout } = useActiveWorkoutStore();

  const { data: plans, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['workout-plans'],
    queryFn: workoutApi.getPlans,
  });

  const { data: calendarHistory } = useQuery({
    queryKey: ['workout-history-calendar'],
    queryFn: () => workoutApi.getHistory(0, 120),
  });

  const deleteMutation = useMutation({
    mutationFn: workoutApi.deletePlan,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workout-plans'] }),
  });

  const importMutation = useMutation({
    mutationFn: workoutApi.importTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-plans'] });
      setActiveTab('my-plans');
    },
  });

  const canCreateMore =
    !entitlements || entitlements.isPremium || (plans?.length ?? 0) < (entitlements?.maxWorkoutPlans ?? 3);

  const muscleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    EXERCISE_SEED.forEach((ex) => { counts[ex.muscleGroup] = (counts[ex.muscleGroup] ?? 0) + 1; });
    return counts;
  }, []);

  const confirmDelete = useCallback((plan: WorkoutPlan) => {
    setMenuPlan(null);
    Alert.alert(t('workoutPlans.deletePlanTitle'), t('workoutPlans.deletePlanMsg', { name: plan.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('workoutPlans.deletePlan'), style: 'destructive', onPress: () => deleteMutation.mutate(plan.id) },
    ]);
  }, [deleteMutation, t]);

  const handleImportTemplate = (tpl: WorkoutTemplate) => {
    if (!canCreateMore) { navigation.navigate('Upgrade' as any); return; }
    Alert.alert(
      t('workoutPlans.addTemplateTitle', { name: tpl.name }),
      t('workoutPlans.addTemplateMsg', { n: tpl.daysPerWeek }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('workoutPlans.addToMyPlans'), onPress: () => importMutation.mutate(tpl.id) },
      ],
    );
  };

  const totalHistorySessions = calendarHistory?.totalElements ?? 0;

  // ── Calendar data ─────────────────────────────────────────────────────────────

  const workoutDates = useMemo(() => {
    const set = new Set<string>();
    (calendarHistory?.content ?? []).forEach((s: WorkoutSession) => {
      const d = s.completedAt ?? s.startedAt;
      if (d) set.add(new Date(d).toDateString());
    });
    return set;
  }, [calendarHistory]);

  const currentStreak = useMemo(() => {
    let streak = 0;
    const check = new Date();
    check.setHours(0, 0, 0, 0);
    while (workoutDates.has(check.toDateString())) {
      streak++;
      check.setDate(check.getDate() - 1);
    }
    return streak;
  }, [workoutDates]);

  // ── Resume Banner ─────────────────────────────────────────────────────────────

  const ResumeBanner = () => {
    if (!isWorkoutActive || !activeWorkout) return null;
    const doneCount = activeWorkout.exercises.reduce(
      (s, ex) => s + ex.sets.filter((set) => set.isCompleted).length, 0,
    );
    return (
      <TouchableOpacity
        style={styles.resumeBanner}
        onPress={() => navigation.navigate('ActiveWorkout', { workoutName: activeWorkout.name })}
        activeOpacity={0.85}
      >
        <View style={styles.resumePulse}>
          <Icon name="dumbbell" size={18} color={colors.primary} />
        </View>
        <View style={styles.resumeInfo}>
          <Text style={styles.resumeTitle}>{activeWorkout.name}</Text>
          <Text style={styles.resumeSub}>
            {t('workoutPlans.resumeBanner', { n: doneCount, s: doneCount !== 1 ? 's' : '' })}
          </Text>
        </View>
        <View style={[styles.resumeBtn, { backgroundColor: colors.primary }]}>
          <Icon name="play" size={13} color="#000" />
          <Text style={styles.resumeBtnText}>{t('workoutPlans.resumeBtn')}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Plan card ─────────────────────────────────────────────────────────────────

  const renderPlan = useCallback(({ item }: { item: WorkoutPlan }) => {
    const totalExercises = item.days?.reduce((s, d) => s + (d.exercises?.length ?? 0), 0) ?? 0;
    const daysCount = item.days?.length ?? 0;

    return (
      <TouchableOpacity
        style={styles.planCard}
        onPress={() => navigation.navigate('WorkoutPlanDetail', { planId: item.id })}
        activeOpacity={0.75}
      >
        <View style={[styles.planIconWrap, { backgroundColor: colors.primaryDim }]}>
          <Icon name="dumbbell" size={20} color={colors.primary} />
        </View>
        <View style={styles.planTitleBlock}>
          <Text style={styles.planName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.planMeta}>
            {daysCount} day{daysCount !== 1 ? 's' : ''} · {totalExercises} exercise{totalExercises !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setMenuPlan(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="dots-vertical" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }, [colors, styles, navigation]);

  // ── Plan actions modal ────────────────────────────────────────────────────────

  const PlanActionsModal = (
    <Modal
      visible={menuPlan !== null}
      transparent
      animationType="fade"
      onRequestClose={() => setMenuPlan(null)}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setMenuPlan(null)}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle} numberOfLines={1}>{menuPlan?.name}</Text>

          <TouchableOpacity
            style={styles.sheetRow}
            onPress={() => {
              setMenuPlan(null);
              if (menuPlan) navigation.navigate('WorkoutPlanDetail', { planId: menuPlan.id });
            }}
          >
            <View style={[styles.sheetIconWrap, { backgroundColor: colors.primaryDim }]}>
              <Icon name="eye-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.sheetRowText}>{t('workoutPlans.viewPlan')}</Text>
            <Icon name="chevron-right" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          {menuPlan?.days?.[0] && (
            <TouchableOpacity
              style={styles.sheetRow}
              onPress={() => {
                const day = menuPlan.days[0];
                setMenuPlan(null);
                navigation.navigate('ActiveWorkout', {
                  planId: menuPlan.id,
                  dayId: day.id,
                  workoutName: day.name,
                });
              }}
            >
              <View style={[styles.sheetIconWrap, { backgroundColor: colors.primaryDim }]}>
                <Icon name="play-circle-outline" size={18} color={colors.primary} />
              </View>
              <Text style={styles.sheetRowText}>{t('workoutPlans.startWorkout')}</Text>
              <Icon name="chevron-right" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.sheetRow}
            onPress={() => menuPlan && confirmDelete(menuPlan)}
          >
            <View style={[styles.sheetIconWrap, { backgroundColor: '#EF444420' }]}>
              <Icon name="trash-can-outline" size={18} color="#EF4444" />
            </View>
            <Text style={[styles.sheetRowText, { color: '#EF4444' }]}>{t('workoutPlans.deletePlan')}</Text>
            <Icon name="chevron-right" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // ── Template card ─────────────────────────────────────────────────────────────

  const renderTemplate = (tpl: WorkoutTemplate) => {
    const col = DIFF_COLOR[tpl.difficulty] ?? colors.primary;
    const totalExercises = tpl.days.reduce((sum, d) => sum + d.exercises.length, 0);
    return (
      <View key={tpl.id} style={styles.tplCard}>
        <View style={styles.tplInner}>
          <View style={styles.tplIconBox}>
            <Icon name={tpl.icon} size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.tplName} numberOfLines={1}>{tpl.name}</Text>
            <View style={styles.tplMeta}>
              <View style={[styles.tplDiffDot, { backgroundColor: col }]} />
              <Text style={styles.tplMetaText}>{getDiffLabel(tpl.difficulty)}</Text>
              <Text style={styles.tplMetaDot}>·</Text>
              <Text style={styles.tplMetaText}>{tpl.daysPerWeek}×/week</Text>
              <Text style={styles.tplMetaDot}>·</Text>
              <Text style={styles.tplMetaText}>{totalExercises} exercises</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.tplAddBtn} onPress={() => handleImportTemplate(tpl)} activeOpacity={0.8}>
            <Icon name="plus" size={16} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ── Workout calendar ──────────────────────────────────────────────────────────

  const WorkoutCalendar = useMemo(() => {
    const SCREEN_W = Dimensions.get('window').width;
    const GRID_W = SCREEN_W - Spacing.base * 2 - 18; // card padding + day-label col
    const WEEKS = 16;
    const GAP = 3;
    const CELL = Math.floor((GRID_W - GAP * (WEEKS - 1)) / WEEKS);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build WEEKS columns of 7 days each, Mon-anchored
    const mondayOffset = (today.getDay() + 6) % 7; // days since last Monday
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - mondayOffset - (WEEKS - 1) * 7);

    const columns: { date: Date; hasWorkout: boolean; isToday: boolean; isFuture: boolean }[][] = [];
    for (let w = 0; w < WEEKS; w++) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + w * 7 + d);
        col.push({
          date,
          hasWorkout: workoutDates.has(date.toDateString()),
          isToday: date.toDateString() === today.toDateString(),
          isFuture: date > today,
        });
      }
      columns.push(col);
    }

    const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    return (
      <TouchableOpacity
        style={styles.calendarCard}
        onPress={() => navigation.navigate('WorkoutHistory')}
        activeOpacity={0.85}
      >
        {/* Header */}
        <View style={styles.calendarHeader}>
          <View>
            <Text style={styles.calendarTitle}>{t('workoutPlans.calActivity')}</Text>
            <Text style={styles.calendarSub}>
              {totalHistorySessions > 0 ? t('workoutPlans.calTotalSessions', { n: totalHistorySessions }) : t('workoutPlans.calNoWorkouts')}
            </Text>
          </View>
          {currentStreak > 0 && (
            <View style={[styles.streakBadge, { backgroundColor: colors.primaryDim }]}>
              <Icon name="fire" size={13} color={colors.primary} />
              <Text style={[styles.streakText, { color: colors.primary }]}>
                {t('workoutPlans.calStreak', { n: currentStreak })}
              </Text>
            </View>
          )}
        </View>

        {/* Grid */}
        <View style={styles.calendarGrid}>
          {/* Day labels */}
          <View style={styles.calendarDayCol}>
            {DAY_LABELS.map((d, i) => (
              <Text key={i} style={[styles.calendarDayLabel, { height: CELL, lineHeight: CELL }]}>{d}</Text>
            ))}
          </View>

          {/* Week columns */}
          <View style={styles.calendarWeeks}>
            {columns.map((col, wi) => (
              <View key={wi} style={[styles.calendarCol, { gap: GAP }]}>
                {col.map((day, di) => (
                  <View
                    key={di}
                    style={[
                      styles.calendarCell,
                      { width: CELL, height: CELL, borderRadius: Math.floor(CELL * 0.25) },
                      day.hasWorkout
                        ? { backgroundColor: colors.primary }
                        : { backgroundColor: colors.surfaceElevated },
                      day.isToday && !day.hasWorkout && {
                        borderWidth: 1.5, borderColor: colors.primary,
                        backgroundColor: colors.primaryDim,
                      },
                      day.isFuture && { opacity: 0 },
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.calendarFooter}>
          <View style={styles.calendarLegend}>
            <View style={[styles.legendDot, { backgroundColor: colors.surfaceElevated }]} />
            <Text style={styles.legendText}>{t('workoutPlans.calNone')}</Text>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>{t('workoutPlans.calWorkout')}</Text>
          </View>
          <View style={styles.calendarViewAll}>
            <Text style={styles.calendarViewAllText}>{t('workoutPlans.calViewHistory')}</Text>
            <Icon name="chevron-right" size={13} color={colors.textTertiary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [colors, styles, workoutDates, currentStreak, totalHistorySessions, navigation]);

  // ── My Plans list header ──────────────────────────────────────────────────────

  const MyPlansHeader = (
    <View style={styles.myPlansHeader}>
      <ResumeBanner />

      {WorkoutCalendar}

      {/* Section row */}
      <View style={styles.sectionRow}>
        <View style={styles.sectionLabelWrap}>
          <Text style={styles.sectionLabel}>{t('workoutPlans.sectionMyPlans')}</Text>
          {plans && plans.length > 0 && (
            <View style={[styles.sectionCount, { backgroundColor: colors.primaryDim }]}>
              <Text style={[styles.sectionCountText, { color: colors.primary }]}>{plans.length}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[styles.newPlanBtn, { backgroundColor: colors.primaryDim }]}
          onPress={() => {
            if (!canCreateMore) { navigation.navigate('Upgrade' as any); return; }
            navigation.navigate('CreateWorkoutPlan');
          }}
          activeOpacity={0.8}
        >
          <Icon name="plus" size={14} color={colors.primary} />
          <Text style={[styles.newPlanBtnText, { color: colors.primary }]}>{t('workoutPlans.newPlan')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      {PlanActionsModal}


      {/* Tab row */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          const tabLabel = tab.key === 'my-plans'
            ? t('workoutPlans.tabMyPlans')
            : tab.key === 'templates'
              ? t('workoutPlans.tabTemplates')
              : t('workoutPlans.tabLibrary');
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabPill, active && styles.tabPillActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.75}
            >
              <Icon name={tab.icon} size={16} color={active ? colors.primary : colors.textTertiary} />
              <Text style={[styles.tabPillText, active && styles.tabPillTextActive]}>{tabLabel}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* My Plans */}
      {activeTab === 'my-plans' && (
        <FlatList
          data={plans}
          keyExtractor={(item) => item.id}
          renderItem={renderPlan}
          onRefresh={refetch}
          refreshing={isRefetching}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={MyPlansHeader}
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.empty}>
                <View style={[styles.emptyIconBox, { backgroundColor: colors.primaryDim }]}>
                  <Icon name="clipboard-list-outline" size={36} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>{t('workoutPlans.noPlansYet')}</Text>
                <Text style={styles.emptySub}>{t('workoutPlans.noPlansDesc')}</Text>
                <TouchableOpacity
                  style={[styles.emptyBtn, { borderColor: colors.primary }]}
                  onPress={() => setActiveTab('templates')}
                  activeOpacity={0.8}
                >
                  <Icon name="lightning-bolt-outline" size={15} color={colors.primary} />
                  <Text style={[styles.emptyBtnText, { color: colors.primary }]}>{t('workoutPlans.browseTemplates')}</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Templates */}
      {activeTab === 'templates' && (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionHint}>{t('workoutPlans.templateHint')}</Text>
          {WORKOUT_TEMPLATES.map(renderTemplate)}
        </ScrollView>
      )}

      {/* Library */}
      {activeTab === 'library' && (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.browseAllRow}
            onPress={() => navigation.navigate('ExerciseList', { mode: 'browse' })}
            activeOpacity={0.75}
          >
            <View style={[styles.browseAllIconBox, { backgroundColor: colors.primaryDim }]}>
              <Icon name="magnify" size={20} color={colors.primary} />
            </View>
            <View style={styles.browseAllInfo}>
              <Text style={styles.browseAllTitle}>{t('workoutPlans.browseExercises')}</Text>
              <Text style={styles.browseAllSub}>{t('workoutPlans.exerciseCount', { n: EXERCISE_SEED.length })}</Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          <Text style={styles.libSectionLabel}>{t('workoutPlans.byMuscleGroup')}</Text>
          <View style={styles.muscleGrid}>
            {MUSCLE_META.map((m) => (
              <TouchableOpacity
                key={m.key}
                style={styles.muscleCard}
                onPress={() => navigation.navigate('ExerciseList', { mode: 'browse' })}
                activeOpacity={0.75}
              >
                <View style={[styles.muscleIconBox, { backgroundColor: m.color + '18' }]}>
                  <Icon name={m.icon} size={22} color={m.color} />
                </View>
                <Text style={styles.muscleLabel}>{getMuscleLabel(m.key)}</Text>
                {(muscleCounts[m.key] ?? 0) > 0 && (
                  <View style={[styles.muscleCountPill, { backgroundColor: m.color + '18' }]}>
                    <Text style={[styles.muscleCountText, { color: m.color }]}>{muscleCounts[m.key]}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    // ── Tabs ─────────────────────────────────────────────────────────────────
    tabRow: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderBottomWidth: 1, borderBottomColor: c.surfaceBorder,
    },
    tabPill: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 6, paddingVertical: 14,
      borderBottomWidth: 2, borderBottomColor: 'transparent',
    },
    tabPillActive: { borderBottomColor: c.primary },
    tabPillText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: c.textTertiary },
    tabPillTextActive: { color: c.primary },

    listContent: { padding: Spacing.base, paddingBottom: TAB_BAR_PADDING },
    sectionHint: { fontSize: Typography.sm, color: c.textTertiary, lineHeight: 20, marginBottom: Spacing.sm },

    // ── Resume banner ─────────────────────────────────────────────────────────
    resumeBanner: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: c.surface, borderRadius: Radius.xl,
      borderWidth: 1, borderColor: c.primary + '40',
      padding: Spacing.md, gap: Spacing.md, marginBottom: Spacing.md,
    },
    resumePulse: {
      width: 42, height: 42, borderRadius: 21,
      backgroundColor: c.primaryDim,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    resumeInfo: { flex: 1 },
    resumeTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: c.textPrimary },
    resumeSub: { fontSize: Typography.xs, color: c.primary, marginTop: 2 },
    resumeBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.md,
    },
    resumeBtnText: { fontSize: Typography.xs, fontWeight: Typography.bold, color: '#000' },

    // ── My Plans header ───────────────────────────────────────────────────────
    myPlansHeader: { gap: Spacing.lg, marginBottom: Spacing.md },

    // ── Workout calendar ──────────────────────────────────────────────────────
    calendarCard: {
      backgroundColor: c.surface, borderRadius: Radius.xl,
      borderWidth: 1, borderColor: c.surfaceBorder,
      padding: Spacing.md, gap: Spacing.sm,
    },
    calendarHeader: {
      flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    },
    calendarTitle: {
      fontSize: Typography.xs, fontWeight: Typography.bold,
      color: c.textTertiary, letterSpacing: 1,
    },
    calendarSub: { fontSize: Typography.sm, color: c.textPrimary, fontWeight: Typography.semibold, marginTop: 2 },
    streakBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full,
    },
    streakText: { fontSize: Typography.xs, fontWeight: Typography.bold },
    calendarGrid: { flexDirection: 'row', gap: 6 },
    calendarDayCol: { gap: 3, paddingTop: 1 },
    calendarDayLabel: {
      fontSize: 9, color: c.textTertiary, fontWeight: Typography.medium,
      width: 10, textAlign: 'center',
    },
    calendarWeeks: { flex: 1, flexDirection: 'row', gap: 3 },
    calendarCol: { flex: 1, flexDirection: 'column' },
    calendarCell: { borderRadius: 3 },
    calendarFooter: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingTop: Spacing.xs,
    },
    calendarLegend: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendDot: { width: 10, height: 10, borderRadius: 2 },
    legendText: { fontSize: 10, color: c.textTertiary, marginRight: 4 },
    calendarViewAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    calendarViewAllText: { fontSize: Typography.xs, color: c.textTertiary, fontWeight: Typography.medium },

    // ── Section header ────────────────────────────────────────────────────────
    sectionRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    sectionLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    sectionLabel: {
      fontSize: Typography.xs, fontWeight: Typography.bold,
      color: c.textTertiary, letterSpacing: 1,
    },
    sectionCount: {
      paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radius.full,
    },
    sectionCountText: { fontSize: 10, fontWeight: Typography.bold },
    newPlanBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: Spacing.md, paddingVertical: 6,
      borderRadius: Radius.full,
    },
    newPlanBtnText: { fontSize: Typography.xs, fontWeight: Typography.bold },

    // ── Plan card ─────────────────────────────────────────────────────────────
    planCard: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      backgroundColor: c.surface, borderRadius: Radius.xl,
      borderWidth: 1, borderColor: c.surfaceBorder,
      padding: Spacing.md,
    },
    planIconWrap: {
      width: 40, height: 40, borderRadius: Radius.md,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    planTitleBlock: { flex: 1 },
    planName: { fontSize: Typography.base, fontWeight: Typography.bold, color: c.textPrimary },
    planMeta: { fontSize: Typography.xs, color: c.textTertiary, marginTop: 2 },

    // ── Plan actions sheet ────────────────────────────────────────────────────
    overlay: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'],
      paddingHorizontal: Spacing.base, paddingBottom: TAB_BAR_PADDING, paddingTop: Spacing.sm,
    },
    sheetHandle: {
      width: 36, height: 4, borderRadius: 2, backgroundColor: c.surfaceBorder,
      alignSelf: 'center', marginBottom: Spacing.md,
    },
    sheetTitle: {
      fontSize: Typography.sm, fontWeight: Typography.semibold,
      color: c.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.md,
    },
    sheetRow: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: c.surfaceBorder,
    },
    sheetIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    sheetRowText: { flex: 1, fontSize: Typography.base, fontWeight: Typography.medium, color: c.textPrimary },

    // ── Empty state ───────────────────────────────────────────────────────────
    empty: { alignItems: 'center', paddingVertical: Spacing['3xl'], gap: Spacing.md },
    emptyIconBox: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: c.textPrimary },
    emptySub: {
      fontSize: Typography.sm, color: c.textSecondary,
      textAlign: 'center', lineHeight: 22, paddingHorizontal: Spacing['2xl'],
    },
    emptyBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
      borderRadius: Radius.full, borderWidth: 1.5, marginTop: Spacing.xs,
    },
    emptyBtnText: { fontSize: Typography.sm, fontWeight: Typography.semibold },

    // ── Templates ─────────────────────────────────────────────────────────────
    tplCard: {
      backgroundColor: c.surface, borderRadius: Radius.xl,
      borderWidth: 1, borderColor: c.surfaceBorder,
      marginBottom: Spacing.xs, overflow: 'hidden',
    },
    tplInner: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    },
    tplIconBox: {
      width: 38, height: 38, borderRadius: Radius.md,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: c.primaryDim,
    },
    tplName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: c.textPrimary },
    tplMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    tplDiffDot: { width: 6, height: 6, borderRadius: 3 },
    tplMetaText: { fontSize: Typography.xs, color: c.textTertiary },
    tplMetaDot: { fontSize: Typography.xs, color: c.surfaceBorder },
    diffBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    diffDot: { width: 5, height: 5, borderRadius: 3 },
    diffBadgeText: { fontSize: 10, fontWeight: Typography.semibold },
    daysBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    daysBadgeText: { fontSize: 10, color: c.textSecondary },
    tplAddBtn: {
      width: 32, height: 32, borderRadius: 16,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.primary, flexShrink: 0,
    },

    // ── Library ───────────────────────────────────────────────────────────────
    browseAllRow: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      backgroundColor: c.surface, borderRadius: Radius.xl,
      borderWidth: 1, borderColor: c.surfaceBorder, padding: Spacing.base, marginBottom: Spacing.md,
    },
    browseAllIconBox: {
      width: 44, height: 44, borderRadius: Radius.md,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    browseAllInfo: { flex: 1 },
    browseAllTitle: { fontSize: Typography.base, fontWeight: Typography.semibold, color: c.textPrimary },
    browseAllSub: { fontSize: Typography.xs, color: c.textTertiary, marginTop: 2 },
    libSectionLabel: {
      fontSize: Typography.xs, fontWeight: Typography.semibold,
      color: c.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm,
    },
    muscleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    muscleCard: {
      width: '30.5%', alignItems: 'center', gap: Spacing.xs,
      backgroundColor: c.surface, borderRadius: Radius.xl,
      borderWidth: 1, borderColor: c.surfaceBorder,
      paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm,
    },
    muscleIconBox: { width: 48, height: 48, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
    muscleLabel: { fontSize: 11, fontWeight: Typography.semibold, color: c.textPrimary, textAlign: 'center' },
    muscleCountPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
    muscleCountText: { fontSize: 10, fontWeight: Typography.bold },
  });
}
