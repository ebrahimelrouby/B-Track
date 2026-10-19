import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';

import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius, TAB_BAR_PADDING } from '@/theme';
import Button from '@/components/common/Button';
import { workoutApi } from '@/api/workout.api';
import { WorkoutDay } from '@/types';
import { WorkoutStackParamList, WorkoutNavigationProp } from '@/navigation/types';

type RouteProps = RouteProp<WorkoutStackParamList, 'WorkoutPlanDetail'>;

export default function WorkoutPlanDetailScreen() {
  const navigation = useNavigation<WorkoutNavigationProp>();
  const { params } = useRoute<RouteProps>();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { t } = useTranslation();

  const [addingDay, setAddingDay] = useState(false);
  const [newDayName, setNewDayName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [menuDay, setMenuDay] = useState<WorkoutDay | null>(null);
  const [localDays, setLocalDays] = useState<WorkoutDay[]>([]);

  const { data: plan, refetch } = useQuery({
    queryKey: ['workout-plan', params.planId],
    queryFn: () => workoutApi.getPlan(params.planId),
  });

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  React.useEffect(() => {
    if (plan?.days) setLocalDays(plan.days);
  }, [plan?.days]);

  const totalExercises = useMemo(
    () => plan?.days?.reduce((s: number, d: WorkoutDay) => s + (d.exercises?.length ?? 0), 0) ?? 0,
    [plan],
  );

  const filteredDays = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return q ? localDays.filter((d) => d.name.toLowerCase().includes(q)) : localDays;
  }, [localDays, searchQuery]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['workout-plan', params.planId] });
    queryClient.invalidateQueries({ queryKey: ['workout-plans'] });
  }, [queryClient, params.planId]);

  const addDayMutation = useMutation({
    mutationFn: (name: string) => workoutApi.addDay(params.planId, { name }),
    onSuccess: () => { invalidate(); setNewDayName(''); setAddingDay(false); },
  });

  const renameDayMutation = useMutation({
    mutationFn: ({ dayId, name }: { dayId: string; name: string }) =>
      workoutApi.renameDay(dayId, name),
    onSuccess: () => { invalidate(); setEditingDayId(null); },
  });

  const deleteDayMutation = useMutation({
    mutationFn: (dayId: string) => workoutApi.deleteDay(dayId),
    onSuccess: () => { invalidate(); },
  });

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const openEdit = useCallback((day: WorkoutDay) => {
    setMenuDay(null);
    setEditingDayId(day.id);
    setEditingName(day.name);
  }, []);

  const confirmDelete = useCallback((day: WorkoutDay) => {
    setMenuDay(null);
    Alert.alert(
      t('workoutPlanDetail.deleteDayTitle'),
      t('workoutPlanDetail.deleteDayMsg', { name: day.name }),
      [
        { text: t('workoutPlanDetail.cancelBtn'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: () => deleteDayMutation.mutate(day.id) },
      ],
    );
  }, [deleteDayMutation, t]);

  const submitRename = useCallback(() => {
    if (!editingDayId || !editingName.trim()) return;
    renameDayMutation.mutate({ dayId: editingDayId, name: editingName.trim() });
  }, [editingDayId, editingName, renameDayMutation]);

  // ── Day card ──────────────────────────────────────────────────────────────────

  const renderDay = useCallback(({ item, index = 0, drag, isActive }: RenderItemParams<WorkoutDay> & { index?: number }) => {
    const exCount = item.exercises?.length ?? 0;
    const isEditing = editingDayId === item.id;
    const hasEx = exCount > 0;

    return (
      <ScaleDecorator>
        <TouchableOpacity
          style={[styles.dayCard, isActive && { opacity: 0.9, shadowOpacity: 0.3 }]}
          onPress={() => {
            if (!isEditing) navigation.navigate('WorkoutDay', { dayId: item.id, dayName: item.name });
          }}
          activeOpacity={isEditing ? 1 : 0.75}
        >
          {/* Left accent bar */}
          <View style={[styles.dayBar, { backgroundColor: hasEx ? colors.primary : colors.surfaceBorder }]} />

          {/* Number circle */}
          <View style={[
            styles.dayNum,
            {
              backgroundColor: hasEx ? colors.primary : 'transparent',
              borderColor: hasEx ? colors.primary : colors.primary + '60',
            },
          ]}>
            <Text style={[styles.dayNumText, { color: hasEx ? '#000' : colors.primary }]}>
              {index + 1}
            </Text>
          </View>

          {/* Name + count */}
          <View style={styles.dayInfo}>
            {isEditing ? (
              <TextInput
                style={styles.renameInput}
                value={editingName}
                onChangeText={setEditingName}
                autoFocus
                onSubmitEditing={submitRename}
                returnKeyType="done"
                selectTextOnFocus
              />
            ) : (
              <>
                <Text style={styles.dayName}>{item.name}</Text>
                <Text style={[styles.dayCount, { color: hasEx ? colors.textSecondary : colors.textTertiary }]}>
                  {hasEx ? `${exCount} ${t('workoutPlanDetail.statExercises')}` : t('workoutPlanDetail.noExercises')}
                </Text>
              </>
            )}
          </View>

          {isEditing ? (
            <View style={styles.editActions}>
              <TouchableOpacity onPress={() => setEditingDayId(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="close" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={submitRename} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} disabled={renameDayMutation.isPending}>
                <Icon name="check" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.dayRight}>
              {hasEx && (
                <View style={[styles.exBadge, { backgroundColor: colors.primaryDim }]}>
                  <Icon name="dumbbell" size={11} color={colors.primary} />
                  <Text style={[styles.exBadgeText, { color: colors.primary }]}>{exCount}</Text>
                </View>
              )}
              {hasEx && (
                <TouchableOpacity
                  style={[styles.startBtn, { backgroundColor: colors.primary }]}
                  onPress={() => navigation.navigate('ActiveWorkout', {
                    planId: params.planId,
                    dayId: item.id,
                    workoutName: item.name,
                  })}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="play" size={14} color="#000" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setMenuDay(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="dots-vertical" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
              <TouchableOpacity onLongPress={drag} delayLongPress={150} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="drag-horizontal-variant" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </ScaleDecorator>
    );
  }, [colors, styles, navigation, params.planId, editingDayId, editingName, submitRename, renameDayMutation.isPending]);

  // ── Plan header ───────────────────────────────────────────────────────────────

  const PlanHeader = useMemo(() => {
    const daysCount = plan?.days?.length ?? 0;
    return (
      <View style={styles.planHeader}>
        <Text style={styles.planName}>{plan?.name}</Text>
        {plan?.description ? <Text style={styles.planDesc}>{plan.description}</Text> : null}

        {/* Stats row */}
        <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          {[
            { icon: 'calendar-outline', value: String(daysCount), label: t('workoutPlanDetail.statDays') },
            { icon: 'dumbbell', value: String(totalExercises), label: t('workoutPlanDetail.statExercises') },
          ].map((s, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={[styles.statDivider, { backgroundColor: colors.surfaceBorder }]} />}
              <View style={styles.statItem}>
                <Icon name={s.icon} size={15} color={colors.primary} />
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>{t('workoutPlanDetail.trainingDays', { n: daysCount })}</Text>
          <TouchableOpacity
            style={[styles.addDayTopBtn, { backgroundColor: colors.primaryDim }]}
            onPress={() => setAddingDay(true)}
            activeOpacity={0.8}
          >
            <Icon name="plus" size={14} color={colors.primary} />
            <Text style={[styles.addDayTopBtnText, { color: colors.primary }]}>{t('workoutPlanDetail.addDay')}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.searchRow, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Icon name="magnify" size={18} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder={t('workoutPlanDetail.searchPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>
    );
  }, [plan, colors, styles, totalExercises, searchQuery, setAddingDay, setSearchQuery]);

  // ── Day actions modal ─────────────────────────────────────────────────────────

  const DayActionsModal = (
    <Modal
      visible={menuDay !== null}
      transparent
      animationType="fade"
      onRequestClose={() => setMenuDay(null)}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setMenuDay(null)}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle} numberOfLines={1}>{menuDay?.name}</Text>

          <TouchableOpacity style={styles.sheetRow} onPress={() => menuDay && openEdit(menuDay)}>
            <View style={[styles.sheetIconWrap, { backgroundColor: colors.primary + '20' }]}>
              <Icon name="pencil-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.sheetRowText}>{t('workoutPlanDetail.renameDay')}</Text>
            <Icon name="chevron-right" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.sheetRow} onPress={() => menuDay && confirmDelete(menuDay)}>
            <View style={[styles.sheetIconWrap, { backgroundColor: '#EF444420' }]}>
              <Icon name="trash-can-outline" size={18} color="#EF4444" />
            </View>
            <Text style={[styles.sheetRowText, { color: '#EF4444' }]}>{t('workoutPlanDetail.deleteDay')}</Text>
            <Icon name="chevron-right" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      {DayActionsModal}
      <DraggableFlatList
        data={filteredDays}
        keyExtractor={(item) => item.id}
        renderItem={renderDay}
        onDragEnd={({ data }) => setLocalDays(data)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={PlanHeader}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListFooterComponent={
          addingDay ? (
            <View style={styles.footer}>
              <View style={styles.addDayForm}>
                <TextInput
                  style={styles.addDayInput}
                  placeholder={t('workoutPlanDetail.dayNamePlaceholder')}
                  placeholderTextColor={colors.textTertiary}
                  value={newDayName}
                  onChangeText={setNewDayName}
                  autoFocus
                  onSubmitEditing={() => { if (newDayName.trim()) addDayMutation.mutate(newDayName.trim()); }}
                />
                <View style={styles.addDayBtns}>
                  <Button title={t('workoutPlanDetail.cancelBtn')} variant="ghost" onPress={() => setAddingDay(false)} />
                  <Button
                    title={t('workoutPlanDetail.addBtn')}
                    onPress={() => { if (newDayName.trim()) addDayMutation.mutate(newDayName.trim()); }}
                    loading={addDayMutation.isPending}
                    disabled={!newDayName.trim()}
                  />
                </View>
              </View>
            </View>
          ) : null
        }
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },

    listContent: {
      paddingHorizontal: Spacing.base,
      paddingBottom: TAB_BAR_PADDING,
    },

    // ── Plan header ───────────────────────────────────────────────────────────
    planHeader: { paddingTop: Spacing.md, paddingBottom: Spacing.lg, gap: Spacing.md },
    planName: {
      fontSize: Typography['2xl'], fontWeight: Typography.bold,
      color: c.textPrimary,
    },
    planDesc: {
      fontSize: Typography.base, color: c.textSecondary, lineHeight: 22,
    },

    statsRow: {
      flexDirection: 'row',
      borderRadius: Radius.xl, borderWidth: 1,
      overflow: 'hidden',
    },
    statItem: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 6, paddingVertical: Spacing.md,
    },
    statDivider: { width: 1 },
    statValue: {
      fontSize: Typography.base, fontWeight: Typography.bold, color: c.textPrimary,
    },
    statLabel: { fontSize: Typography.xs, color: c.textTertiary, fontWeight: Typography.medium },

    sectionRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    sectionLabel: {
      fontSize: Typography.xs, fontWeight: Typography.semibold,
      color: c.textTertiary, textTransform: 'uppercase', letterSpacing: 1,
    },
    searchRow: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      borderRadius: Radius.xl, borderWidth: 1,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    },
    searchInput: {
      flex: 1, fontSize: Typography.base, paddingVertical: 4,
    },
    addDayTopBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full,
    },
    addDayTopBtnText: { fontSize: Typography.xs, fontWeight: Typography.bold },

    // ── Day card ──────────────────────────────────────────────────────────────
    dayCard: {
      flexDirection: 'row', alignItems: 'center',
      gap: Spacing.md,
      backgroundColor: c.surface,
      borderRadius: Radius.xl,
      borderWidth: 1, borderColor: c.surfaceBorder,
      overflow: 'hidden',
      paddingRight: Spacing.base, paddingVertical: Spacing.md,
    },
    dayBar: { width: 4, alignSelf: 'stretch', flexShrink: 0 },
    dayNum: {
      width: 34, height: 34, borderRadius: 17, borderWidth: 1.5,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    dayNumText: { fontSize: Typography.sm, fontWeight: Typography.bold },
    dayInfo: { flex: 1 },
    dayName: {
      fontSize: Typography.base, fontWeight: Typography.semibold, color: c.textPrimary,
    },
    dayCount: { fontSize: Typography.sm, marginTop: 2 },

    dayRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexShrink: 0 },
    exBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full,
    },
    exBadgeText: { fontSize: Typography.xs, fontWeight: Typography.bold },
    startBtn: {
      width: 28, height: 28, borderRadius: 14,
      alignItems: 'center', justifyContent: 'center',
    },

    renameInput: {
      fontSize: Typography.base, fontWeight: Typography.semibold,
      color: c.textPrimary, borderBottomWidth: 1, borderBottomColor: c.primary,
      paddingVertical: 2,
    },
    editActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flexShrink: 0 },

    // ── Day actions modal ──────────────────────────────────────────────────────
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
    sheetIconWrap: {
      width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    },
    sheetRowText: {
      flex: 1, fontSize: Typography.base, fontWeight: Typography.medium, color: c.textPrimary,
    },

    // ── Footer ────────────────────────────────────────────────────────────────
    footer: { paddingTop: Spacing.md },
    addDayForm: {
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder, padding: Spacing.base,
    },
    addDayInput: {
      color: c.textPrimary, fontSize: Typography.base,
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1, borderBottomColor: c.surfaceBorder,
      marginBottom: Spacing.base,
    },
    addDayBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm },
  });
}
