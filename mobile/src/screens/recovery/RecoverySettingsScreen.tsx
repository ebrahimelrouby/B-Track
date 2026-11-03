import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch , I18nManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius, TAB_BAR_PADDING } from '@/theme';
import { useAuthStore } from '@/store/auth.store';
import { useHealthStore } from '@/store/health.store';
import { healthService } from '@/services/health/healthService';
import { syncRecentHealthData } from '@/services/health/syncRecent';

function SettingRow({ icon, label, value, onPress, colors }: {
  icon: string; label: string; value?: string; onPress: () => void; colors: ColorPalette;
}) {
  return (
    <TouchableOpacity
      style={[rowS.row, { borderBottomColor: colors.surfaceBorder }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Icon name={icon} size={18} color={colors.primary} />
      <Text style={[rowS.label, { color: colors.textPrimary }]}>{label}</Text>
      <View style={{ flex: 1 }} />
      {value && <Text style={[rowS.value, { color: colors.textTertiary }]}>{value}</Text>}
      <Icon name={I18nManager.isRTL ? 'chevron-left' : 'chevron-right'} size={16} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

function ToggleRow({ icon, label, value, onChange, colors }: {
  icon: string; label: string; value: boolean; onChange: (v: boolean) => void; colors: ColorPalette;
}) {
  return (
    <View style={[rowS.row, { borderBottomColor: colors.surfaceBorder }]}>
      <Icon name={icon} size={18} color={colors.primary} />
      <Text style={[rowS.label, { color: colors.textPrimary }]}>{label}</Text>
      <View style={{ flex: 1 }} />
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.surfaceBorder, true: colors.primary + '80' }}
        thumbColor={value ? colors.primary : colors.textTertiary}
      />
    </View>
  );
}

const rowS = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1 },
  label: { fontSize: Typography.sm, fontWeight: Typography.medium, flex: 0 },
  value: { fontSize: Typography.sm },
});

export default function RecoverySettingsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { entitlements } = useAuthStore();
  const { stepsAuthorized: healthAuthorized, setAuthorized } = useHealthStore();

  const { t } = useTranslation();
  const [checkInReminder, setCheckInReminder] = React.useState(true);
  const [autoRecalculate, setAutoRecalculate] = React.useState(true);
  const [isConnecting, setIsConnecting] = React.useState(false);

  async function handleConnectHealth() {
    setIsConnecting(true);
    try {
      const granted = await healthService.requestAuthorization();
      setAuthorized(granted);
      if (granted) await syncRecentHealthData();
    } finally {
      setIsConnecting(false);
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name={I18nManager.isRTL ? "arrow-right" : "arrow-left"} size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('recoverySettings.title')}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: TAB_BAR_PADDING }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Scoring ────────────────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>{t('recoverySettings.scoring')}</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <SettingRow
            icon="tune" label={t('recoverySettings.sleepWeight')} value="35%"
            onPress={() => {}} colors={colors}
          />
          <SettingRow
            icon="tune" label={t('recoverySettings.trainingWeight')} value="25%"
            onPress={() => {}} colors={colors}
          />
          <SettingRow
            icon="tune" label={t('recoverySettings.heartWeight')} value="20%"
            onPress={() => {}} colors={colors}
          />
          <SettingRow
            icon="tune" label={t('recoverySettings.hydrationWeight')} value="10%"
            onPress={() => {}} colors={colors}
          />
          <SettingRow
            icon="tune" label={t('recoverySettings.wellnessWeight')} value="10%"
            onPress={() => {}} colors={colors}
          />
        </View>
        <Text style={[styles.hint, { color: colors.textTertiary }]}>
          {t('recoverySettings.weightHint')}
        </Text>

        {/* ── Notifications ──────────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>{t('recoverySettings.notifications')}</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <ToggleRow
            icon="bell-outline" label={t('recoverySettings.checkInReminder')}
            value={checkInReminder} onChange={setCheckInReminder} colors={colors}
          />
          <ToggleRow
            icon="refresh" label={t('recoverySettings.autoRecalculate')}
            value={autoRecalculate} onChange={setAutoRecalculate} colors={colors}
          />
        </View>

        {/* ── Health Permissions ─────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>{t('recoverySettings.healthPermissions')}</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          {[
            { icon: 'moon-waning-crescent', label: t('recoverySettings.permSleep'), connectable: true },
            { icon: 'shoe-sneaker',         label: t('recoverySettings.permSteps'), connectable: true },
            { icon: 'heart-pulse',          label: t('recoverySettings.permHeartRate'),   status: t('recoverySettings.statusNotConnected') },
            { icon: 'heart-flash',          label: t('recoverySettings.permHrv'),         status: t('recoverySettings.statusNotAvailable') },
            { icon: 'water',                label: t('recoverySettings.permRespiratory'), status: t('recoverySettings.statusNotAvailable') },
          ].map(p => {
            const status = p.connectable
              ? (healthAuthorized ? t('recoverySettings.statusConnected') : t('recoverySettings.statusNotConnected'))
              : p.status;
            const statusColor = p.connectable && healthAuthorized ? '#22C55E' : colors.textTertiary;
            const row = (
              <View style={[rowS.row, { borderBottomColor: colors.surfaceBorder }]}>
                <Icon name={p.icon} size={18} color={colors.textTertiary} />
                <Text style={[rowS.label, { color: colors.textPrimary }]}>{p.label}</Text>
                <View style={{ flex: 1 }} />
                {isConnecting && p.connectable && !healthAuthorized ? (
                  <Text style={{ fontSize: Typography.xs, color: colors.textTertiary }}>{t('recoverySettings.connecting')}</Text>
                ) : (
                  <Text style={{ fontSize: Typography.xs, color: statusColor, fontWeight: p.connectable && healthAuthorized ? Typography.semibold : Typography.regular }}>{status}</Text>
                )}
                {p.connectable && !healthAuthorized && <Icon name={I18nManager.isRTL ? 'chevron-left' : 'chevron-right'} size={16} color={colors.textTertiary} />}
              </View>
            );
            return p.connectable && !healthAuthorized ? (
              <TouchableOpacity key={p.label} onPress={handleConnectHealth} disabled={isConnecting} activeOpacity={0.7}>
                {row}
              </TouchableOpacity>
            ) : (
              <View key={p.label}>{row}</View>
            );
          })}
        </View>
        <Text style={[styles.hint, { color: colors.textTertiary }]}>
          {t('recoverySettings.healthHint')}
        </Text>

        {/* ── Premium ───────────────────────────────────────────────────────── */}
        {!entitlements?.isPremium && (
          <>
            <Text style={styles.sectionTitle}>{t('recoverySettings.premiumFeatures')}</Text>
            <View style={[styles.premiumCard, { backgroundColor: '#F59E0B12', borderColor: '#F59E0B40' }]}>
              {[
                t('recoverySettings.premUnlimitedHistory'),
                t('recoverySettings.premAdvancedBreakdown'),
                t('recoverySettings.premAiInsights'),
                t('recoverySettings.premTrainingLoad'),
                t('recoverySettings.premMuscleFatigue'),
                t('recoverySettings.premAppleWatch'),
                t('recoverySettings.premExport'),
              ].map(f => (
                <View key={f} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                  <Icon name="crown" size={13} color="#F59E0B" style={{ marginTop: 1 }} />
                  <Text style={{ fontSize: Typography.xs, color: '#F59E0B' }}>{f}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── Disclaimer ────────────────────────────────────────────────────── */}
        <View style={[styles.disclaimerCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}>
          <Icon name="shield-check-outline" size={16} color={colors.textTertiary} />
          <Text style={[styles.disclaimerText, { color: colors.textTertiary }]}>
            {t('recoverySettings.disclaimer')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    root:   { flex: 1, backgroundColor: c.background },
    scroll: { padding: Spacing.base, gap: Spacing.md },
    header: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
      borderBottomWidth: 1, borderBottomColor: c.surfaceBorder,
    },
    backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    title:   { fontSize: Typography.lg, fontWeight: Typography.bold, color: c.textPrimary },

    sectionTitle: {
      fontSize: Typography.xs, fontWeight: Typography.semibold,
      color: c.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8,
      marginTop: Spacing.sm,
    },
    card: { borderRadius: Radius.lg, borderWidth: 1, paddingHorizontal: Spacing.base },
    hint: { fontSize: Typography.xs, lineHeight: 16 },

    premiumCard: {
      borderRadius: Radius.lg, borderWidth: 1,
      padding: Spacing.base,
    },
    disclaimerCard: {
      flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start',
      borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.base,
    },
    disclaimerText: { flex: 1, fontSize: Typography.xs, lineHeight: 18 },
  });
}
