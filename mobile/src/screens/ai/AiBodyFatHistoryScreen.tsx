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
import { AiBodyFatEstimate } from '@/types';

export default function AiBodyFatHistoryScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['ai-body-fat-history'],
    queryFn: () => aiApi.getBodyFatHistory(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => aiApi.deleteBodyFatEstimate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-body-fat-history'] }),
    onError: () => Alert.alert(t('aiBodyFatHistory.errorTitle'), t('aiBodyFatHistory.errorMsg')),
  });

  const confirmDelete = (item: AiBodyFatEstimate) => {
    Alert.alert(
      t('aiBodyFatHistory.deleteTitle'),
      t('aiBodyFatHistory.deleteMsg'),
      [
        { text: t('aiBodyFatHistory.cancelBtn'), style: 'cancel' },
        { text: t('aiBodyFatHistory.deleteBtn'), style: 'destructive', onPress: () => deleteMutation.mutate(item.id) },
      ],
    );
  };

  const renderItem = ({ item }: { item: AiBodyFatEstimate }) => (
    <View style={styles.card}>
      <View style={styles.rangeBlock}>
        <Text style={styles.rangeValue}>
          {item.minBodyFatPct.toFixed(1)}–{item.maxBodyFatPct.toFixed(1)}%
        </Text>
        <Text style={styles.rangeLabel}>{t('aiBodyFatHistory.rangeLabel')}</Text>
      </View>
      <View style={styles.cardMid}>
        <Text style={styles.dateText}>
          {item.createdAt ? item.createdAt.split('T')[0] : '—'}
        </Text>
        {item.gender && (
          <Text style={styles.metaText}>
            {item.gender}
            {item.trainingExperience ? ` · ${item.trainingExperience}` : ''}
          </Text>
        )}
        {item.confidenceScore != null && (
          <Text style={styles.metaText}>
            {t('aiBodyFatHistory.confidence', { pct: Math.round(item.confidenceScore * 100) })}
          </Text>
        )}
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
        <Text style={styles.headerTitle}>{t('aiBodyFatHistory.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (data?.content.length ?? 0) === 0 ? (
        <View style={styles.empty}>
          <Icon name="chart-areaspline" size={52} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>{t('aiBodyFatHistory.emptyTitle')}</Text>
          <Text style={styles.emptyText}>{t('aiBodyFatHistory.emptyText')}</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.goBack()}>
            <Icon name="camera-plus-outline" size={16} color={colors.textInverse} />
            <Text style={styles.emptyBtnText}>{t('aiBodyFatHistory.newAnalysis')}</Text>
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
      padding: Spacing.base, flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    },
    rangeBlock: { alignItems: 'center', minWidth: 80 },
    rangeValue: { fontSize: Typography.lg, fontWeight: Typography.bold, color: c.primary },
    rangeLabel: { fontSize: Typography.xs, color: c.textTertiary },
    cardMid: { flex: 1, gap: 2 },
    dateText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: c.textPrimary },
    metaText: { fontSize: Typography.xs, color: c.textTertiary },
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
