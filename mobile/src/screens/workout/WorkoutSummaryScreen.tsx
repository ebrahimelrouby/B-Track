import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius, TAB_BAR_PADDING } from '@/theme';
import Button from '@/components/common/Button';
import { WorkoutStackParamList } from '@/navigation/types';

type RouteProps = RouteProp<WorkoutStackParamList, 'WorkoutSummary'>;

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function WorkoutSummaryScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<RouteProps>();
  const colors = useColors();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const { t } = useTranslation();

  const stats = [
    { icon: 'clock-outline',    label: t('workoutSummary.duration'),  value: formatDuration(params.durationSeconds) },
    { icon: 'weight-lifter',    label: t('workoutSummary.volume'),    value: `${params.totalVolumeKg}kg` },
    { icon: 'dumbbell',         label: t('workoutSummary.sets'),      value: String(params.totalSets) },
    { icon: 'arm-flex-outline', label: t('workoutSummary.exercises'), value: String(params.exerciseCount) },
  ];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
    >
      <View style={styles.hero}>
        <View style={styles.trophyCircle}>
          <Icon name="trophy" size={52} color={colors.primary} />
        </View>
        <Text style={styles.title}>{t('workoutSummary.title')}</Text>
        <Text style={styles.workoutName}>{params.name}</Text>
        <Text style={styles.subtitle}>{t('workoutSummary.subtitle')}</Text>
      </View>

      <View style={styles.grid}>
        {stats.map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Icon name={s.icon} size={22} color={colors.primary} />
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Button
        title={t('workoutSummary.backToHome')}
        onPress={() => {
          // Reset Workout stack to root so re-visiting the tab shows WorkoutPlans
          navigation.dispatch(CommonActions.reset({
            index: 0,
            routes: [{ name: 'WorkoutPlans' }],
          }));
          // Switch to Dashboard tab
          navigation.getParent()?.navigate('Dashboard');
        }}
        fullWidth
        style={styles.primaryBtn}
      />
      {params.sessionId ? (
        <Button
          title={t('workoutSummary.viewSession')}
          variant="secondary"
          onPress={() => navigation.navigate('WorkoutHistory')}
          fullWidth
        />
      ) : null}
    </ScrollView>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    scroll: { padding: Spacing['2xl'] },

    hero: { alignItems: 'center', marginBottom: Spacing['3xl'] },
    trophyCircle: {
      width: 100, height: 100, borderRadius: 50,
      backgroundColor: c.primaryDim, borderWidth: 2, borderColor: c.primary,
      alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl,
    },
    title: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: c.textPrimary },
    workoutName: { fontSize: Typography.lg, fontWeight: Typography.semibold, color: c.primary, marginTop: 4 },
    subtitle: { fontSize: Typography.base, color: c.textSecondary, marginTop: Spacing.sm },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing['2xl'] },
    statCard: {
      flex: 1, minWidth: '45%', backgroundColor: c.surface,
      borderRadius: Radius.lg, borderWidth: 1, borderColor: c.surfaceBorder,
      padding: Spacing.base, alignItems: 'center', gap: 4,
    },
    statValue: { fontSize: Typography.xl, fontWeight: Typography.bold, color: c.textPrimary, marginTop: Spacing.xs },
    statLabel: { fontSize: Typography.sm, color: c.textTertiary },
    primaryBtn: { marginBottom: Spacing.sm },
  });
}
