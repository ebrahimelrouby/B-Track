import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, I18nManager } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius } from '@/theme';
import { aiApi } from '@/api/ai.api';
import { AiNutritionEstimate } from '@/types';
import { AiStackParamList } from '@/navigation/types';

type RouteProps = RouteProp<AiStackParamList, 'AiEstimateReview'>;

interface MacroField {
  key: keyof AiNutritionEstimate;
  label: string;
  unit: string;
  required: boolean;
}

const MACRO_FIELDS: MacroField[] = [
  { key: 'estimatedCalories',  label: 'Calories',  unit: 'kcal', required: true },
  { key: 'estimatedProteinG',  label: 'Protein',   unit: 'g',    required: true },
  { key: 'estimatedCarbsG',    label: 'Carbs',     unit: 'g',    required: true },
  { key: 'estimatedFatG',      label: 'Fat',       unit: 'g',    required: true },
  { key: 'estimatedFiberG',    label: 'Fiber',     unit: 'g',    required: false },
  { key: 'estimatedSugarG',    label: 'Sugar',     unit: 'g',    required: false },
  { key: 'estimatedSodiumMg',  label: 'Sodium',    unit: 'mg',   required: false },
  { key: 'estimatedServingG',  label: 'Serving',   unit: 'g',    required: false },
];

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'PRE_WORKOUT', 'POST_WORKOUT'];

export default function AiEstimateReviewScreen() {
  const navigation = useNavigation<any>();
  const { params } = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const getMacroLabel = (key: string) => ({
    estimatedCalories: t('aiEstimateReview.calories'),
    estimatedProteinG: t('aiEstimateReview.protein'),
    estimatedCarbsG: t('aiEstimateReview.carbs'),
    estimatedFatG: t('aiEstimateReview.fat'),
    estimatedFiberG: t('aiEstimateReview.fiber'),
    estimatedSugarG: t('aiEstimateReview.sugar'),
    estimatedSodiumMg: t('aiEstimateReview.sodium'),
    estimatedServingG: t('aiEstimateReview.serving'),
  }[key] ?? key);

  const getMealLabel = (mt: string) => ({
    BREAKFAST: t('aiEstimateReview.mealBreakfast'),
    LUNCH: t('aiEstimateReview.mealLunch'),
    DINNER: t('aiEstimateReview.mealDinner'),
    SNACK: t('aiEstimateReview.mealSnack'),
    PRE_WORKOUT: t('aiEstimateReview.mealPreWorkout'),
    POST_WORKOUT: t('aiEstimateReview.mealPostWorkout'),
  }[mt] ?? mt.replace('_', ' '));

  const { data: estimate, isLoading } = useQuery({
    queryKey: ['ai-estimate', params.estimateId],
    queryFn: async () => {
      // For mock, the estimate was returned during mutation — look it up from cache
      // In real flow, the mutation result is stored and this query hydrates from it
      return null as AiNutritionEstimate | null;
    },
    enabled: false, // populated by passed data
  });

  // Use passed state from mutation result stored in route params approach
  const [editedEstimate, setEditedEstimate] = useState<Partial<AiNutritionEstimate>>({});
  const [foodName, setFoodName] = useState('');
  const [mealType, setMealType] = useState('BREAKFAST');
  const [isInitialized, setIsInitialized] = useState(false);
  const [cachedEstimate, setCachedEstimate] = useState<AiNutritionEstimate | null>(null);

  // Retrieve estimate from TanStack Query cache written by the mutation
  React.useEffect(() => {
    const cached = queryClient.getQueryData<AiNutritionEstimate>(['ai-estimate-result', params.estimateId]);
    if (cached && !isInitialized) {
      setCachedEstimate(cached);
      setFoodName(cached.foodName ?? '');
      setEditedEstimate({
        estimatedCalories: cached.estimatedCalories,
        estimatedProteinG: cached.estimatedProteinG,
        estimatedCarbsG: cached.estimatedCarbsG,
        estimatedFatG: cached.estimatedFatG,
        estimatedFiberG: cached.estimatedFiberG,
        estimatedSugarG: cached.estimatedSugarG,
        estimatedSodiumMg: cached.estimatedSodiumMg,
        estimatedServingG: cached.estimatedServingG,
      });
      setIsInitialized(true);
    }
  }, [params.estimateId, queryClient, isInitialized]);

  const saveMutation = useMutation({
    mutationFn: () =>
      aiApi.saveNutritionEstimate(params.estimateId, {
        foodName: foodName || 'Unknown food',
        calories: editedEstimate.estimatedCalories ?? 0,
        proteinG: editedEstimate.estimatedProteinG ?? 0,
        carbsG: editedEstimate.estimatedCarbsG ?? 0,
        fatG: editedEstimate.estimatedFatG ?? 0,
        fiberG: editedEstimate.estimatedFiberG,
        sugarG: editedEstimate.estimatedSugarG,
        sodiumMg: editedEstimate.estimatedSodiumMg,
        servingG: editedEstimate.estimatedServingG,
        mealType,
        loggedDate: new Date().toISOString().split('T')[0],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-nutrition-history'] });
      Alert.alert(t('aiEstimateReview.savedTitle'), t('aiEstimateReview.savedMsg'), [
        { text: t('common.ok'), onPress: () => navigation.goBack() },
      ]);
    },
    onError: () => Alert.alert(t('common.error'), t('aiEstimateReview.saveError')),
  });

  const display = cachedEstimate;

  const getFieldValue = (field: MacroField): string => {
    const v = editedEstimate[field.key as keyof typeof editedEstimate];
    return v !== undefined && v !== null ? String(v) : '';
  };

  const setFieldValue = (key: keyof AiNutritionEstimate, value: string) => {
    setEditedEstimate(prev => ({ ...prev, [key]: value === '' ? undefined : parseFloat(value) || 0 }));
  };

  const confidencePct = Math.round((display?.confidenceScore ?? 0) * 100);
  const confidenceColor = confidencePct >= 80 ? colors.success : confidencePct >= 60 ? colors.warning : colors.error;

  if (!display) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>{t('aiEstimateReview.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name={I18nManager.isRTL ? "arrow-right" : "arrow-left"} size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('aiEstimateReview.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
      >
        <View style={styles.confidenceRow}>
          <Icon name="brain" size={18} color={colors.primary} />
          <Text style={styles.confidenceLabel}>{t('aiEstimateReview.aiConfidence')}</Text>
          <View style={[styles.confidenceBadge, { backgroundColor: confidenceColor + '22' }]}>
            <Text style={[styles.confidenceValue, { color: confidenceColor }]}>{confidencePct}%</Text>
          </View>
        </View>

        {(display.assumptions?.length ?? 0) > 0 && (
          <View style={styles.assumptionsCard}>
            <Text style={styles.sectionTitle}>{t('aiEstimateReview.assumptions')}</Text>
            {display.assumptions!.map((a, i) => (
              <View key={i} style={styles.assumptionRow}>
                <Icon name="information-outline" size={13} color={colors.textTertiary} />
                <Text style={styles.assumptionText}>{a}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('aiEstimateReview.foodName')}</Text>
          <TextInput
            style={styles.nameInput}
            value={foodName}
            onChangeText={setFoodName}
            placeholder={t('aiEstimateReview.foodNamePlaceholder')}
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('aiEstimateReview.macrosTitle')}</Text>
          <View style={styles.macroGrid}>
            {MACRO_FIELDS.map(field => (
              <View key={field.key as string} style={styles.macroField}>
                <Text style={styles.macroLabel}>
                  {getMacroLabel(field.key as string)}
                  {field.required && <Text style={{ color: colors.primary }}> *</Text>}
                </Text>
                <View style={styles.macroInputRow}>
                  <TextInput
                    style={styles.macroInput}
                    value={getFieldValue(field)}
                    onChangeText={v => setFieldValue(field.key, v)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textTertiary}
                  />
                  <Text style={styles.macroUnit}>{field.unit}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('aiEstimateReview.mealType')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.mealTypeRow}>
              {MEAL_TYPES.map(mt => (
                <TouchableOpacity
                  key={mt}
                  style={[styles.mealTypeChip, mealType === mt && styles.mealTypeChipActive]}
                  onPress={() => setMealType(mt)}
                >
                  <Text style={[styles.mealTypeText, mealType === mt && styles.mealTypeTextActive]}>
                    {getMealLabel(mt)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <Text style={styles.note}>{t('aiEstimateReview.note')}</Text>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.base }]}>
        <TouchableOpacity style={styles.discardBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.discardBtnText}>{t('aiEstimateReview.discardBtn')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, saveMutation.isPending && { opacity: 0.6 }]}
          onPress={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending
            ? <ActivityIndicator color={colors.textInverse} size="small" />
            : <Icon name="check" size={18} color={colors.textInverse} />}
          <Text style={styles.saveBtnText}>{t('aiEstimateReview.saveBtn')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background, gap: Spacing.base },
    loadingText: { fontSize: Typography.sm, color: c.textSecondary },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
      borderBottomWidth: 1, borderBottomColor: c.surfaceBorder,
    },
    backBtn: { padding: Spacing.sm },
    headerTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: c.textPrimary },

    scroll: { padding: Spacing.base, gap: Spacing.md },

    confidenceRow: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: c.surface, borderRadius: Radius.lg,
      padding: Spacing.md, borderWidth: 1, borderColor: c.surfaceBorder,
    },
    confidenceLabel: { flex: 1, fontSize: Typography.sm, color: c.textSecondary },
    confidenceBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.sm },
    confidenceValue: { fontSize: Typography.sm, fontWeight: Typography.bold },

    assumptionsCard: {
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder, padding: Spacing.base, gap: Spacing.sm,
    },
    assumptionRow: { flexDirection: 'row', gap: Spacing.xs, alignItems: 'flex-start' },
    assumptionText: { flex: 1, fontSize: Typography.xs, color: c.textTertiary, lineHeight: 18 },

    card: {
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder, padding: Spacing.base, gap: Spacing.md,
    },
    sectionTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: c.textPrimary },

    nameInput: {
      backgroundColor: c.surfaceElevated, borderRadius: Radius.md, borderWidth: 1,
      borderColor: c.surfaceBorder, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
      color: c.textPrimary, fontSize: Typography.base,
    },

    macroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    macroField: { width: '47%' },
    macroLabel: { fontSize: Typography.xs, color: c.textSecondary, marginBottom: 4 },
    macroInputRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: c.surfaceElevated, borderRadius: Radius.md,
      borderWidth: 1, borderColor: c.surfaceBorder, paddingHorizontal: Spacing.sm,
    },
    macroInput: { flex: 1, paddingVertical: Spacing.sm, color: c.textPrimary, fontSize: Typography.base },
    macroUnit: { fontSize: Typography.xs, color: c.textTertiary, paddingStart: 4 },

    mealTypeRow: { flexDirection: 'row', gap: Spacing.sm },
    mealTypeChip: {
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
      borderRadius: Radius.full, borderWidth: 1, borderColor: c.surfaceBorder,
      backgroundColor: c.surfaceElevated,
    },
    mealTypeChipActive: { backgroundColor: c.primaryDim, borderColor: c.primary },
    mealTypeText: { fontSize: Typography.xs, color: c.textSecondary },
    mealTypeTextActive: { color: c.primary, fontWeight: Typography.semibold },

    note: { fontSize: Typography.xs, color: c.textTertiary, textAlign: 'center', lineHeight: 18 },

    footer: {
      flexDirection: 'row', gap: Spacing.sm, padding: Spacing.base,
      borderTopWidth: 1, borderTopColor: c.surfaceBorder,
      backgroundColor: c.background,
    },
    discardBtn: {
      flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder, alignItems: 'center',
    },
    discardBtnText: { fontSize: Typography.base, fontWeight: Typography.medium, color: c.textSecondary },
    saveBtn: {
      flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: Spacing.sm, backgroundColor: c.primary, borderRadius: Radius.lg,
      paddingVertical: Spacing.md,
    },
    saveBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: c.textInverse },
  });
}
