import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, I18nManager } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTranslation } from 'react-i18next';
import { useColors, ColorPalette, Spacing, Typography, Radius } from '@/theme';
import { useThemeStore, ThemeId } from '@/store/theme.store';
import { useLangStore, LangId } from '@/store/language.store';
import { useAuthStore } from '@/store/auth.store';
import { userApi } from '@/api/user.api';
import { workoutApi } from '@/api/workout.api';

const THEMES = [
  { id: 'dark',       label: 'Lime',     bg: '#141414', accent: '#AAFF00', text: '#FFFFFF' },
  { id: 'midnight',  label: 'Midnight', bg: '#0C0D1A', accent: '#7B6CF0', text: '#E8EAFF' },
  { id: 'orange', label: 'Ember',  bg: '#1A1A1A', accent: '#F97316', text: '#FFFFFF' },
  { id: 'pink',   label: 'Rose',   bg: '#0D0D0D', accent: '#F020A0', text: '#FFFFFF' },
  { id: 'coral',  label: 'Coral',  bg: '#120E0F', accent: '#E8677D', text: '#FDF4F5' },
  { id: 'gold',   label: 'Gold',   bg: '#0A0A0A', accent: '#E8B923', text: '#FBF3E0' },
  { id: 'teal',   label: 'Teal',   bg: '#14161D', accent: '#2DD4BF', text: '#F1F5F9' },
  { id: 'azure',  label: 'Azure',  bg: '#070B14', accent: '#2563EB', text: '#F0F4FF' },
  { id: 'light',  label: 'Light',  bg: '#F4F6F8', accent: '#7ACC00', text: '#111827' },
] as const;

// Picks a readable check-icon color for a swatch's accent background using
// WCAG relative luminance (gamma-corrected), so it works for any accent hue —
// including bright ones like Lime/Light/Gold where a plain white icon would
// nearly vanish — instead of hardcoding which theme's text color needs which icon.
function readableIconColor(hex: string): string {
  const toLinear = (channel: number) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const r = toLinear(parseInt(hex.slice(1, 3), 16));
  const g = toLinear(parseInt(hex.slice(3, 5), 16));
  const b = toLinear(parseInt(hex.slice(5, 7), 16));
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Below this, black and white icons have equal contrast against the
  // background; above it, black wins (WCAG contrast-ratio crossover).
  return luminance > 0.179 ? '#0A0A0A' : '#FFFFFF';
}

const GOAL_LABELS: Record<string, string> = {
  LOSE_FAT: 'Lose Fat', MAINTAIN: 'Maintain', GAIN_MUSCLE: 'Gain Muscle',
};
const ACTIVITY_LABELS: Record<string, string> = {
  SEDENTARY: 'Sedentary', LIGHTLY_ACTIVE: 'Lightly Active',
  MODERATELY_ACTIVE: 'Moderately Active', VERY_ACTIVE: 'Very Active', EXTRA_ACTIVE: 'Extra Active',
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { user, entitlements, logout } = useAuthStore();
  const { theme: activeTheme, setTheme } = useThemeStore();
  const { lang: activeLang, setLang } = useLangStore();
  const colors = useColors();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [editPersonal, setEditPersonal] = useState(false);
  const [editMetrics, setEditMetrics] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [targetWeightKg, setTargetWeightKg] = useState('');

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: userApi.getMe });
  const { data: history } = useQuery({
    queryKey: ['workout-history-count'],
    queryFn: () => workoutApi.getHistory(0, 1),
  });

  const updateMutation = useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });

  const initials = `${(user?.firstName ?? 'U')[0]}${(user?.lastName ?? '')[0] ?? ''}`.toUpperCase();
  const profile = (me as any)?.profile;

  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const avatarUri = localAvatar ?? profile?.avatarUrl ?? null;

  const handlePickAvatar = useCallback(() => {
    launchImageLibrary({ mediaType: 'photo', quality: 1, selectionLimit: 1 }, (res) => {
      if (res.didCancel || res.errorCode) return;
      const uri = res.assets?.[0]?.uri;
      if (uri) {
        setLocalAvatar(uri);
        updateMutation.mutate({ avatarUrl: uri });
      }
    });
  }, [updateMutation]);

  const handleLogout = () => {
    Alert.alert(t('profile.logoutTitle'), t('profile.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.logout'), style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={styles.screenHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Icon name={I18nManager.isRTL ? "arrow-right" : "arrow-left"} size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>{t('profile.title')}</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (navigation as any).navigate('Notifications')}
          activeOpacity={0.7}
        >
          <Icon name="bell-outline" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrap} onPress={handlePickAvatar} activeOpacity={0.8}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={[styles.avatarCamBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
              <Icon name="camera-plus" size={14} color={colors.textInverse} />
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoLabel}>{t('profile.tapToChange')}</Text>
          <Text style={styles.fullName}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.planBadge}>
            <Text style={styles.planBadgeText}>{entitlements?.plan ?? 'FREE'}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { num: String(history?.totalElements ?? 0), lbl: t('profile.workouts') },
            { num: 'Jun 2025', lbl: t('profile.memberSince') },
            { num: entitlements?.plan ?? 'FREE', lbl: t('profile.plan') },
          ].map((s, i) => (
            <View key={i} style={[styles.statBox, i > 0 && styles.statBoxBorder]}>
              <Text style={styles.statNum}>{s.num}</Text>
              <Text style={styles.statLbl}>{s.lbl}</Text>
            </View>
          ))}
        </View>

        {/* Personal Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('profile.personalInfo')}</Text>
            <TouchableOpacity onPress={() => {
              if (editPersonal) updateMutation.mutate({ firstName, lastName });
              setEditPersonal(v => !v);
            }}>
              <Text style={styles.editBtn}>{editPersonal ? t('common.save') : t('common.edit')}</Text>
            </TouchableOpacity>
          </View>
          {[
            { label: t('profile.firstName'), display: user?.firstName ?? '—', value: firstName, set: setFirstName },
            { label: t('profile.lastName'), display: user?.lastName ?? '—', value: lastName, set: setLastName },
          ].map((f, i) => (
            <View key={f.label} style={[styles.fieldRow, i > 0 && styles.fieldBorder]}>
              <Text style={styles.fieldLabel}>{f.label}</Text>
              {editPersonal
                ? <TextInput style={styles.fieldInput} value={f.value} onChangeText={f.set} placeholderTextColor={colors.textTertiary} />
                : <Text style={styles.fieldValue}>{f.display}</Text>
              }
            </View>
          ))}
          <View style={[styles.fieldRow, styles.fieldBorder]}>
            <Text style={styles.fieldLabel}>{t('profile.email')}</Text>
            <Text style={styles.fieldValue}>{user?.email ?? '—'}</Text>
          </View>
        </View>

        {/* Body Metrics */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('profile.bodyMetrics')}</Text>
            <TouchableOpacity onPress={() => {
              if (editMetrics) {
                const updates: Record<string, number> = {};
                if (weightKg) updates.weightKg = parseFloat(weightKg);
                if (heightCm) updates.heightCm = parseFloat(heightCm);
                if (targetWeightKg) updates.targetWeightKg = parseFloat(targetWeightKg);
                updateMutation.mutate(updates);
              } else {
                setWeightKg(String(profile?.weightKg ?? ''));
                setHeightCm(String(profile?.heightCm ?? ''));
                setTargetWeightKg(String(profile?.targetWeightKg ?? ''));
              }
              setEditMetrics(v => !v);
            }}>
              <Text style={styles.editBtn}>{editMetrics ? t('common.save') : t('common.edit')}</Text>
            </TouchableOpacity>
          </View>
          {[
            { label: t('profile.height'), display: profile?.heightCm ? `${profile.heightCm} cm` : '—', value: heightCm, set: setHeightCm },
            { label: t('profile.weight'), display: profile?.weightKg ? `${profile.weightKg} kg` : '—', value: weightKg, set: setWeightKg },
            { label: t('profile.targetWeight'), display: profile?.targetWeightKg ? `${profile.targetWeightKg} kg` : '—', value: targetWeightKg, set: setTargetWeightKg },
          ].map((f, i) => (
            <View key={f.label} style={[styles.fieldRow, i > 0 && styles.fieldBorder]}>
              <Text style={styles.fieldLabel}>{f.label}</Text>
              {editMetrics
                ? <TextInput style={styles.fieldInput} value={f.value} onChangeText={f.set} keyboardType="numeric" placeholderTextColor={colors.textTertiary} />
                : <Text style={styles.fieldValue}>{f.display}</Text>
              }
            </View>
          ))}
        </View>

        {/* Fitness Profile */}
        <View style={styles.card}>
          <View style={styles.cardHeader}><Text style={styles.cardTitle}>{t('profile.fitnessProfile')}</Text></View>
          {[
            { label: t('profile.goal'), value: GOAL_LABELS[profile?.fitnessGoal ?? ''] ?? '—' },
            { label: t('profile.activityLevel'), value: ACTIVITY_LABELS[profile?.activityLevel ?? ''] ?? '—' },
            { label: t('profile.experience'), value: profile?.fitnessExperience ?? '—' },
          ].map((f, i) => (
            <View key={f.label} style={[styles.fieldRow, i > 0 && styles.fieldBorder]}>
              <Text style={styles.fieldLabel}>{f.label}</Text>
              <Text style={styles.fieldValue}>{f.value}</Text>
            </View>
          ))}
        </View>

        {/* App settings */}
        <Text style={styles.sectionHeader}>{t('profile.appSection')}</Text>
        <View style={styles.card}>
          {/* Theme picker */}
          <View style={[styles.settingsRow, { flexDirection: 'column', alignItems: 'stretch', gap: Spacing.sm }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <Icon name="palette-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.rowLabel}>{t('profile.theme')}</Text>
              <Text style={styles.rowValue}>{THEMES.find(th => th.id === activeTheme)?.label}</Text>
            </View>
            <View style={styles.themeGrid}>
              {THEMES.map(th => {
                const selected = activeTheme === th.id;
                return (
                  <TouchableOpacity
                    key={th.id}
                    style={[
                      styles.themeCard,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: selected ? th.accent : colors.surfaceBorder,
                      },
                    ]}
                    onPress={() => setTheme(th.id as ThemeId)}
                    activeOpacity={0.75}
                  >
                    {selected && (
                      <View style={[styles.themeCheckBadge, { backgroundColor: th.accent }]}>
                        <Icon name="check" size={10} color={readableIconColor(th.accent)} />
                      </View>
                    )}
                    <View style={[styles.themeSwatch, { backgroundColor: th.bg, borderColor: th.accent + '55' }]}>
                      <View style={[styles.themeSwatchDot, { backgroundColor: th.accent }]} />
                    </View>
                    <Text
                      style={[
                        styles.themeChipLabel,
                        { color: selected ? colors.textPrimary : colors.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {th.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Language picker */}
          <View style={[styles.settingsRow, styles.fieldBorder, { flexDirection: 'column', alignItems: 'stretch', gap: Spacing.sm }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <Icon name="translate" size={20} color={colors.textSecondary} />
              <Text style={styles.rowLabel}>{t('profile.language')}</Text>
            </View>
            <View style={styles.themePicker}>
              {([
                { id: 'en', label: 'English', flag: '🇺🇸' },
                { id: 'ar', label: 'العربية', flag: '🇸🇦' },
              ] as const).map(l => {
                const selected = activeLang === l.id;
                return (
                  <TouchableOpacity
                    key={l.id}
                    style={[
                      styles.langChip,
                      {
                        backgroundColor: selected ? colors.primaryDim : colors.surfaceElevated,
                        borderColor: selected ? colors.primary : colors.surfaceBorder,
                      },
                    ]}
                    onPress={() => setLang(l.id as LangId)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.langFlag}>{l.flag}</Text>
                    <Text style={[styles.langLabel, { color: selected ? colors.primary : colors.textSecondary }]}>
                      {l.label}
                    </Text>
                    {selected && <Icon name="check-circle" size={14} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.settingsRow, styles.fieldBorder]}>
            <Icon name="information-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.rowLabel}>{t('profile.version')}</Text>
            <Text style={styles.rowValue}>1.0.0</Text>
          </View>
        </View>

        {/* Account */}
        <Text style={styles.sectionHeader}>{t('profile.account')}</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.settingsRow} onPress={handleLogout}>
            <Icon name="logout" size={20} color={colors.error} />
            <Text style={[styles.rowLabel, { color: colors.error }]}>{t('profile.logout')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    scroll: { padding: Spacing.base },

    screenHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.base,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.surfaceBorder,
    },
    screenTitle: {
      flex: 1,
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      color: c.textPrimary,
      textAlign: 'center',
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },

    avatarSection: { alignItems: 'center', paddingVertical: Spacing['2xl'] },
    avatarWrap: { position: 'relative', marginBottom: Spacing.xs },
    avatar: {
      width: 88, height: 88, borderRadius: 44,
      backgroundColor: c.primaryDim, borderWidth: 2.5, borderColor: c.primary,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: c.primary },
    avatarCamBadge: {
      position: 'absolute', bottom: 0, right: 0,
      width: 28, height: 28, borderRadius: 14,
      borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    },
    changePhotoLabel: {
      fontSize: Typography.xs, color: c.textTertiary, marginBottom: Spacing.sm,
    },
    fullName: { fontSize: Typography.xl, fontWeight: Typography.bold, color: c.textPrimary },
    email: { fontSize: Typography.sm, color: c.textSecondary, marginTop: 4 },
    planBadge: {
      marginTop: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: 3,
      borderRadius: Radius.sm, borderWidth: 1, borderColor: c.primary,
    },
    planBadgeText: { fontSize: Typography.xs, fontWeight: Typography.bold, color: c.primary },

    statsRow: {
      flexDirection: 'row', backgroundColor: c.surface,
      borderRadius: Radius.lg, borderWidth: 1, borderColor: c.surfaceBorder,
      marginBottom: Spacing.xl, overflow: 'hidden',
    },
    statBox: { flex: 1, alignItems: 'center', paddingVertical: Spacing.base },
    statBoxBorder: { borderLeftWidth: 1, borderLeftColor: c.surfaceBorder },
    statNum: { fontSize: Typography.sm, fontWeight: Typography.bold, color: c.textPrimary, textAlign: 'center' },
    statLbl: { fontSize: Typography.xs, color: c.textTertiary, marginTop: 2 },

    sectionHeader: {
      fontSize: Typography.xs, fontWeight: Typography.semibold,
      color: c.textTertiary, textTransform: 'uppercase', letterSpacing: 1,
      marginBottom: Spacing.sm, marginTop: Spacing.md, paddingHorizontal: 4,
    },
    card: {
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder, marginBottom: Spacing.md, overflow: 'hidden',
    },
    cardHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: c.surfaceBorder,
    },
    cardTitle: { fontSize: Typography.base, fontWeight: Typography.semibold, color: c.textPrimary },
    editBtn: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: c.primary },

    fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base },
    fieldBorder: { borderTopWidth: 1, borderTopColor: c.surfaceBorder },
    fieldLabel: { fontSize: Typography.sm, color: c.textSecondary },
    fieldValue: { fontSize: Typography.sm, color: c.textPrimary, fontWeight: Typography.medium },
    fieldInput: {
      fontSize: Typography.sm, color: c.textPrimary,
      borderBottomWidth: 1, borderBottomColor: c.primary,
      minWidth: 120, textAlign: 'right', paddingVertical: 2,
    },

    settingsRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, gap: Spacing.md },
    rowLabel: { flex: 1, fontSize: Typography.base, color: c.textPrimary },
    rowValue: { fontSize: Typography.sm, color: c.textTertiary },

    themePicker: { flexDirection: 'row', gap: Spacing.sm },
    themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    themeCard: {
      width: '31%', alignItems: 'center', justifyContent: 'center',
      paddingVertical: Spacing.sm, paddingHorizontal: 4,
      borderRadius: Radius.lg, borderWidth: 2, position: 'relative',
    },
    themeSwatch: {
      width: 36, height: 36, borderRadius: 18, borderWidth: 1.5,
      alignItems: 'center', justifyContent: 'center', marginBottom: 6,
    },
    themeSwatchDot: { width: 14, height: 14, borderRadius: 7 },
    themeCheckBadge: {
      position: 'absolute', top: 6, right: 6,
      width: 16, height: 16, borderRadius: 8,
      alignItems: 'center', justifyContent: 'center', zIndex: 1,
    },
    themeChipLabel: { fontSize: Typography.xs, fontWeight: Typography.semibold, maxWidth: '100%' },

    langChip: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 6, paddingVertical: 12, paddingHorizontal: Spacing.sm,
      borderRadius: Radius.lg, borderWidth: 1.5,
    },
    langFlag: { fontSize: 16 },
    langLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  });
}
