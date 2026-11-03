import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl,
  I18nManager,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius } from '@/theme';
import { WorkoutSession } from '@/types';
import { WorkoutNavigationProp } from '@/navigation/types';
import { workoutApi } from '@/api/workout.api';

function formatDuration(s?: number) {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m` : `${s}s`;
}

function relativeDate(iso: string, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return t('workoutHistory.today');
  if (diffDays === 1) return t('workoutHistory.yesterday');
  if (diffDays < 7) return t('workoutHistory.daysAgo', { n: diffDays });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function WorkoutHistoryScreen() {
  const navigation = useNavigation<WorkoutNavigationProp>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const { t } = useTranslation();

  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  const load = useCallback(async (reset = false) => {
    try {
      const p = reset ? 0 : page;
      const result = await workoutApi.getHistory(p, PAGE_SIZE);
      setSessions(prev => reset ? result.content : [...prev, ...result.content]);
      setPage(p + 1);
      setHasMore(!result.last);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    setPage(0);
    load(true);
  }, []));

  const onRefresh = () => { setRefreshing(true); setPage(0); load(true); };

  const renderItem = ({ item }: { item: WorkoutSession }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={() => navigation.navigate('SessionDetail', { sessionId: item.id })}
    >
      <View style={styles.iconWrap}>
        <Icon name="dumbbell" size={20} color={colors.primary} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.sessionName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.sessionDate}>{relativeDate(item.startedAt, t)} · {formatTime(item.startedAt)}</Text>
        <View style={styles.chips}>
          {item.durationSeconds ? (
            <View style={styles.chip}>
              <Icon name="clock-outline" size={11} color={colors.textTertiary} />
              <Text style={styles.chipText}>{formatDuration(item.durationSeconds)}</Text>
            </View>
          ) : null}
          {item.totalVolumeKg ? (
            <View style={styles.chip}>
              <Icon name="weight" size={11} color={colors.textTertiary} />
              <Text style={styles.chipText}>{item.totalVolumeKg}kg</Text>
            </View>
          ) : null}
          {item.exercises?.length ? (
            <View style={styles.chip}>
              <Icon name="format-list-bulleted" size={11} color={colors.textTertiary} />
              <Text style={styles.chipText}>{t('workoutHistory.exerciseCount', { n: item.exercises.length })}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Icon name={I18nManager.isRTL ? 'chevron-left' : 'chevron-right'} size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={[styles.root, { paddingBottom: insets.bottom }]}
      data={sessions}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      contentContainerStyle={[styles.list, sessions.length === 0 && styles.listFill]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Icon name="history" size={52} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>{t('workoutHistory.emptyTitle')}</Text>
          <Text style={styles.emptySub}>{t('workoutHistory.emptyDesc')}</Text>
        </View>
      }
      ListFooterComponent={
        hasMore && sessions.length > 0 ? (
          <TouchableOpacity style={styles.loadMore} onPress={() => load()}>
            <Text style={styles.loadMoreText}>{t('workoutHistory.loadMore')}</Text>
          </TouchableOpacity>
        ) : null
      }
      ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
    />
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background },
    list: { padding: Spacing.base },
    listFill: { flex: 1 },

    card: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder,
      padding: Spacing.base, gap: Spacing.md,
    },
    iconWrap: {
      width: 40, height: 40, borderRadius: Radius.md,
      backgroundColor: c.primaryDim, alignItems: 'center', justifyContent: 'center',
    },
    cardBody: { flex: 1 },
    sessionName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: c.textPrimary },
    sessionDate: { fontSize: Typography.sm, color: c.textTertiary, marginTop: 2 },
    chips: { flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.sm, flexWrap: 'wrap' },
    chip: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: Spacing.sm, paddingVertical: 3,
      backgroundColor: c.surfaceElevated, borderRadius: Radius.sm,
      borderWidth: 1, borderColor: c.surfaceBorder,
    },
    chipText: { fontSize: Typography.xs, color: c.textTertiary },

    loadMore: { padding: Spacing.base, alignItems: 'center' },
    loadMoreText: { color: c.primary, fontWeight: Typography.semibold, fontSize: Typography.sm },

    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
    emptyTitle: { fontSize: Typography.lg, fontWeight: Typography.semibold, color: c.textSecondary },
    emptySub: { fontSize: Typography.base, color: c.textTertiary, textAlign: 'center' },
  });
}
