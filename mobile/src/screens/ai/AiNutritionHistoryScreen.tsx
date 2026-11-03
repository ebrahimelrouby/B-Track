import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, I18nManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius } from '@/theme';
import { aiApi } from '@/api/ai.api';
import { AiNutritionEstimate } from '@/types';

function getMealTypeLabel(mealType: string, t: (key: string) => string): string {
  const key = {
    BREAKFAST: 'dashboard.mealBreakfast',
    LUNCH: 'dashboard.mealLunch',
    DINNER: 'dashboard.mealDinner',
    SNACK: 'dashboard.mealSnack',
  }[mealType];
  return key ? t(key) : mealType.replace('_', ' ');
}

export default function AiNutritionHistoryScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['ai-nutrition-history'],
    queryFn: () => aiApi.getNutritionHistory(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => aiApi.deleteNutritionEstimate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-nutrition-history'] }),
    onError: () => Alert.alert(t('aiNutritionHistory.errorTitle'), t('aiNutritionHistory.errorMsg')),
  });

  const confirmDelete = (item: AiNutritionEstimate) => {
    Alert.alert(
      t('aiNutritionHistory.deleteTitle'),
      t('aiNutritionHistory.deleteMsg', { name: item.foodName ?? t('aiNutritionHistory.thisEntry') }),
      [
        { text: t('aiNutritionHistory.cancelBtn'), style: 'cancel' },
        { text: t('aiNutritionHistory.deleteBtn'), style: 'destructive', onPress: () => deleteMutation.mutate(item.id) },
      ],
    );
  };

  const renderItem = ({ item }: { item: AiNutritionEstimate }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.foodName} numberOfLines={1}>{item.foodName ?? '—'}</Text>
        <Text style={styles.dateText}>
          {item.loggedDate ?? (item.createdAt ? item.createdAt.split('T')[0] : '—')}
          {item.mealType ? ` · ${getMealTypeLabel(item.mealType, t)}` : ''}
        </Text>
        <View style={styles.macroRow}>
          <MacroBadge label={t('aiNutritionHistory.calLabel')} value={item.confirmedCalories ?? item.estimatedCalories} unit="kcal" colors={colors} />
          <MacroBadge label="P" value={item.confirmedProteinG ?? item.estimatedProteinG} unit="g" colors={colors} />
          <MacroBadge label="C" value={item.confirmedCarbsG ?? item.estimatedCarbsG} unit="g" colors={colors} />
          <MacroBadge label="F" value={item.confirmedFatG ?? item.estimatedFatG} unit="g" colors={colors} />
        </View>
      </View>
      <TouchableOpacity
        onPress={() => confirmDelete(item)}
        style={styles.deleteBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Icon name="trash-can-outline" size={18} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name={I18nManager.isRTL ? "arrow-right" : "arrow-left"} size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('aiNutritionHistory.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (data?.content.length ?? 0) === 0 ? (
        <View style={styles.empty}>
          <Icon name="food-outline" size={52} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>{t('aiNutritionHistory.emptyTitle')}</Text>
          <Text style={styles.emptyText}>{t('aiNutritionHistory.emptyText')}</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.goBack()}>
            <Icon name="brain" size={16} color={colors.textInverse} />
            <Text style={styles.emptyBtnText}>{t('aiNutritionHistory.tryAiScan')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data?.content}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing.xl }]}
        />
      )}
    </View>
  );
}

function MacroBadge({ label, value, unit, colors }: {
  label: string; value?: number; unit: string; colors: ColorPalette;
}) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 10, color: colors.textTertiary }}>{label}</Text>
      <Text style={{ fontSize: Typography.xs, fontWeight: Typography.semibold, color: colors.textPrimary }}>
        {value != null ? Math.round(value) : '—'}{unit}
      </Text>
    </View>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
      borderBottomWidth: 1, borderBottomColor: c.surfaceBorder,
    },
    backBtn: { padding: Spacing.sm },
    headerTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: c.textPrimary },

    list: { padding: Spacing.base, gap: Spacing.sm },
    card: {
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder,
      padding: Spacing.base, flexDirection: 'row', alignItems: 'center',
    },
    cardLeft: { flex: 1, gap: 4 },
    foodName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: c.textPrimary },
    dateText: { fontSize: Typography.xs, color: c.textTertiary },
    macroRow: { flexDirection: 'row', gap: Spacing.base, marginTop: 4 },
    deleteBtn: { padding: Spacing.sm },

    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    empty: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      padding: Spacing['2xl'], gap: Spacing.md,
    },
    emptyTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: c.textPrimary },
    emptyText: { fontSize: Typography.sm, color: c.textTertiary, textAlign: 'center', lineHeight: 20 },
    emptyBtn: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: c.primary, borderRadius: Radius.lg,
      paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xl, marginTop: Spacing.sm,
    },
    emptyBtnText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: c.textInverse },
  });
}
