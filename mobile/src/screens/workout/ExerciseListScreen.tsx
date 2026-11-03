import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Modal, Pressable, Alert, ScrollView, Dimensions, KeyboardAvoidingView, Platform, Image,
  I18nManager,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius, TAB_BAR_PADDING } from '@/theme';
import { Exercise, MuscleGroup, EquipmentType, ExerciseDifficulty } from '@/types';
import { WorkoutStackParamList, WorkoutNavigationProp } from '@/navigation/types';
import { useActiveWorkoutStore } from '@/store/activeWorkout.store';
import { workoutApi } from '@/api/workout.api';
import { USE_MOCK_API } from '@/constants/config';
import { EXERCISE_SEED } from '@/api/mock/exerciseSeed';
import { localDb } from '@/api/mock/localDb';
import apiClient from '@/api/client';
import { exerciseIcon, MUSCLE_ICONS } from '@/utils/exerciseIcon';
import { muscleGroupLabel, equipmentLabel } from '@/utils/enumLabels';
import { exercisePictogram } from '@/utils/exercisePictogram';
import { muscleAnatomyIcon } from '@/utils/muscleAnatomyIcon';

const CUSTOM_KEY = 'exercises:custom';
// Icon/color are cosmetic-only and the backend doesn't store them — persisted
// locally, keyed by exercise id, so custom-exercise personalization survives
// app restarts even after the exercise round-trips through the real API.
const ICON_OVERRIDES_KEY = 'exercises:iconOverrides';
type IconOverrides = Record<string, { iconName?: string; iconColor?: string }>;

type RouteProps = RouteProp<WorkoutStackParamList, 'ExerciseList'>;

// ─── Constants ───────────────────────────────────────────────────────────────

const MUSCLE_GROUPS: MuscleGroup[] = [
  'CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'FOREARMS',
  'CORE', 'QUADRICEPS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'FULL_BODY', 'CARDIO',
];

const EQUIPMENT_TYPES: EquipmentType[] = [
  'BARBELL', 'DUMBBELL', 'MACHINE', 'CABLE', 'BODYWEIGHT', 'KETTLEBELL', 'RESISTANCE_BAND',
];

const MUSCLE_COLORS: Record<MuscleGroup, string> = {
  CHEST: '#EF4444', BACK: '#3B82F6', SHOULDERS: '#8B5CF6',
  BICEPS: '#06B6D4', TRICEPS: '#F59E0B', FOREARMS: '#F97316',
  CORE: '#EC4899', GLUTES: '#22C55E', QUADRICEPS: '#22C55E',
  HAMSTRINGS: '#22C55E', CALVES: '#22C55E', FULL_BODY: '#AAFF00',
  CARDIO: '#F97316', OTHER: '#6B6B6B',
};

// Per-exercise icon (keyword match → distinct muscle-group fallback), shared
// with ExerciseDetailScreen via src/utils/exerciseIcon.ts.

// Custom-exercise icon/color picker options (Create Custom Exercise sheet).
const ICON_OPTIONS = [
  'dumbbell', 'weight-lifter', 'arm-flex', 'run', 'run-fast',
  'yoga', 'human-handsup', 'heart-pulse', 'human', 'kettlebell',
];
const COLOR_OPTIONS = [
  '#EF4444', '#F97316', '#F59E0B', '#22C55E', '#06B6D4',
  '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280',
];

const EQUIPMENT_ICONS: Record<EquipmentType, string> = {
  BARBELL: 'weight-lifter', DUMBBELL: 'dumbbell', MACHINE: 'robot-industrial',
  CABLE: 'cable-data', BODYWEIGHT: 'human', KETTLEBELL: 'kettlebell',
  RESISTANCE_BAND: 'arm-flex-outline', SMITH_MACHINE: 'weight-lifter', OTHER: 'dumbbell',
};

const DIFFICULTY_ORDER: Record<ExerciseDifficulty, number> = {
  BEGINNER: 0, INTERMEDIATE: 1, ADVANCED: 2,
};

// ─── Dropdown ────────────────────────────────────────────────────────────────

interface DropdownProps<T extends string> {
  label: string;
  icon: string;
  value: T | undefined;
  options: T[];
  formatLabel: (v: T) => string;
  accentColor?: (v: T) => string;
  onSelect: (v: T | undefined) => void;
  colors: ColorPalette;
}

function Dropdown<T extends string>({
  label, icon, value, options, formatLabel, accentColor, onSelect, colors,
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const isActive = value !== undefined;
  const styles = useMemo(() => getDropdownStyles(colors), [colors]);

  return (
    <>
      <TouchableOpacity
        style={[styles.dropBtn, isActive && styles.dropBtnActive]}
        onPress={() => setOpen(true)}
        activeOpacity={0.75}
      >
        <Icon name={icon} size={14} color={isActive ? colors.primary : colors.textSecondary} />
        <Text style={[styles.dropBtnText, isActive && styles.dropBtnTextActive]} numberOfLines={1}>
          {value ? formatLabel(value) : label}
        </Text>
        <Icon name="chevron-down" size={14} color={isActive ? colors.primary : colors.textTertiary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{label}</Text>

            {/* All — full-width card */}
            <TouchableOpacity
              style={[styles.allCard, !value && { borderColor: colors.primary, backgroundColor: colors.primaryDim }]}
              onPress={() => { onSelect(undefined); setOpen(false); }}
              activeOpacity={0.75}
            >
              <View style={[styles.allIconWrap, { backgroundColor: !value ? colors.primary + '30' : colors.surfaceElevated }]}>
                <Icon name="format-list-bulleted" size={18} color={!value ? colors.primary : colors.textSecondary} />
              </View>
              <Text style={[styles.allCardText, { color: !value ? colors.primary : colors.textSecondary }]}>
                All {label}s
              </Text>
              {!value && <Icon name="check-bold" size={15} color={colors.primary} />}
            </TouchableOpacity>

            {/* 2-column grid */}
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              <View style={styles.grid}>
                {options.map((item) => {
                  const selected = value === item;
                  const color = accentColor ? accentColor(item) : colors.textSecondary;
                  const iconName = MUSCLE_ICONS[item as MuscleGroup] ?? EQUIPMENT_ICONS[item as EquipmentType] ?? 'dumbbell';
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.gridCard,
                        { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder },
                        selected && { borderColor: colors.primary, backgroundColor: colors.primaryDim },
                      ]}
                      onPress={() => { onSelect(item as T); setOpen(false); }}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.gridIconWrap, { backgroundColor: color + '22' }]}>
                        <Icon name={iconName} size={20} color={color} />
                      </View>
                      <Text style={[styles.gridLabel, { color: selected ? colors.primary : colors.textPrimary }]} numberOfLines={1}>
                        {formatLabel(item)}
                      </Text>
                      {selected && <Icon name="check-bold" size={15} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

// ─── Create Custom Exercise Modal ────────────────────────────────────────────

function CreateExerciseModal({
  visible, onClose, onCreate, colors,
}: {
  visible: boolean; onClose: () => void;
  onCreate: (ex: Exercise) => Promise<void>; colors: ColorPalette;
}) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  // Numeric, not '90%'/'60%' — the sheet's immediate parent (the bare
  // Pressable wrapping it, used only to swallow taps) sizes to its content,
  // not the screen, so a percentage maxHeight here doesn't resolve against
  // anything and gets ignored. That left the ScrollView's `flex: 1` with no
  // definite space to size against, collapsing it to ~0 height — the form
  // rendered as just the drag handle and footer with nothing in between.
  const windowHeight = Dimensions.get('window').height;
  // Footer: paddingTop (Spacing.md) + button (16 vertical padding * 2 + ~24
  // for the icon/text row) + its own bottom safe-area padding.
  const FOOTER_RESERVED_HEIGHT = Spacing.md + 16 * 2 + 24 + insets.bottom + Spacing.base;
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup>('CHEST');
  const [equipment, setEquipment] = useState<EquipmentType>('BARBELL');
  const [customMuscle, setCustomMuscle] = useState('');
  const [customEquip, setCustomEquip] = useState('');
  const [iconName, setIconName] = useState(ICON_OPTIONS[0]);
  const [iconColor, setIconColor] = useState(COLOR_OPTIONS[0]);
  // A real photo replaces the icon+color entirely when set — mutually
  // exclusive, not layered, since the icon is just a cosmetic stand-in for
  // not having a photo.
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  // 'none' | 'muscle' | 'equip' — which inline list is expanded
  const [expanded, setExpanded] = useState<'none' | 'muscle' | 'equip'>('none');

  const MUSCLES: MuscleGroup[] = [
    'CHEST','BACK','SHOULDERS','BICEPS','TRICEPS','FOREARMS',
    'CORE','QUADRICEPS','HAMSTRINGS','GLUTES','CALVES','FULL_BODY','CARDIO','OTHER',
  ];
  const EQUIPS: EquipmentType[] = [
    'BARBELL','DUMBBELL','MACHINE','CABLE','BODYWEIGHT','KETTLEBELL','RESISTANCE_BAND','OTHER',
  ];

  const muscleLabel = muscle === 'OTHER' && customMuscle.trim()
    ? customMuscle.trim()
    : muscleGroupLabel(muscle, t);

  const equipLabel = equipment === 'OTHER' && customEquip.trim()
    ? customEquip.trim()
    : equipmentLabel(equipment, t);

  const reset = () => {
    setName('');
    setMuscle('CHEST');
    setEquipment('BARBELL');
    setCustomMuscle('');
    setCustomEquip('');
    setIconName(ICON_OPTIONS[0]);
    setIconColor(COLOR_OPTIONS[0]);
    setPhotoUri(undefined);
    setExpanded('none');
  };

  const pickPhoto = useCallback(() => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8, selectionLimit: 1 }, (res) => {
      const uri = res.assets?.[0]?.uri;
      if (uri) setPhotoUri(uri);
    });
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) { Alert.alert(t('exerciseList.nameRequired'), t('exerciseList.nameRequiredMsg')); return; }
    if (muscle === 'OTHER' && !customMuscle.trim()) {
      Alert.alert(t('exerciseList.muscleRequired'), t('exerciseList.muscleRequiredMsg')); return;
    }
    if (equipment === 'OTHER' && !customEquip.trim()) {
      Alert.alert(t('exerciseList.equipmentRequired'), t('exerciseList.equipmentRequiredMsg')); return;
    }
    const notes = [
      muscle === 'OTHER' ? `Muscle: ${customMuscle.trim()}` : null,
      equipment === 'OTHER' ? `Equipment: ${customEquip.trim()}` : null,
    ].filter(Boolean).join(' · ');
    const ex: Exercise = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      muscleGroup: muscle,
      equipment,
      difficulty: 'BEGINNER',
      instructions: notes || undefined,
      isCustom: true,
      imageUrl: photoUri,
      // Only meaningful when there's no photo — the photo takes over the
      // spot the icon would otherwise occupy, not layered on top of it.
      iconName: photoUri ? undefined : iconName,
      iconColor: photoUri ? undefined : iconColor,
    };
    setIsSubmitting(true);
    try {
      await onCreate(ex);
      reset();
      onClose();
    } catch {
      // onCreate already surfaced its own error alert — keep the sheet open to retry.
    } finally {
      setIsSubmitting(false);
    }
  };

  const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      maxHeight: windowHeight * 0.9,
    },
    scrollArea: { flexShrink: 1 },
    // Reserve room for the absolutely-positioned footer so scrolled content
    // never ends up hidden behind it (see `footer` below).
    scrollContent: { paddingHorizontal: Spacing.base, paddingBottom: FOOTER_RESERVED_HEIGHT },
    handle: {
      width: 36, height: 4, borderRadius: 2,
      backgroundColor: colors.surfaceBorder, alignSelf: 'center', marginVertical: Spacing.md,
    },
    title: {
      fontSize: Typography.lg, fontWeight: Typography.bold,
      color: colors.textPrimary, marginBottom: Spacing.lg,
    },
    label: {
      fontSize: Typography.xs, fontWeight: Typography.semibold,
      color: colors.textTertiary, textTransform: 'uppercase',
      letterSpacing: 0.8, marginBottom: 6,
    },
    input: {
      backgroundColor: colors.surfaceElevated, borderRadius: Radius.md,
      borderWidth: 1, borderColor: colors.surfaceBorder,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
      fontSize: Typography.base, color: colors.textPrimary,
    },
    // Live preview — the visual anchor at the top of the form.
    previewCard: {
      alignItems: 'center', gap: Spacing.sm,
      backgroundColor: colors.surfaceElevated, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: colors.surfaceBorder,
      paddingVertical: Spacing.lg, paddingHorizontal: Spacing.base,
      marginBottom: Spacing.lg,
    },
    previewIconBig: {
      width: 64, height: 64, borderRadius: 32,
      alignItems: 'center', justifyContent: 'center', borderWidth: 2,
    },
    previewPhotoBig: {
      width: 64, height: 64, borderRadius: 32,
      borderWidth: 2, borderColor: colors.surfaceBorder,
    },
    previewNameBig: { fontSize: Typography.lg, fontWeight: Typography.bold, color: colors.textPrimary },
    previewMetaRow: { flexDirection: 'row', gap: 8 },
    previewChip: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: colors.background, borderRadius: Radius.full,
      paddingHorizontal: 10, paddingVertical: 4,
    },
    previewChipText: {
      fontSize: Typography.xs, fontWeight: Typography.semibold,
      color: colors.textSecondary, textTransform: 'capitalize',
    },
    // Section cards group related fields with a shared panel — fields inside
    // use `colors.background` (a step darker than the card) so they read as
    // recessed/inset against the card, same depth convention as the preview chips.
    sectionCard: {
      backgroundColor: colors.surfaceElevated, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: colors.surfaceBorder,
      padding: Spacing.base, marginBottom: Spacing.lg,
    },
    sectionDivider: { height: 1, backgroundColor: colors.surfaceBorder, marginVertical: Spacing.md },
    picker: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: colors.background, borderRadius: Radius.md,
      borderWidth: 1, borderColor: colors.surfaceBorder,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    },
    pickerBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    pickerText: { fontSize: Typography.base, color: colors.textPrimary, textTransform: 'capitalize', flex: 1 },
    // Picker option list — rendered inside its own overlay Modal (see
    // pickerOverlay/pickerSheet below) rather than inline, so opening it
    // doesn't shove the rest of the form down the screen.
    pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
    pickerSheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      paddingHorizontal: Spacing.base,
      paddingBottom: insets.bottom + Spacing.base,
      maxHeight: windowHeight * 0.6,
    },
    optionRow: {
      paddingHorizontal: Spacing.md, paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    optionText: { fontSize: Typography.base, color: colors.textPrimary, textTransform: 'capitalize' },
    otherInput: {
      backgroundColor: colors.background, borderRadius: Radius.md,
      borderWidth: 1, borderColor: colors.primary + '80',
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
      fontSize: Typography.base, color: colors.textPrimary,
      marginTop: Spacing.sm,
    },
    // Absolutely positioned over the scroll area rather than a flex sibling
    // of it — sidesteps flex-distribution inside a content-sized (not
    // definite-height) sheet entirely. `scrollContent`'s paddingBottom above
    // reserves room so scrolled content doesn't end up hidden underneath.
    footer: {
      position: 'absolute', left: 0, right: 0, bottom: 0,
      backgroundColor: colors.surface,
      borderTopWidth: 1, borderTopColor: colors.surfaceBorder,
      paddingHorizontal: Spacing.base, paddingTop: Spacing.md,
      paddingBottom: insets.bottom + Spacing.base,
    },
    createBtn: {
      backgroundColor: colors.primary, borderRadius: Radius.xl,
      paddingVertical: 16,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    createBtnText: { fontSize: Typography.lg, fontWeight: Typography.bold, color: '#000' },
    swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    iconSwatch: {
      width: 48, height: 48, borderRadius: Radius.md,
      borderWidth: 2, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.background,
    },
    colorSwatch: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 3, borderColor: 'transparent',
    },
    colorSwatchSelected: { borderColor: colors.textPrimary },
    choosePhotoBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary + '60',
      backgroundColor: colors.primary + '10', borderRadius: Radius.md,
      paddingVertical: Spacing.md,
    },
    choosePhotoText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: colors.primary },
    photoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    photoThumb: { width: 48, height: 48, borderRadius: Radius.md, borderWidth: 1, borderColor: colors.surfaceBorder },
    photoActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    photoActionText: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: colors.textSecondary },
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={s.overlay} onPress={onClose}>
          <Pressable onPress={() => {}}>
            <View style={s.sheet}>
              <View style={s.handle} />
              <ScrollView
                style={s.scrollArea}
                contentContainerStyle={s.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={s.title}>{t('exerciseList.createTitle')}</Text>

                {/* Live preview */}
                <View style={s.previewCard}>
                  {photoUri ? (
                    <Image source={{ uri: photoUri }} style={s.previewPhotoBig} />
                  ) : (
                    <View style={[s.previewIconBig, { backgroundColor: iconColor + '22', borderColor: iconColor + '55' }]}>
                      <Icon name={iconName} size={30} color={iconColor} />
                    </View>
                  )}
                  <Text style={s.previewNameBig} numberOfLines={1}>
                    {name.trim() || t('exerciseList.namePlaceholder')}
                  </Text>
                  <View style={s.previewMetaRow}>
                    <View style={s.previewChip}>
                      <Icon name={MUSCLE_ICONS[muscle]} size={12} color={MUSCLE_COLORS[muscle]} />
                      <Text style={[s.previewChipText, { color: MUSCLE_COLORS[muscle] }]}>{muscleLabel}</Text>
                    </View>
                    <View style={s.previewChip}>
                      <Icon name={EQUIPMENT_ICONS[equipment]} size={12} color={colors.textSecondary} />
                      <Text style={s.previewChipText}>{equipLabel}</Text>
                    </View>
                  </View>
                </View>

                {/* Name */}
                <Text style={s.label}>{t('exerciseList.exerciseName')}</Text>
                <TextInput
                  style={[s.input, { marginBottom: Spacing.lg }]}
                  value={name}
                  onChangeText={setName}
                  placeholder={t('exerciseList.namePlaceholder')}
                  placeholderTextColor={colors.textTertiary}
                  returnKeyType="done"
                  onSubmitEditing={() => setExpanded('none')}
                />

                {/* Details: muscle group + equipment */}
                <View style={s.sectionCard}>
                  <Text style={s.label}>{t('exerciseList.muscleGroupLabel')}</Text>
                  <TouchableOpacity style={s.picker} onPress={() => setExpanded('muscle')} activeOpacity={0.8}>
                    <View style={[s.pickerBadge, { backgroundColor: MUSCLE_COLORS[muscle] + '22' }]}>
                      <Icon name={MUSCLE_ICONS[muscle]} size={13} color={MUSCLE_COLORS[muscle]} />
                    </View>
                    <Text style={s.pickerText}>{muscleLabel}</Text>
                    <Icon name="chevron-down" size={18} color={colors.textTertiary} />
                  </TouchableOpacity>
                  {muscle === 'OTHER' && (
                    <TextInput
                      style={s.otherInput}
                      value={customMuscle}
                      onChangeText={setCustomMuscle}
                      placeholder={t('exerciseList.muscleGroupPlaceholder')}
                      placeholderTextColor={colors.textTertiary}
                      returnKeyType="done"
                    />
                  )}

                  <View style={s.sectionDivider} />

                  <Text style={s.label}>{t('exerciseList.equipmentLabel')}</Text>
                  <TouchableOpacity style={s.picker} onPress={() => setExpanded('equip')} activeOpacity={0.8}>
                    <View style={[s.pickerBadge, { backgroundColor: colors.surfaceBorder }]}>
                      <Icon name={EQUIPMENT_ICONS[equipment]} size={13} color={colors.textSecondary} />
                    </View>
                    <Text style={s.pickerText}>{equipLabel}</Text>
                    <Icon name="chevron-down" size={18} color={colors.textTertiary} />
                  </TouchableOpacity>
                  {equipment === 'OTHER' && (
                    <TextInput
                      style={s.otherInput}
                      value={customEquip}
                      onChangeText={setCustomEquip}
                      placeholder={t('exerciseList.equipmentPlaceholder')}
                      placeholderTextColor={colors.textTertiary}
                      returnKeyType="done"
                    />
                  )}
                </View>

                {/* Appearance: photo, or icon + color */}
                <View style={s.sectionCard}>
                  <Text style={s.label}>{t('exerciseList.photoLabel')}</Text>
                  {photoUri ? (
                    <View style={s.photoRow}>
                      <Image source={{ uri: photoUri }} style={s.photoThumb} />
                      <TouchableOpacity style={s.photoActionBtn} onPress={pickPhoto}>
                        <Icon name="image-edit-outline" size={16} color={colors.textSecondary} />
                        <Text style={s.photoActionText}>{t('exerciseList.changePhoto')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.photoActionBtn} onPress={() => setPhotoUri(undefined)}>
                        <Icon name="close" size={16} color={colors.error} />
                        <Text style={[s.photoActionText, { color: colors.error }]}>{t('exerciseList.removePhoto')}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={s.choosePhotoBtn} onPress={pickPhoto}>
                      <Icon name="image-plus" size={18} color={colors.primary} />
                      <Text style={s.choosePhotoText}>{t('exerciseList.choosePhoto')}</Text>
                    </TouchableOpacity>
                  )}

                  {!photoUri && (
                    <>
                      <View style={s.sectionDivider} />

                      <Text style={s.label}>{t('exerciseList.iconLabel')}</Text>
                      <View style={s.swatchRow}>
                        {ICON_OPTIONS.map((ic) => (
                          <TouchableOpacity
                            key={ic}
                            style={[
                              s.iconSwatch,
                              { borderColor: ic === iconName ? iconColor : colors.surfaceBorder },
                              ic === iconName && { backgroundColor: iconColor + '1A' },
                            ]}
                            onPress={() => setIconName(ic)}
                          >
                            <Icon name={ic} size={20} color={ic === iconName ? iconColor : colors.textSecondary} />
                          </TouchableOpacity>
                        ))}
                      </View>

                      <View style={s.sectionDivider} />

                      <Text style={s.label}>{t('exerciseList.colorLabel')}</Text>
                      <View style={s.swatchRow}>
                        {COLOR_OPTIONS.map((c) => (
                          <TouchableOpacity
                            key={c}
                            style={[
                              s.colorSwatch,
                              { backgroundColor: c },
                              c === iconColor && s.colorSwatchSelected,
                            ]}
                            onPress={() => setIconColor(c)}
                          >
                            {c === iconColor && <Icon name="check" size={16} color="#000" />}
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}
                </View>
              </ScrollView>

              {/* Footer — its own panel below the scroll area, not inline
                  padding, so the sheet's bottom edge is unambiguous. */}
              <View style={s.footer}>
                <TouchableOpacity
                  style={[s.createBtn, isSubmitting && { opacity: 0.6 }]}
                  onPress={handleCreate}
                  activeOpacity={0.85}
                  disabled={isSubmitting}
                >
                  {!isSubmitting && <Icon name="check-bold" size={18} color="#000" />}
                  <Text style={s.createBtnText}>
                    {isSubmitting ? t('exerciseList.creatingBtn') : t('exerciseList.createBtn')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>

      {/* Muscle group / equipment option list — its own overlay so opening
          it doesn't push the form content below it down the screen. */}
      <Modal
        visible={expanded !== 'none'}
        transparent
        animationType="fade"
        onRequestClose={() => setExpanded('none')}
      >
        <Pressable style={s.pickerOverlay} onPress={() => setExpanded('none')}>
          <Pressable onPress={() => {}} style={s.pickerSheet}>
            <View style={s.handle} />
            <Text style={s.title}>
              {expanded === 'muscle' ? t('exerciseList.muscleGroupLabel') : t('exerciseList.equipmentLabel')}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {expanded === 'muscle'
                ? MUSCLES.map((m, i) => (
                    <TouchableOpacity
                      key={m}
                      style={[s.optionRow, i === MUSCLES.length - 1 && { borderBottomWidth: 0 }]}
                      onPress={() => { setMuscle(m); setExpanded('none'); }}
                    >
                      <Text style={[s.optionText, m === muscle && { color: colors.primary, fontWeight: Typography.bold }]}>
                        {muscleGroupLabel(m, t)}
                      </Text>
                      {m === muscle && <Icon name="check" size={16} color={colors.primary} />}
                    </TouchableOpacity>
                  ))
                : EQUIPS.map((e, i) => (
                    <TouchableOpacity
                      key={e}
                      style={[s.optionRow, i === EQUIPS.length - 1 && { borderBottomWidth: 0 }]}
                      onPress={() => { setEquipment(e); setExpanded('none'); }}
                    >
                      <Text style={[s.optionText, e === equipment && { color: colors.primary, fontWeight: Typography.bold }]}>
                        {equipmentLabel(e, t)}
                      </Text>
                      {e === equipment && <Icon name="check" size={16} color={colors.primary} />}
                    </TouchableOpacity>
                  ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

type SortKey = 'name' | 'difficulty' | 'muscle';
const SORT_ICONS: Record<SortKey, string> = {
  name: 'sort-alphabetical-ascending', difficulty: 'signal', muscle: 'arm-flex-outline',
};

export default function ExerciseListScreen() {
  const navigation = useNavigation<WorkoutNavigationProp>();
  const { params } = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | undefined>(params.muscleGroup);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType | undefined>();
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customExercises, setCustomExercises] = useState<Exercise[]>(
    () => localDb.get<Exercise[]>(CUSTOM_KEY) ?? [],
  );

  const { addExercise } = useActiveWorkoutStore();
  const isSelectMode = params.mode === 'select';

  const { data: rawData, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['exercises'],
    queryFn: async (): Promise<Exercise[]> => {
      if (USE_MOCK_API) return EXERCISE_SEED;
      // No page/size here previously meant the backend's default page size
      // (30) silently capped this screen's list — fine when the library had
      // ~65 exercises, broken now that it has 900+. This screen's search/
      // filter/sort all run client-side against rawData, so it needs the
      // full list in one shot rather than real pagination.
      const r = await apiClient.get('/exercises', { params: { size: 2000 } });
      return r.data.data?.content as Exercise[];
    },
    staleTime: Infinity,
  });

  const handleCreateCustom = useCallback(async (ex: Exercise) => {
    if (USE_MOCK_API) {
      // No real backend to round-trip to in mock mode — the locally-generated
      // id is fine since the mock workout API doesn't validate it.
      const updated = [...customExercises, ex];
      localDb.set(CUSTOM_KEY, updated);
      setCustomExercises(updated);
      return;
    }

    try {
      const res = await apiClient.post('/exercises', {
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        equipment: ex.equipment,
        difficulty: ex.difficulty,
        instructions: ex.instructions,
        imageUrl: ex.imageUrl,
      });
      // The backend issues the real id here — this is what fixes "add exercise"
      // failing with a fake custom_<timestamp> id the server can't resolve.
      const created = res.data.data as Exercise;

      if (ex.iconName) {
        const overrides = localDb.get<IconOverrides>(ICON_OVERRIDES_KEY) ?? {};
        overrides[created.id] = { iconName: ex.iconName, iconColor: ex.iconColor };
        localDb.set(ICON_OVERRIDES_KEY, overrides);
      }

      queryClient.setQueryData<Exercise[]>(['exercises'], (old: Exercise[] | undefined) => [
        ...(old ?? []),
        { ...created, iconName: ex.iconName, iconColor: ex.iconColor },
      ]);
    } catch (e: any) {
      Alert.alert(
        t('exerciseList.createErrorTitle'),
        e?.response?.data?.message ?? t('exerciseList.createErrorMsg'),
      );
      throw e;
    }
  }, [customExercises, queryClient, t]);

  const data = useMemo(() => {
    const overrides: IconOverrides = USE_MOCK_API ? {} : (localDb.get<IconOverrides>(ICON_OVERRIDES_KEY) ?? {});
    const merged = (rawData ?? []).map((e: Exercise) => (
      overrides[e.id] ? { ...e, iconName: overrides[e.id].iconName, iconColor: overrides[e.id].iconColor } : e
    ));
    let results: Exercise[] = [...merged, ...customExercises];
    if (selectedMuscle) results = results.filter((e) => e.muscleGroup === selectedMuscle);
    if (selectedEquipment) results = results.filter((e) => e.equipment === selectedEquipment);
    if (search) results = results.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));
    return [...results].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'difficulty') return DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty];
      return a.muscleGroup.localeCompare(b.muscleGroup);
    });
  }, [rawData, customExercises, selectedMuscle, selectedEquipment, search, sortBy]);

  const activeFilters = [selectedMuscle, selectedEquipment].filter(Boolean).length;

  const cycleSortBy = () => {
    const order: SortKey[] = ['name', 'difficulty', 'muscle'];
    setSortBy(order[(order.indexOf(sortBy) + 1) % order.length]);
  };

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleConfirmSelection = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setIsAdding(true);

    const selected = data.filter((e) => selectedIds.has(e.id));

    try {
      if (params.dayId) {
        // Persist each exercise to the plan day
        for (const exercise of selected) {
          await workoutApi.addExercise(params.dayId, { exerciseId: exercise.id, targetSets: 3 });
        }
        // Invalidate plan queries so WorkoutPlanDetailScreen shows updated counts
        queryClient.invalidateQueries({ queryKey: ['workout-plans'] });
        queryClient.invalidateQueries({ queryKey: ['workout-plan'] });
      } else {
        // Add to active workout in-session
        selected.forEach((exercise) => addExercise(exercise));
      }
      navigation.goBack();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? t('exerciseList.addErrorMsg');
      Alert.alert(t('exerciseList.addErrorTitle'), msg);
    } finally {
      setIsAdding(false);
    }
  }, [selectedIds, data, params.dayId, addExercise, navigation, queryClient]);

  const handleBrowse = useCallback((exercise: Exercise) => {
    navigation.navigate('ExerciseDetail', { exercise });
  }, [navigation]);

  const renderExercise = useCallback(({ item }: { item: Exercise }) => {
    const muscleColor = item.iconColor ?? MUSCLE_COLORS[item.muscleGroup];
    const icon = item.iconName ?? exerciseIcon(item.name, item.muscleGroup);
    const pictogram = item.iconName ? null : (exercisePictogram(item.name) ?? muscleAnatomyIcon(item.muscleGroup));
    const isSelected = selectedIds.has(item.id);
    // Exercises with a stock photo use a single consistent muscle-group
    // category icon instead — any exercise that's already rendering an icon
    // (custom iconName, or no photo available) keeps what it has. Muscle
    // groups without dedicated anatomy art (BICEPS, CARDIO, FOREARMS, OTHER)
    // fall through unchanged since muscleAnatomyIcon returns null for them.
    const categoryIcon = item.imageUrl ? muscleAnatomyIcon(item.muscleGroup) : null;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          isSelectMode && isSelected && styles.cardSelected,
        ]}
        onPress={() => {
          if (isSelectMode) toggleSelect(item.id);
          else handleBrowse(item);
        }}
        activeOpacity={0.75}
      >
        {/* Left: category icon override > real photo > matched exercise pictogram > generic muscle/pattern icon */}
        {categoryIcon ? (
          <View style={[styles.cardIcon, { backgroundColor: muscleColor + '18' }]}>
            <Image source={categoryIcon} style={[styles.cardPictogram, { tintColor: muscleColor }]} />
          </View>
        ) : item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.cardIcon} />
        ) : pictogram ? (
          <View style={[styles.cardIcon, { backgroundColor: muscleColor + '18' }]}>
            <Image source={pictogram} style={[styles.cardPictogram, { tintColor: muscleColor }]} />
          </View>
        ) : (
          <View style={[styles.cardIcon, { backgroundColor: muscleColor + '18' }]}>
            <Icon name={icon} size={20} color={muscleColor} />
          </View>
        )}

        {/* Content */}
        <View style={styles.cardContent}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.cardMeta}>
            <Text style={[styles.cardMuscle, { color: muscleColor }]}>
              {muscleGroupLabel(item.muscleGroup, t)}
            </Text>
            <Text style={styles.cardDot}>·</Text>
            <Text style={styles.cardEquip}>{equipmentLabel(item.equipment, t)}</Text>
          </View>
        </View>

        {/* Right: selection indicator or info/chevron */}
        <View style={styles.cardActions}>
          {isSelectMode ? (
            <>
              {/* Info always available */}
              <TouchableOpacity
                style={styles.infoBtn}
                onPress={() => handleBrowse(item)}
                hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
              >
                <Icon name="information-outline" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
              {/* Selection circle */}
              <View style={[
                styles.selectCircle,
                isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}>
                {isSelected && <Icon name="check-bold" size={13} color="#000" />}
              </View>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.infoBtn}
                onPress={() => handleBrowse(item)}
                hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
              >
                <Icon name="information-outline" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
              <Icon name={I18nManager.isRTL ? 'chevron-left' : 'chevron-right'} size={20} color={colors.textTertiary} />
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [selectedIds, isSelectMode, colors, styles, toggleSelect, handleBrowse]);

  const hasSelection = isSelectMode && selectedIds.size > 0;
  const listPaddingBottom = hasSelection ? TAB_BAR_PADDING + 80 : TAB_BAR_PADDING;

  return (
    <View style={styles.root}>
      {/* ── Top bar ── */}
      <View style={[styles.topBar, { backgroundColor: colors.surface }]}>
        {/* Search bar */}
        <View style={[styles.searchPill, { backgroundColor: colors.surfaceElevated, borderColor: search.length > 0 ? colors.primary + '60' : colors.surfaceBorder }]}>
          <Icon name="magnify" size={20} color={search.length > 0 ? colors.primary : colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder={t('exerciseList.searchPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Dropdowns row — full width each */}
        <View style={styles.dropdownsRow}>
          <Dropdown
            label={t('exerciseList.filterMuscle')}
            icon="arm-flex-outline"
            value={selectedMuscle}
            options={MUSCLE_GROUPS}
            formatLabel={v => muscleGroupLabel(v, t)}
            accentColor={v => MUSCLE_COLORS[v]}
            onSelect={setSelectedMuscle}
            colors={colors}
          />
          <Dropdown
            label={t('exerciseList.filterEquipment')}
            icon="dumbbell"
            value={selectedEquipment}
            options={EQUIPMENT_TYPES}
            formatLabel={v => equipmentLabel(v, t)}
            onSelect={setSelectedEquipment}
            colors={colors}
          />
        </View>

        {/* Controls row — sort | count · spacer · clear? · selected? · create */}
        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={[styles.sortBtn, { backgroundColor: colors.surfaceElevated }]}
            onPress={cycleSortBy}
          >
            <Icon name={SORT_ICONS[sortBy]} size={15} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.countBadge, { backgroundColor: colors.surfaceElevated }]}>
            <Text style={[styles.countBadgeText, { color: colors.textSecondary }]}>
              {isLoading ? '…' : data.length}
            </Text>
          </View>

          <View style={styles.filterSpacer} />

          {activeFilters > 0 && (
            <TouchableOpacity
              style={[styles.clearBtn, { backgroundColor: colors.error + '15', borderColor: colors.error + '40' }]}
              onPress={() => { setSelectedMuscle(undefined); setSelectedEquipment(undefined); }}
            >
              <Icon name="filter-remove-outline" size={14} color={colors.error} />
            </TouchableOpacity>
          )}
          {isSelectMode && selectedIds.size > 0 && (
            <View style={[styles.selectedBadge, { backgroundColor: colors.primaryDim, borderColor: colors.primary + '40' }]}>
              <Icon name="check-bold" size={11} color={colors.primary} />
              <Text style={[styles.selectedBadgeText, { color: colors.primary }]}>{selectedIds.size}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.createTopBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.8}
          >
            <Icon name="plus" size={18} color="#000" />
            <Text style={styles.createTopBtnText}>{t('exerciseList.custom')}</Text>
          </TouchableOpacity>
        </View>
      </View>


      <FlatList
        data={data}
        keyExtractor={item => item.id}
        renderItem={renderExercise}
        contentContainerStyle={[styles.list, { paddingBottom: listPaddingBottom }]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          !isLoading ? (
            isError ? (
              <View style={styles.empty}>
                <View style={[styles.emptyIconBox, { backgroundColor: colors.error + '20' }]}>
                  <Icon name="wifi-off" size={36} color={colors.error} />
                </View>
                <Text style={styles.emptyTitle}>{t('exerciseList.loadErrorTitle')}</Text>
                <Text style={styles.emptySub}>{t('exerciseList.loadErrorDesc')}</Text>
                <TouchableOpacity
                  style={[styles.retryBtn, { backgroundColor: colors.primary, opacity: isRefetching ? 0.6 : 1 }]}
                  onPress={() => refetch()}
                  disabled={isRefetching}
                >
                  <Icon name="refresh" size={16} color="#000" />
                  <Text style={styles.retryBtnText}>{t('exerciseList.retry')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.empty}>
                <View style={[styles.emptyIconBox, { backgroundColor: colors.primaryDim }]}>
                  <Icon name="dumbbell" size={36} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>{t('exerciseList.emptyTitle')}</Text>
                <Text style={styles.emptySub}>{t('exerciseList.emptyDesc')}</Text>
              </View>
            )
          ) : null
        }

        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        extraData={selectedIds}
      />

      {/* Floating confirm panel — only when exercises are selected */}
      {hasSelection && (
        <View style={[styles.confirmPanel, { backgroundColor: colors.surface, borderTopColor: colors.surfaceBorder }]}>
          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 }]}
            onPress={handleConfirmSelection}
            disabled={isAdding}
            activeOpacity={0.85}
          >
            <View style={styles.confirmCountBadge}>
              <Text style={styles.confirmCountText}>{selectedIds.size}</Text>
            </View>
            <Text style={[styles.confirmBtnText, { color: '#000' }]}>
              {isAdding ? t('exerciseList.addingBtn') : t('exerciseList.addBtn', { s: selectedIds.size > 1 ? 's' : '' })}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <CreateExerciseModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateCustom}
        colors={colors}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },

    // ── Top bar ──────────────────────────────────────────────────────────────
    topBar: {
      paddingHorizontal: Spacing.base,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.md,
      gap: Spacing.sm,
    },
    searchPill: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      borderRadius: Radius.xl, borderWidth: 1.5,
      paddingHorizontal: Spacing.md, paddingVertical: 13,
    },
    searchInput: { flex: 1, fontSize: Typography.base, paddingVertical: 0 },
    dropdownsRow: { flexDirection: 'row', gap: Spacing.sm },
    filtersRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    sortBtn: {
      height: 36, paddingHorizontal: Spacing.sm,
      borderRadius: Radius.md,
      alignItems: 'center', justifyContent: 'center',
      aspectRatio: 1,
    },
    filterSpacer: { flex: 1 },
    selectedBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: Spacing.sm, paddingVertical: 5,
      borderRadius: Radius.full, borderWidth: 1,
    },
    selectedBadgeText: { fontSize: Typography.xs, fontWeight: Typography.bold },
    clearBtn: {
      height: 36, aspectRatio: 1,
      borderRadius: Radius.full, borderWidth: 1,
      alignItems: 'center', justifyContent: 'center',
    },
    countBadge: {
      height: 36, paddingHorizontal: Spacing.md,
      borderRadius: Radius.md,
      alignItems: 'center', justifyContent: 'center',
    },
    countBadgeText: { fontSize: Typography.sm, fontWeight: Typography.semibold },

    // List
    list: { paddingHorizontal: Spacing.sm, paddingTop: Spacing.xs },
    separator: { height: Spacing.xs },

    // Exercise card
    card: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder,
      marginHorizontal: Spacing.xs,
    },
    cardSelected: {
      borderColor: c.primary,
      backgroundColor: c.primaryDim,
    },
    cardIcon: {
      width: 44, height: 44, borderRadius: Radius.md,
      alignItems: 'center', justifyContent: 'center',
      marginHorizontal: Spacing.md, flexShrink: 0,
    },
    cardPictogram: { width: 26, height: 26 },
    cardContent: { flex: 1, paddingVertical: Spacing.md },
    cardName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: c.textPrimary },
    cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
    cardMuscle: { fontSize: Typography.xs, fontWeight: Typography.medium, textTransform: 'capitalize' },
    cardDot: { fontSize: Typography.xs, color: c.textTertiary },
    cardEquip: { fontSize: Typography.xs, color: c.textTertiary, textTransform: 'capitalize' },
    cardActions: { flexDirection: 'row', alignItems: 'center', paddingEnd: Spacing.md, gap: Spacing.xs },
    infoBtn: { padding: Spacing.xs },

    // Selection circle
    selectCircle: {
      width: 24, height: 24, borderRadius: 12,
      borderWidth: 2, borderColor: c.surfaceBorder,
      alignItems: 'center', justifyContent: 'center',
    },

    // Empty
    empty: { alignItems: 'center', paddingVertical: Spacing['4xl'], gap: Spacing.md },
    emptyIconBox: {
      width: 72, height: 72, borderRadius: 36,
      alignItems: 'center', justifyContent: 'center',
    },
    emptyTitle: { fontSize: Typography.lg, fontWeight: Typography.semibold, color: c.textSecondary },
    emptySub: { fontSize: Typography.sm, color: c.textTertiary },
    retryBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
      marginTop: Spacing.sm,
    },
    retryBtnText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: '#000' },

    confirmPanel: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingHorizontal: Spacing.base,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.base,
      borderTopWidth: 1,
    },
    confirmRow: { flexDirection: 'row', gap: Spacing.sm },
    confirmBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: Spacing.sm, paddingVertical: 14,
      borderRadius: Radius.xl,
    },
    confirmBtnText: { fontSize: Typography.base, fontWeight: Typography.bold },
    confirmCountBadge: {
      width: 22, height: 22, borderRadius: 11,
      backgroundColor: 'rgba(0,0,0,0.2)',
      alignItems: 'center', justifyContent: 'center',
    },
    confirmCountText: { fontSize: 11, fontWeight: Typography.bold, color: '#000' },
    // ── Create button in filter row ───────────────────────────────────────────
    createTopBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      height: 36, paddingHorizontal: Spacing.md,
      borderRadius: Radius.md,
    },
    createTopBtnText: {
      fontSize: Typography.sm, fontWeight: Typography.bold, color: '#000',
    },
  });
}

function getDropdownStyles(c: ColorPalette) {
  const SCREEN_W = Dimensions.get('window').width;
  const CARD_W = Math.floor((SCREEN_W - Spacing.base * 2 - Spacing.sm) / 2);

  return StyleSheet.create({
    dropBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: Spacing.md, height: 40,
      borderRadius: Radius.xl, backgroundColor: c.surfaceElevated,
      borderWidth: 1, borderColor: c.surfaceBorder,
      flex: 1,
    },
    dropBtnActive: { backgroundColor: c.primaryDim, borderColor: c.primary },
    dropBtnText: { flex: 1, fontSize: Typography.sm, color: c.textSecondary, fontWeight: Typography.medium },
    dropBtnTextActive: { color: c.primary, fontWeight: Typography.semibold },

    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      paddingBottom: 36, paddingTop: Spacing.md,
    },
    sheetHandle: {
      width: 40, height: 4, borderRadius: 2,
      backgroundColor: c.surfaceBorder, alignSelf: 'center', marginBottom: Spacing.md,
    },
    sheetTitle: {
      fontSize: Typography.md, fontWeight: Typography.bold, color: c.textPrimary,
      paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm,
    },

    // All card — full width
    allCard: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      marginHorizontal: Spacing.base, marginBottom: Spacing.md,
      borderRadius: Radius.xl, borderWidth: 1.5, borderColor: c.surfaceBorder,
      backgroundColor: c.surfaceElevated,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    },
    allIconWrap: {
      width: 36, height: 36, borderRadius: Radius.md,
      alignItems: 'center', justifyContent: 'center',
    },
    allCardText: {
      flex: 1, fontSize: Typography.base, fontWeight: Typography.semibold,
      textTransform: 'capitalize',
    },

    // 2-column grid
    grid: {
      flexDirection: 'row', flexWrap: 'wrap',
      paddingHorizontal: Spacing.base, paddingBottom: Spacing.base,
      gap: Spacing.sm,
    },
    gridCard: {
      width: CARD_W,
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      borderRadius: Radius.xl, borderWidth: 1.5,
      paddingVertical: Spacing.md, paddingHorizontal: Spacing.md,
    },
    gridIconWrap: {
      width: 36, height: 36, borderRadius: Radius.md,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    gridLabel: {
      flex: 1, fontSize: Typography.sm, fontWeight: Typography.semibold,
      textTransform: 'capitalize',
    },
  });
}
