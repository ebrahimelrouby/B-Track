import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';

import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius, TAB_BAR_PADDING } from '@/theme';
import { useActiveWorkoutStore } from '@/store/activeWorkout.store';
import { workoutApi } from '@/api/workout.api';
import { ActiveExercise, ActiveSet, MuscleGroup, SetType, WorkoutSet } from '@/types';
import { WorkoutStackParamList, WorkoutNavigationProp } from '@/navigation/types';
import { pushWorkoutStateToWatch, subscribeToWatchActions } from '@/native/watch';

type RouteProps = RouteProp<WorkoutStackParamList, 'ActiveWorkout'>;

// ─── Constants ───────────────────────────────────────────────────────────────

const SET_TYPE_ORDER: SetType[] = ['NORMAL', 'WARMUP', 'DROP_SET', 'FAILURE', 'AMRAP', 'TEMPO'];

const SET_TYPE_META: Record<SetType, { label: string; color: string; bg: string }> = {
  NORMAL:   { label: '',  color: '',        bg: '' },
  WARMUP:   { label: 'W', color: '#F59E0B', bg: '#F59E0B22' },
  DROP_SET: { label: 'D', color: '#3B82F6', bg: '#3B82F622' },
  FAILURE:  { label: 'F', color: '#EF4444', bg: '#EF444422' },
  AMRAP:    { label: 'A', color: '#8B5CF6', bg: '#8B5CF622' },
  TEMPO:    { label: 'T', color: '#06B6D4', bg: '#06B6D422' },
};

const MUSCLE_ICONS: Record<MuscleGroup, string> = {
  CHEST: 'arm-flex', BACK: 'human-handsup', SHOULDERS: 'account-box',
  BICEPS: 'arm-flex-outline', TRICEPS: 'arm-flex', FOREARMS: 'hand-back-right',
  CORE: 'human', GLUTES: 'human-male', QUADRICEPS: 'run-fast',
  HAMSTRINGS: 'human-male-height', CALVES: 'walk', FULL_BODY: 'human-male-board',
  CARDIO: 'heart-pulse', OTHER: 'dumbbell',
};

function formatTime(s: number): string {
  const h   = Math.floor(s / 3600);
  const m   = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`;
}

function calcVolume(sets: ActiveSet[]): number {
  return sets.reduce(
    (sum, s) => sum + (s.isCompleted && s.weightKg && s.reps ? s.weightKg * s.reps : 0), 0,
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface RestTimerState { endTime: number; initial: number; }

// ─── SetRow ──────────────────────────────────────────────────────────────────

interface SetRowProps {
  set: ActiveSet; prevSet?: WorkoutSet; index: number;
  onUpdate: (u: Partial<ActiveSet>) => void;
  onComplete: () => void; onRemove: () => void; onCycleType: () => void;
  colors: ColorPalette; styles: ReturnType<typeof getStyles>;
}

const SetRow = React.memo(function SetRow({
  set, prevSet, index, onUpdate, onComplete, onRemove, onCycleType, colors, styles,
}: SetRowProps) {
  const meta     = SET_TYPE_META[set.setType];
  const isNormal = set.setType === 'NORMAL';
  const label    = isNormal ? String(index + 1) : meta.label;
  const badgeBg  = isNormal
    ? (set.isCompleted ? colors.primary : colors.surfaceElevated)
    : meta.bg;
  const badgeColor = isNormal
    ? (set.isCompleted ? '#000' : colors.textSecondary)
    : meta.color;
  const prevLabel = prevSet?.weightKg && prevSet?.reps
    ? `${prevSet.weightKg}×${prevSet.reps}` : '—';

  return (
    <View style={[styles.setRow, set.isCompleted && { backgroundColor: colors.primaryDim }]}>
      <TouchableOpacity
        style={[styles.typeBadge, { backgroundColor: badgeBg }]}
        onPress={onCycleType}
        onLongPress={onRemove}
        delayLongPress={500}
        hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      >
        {isNormal && set.isCompleted
          ? <Icon name="check" size={14} color="#000" />
          : <Text style={[styles.typeBadgeText, { color: badgeColor }]}>{label}</Text>
        }
      </TouchableOpacity>

      <Text style={styles.prevCell}>{prevLabel}</Text>

      <TextInput
        style={[styles.setInput, set.isCompleted && styles.setInputDone]}
        value={set.weightKg?.toString() ?? ''}
        onChangeText={(v) => onUpdate({ weightKg: v === '' ? undefined : parseFloat(v) || undefined })}
        keyboardType="decimal-pad"
        placeholder="kg"
        placeholderTextColor={colors.textTertiary}
        selectTextOnFocus
      />

      <TextInput
        style={[styles.setInput, set.isCompleted && styles.setInputDone]}
        value={set.reps?.toString() ?? ''}
        onChangeText={(v) => onUpdate({ reps: v === '' ? undefined : parseInt(v, 10) || undefined })}
        keyboardType="number-pad"
        placeholder="reps"
        placeholderTextColor={colors.textTertiary}
        selectTextOnFocus
      />

      <TextInput
        style={[styles.setInput, styles.rpeInput, set.isCompleted && styles.setInputDone]}
        value={set.rpe?.toString() ?? ''}
        onChangeText={(v) => onUpdate({ rpe: v === '' ? undefined : parseFloat(v) || undefined })}
        keyboardType="decimal-pad"
        placeholder="—"
        placeholderTextColor={colors.textTertiary}
        selectTextOnFocus
      />

      <TouchableOpacity
        style={[styles.completeBtn, set.isCompleted && styles.completeBtnDone]}
        onPress={onComplete}
        activeOpacity={0.75}
      >
        <Icon name="check-bold" size={15} color={set.isCompleted ? '#000' : colors.textTertiary} />
      </TouchableOpacity>
    </View>
  );
});

// ─── ExerciseCard ─────────────────────────────────────────────────────────────

interface ExerciseCardProps {
  exercise: ActiveExercise; prevSets: WorkoutSet[];
  onAddSet: () => void; onUpdateSet: (id: string, u: Partial<ActiveSet>) => void;
  onCompleteSet: (id: string) => void; onRemoveSet: (id: string) => void;
  onCycleSetType: (id: string) => void; onUpdateNotes: (n: string) => void;
  onOpenOptions: () => void; colors: ColorPalette; styles: ReturnType<typeof getStyles>;
}

const ExerciseCard = React.memo(function ExerciseCard({
  exercise, prevSets, onAddSet, onUpdateSet, onCompleteSet, onRemoveSet,
  onCycleSetType, onUpdateNotes, onOpenOptions, colors, styles,
}: ExerciseCardProps) {
  const [showNotes, setShowNotes] = useState(false);
  const { t } = useTranslation();
  const muscleIcon = MUSCLE_ICONS[exercise.exercise.muscleGroup] ?? 'dumbbell';
  const vol        = calcVolume(exercise.sets);
  const doneCount  = exercise.sets.filter((s) => s.isCompleted).length;
  const total      = exercise.sets.length;
  const allDone    = total > 0 && doneCount === total;
  const pct        = total > 0 ? doneCount / total : 0;

  return (
    <View style={[styles.exCard, allDone && { borderColor: colors.primary + '60' }]}>
      {/* Left accent bar — lime when all done, neutral otherwise */}
      <View style={[styles.exAccentBar, { backgroundColor: allDone ? colors.primary : colors.surfaceBorder }]} />

      <View style={styles.exContent}>
        {/* Header row */}
        <View style={styles.exHeader}>
          {/* Exercise icon */}
          {exercise.exercise.imageUrl ? (
            <Image
              source={{ uri: exercise.exercise.imageUrl }}
              style={styles.exIcon}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.exIconBox, { backgroundColor: colors.primaryDim }]}>
              <Icon name={muscleIcon} size={18} color={colors.primary} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.exName} numberOfLines={1}>{exercise.exercise.name}</Text>
            <Text style={styles.exMuscle}>{exercise.exercise.muscleGroup.replace(/_/g, ' ')}</Text>
          </View>
          <TouchableOpacity onPress={onOpenOptions} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="dots-horizontal" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Volume + sets + progress */}
        <View style={styles.exSubRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {allDone ? (
              <View style={[styles.allDonePill, { backgroundColor: colors.primaryDim, borderColor: colors.primary + '50' }]}>
                <Icon name="check-circle" size={12} color={colors.primary} />
                <Text style={[styles.allDoneText, { color: colors.primary }]}>{t('activeWorkout.allSetsDone')}</Text>
              </View>
            ) : (
              <Text style={[styles.exVolText, vol === 0 && { color: colors.textTertiary }]}>
                {vol > 0 ? `${vol.toLocaleString()} kg` : t('activeWorkout.noVolumeYet')}
              </Text>
            )}
          </View>
          <Text style={styles.exSetCount}>{doneCount}/{total} sets</Text>
        </View>

        {/* Set progress bar */}
        {total > 0 && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${pct * 100}%` as any, backgroundColor: allDone ? colors.primary : colors.primary + '60' }]} />
          </View>
        )}

        {/* Column headers */}
        {total > 0 && (
          <View style={styles.colHeader}>
            <Text style={[styles.colHeaderText, { width: 34 }]}>SET</Text>
            <Text style={[styles.colHeaderText, styles.prevCol]}>PREV</Text>
            <Text style={[styles.colHeaderText, styles.inputCol]}>KG</Text>
            <Text style={[styles.colHeaderText, styles.inputCol]}>REPS</Text>
            <Text style={[styles.colHeaderText, styles.rpeCol]}>RPE</Text>
            <View style={{ width: 38 }} />
          </View>
        )}

        {/* Set rows */}
        {exercise.sets.map((s, i) => (
          <SetRow
            key={s.localId} set={s} prevSet={prevSets[i]} index={i}
            onUpdate={(u) => onUpdateSet(s.localId, u)}
            onComplete={() => onCompleteSet(s.localId)}
            onRemove={() => onRemoveSet(s.localId)}
            onCycleType={() => onCycleSetType(s.localId)}
            colors={colors} styles={styles}
          />
        ))}

        {/* Add Set */}
        <TouchableOpacity style={styles.addSetRow} onPress={onAddSet} activeOpacity={0.7}>
          <View style={[styles.addSetIcon, { backgroundColor: colors.primaryDim }]}>
            <Icon name="plus" size={13} color={colors.primary} />
          </View>
          <Text style={styles.addSetText}>{t('activeWorkout.addSet')}</Text>
        </TouchableOpacity>

        {/* Notes */}
        <TouchableOpacity
          style={styles.notesToggle}
          onPress={() => setShowNotes((v) => !v)}
          activeOpacity={0.7}
        >
          <Icon
            name={exercise.notes ? 'note-text' : 'note-outline'}
            size={13}
            color={exercise.notes ? colors.primary : colors.textTertiary}
          />
          <Text style={[styles.notesHint, exercise.notes && { color: colors.textSecondary }]}>
            {exercise.notes || t('activeWorkout.addNote')}
          </Text>
          <Icon name={showNotes ? 'chevron-up' : 'chevron-down'} size={13} color={colors.textTertiary} />
        </TouchableOpacity>

        {showNotes && (
          <TextInput
            style={[styles.notesInput, { borderColor: colors.surfaceBorder }]}
            value={exercise.notes ?? ''}
            onChangeText={onUpdateNotes}
            placeholder={t('activeWorkout.notesPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            multiline autoFocus
          />
        )}
      </View>
    </View>
  );
});

// ─── Rest Timer Banner ────────────────────────────────────────────────────────

function RestBanner({
  countdown, initial, isPaused, onPause, onResume, onAdjust, onSkip, colors,
}: {
  countdown: number; initial: number; isPaused: boolean;
  onPause: () => void; onResume: () => void; onAdjust: (d: number) => void;
  onSkip: () => void; colors: ColorPalette;
}) {
  const { t } = useTranslation();
  const pct = initial > 0 ? countdown / initial : 0;
  const barColor = pct > 0.5 ? colors.primary : pct > 0.25 ? '#F59E0B' : '#EF4444';

  return (
    <View>
      {/* Progress bar */}
      <View style={{ height: 3, backgroundColor: colors.surfaceElevated }}>
        <View style={{ height: 3, width: `${pct * 100}%` as any, backgroundColor: barColor }} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm }}>
        <TouchableOpacity
          style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.sm, backgroundColor: colors.surfaceElevated }}
          onPress={() => onAdjust(-30)}
        >
          <Text style={{ fontSize: Typography.sm, fontWeight: Typography.bold, color: colors.primary }}>−30s</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ flex: 1, alignItems: 'center' }} onPress={isPaused ? onResume : onPause}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name={isPaused ? 'play-circle' : 'pause-circle'} size={22} color={colors.primary} />
            <Text style={{ fontSize: 26, fontWeight: Typography.extrabold, color: barColor, fontVariant: ['tabular-nums'] }}>
              {formatTime(countdown)}
            </Text>
          </View>
          <Text style={{ fontSize: Typography.xs, color: colors.textTertiary, marginTop: 2 }}>
            {isPaused ? t('activeWorkout.paused') : t('activeWorkout.rest')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.sm, backgroundColor: colors.surfaceElevated }}
          onPress={() => onAdjust(30)}
        >
          <Text style={{ fontSize: Typography.sm, fontWeight: Typography.bold, color: colors.primary }}>+30s</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ marginLeft: Spacing.sm, padding: Spacing.sm, borderRadius: Radius.sm, backgroundColor: colors.primaryDim }}
          onPress={onSkip}
        >
          <Icon name="skip-next" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Finish Modal ─────────────────────────────────────────────────────────────

function FinishModal({
  visible, workoutName, durationSeconds, totalSets, totalVolume, exerciseCount,
  onKeepGoing, onSave, onDiscard, colors,
}: {
  visible: boolean; workoutName: string; durationSeconds: number;
  totalSets: number; totalVolume: number; exerciseCount: number;
  onKeepGoing: () => void; onSave: () => void; onDiscard: () => void;
  colors: ColorPalette;
}) {
  const { t } = useTranslation();
  const stats = [
    { icon: 'clock-outline',    label: t('activeWorkout.modalDuration'),   value: formatTime(durationSeconds) },
    { icon: 'layers-triple',    label: t('activeWorkout.modalSetsDone'),   value: String(totalSets) },
    { icon: 'weight',           label: t('activeWorkout.modalVolume'),     value: `${totalVolume.toLocaleString()} kg` },
    { icon: 'dumbbell',         label: t('activeWorkout.modalExercises'),  value: String(exerciseCount) },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onKeepGoing}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 }}>
          {/* Handle */}
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.surfaceBorder, alignSelf: 'center', marginTop: 14, marginBottom: 20 }} />

          {/* Trophy icon */}
          <View style={{ alignItems: 'center', marginBottom: Spacing.lg }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primaryDim, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md }}>
              <Icon name="trophy" size={36} color={colors.primary} />
            </View>
            <Text style={{ fontSize: Typography.xl, fontWeight: Typography.bold, color: colors.textPrimary }}>
              {t('activeWorkout.workoutComplete')}
            </Text>
            <Text style={{ fontSize: Typography.sm, color: colors.textTertiary, marginTop: 4 }}>
              {workoutName}
            </Text>
          </View>

          {/* Stats grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.base, gap: Spacing.sm, marginBottom: Spacing.xl }}>
            {stats.map((s) => (
              <View
                key={s.label}
                style={{
                  flex: 1, minWidth: '44%',
                  backgroundColor: colors.surfaceElevated, borderRadius: Radius.lg,
                  borderWidth: 1, borderColor: colors.surfaceBorder,
                  padding: Spacing.md, alignItems: 'center', gap: 4,
                }}
              >
                <Icon name={s.icon} size={20} color={colors.primary} />
                <Text style={{ fontSize: Typography.lg, fontWeight: Typography.bold, color: colors.textPrimary }}>
                  {s.value}
                </Text>
                <Text style={{ fontSize: Typography.xs, color: colors.textTertiary }}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Actions */}
          <View style={{ paddingHorizontal: Spacing.base, gap: Spacing.sm }}>
            <TouchableOpacity
              style={{ backgroundColor: colors.primary, borderRadius: Radius.xl, paddingVertical: Spacing.md + 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onPress={onSave}
              activeOpacity={0.85}
            >
              <Icon name="check-circle" size={20} color="#000" />
              <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: '#000' }}>
                {t('activeWorkout.saveWorkout')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ backgroundColor: colors.surfaceElevated, borderRadius: Radius.xl, paddingVertical: Spacing.md + 2, borderWidth: 1, borderColor: colors.surfaceBorder, alignItems: 'center' }}
              onPress={onKeepGoing}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: Typography.base, fontWeight: Typography.semibold, color: colors.textPrimary }}>
                {t('activeWorkout.keepGoing')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onDiscard} style={{ alignItems: 'center', paddingVertical: Spacing.sm }}>
              <Text style={{ fontSize: Typography.sm, color: colors.error }}>{t('activeWorkout.discardSession')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Options Modal ────────────────────────────────────────────────────────────

function ExerciseOptionsModal({
  visible, exerciseName, onClose, onInfo, onDuplicate, onRemove, colors,
}: {
  visible: boolean; exerciseName: string; onClose: () => void; onInfo: () => void;
  onDuplicate: () => void; onRemove: () => void; colors: ColorPalette;
}) {
  const { t } = useTranslation();
  const rows = [
    { icon: 'information-outline', label: t('activeWorkout.exerciseInfo'), action: onInfo },
    { icon: 'content-copy',        label: t('activeWorkout.duplicateExercise'), action: () => { onDuplicate(); onClose(); } },
    { icon: 'trash-can-outline',   label: t('activeWorkout.removeExercise'),    action: () => { onRemove(); onClose(); }, danger: true },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }} activeOpacity={1} onPress={onClose}>
        <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 28 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.surfaceBorder, alignSelf: 'center', marginVertical: Spacing.md }} />
          <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: colors.textPrimary, paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm }} numberOfLines={1}>
            {exerciseName}
          </Text>
          {rows.map((r) => (
            <TouchableOpacity
              key={r.label}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, gap: Spacing.md }}
              onPress={r.action}
              activeOpacity={0.7}
            >
              <View style={{ width: 40, height: 40, borderRadius: Radius.md, backgroundColor: r.danger ? colors.error + '18' : colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={r.icon} size={19} color={r.danger ? colors.error : colors.textSecondary} />
              </View>
              <Text style={{ flex: 1, fontSize: Typography.base, color: r.danger ? colors.error : colors.textPrimary, fontWeight: Typography.medium }}>
                {r.label}
              </Text>
              <Icon name="chevron-right" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={{ borderTopWidth: 1, borderTopColor: colors.surfaceBorder, marginTop: Spacing.xs, paddingVertical: Spacing.md, alignItems: 'center' }}
            onPress={onClose}
          >
            <Text style={{ fontSize: Typography.base, color: colors.textTertiary }}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ActiveWorkoutScreen() {
  const navigation = useNavigation<WorkoutNavigationProp>();
  const { params } = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { t } = useTranslation();

  const {
    activeWorkout, isWorkoutActive, currentExerciseLocalId,
    startWorkout, addExercise, addSet, updateSet, completeSet, removeSet,
    removeExercise, duplicateExercise, cycleSetType,
    updateExerciseNotes, finishWorkout, discardWorkout,
  } = useActiveWorkoutStore();

  const [elapsedSeconds, setElapsedSeconds]  = useState(0);
  const [restState, setRestState]            = useState<RestTimerState | null>(null);
  const [restCountdown, setRestCountdown]    = useState(0);
  const [restPaused, setRestPaused]          = useState(false);
  const [prevSetsMap, setPrevSetsMap]        = useState<Record<string, WorkoutSet[]>>({});
  const [optionsTarget, setOptionsTarget]    = useState<ActiveExercise | null>(null);
  const [showFinish, setShowFinish]          = useState(false);

  const loadedIds    = useRef<Set<string>>(new Set());
  const syncMutation = useMutation({ mutationFn: workoutApi.syncSession });

  useEffect(() => {
    if (!isWorkoutActive) {
      startWorkout({ planId: params.planId, dayId: params.dayId, name: params.workoutName });
    }
  }, []);

  useEffect(() => {
    if (!params.dayId || !activeWorkout || activeWorkout.exercises.length > 0) return;
    workoutApi.getPlans().then((plans) => {
      for (const plan of plans) {
        const day = plan.days.find((d) => d.id === params.dayId);
        if (day) {
          [...day.exercises].sort((a, b) => a.sortOrder - b.sortOrder).forEach((wde) => addExercise(wde.exercise));
          break;
        }
      }
    }).catch(() => {});
  }, [params.dayId, isWorkoutActive]);

  useEffect(() => {
    if (!activeWorkout) return;
    const start = new Date(activeWorkout.startedAt).getTime();
    const id = setInterval(() => setElapsedSeconds(Math.round((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, [activeWorkout?.startedAt]);

  useEffect(() => {
    if (!restState || restPaused) return;
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((restState.endTime - Date.now()) / 1000));
      setRestCountdown(remaining);
      if (remaining === 0) {
        setRestState(null);
        ReactNativeHapticFeedback.trigger('notificationWarning');
      }
    }, 500);
    return () => clearInterval(id);
  }, [restState, restPaused]);

  useEffect(() => {
    if (!activeWorkout) return;
    activeWorkout.exercises.forEach((ex) => {
      const id = ex.exercise.id;
      if (loadedIds.current.has(id)) return;
      loadedIds.current.add(id);
      workoutApi.getLastSetsForExercise(id).then((sets) => {
        if (sets.length > 0) setPrevSetsMap((prev) => ({ ...prev, [id]: sets }));
      }).catch(() => {});
    });
  }, [activeWorkout?.exercises]);

  const startRestTimer = useCallback((seconds: number) => {
    setRestState({ endTime: Date.now() + seconds * 1000, initial: seconds });
    setRestCountdown(seconds);
    setRestPaused(false);
    ReactNativeHapticFeedback.trigger('impactMedium');
  }, []);

  const handleSetComplete = useCallback((exLocalId: string, setLocalId: string, restSecs = 90) => {
    completeSet(exLocalId, setLocalId);
    startRestTimer(restSecs);
  }, [completeSet, startRestTimer]);

  const handlePauseRest = useCallback(() => {
    const remaining = restState ? Math.max(0, Math.ceil((restState.endTime - Date.now()) / 1000)) : 0;
    setRestCountdown(remaining);
    setRestPaused(true);
  }, [restState]);

  const handleResumeRest = useCallback(() => {
    setRestState((prev) => prev ? { ...prev, endTime: Date.now() + restCountdown * 1000 } : null);
    setRestPaused(false);
  }, [restCountdown]);

  const handleAdjustRest = useCallback((delta: number) => {
    if (restPaused) setRestCountdown((c) => Math.max(0, c + delta));
    else setRestState((prev) => prev ? { ...prev, endTime: prev.endTime + delta * 1000 } : null);
  }, [restPaused]);

  const doFinish = useCallback(async () => {
    const completed = finishWorkout();
    if (!completed) return;
    const totalSets = completed.exercises.reduce((s, ex) => s + ex.sets.filter((set) => set.isCompleted).length, 0);
    const totalVolumeKg = completed.exercises.reduce(
      (v, ex) => v + ex.sets.reduce((s, set) => s + (set.isCompleted && set.weightKg && set.reps ? set.weightKg * set.reps : 0), 0), 0,
    );
    const summaryBase = {
      name: completed.name,
      durationSeconds: elapsedSeconds,
      totalVolumeKg: Math.round(totalVolumeKg * 10) / 10,
      totalSets,
      exerciseCount: completed.exercises.length,
    };
    const goToSummary = (sessionId: string) => {
      navigation.reset({
        index: 1,
        routes: [
          { name: 'WorkoutPlans' },
          { name: 'WorkoutSummary', params: { sessionId, ...summaryBase } },
        ],
      });
    };
    const netState = await NetInfo.fetch();
    if (netState.isConnected) {
      syncMutation.mutate(completed, {
        onSuccess: (s) => goToSummary(s.id),
        onError:   ()  => goToSummary(''),
      });
    } else {
      goToSummary('');
    }
  }, [elapsedSeconds, finishWorkout, navigation, syncMutation]);

  const handleFinishPress = useCallback(() => {
    setShowFinish(true);
    ReactNativeHapticFeedback.trigger('impactLight');
  }, []);

  const handleDiscard = useCallback(() => {
    setShowFinish(false);
    discardWorkout();
    navigation.goBack();
  }, [discardWorkout, navigation]);

  // ── Push live workout state to the Apple Watch / Wear OS companion apps ──────
  useEffect(() => {
    if (!activeWorkout) {
      pushWorkoutStateToWatch({ isActive: false });
      return;
    }
    const currentExercise = activeWorkout.exercises.find((e) => e.localId === currentExerciseLocalId);
    const lastSet = currentExercise?.sets[currentExercise.sets.length - 1];
    pushWorkoutStateToWatch({
      isActive: true,
      workoutName: activeWorkout.name,
      startedAtMs: new Date(activeWorkout.startedAt).getTime(),
      isPaused: activeWorkout.isPaused,
      currentExerciseName: currentExercise?.exercise.name,
      lastWeightKg: lastSet?.weightKg,
      lastReps: lastSet?.reps,
      restEndTimeMs: restState && !restPaused ? restState.endTime : undefined,
    });
  }, [activeWorkout, currentExerciseLocalId, restState, restPaused]);

  // ── Handle actions triggered from the watch ──────────────────────────────────
  useEffect(() => subscribeToWatchActions((action) => {
    if (action === 'finishWorkout') {
      doFinish();
      return;
    }
    if (action === 'skipRest') {
      setRestState(null);
      return;
    }
    if (action === 'logSet') {
      const ex = activeWorkout?.exercises.find((e) => e.localId === currentExerciseLocalId);
      if (!ex) return;
      const last = ex.sets[ex.sets.length - 1];
      const created = addSet(ex.localId, last);
      if (created) handleSetComplete(ex.localId, created.localId, ex.restTimerSeconds ?? 90);
    }
  }), [activeWorkout, currentExerciseLocalId, addSet, handleSetComplete, doFinish]);

  const renderExercise = useCallback(({ item: ex }: { item: ActiveExercise }) => (
    <ExerciseCard
      exercise={ex}
      prevSets={prevSetsMap[ex.exercise.id] ?? []}
      onAddSet={() => { const last = ex.sets[ex.sets.length - 1]; addSet(ex.localId, last); }}
      onUpdateSet={(id, u) => updateSet(ex.localId, id, u)}
      onCompleteSet={(id) => handleSetComplete(ex.localId, id, ex.restTimerSeconds ?? 90)}
      onRemoveSet={(id) => removeSet(ex.localId, id)}
      onCycleSetType={(id) => cycleSetType(ex.localId, id)}
      onUpdateNotes={(n) => updateExerciseNotes(ex.localId, n)}
      onOpenOptions={() => setOptionsTarget(ex)}
      colors={colors}
      styles={styles}
    />
  ), [prevSetsMap, addSet, updateSet, handleSetComplete, removeSet, cycleSetType, updateExerciseNotes, colors, styles]);

  if (!activeWorkout) return null;

  const totalVol    = activeWorkout.exercises.reduce((s, ex) => s + calcVolume(ex.sets), 0);
  const totalDone   = activeWorkout.exercises.reduce((s, ex) => s + ex.sets.filter((set) => set.isCompleted).length, 0);
  const totalSets   = activeWorkout.exercises.reduce((s, ex) => s + ex.sets.length, 0);

  return (
    <View style={styles.root}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.discardBtn}
            onPress={() => { setShowFinish(false); discardWorkout(); navigation.goBack(); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.workoutLabel} numberOfLines={1}>{activeWorkout.name}</Text>
            {/* Glow halo behind timer */}
            <View style={styles.timerGlow} />
            <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
          </View>

          <TouchableOpacity
            style={styles.finishBtn}
            onPress={handleFinishPress}
            activeOpacity={0.85}
          >
            <Icon name="flag-checkered" size={15} color="#000" />
            <Text style={styles.finishBtnText}>{t('activeWorkout.finish')}</Text>
          </TouchableOpacity>
        </View>

        {/* Stats strip */}
        <View style={styles.statsStrip}>
          {[
            { icon: 'layers-triple-outline', value: `${totalDone}/${totalSets}`, label: t('activeWorkout.statSets') },
            { icon: 'weight',                value: totalVol > 0 ? `${totalVol.toLocaleString()}` : '0', label: t('activeWorkout.statKg') },
            { icon: 'dumbbell',              value: `${activeWorkout.exercises.length}`, label: t('activeWorkout.statExercises') },
          ].map((s, i, arr) => (
            <React.Fragment key={s.label}>
              <View style={styles.statChip}>
                <Icon name={s.icon} size={12} color={colors.primary} />
                <Text style={styles.statChipValue}>{s.value}</Text>
                <Text style={styles.statChipLabel}>{s.label}</Text>
              </View>
              {i < arr.length - 1 && <View style={styles.statDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Workout progress bar */}
        {totalSets > 0 && (
          <View style={styles.headerProgress}>
            <View style={[styles.headerProgressFill, { width: `${(totalDone / totalSets) * 100}%` as any }]} />
          </View>
        )}
      </View>

      {/* ── Exercise List ────────────────────────────────────────────────── */}
      <FlatList
        data={activeWorkout.exercises}
        keyExtractor={(item) => item.localId}
        renderItem={renderExercise}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + (restState ? 140 : 80) }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListFooterComponent={
          <TouchableOpacity
            style={[styles.addExBtn, { marginTop: Spacing.md }]}
            onPress={() => navigation.navigate('ExerciseList', { mode: 'select' })}
            activeOpacity={0.85}
          >
            <Icon name="plus-circle" size={18} color="#000" />
            <Text style={styles.addExText}>{t('activeWorkout.addExercise')}</Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconBox, { backgroundColor: colors.primaryDim }]}>
              <Icon name="dumbbell" size={36} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>{t('activeWorkout.emptyTitle')}</Text>
            <Text style={styles.emptySub}>{t('activeWorkout.emptyDesc')}</Text>
          </View>
        }
      />

      {/* ── Rest Timer (floating bottom panel) ──────────────────────────── */}
      {restState && (
        <View style={[styles.restPanel, { paddingBottom: insets.bottom + Spacing.xs }]}>
          <RestBanner
            countdown={restCountdown}
            initial={restState.initial}
            isPaused={restPaused}
            onPause={handlePauseRest}
            onResume={handleResumeRest}
            onAdjust={handleAdjustRest}
            onSkip={() => { setRestState(null); setRestCountdown(0); setRestPaused(false); }}
            colors={colors}
          />
        </View>
      )}

      {/* ── Finish Modal ─────────────────────────────────────────────────── */}
      <FinishModal
        visible={showFinish}
        workoutName={activeWorkout.name}
        durationSeconds={elapsedSeconds}
        totalSets={totalDone}
        totalVolume={Math.round(totalVol * 10) / 10}
        exerciseCount={activeWorkout.exercises.length}
        onKeepGoing={() => setShowFinish(false)}
        onSave={doFinish}
        onDiscard={handleDiscard}
        colors={colors}
      />

      {/* ── Options Modal ─────────────────────────────────────────────────── */}
      {optionsTarget && (
        <ExerciseOptionsModal
          visible
          exerciseName={optionsTarget.exercise.name}
          onClose={() => setOptionsTarget(null)}
          onInfo={() => { setOptionsTarget(null); navigation.navigate('ExerciseDetail', { exercise: optionsTarget.exercise }); }}
          onDuplicate={() => duplicateExercise(optionsTarget.localId)}
          onRemove={() => removeExercise(optionsTarget.localId)}
          colors={colors}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },

    // Header
    header: {
      backgroundColor: c.surface,
    },
    headerRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: Spacing.xs,
    },
    discardBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: c.surfaceElevated,
      borderWidth: 1, borderColor: c.surfaceBorder,
      alignItems: 'center', justifyContent: 'center',
    },
    headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.sm },
    workoutLabel: {
      fontSize: Typography.xl, fontWeight: Typography.bold,
      color: c.textPrimary, letterSpacing: 0.2,
    },
    timerGlow: {
      position: 'absolute',
      width: 120, height: 40,
      borderRadius: 60,
      backgroundColor: c.primary,
      opacity: 0.08,
      top: 6,
      alignSelf: 'center',
    },
    timerText: {
      fontSize: 22, fontWeight: Typography.bold,
      color: c.primary, fontVariant: ['tabular-nums'],
      letterSpacing: 0, marginTop: 2,
    },
    finishBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: Spacing.md, paddingVertical: 10,
      borderRadius: Radius.full, backgroundColor: c.primary,
      shadowColor: c.primary, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.45, shadowRadius: 10, elevation: 6,
    },
    finishBtnText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: '#000' },

    // Stats strip
    statsStrip: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      paddingVertical: Spacing.sm, gap: Spacing.sm,
    },
    statChip: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: c.surfaceElevated,
      paddingHorizontal: Spacing.sm, paddingVertical: 5,
      borderRadius: Radius.full,
      borderWidth: 1, borderColor: c.surfaceBorder,
    },
    statChipValue: { fontSize: Typography.xs, fontWeight: Typography.bold, color: c.textPrimary },
    statChipLabel: { fontSize: Typography.xs, color: c.textTertiary },
    statDivider: { width: 1, height: 14, backgroundColor: c.surfaceBorder },

    // Header progress bar (flush at the bottom of header)
    headerProgress: {
      height: 2, backgroundColor: c.surfaceBorder, overflow: 'hidden',
    },
    headerProgressFill: {
      height: 2, backgroundColor: c.primary,
    },

    // List
    list: { padding: Spacing.sm },

    // Exercise card
    exCard: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: Radius.xl,
      borderWidth: 1, borderColor: c.surfaceBorder,
      overflow: 'hidden',
      // subtle shadow
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
    },
    exAccentBar: { width: 3, flexShrink: 0 },
    exContent: { flex: 1, paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm },

    exHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
    exIconBox: {
      width: 42, height: 42, borderRadius: Radius.md,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    exIcon: { width: 42, height: 42, borderRadius: Radius.md, flexShrink: 0 },
    exName: { fontSize: Typography.base, fontWeight: Typography.bold, color: c.textPrimary },
    exMuscle: { fontSize: Typography.xs, color: c.textTertiary, textTransform: 'capitalize', marginTop: 2 },

    exSubRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: Spacing.xs,
    },
    exVolText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: c.primary },
    exSetCount: { fontSize: Typography.sm, color: c.textTertiary },
    allDonePill: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: Spacing.sm, paddingVertical: 3,
      borderRadius: Radius.full, borderWidth: 1,
    },
    allDoneText: { fontSize: Typography.xs, fontWeight: Typography.bold },

    // Progress bar
    progressBar: {
      height: 3, backgroundColor: c.surfaceElevated,
      borderRadius: 2, marginBottom: Spacing.sm, overflow: 'hidden',
    },
    progressFill: { height: 3, borderRadius: 2 },

    // Column headers
    colHeader: {
      flexDirection: 'row', alignItems: 'center',
      paddingBottom: 4, marginBottom: 2,
      borderBottomWidth: 1, borderBottomColor: c.surfaceBorder,
    },
    colHeaderText: {
      fontSize: 9, fontWeight: Typography.semibold,
      color: c.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8,
    },
    prevCol: { flex: 1, textAlign: 'center' },
    inputCol: { flex: 1.2, textAlign: 'center' },
    rpeCol: { width: 36, textAlign: 'center' },

    // Set row
    setRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 4, borderRadius: Radius.md,
      marginHorizontal: -4, paddingHorizontal: 4, gap: 2,
    },
    typeBadge: {
      width: 32, height: 32, borderRadius: 8,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    typeBadgeText: { fontSize: Typography.xs, fontWeight: Typography.bold },
    prevCell: { flex: 1, textAlign: 'center', fontSize: 11, color: c.textTertiary },
    setInput: {
      flex: 1.2, backgroundColor: c.surfaceElevated,
      borderRadius: Radius.md, paddingVertical: 7,
      textAlign: 'center', fontSize: Typography.sm,
      fontWeight: Typography.bold, color: c.textPrimary,
      marginHorizontal: 2, minHeight: 34,
      borderWidth: 1, borderColor: c.surfaceBorder,
    },
    setInputDone: { backgroundColor: c.primaryDim, color: c.primary, borderColor: c.primary + '40' },
    rpeInput: { flex: 0, width: 36 },
    completeBtn: {
      width: 34, height: 34, borderRadius: 17,
      backgroundColor: c.surfaceElevated,
      borderWidth: 1.5, borderColor: c.surfaceBorder,
      alignItems: 'center', justifyContent: 'center',
      marginLeft: 2, flexShrink: 0,
    },
    completeBtnDone: { backgroundColor: c.primary, borderColor: c.primary },

    // Add set
    addSetRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      paddingVertical: Spacing.sm, marginTop: Spacing.xs,
      borderTopWidth: 1, borderTopColor: c.surfaceBorder, gap: 6,
    },
    addSetIcon: {
      width: 20, height: 20, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
    },
    addSetText: { fontSize: Typography.sm, color: c.primary, fontWeight: Typography.semibold },

    // Notes
    notesToggle: {
      flexDirection: 'row', alignItems: 'center',
      gap: Spacing.xs, paddingTop: Spacing.xs,
    },
    notesHint: { flex: 1, fontSize: Typography.xs, color: c.textTertiary },
    notesInput: {
      backgroundColor: c.surfaceElevated, borderRadius: Radius.md,
      padding: Spacing.sm, marginTop: Spacing.xs,
      color: c.textPrimary, fontSize: Typography.sm,
      minHeight: 56, textAlignVertical: 'top',
      borderWidth: 1, borderColor: c.surfaceBorder,
    },

    // Rest timer floating panel
    restPanel: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: c.surface,
      borderTopWidth: 1, borderTopColor: c.surfaceBorder,
      shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.2, shadowRadius: 12, elevation: 16,
    },

    // Add Exercise (inline list footer)
    addExBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      paddingVertical: Spacing.md, borderRadius: Radius.xl,
      backgroundColor: c.primary, gap: Spacing.sm,
      marginHorizontal: Spacing.xs,
      shadowColor: c.primary, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
    },
    addExText: { fontSize: Typography.base, fontWeight: Typography.bold, color: '#000' },

    // Empty state
    emptyState: { alignItems: 'center', paddingVertical: Spacing['4xl'], gap: Spacing.md },
    emptyIconBox: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: c.textPrimary },
    emptySub: { fontSize: Typography.sm, color: c.textSecondary, textAlign: 'center', lineHeight: 20 },
  });
}
