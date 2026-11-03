import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions , I18nManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius, TAB_BAR_PADDING } from '@/theme';
import { HealthNavigationProp } from '@/navigation/types';
import { recoveryApi } from '@/api/recovery.api';
import { RecoveryScore, RecoveryLevel } from '@/types';
import { useAuthStore } from '@/store/auth.store';
import { localDb } from '@/api/mock/localDb';

const STARRED_KEY = 'recovery:starred';

const W = Dimensions.get('window').width;

const LEVEL_COLORS: Record<RecoveryLevel, string> = {
  READY_FOR_HEAVY_TRAINING:      '#22C55E',
  READY_FOR_NORMAL_TRAINING:     '#4ADE80',
  MODERATE_TRAINING_RECOMMENDED: '#F59E0B',
  LIGHT_ACTIVITY_RECOMMENDED:    '#F97316',
  REST_RECOMMENDED:              '#EF4444',
};

function TrendChart({ data, colors }: { data: RecoveryScore[]; colors: ColorPalette }) {
  const { t } = useTranslation();
  if (data.length < 2) return null;

  const chartW   = W - Spacing.base * 4;
  const chartH   = 90;
  const maxScore = 100;
  const recent   = data.slice(0, 14).reverse(); // oldest → newest
  const gap      = 4;
  const barW     = Math.floor((chartW - gap * (recent.length - 1)) / recent.length);

  return (
    <View style={{ paddingHorizontal: Spacing.base, marginBottom: Spacing.sm }}>
      <Svg width={chartW} height={chartH + 16}>
        {recent.map((d, i) => {
          const barH  = Math.max(2, (d.recoveryScore / maxScore) * chartH);
          const x     = i * (barW + gap);
          const y     = chartH - barH;
          const col   = LEVEL_COLORS[d.recoveryLevel] ?? colors.primary;
          const isLast = i === recent.length - 1;
          return (
            <React.Fragment key={d.id}>
              <Rect x={x} y={y} width={barW} height={barH} rx={3}
                fill={col + (isLast ? 'FF' : '99')} />
              {isLast && (
                <SvgText x={x + barW / 2} y={y - 4} fontSize={9} fill={col}
                  textAnchor="middle" fontWeight="bold">
                  {d.recoveryScore}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
        {/* Average line */}
        {(() => {
          const avg = recent.reduce((a, d) => a + d.recoveryScore, 0) / recent.length;
          const y   = chartH - (avg / maxScore) * chartH;
          return (
            <Line x1={0} y1={y} x2={chartW} y2={y}
              stroke={colors.textTertiary} strokeWidth={1} strokeDasharray="4 4" />
          );
        })()}
      </Svg>
      <Text style={{ fontSize: 9, color: colors.textTertiary, marginTop: 2 }}>
        {t('recoveryHistory.trendSubtitle', { n: recent.length })}
      </Text>
    </View>
  );
}

function HistoryRow({ item, colors, onPress, starred, onToggleStar }: {
  item: RecoveryScore; colors: ColorPalette; onPress: () => void;
  starred: boolean; onToggleStar: () => void;
}) {
  const { t } = useTranslation();
  const getLevelLabel = (key: RecoveryLevel): string => ({
    READY_FOR_HEAVY_TRAINING:      t('recoveryDashboard.levelHeavy'),
    READY_FOR_NORMAL_TRAINING:     t('recoveryDashboard.levelNormal'),
    MODERATE_TRAINING_RECOMMENDED: t('recoveryDashboard.levelModerate'),
    LIGHT_ACTIVITY_RECOMMENDED:    t('recoveryDashboard.levelLight'),
    REST_RECOMMENDED:              t('recoveryDashboard.levelRest'),
  }[key] ?? key);
  const col   = LEVEL_COLORS[item.recoveryLevel] ?? colors.primary;
  const isToday = item.date === new Date().toISOString().split('T')[0];

  return (
    <TouchableOpacity
      style={[
        rowStyles.row,
        { borderBottomColor: colors.surfaceBorder },
        starred && { backgroundColor: '#F59E0B08' },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Score bar accent */}
      <View style={[rowStyles.accent, { backgroundColor: col }]} />

      {/* Date + level */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={[rowStyles.date, { color: colors.textPrimary }]}>
            {isToday
              ? t('recoveryHistory.today')
              : new Date(item.date + 'T12:00:00').toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric',
                })}
          </Text>
          {isToday && (
            <View style={[rowStyles.todayBadge, { backgroundColor: col + '20' }]}>
              <Text style={[rowStyles.todayText, { color: col }]}>{t('recoveryHistory.today')}</Text>
            </View>
          )}
        </View>
        <Text style={[rowStyles.level, { color: colors.textTertiary }]}>{getLevelLabel(item.recoveryLevel)}</Text>
      </View>

      {/* Score */}
      <Text style={[rowStyles.score, { color: col }]}>{item.recoveryScore}</Text>

      {/* Star button */}
      <TouchableOpacity
        style={[rowStyles.starBtn, starred && { backgroundColor: '#F59E0B18' }]}
        onPress={(e) => { e.stopPropagation(); onToggleStar(); }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Icon
          name={starred ? 'star' : 'star-outline'}
          size={20}
          color={starred ? '#F59E0B' : colors.textTertiary}
        />
      </TouchableOpacity>

      <Icon name={I18nManager.isRTL ? 'chevron-left' : 'chevron-right'} size={16} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

const rowStyles = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md, borderBottomWidth: 1, paddingEnd: Spacing.sm },
  accent:     { width: 3, height: 38, borderRadius: 2, flexShrink: 0 },
  date:       { fontSize: Typography.sm, fontWeight: Typography.medium },
  todayBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  todayText:  { fontSize: 9, fontWeight: Typography.bold },
  level:      { fontSize: Typography.xs, marginTop: 2 },
  score:      { fontSize: Typography.xl, fontWeight: Typography.bold, minWidth: 30, textAlign: I18nManager.isRTL ? 'left' : 'right' },
  starBtn:    { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});

export default function RecoveryHistoryScreen() {
  const navigation = useNavigation<HealthNavigationProp>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { entitlements } = useAuthStore();
  const { t } = useTranslation();

  const [starred, setStarred] = useState<Set<string>>(
    () => new Set(localDb.get<string[]>(STARRED_KEY) ?? [])
  );
  const [filterStarred, setFilterStarred] = useState(false);

  const toggleStar = useCallback((date: string) => {
    setStarred(prev => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      localDb.set(STARRED_KEY, Array.from(next));
      return next;
    });
  }, []);

  const { data: history = [], isLoading } = useQuery<RecoveryScore[]>({
    queryKey: ['recovery-history'],
    queryFn:  () => recoveryApi.getHistory(),
  });

  const allData     = entitlements?.isPremium ? history : history.slice(0, 7);
  const displayData = filterStarred ? allData.filter((d: RecoveryScore) => starred.has(d.date)) : allData;

  const weekAvg = useMemo(() => {
    const week = allData.slice(0, 7);
    if (!week.length) return 0;
    return Math.round(week.reduce((a: number, d: RecoveryScore) => a + d.recoveryScore, 0) / week.length);
  }, [allData]);

  const best  = useMemo(() => allData.reduce((a: number, d: RecoveryScore) => d.recoveryScore > a ? d.recoveryScore : a, 0), [allData]);
  const worst = useMemo(() => allData.reduce((a: number, d: RecoveryScore) => d.recoveryScore < a ? d.recoveryScore : a, 100), [allData]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name={I18nManager.isRTL ? "arrow-right" : "arrow-left"} size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('recoveryHistory.title')}</Text>
        <TouchableOpacity
          style={[styles.starFilter, filterStarred && { backgroundColor: '#F59E0B20', borderColor: '#F59E0B50' }]}
          onPress={() => setFilterStarred(f => !f)}
        >
          <Icon name={filterStarred ? 'star' : 'star-outline'} size={16} color={filterStarred ? '#F59E0B' : colors.textTertiary} />
          {starred.size > 0 && (
            <Text style={[styles.starCount, { color: filterStarred ? '#F59E0B' : colors.textTertiary }]}>
              {starred.size}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayData}
        keyExtractor={d => d.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_PADDING }}
        ListHeaderComponent={() => (
          <View style={{ gap: Spacing.md }}>
            {/* Stats strip */}
            <View style={styles.statsRow}>
              {[
                { label: t('recoveryHistory.stat7DayAvg'), value: String(weekAvg),            color: colors.textPrimary },
                { label: t('recoveryHistory.statBest'),    value: String(best),               color: '#22C55E' },
                { label: t('recoveryHistory.statWorst'),   value: String(worst),              color: '#EF4444' },
                { label: t('recoveryHistory.statStarred'), value: String(starred.size), color: '#F59E0B', icon: 'star' },
              ].map(s => (
                <View key={s.label} style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    {s.icon && <Icon name={s.icon} size={12} color={s.color} />}
                    <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
                  </View>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Trend chart */}
            <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={styles.sectionTitle}>{t('recoveryHistory.trend14Day')}</Text>
              <TrendChart data={displayData} colors={colors} />
            </View>

            {!entitlements?.isPremium && history.length > 7 && (
              <View style={[styles.premiumBanner, { backgroundColor: '#F59E0B12', borderColor: '#F59E0B40' }]}>
                <Icon name="crown" size={14} color="#F59E0B" />
                <Text style={styles.premiumText}>
                  {t('recoveryHistory.premiumBanner', { n: history.length })}
                </Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>
              {filterStarred ? t('recoveryHistory.sectionStarred', { n: displayData.length }) : t('recoveryHistory.sectionHistory')}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <HistoryRow
            item={item}
            colors={colors}
            onPress={() => navigation.navigate('RecoveryDetails', { date: item.date })}
            starred={starred.has(item.date)}
            onToggleStar={() => toggleStar(item.date)}
          />
        )}
        style={{ paddingHorizontal: Spacing.base }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', gap: Spacing.md, paddingTop: 48 }}>
            <Icon
              name={filterStarred ? 'star-outline' : 'heart-pulse'}
              size={40}
              color={colors.textTertiary}
            />
            <Text style={{ color: colors.textTertiary, textAlign: 'center' }}>
              {isLoading
                ? t('recoveryHistory.loading')
                : filterStarred
                ? t('recoveryHistory.noStarred')
                : t('recoveryHistory.noHistory')}
            </Text>
          </View>
        }
      />
    </View>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    root:   { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
      borderBottomWidth: 1, borderBottomColor: c.surfaceBorder,
    },
    backBtn:    { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    title:      { fontSize: Typography.lg, fontWeight: Typography.bold, color: c.textPrimary, flex: 1 },
    starFilter: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: Spacing.sm, paddingVertical: 6,
      borderRadius: Radius.full, borderWidth: 1, borderColor: c.surfaceBorder,
    },
    starCount:  { fontSize: Typography.xs, fontWeight: Typography.bold },

    statsRow: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.base },
    statBox:  {
      flex: 1, alignItems: 'center', gap: 2,
      borderRadius: Radius.md, borderWidth: 1, padding: Spacing.sm,
    },
    statVal:   { fontSize: Typography.lg, fontWeight: Typography.bold },
    statLabel: { fontSize: Typography.xs, color: c.textTertiary },

    chartCard: {
      marginHorizontal: Spacing.base, borderRadius: Radius.lg,
      borderWidth: 1, paddingTop: Spacing.base, overflow: 'hidden',
    },
    sectionTitle: {
      fontSize: Typography.sm, fontWeight: Typography.semibold, color: c.textPrimary,
      paddingHorizontal: Spacing.base, marginBottom: Spacing.sm,
    },
    premiumBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      marginHorizontal: Spacing.base, borderRadius: Radius.md, borderWidth: 1, padding: Spacing.md,
    },
    premiumText: { fontSize: Typography.xs, color: '#F59E0B', fontWeight: Typography.medium, flex: 1 },
  });
}
