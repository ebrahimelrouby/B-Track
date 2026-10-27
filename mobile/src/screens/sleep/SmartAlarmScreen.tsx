import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, Platform, I18nManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useColors, Spacing, Typography, Radius, TAB_BAR_PADDING } from '@/theme';
import { HealthNavigationProp } from '@/navigation/types';
import { recommendBedtimes } from '@/utils/sleepCycle';
import { useAlarmStore } from '@/store/alarm.store';
import { Alarm, Weekday } from '@/types/alarm';
import { scheduleAlarm, cancelAlarm } from '@/services/alarmScheduler';

const SLEEP_COLOR = '#8B5CF6';

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function toHHmm(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function repeatSummary(alarm: Alarm, t: (k: string) => string): string {
  if (alarm.repeatDays.length === 0) return t('smartAlarm.repeatNever');
  if (alarm.repeatDays.length === 7) return t('smartAlarm.repeatEveryDay');
  return [...alarm.repeatDays]
    .sort((a, b) => a - b)
    .map((d) => t(`smartAlarm.day${d}`))
    .join(' ');
}

export default function SmartAlarmScreen() {
  const navigation = useNavigation<HealthNavigationProp>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { t } = useTranslation();
  const { alarms, toggleAlarm, deleteAlarm, updateAlarm } = useAlarmStore();

  const defaultWake = useMemo(() => {
    const d = new Date();
    d.setHours(7, 0, 0, 0);
    if (d <= new Date()) d.setDate(d.getDate() + 1);
    return d;
  }, []);
  const [wakeTime, setWakeTime] = useState(defaultWake);
  const [showPicker, setShowPicker] = useState(false);

  const recommendations = useMemo(() => recommendBedtimes(wakeTime), [wakeTime]);

  const handleTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (event.type === 'set' && selected) setWakeTime(selected);
  };

  async function handleToggle(alarm: Alarm, enabled: boolean) {
    toggleAlarm(alarm.id, enabled);
    if (enabled) {
      const notificationIds = await scheduleAlarm(alarm);
      updateAlarm(alarm.id, { notificationIds });
    } else {
      await cancelAlarm(alarm);
    }
  }

  function handleDelete(alarm: Alarm) {
    Alert.alert(t('smartAlarm.deleteAlarm'), t('smartAlarm.deleteAlarmConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('smartAlarm.deleteAlarm'),
        style: 'destructive',
        onPress: async () => {
          await cancelAlarm(alarm);
          deleteAlarm(alarm.id);
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1, paddingTop: insets.top }}
        contentContainerStyle={{ padding: Spacing.base, gap: Spacing.lg, paddingBottom: TAB_BAR_PADDING }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: Spacing.sm }}>
          <TouchableOpacity
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' }}
            onPress={() => navigation.goBack()}
          >
            <Icon name={I18nManager.isRTL ? 'arrow-right' : 'arrow-left'} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: Typography.xl, fontWeight: Typography.bold, color: colors.textPrimary }}>
              {t('smartAlarm.title')}
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Wake time prompt */}
        <View style={{ backgroundColor: colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: colors.surfaceBorder, padding: Spacing.lg, gap: Spacing.md, alignItems: 'center' }}>
          <Text style={{ fontSize: Typography.base, fontWeight: Typography.semibold, color: colors.textPrimary, textAlign: 'center' }}>
            {t('smartAlarm.wakeTimePrompt')}
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: colors.surfaceElevated, borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}
            onPress={() => setShowPicker(true)}
          >
            <Text style={{ fontSize: Typography.xl, fontWeight: Typography.extrabold, color: SLEEP_COLOR }}>
              {formatTime(wakeTime)}
            </Text>
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker
              value={wakeTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
          )}
        </View>

        {/* Recommended bedtimes */}
        <View style={{ gap: Spacing.sm }}>
          <Text style={{ fontSize: Typography.xs, fontWeight: Typography.bold, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            {t('smartAlarm.recommendedTitle')}
          </Text>
          {recommendations.map((rec) => (
            <TouchableOpacity
              key={rec.cycles}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: colors.surfaceBorder, padding: Spacing.base, gap: Spacing.md }}
              onPress={() => navigation.navigate('CreateAlarm', { recommendedTime: toHHmm(rec.time), cycles: rec.cycles })}
            >
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: SLEEP_COLOR + '20', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="weather-night" size={18} color={SLEEP_COLOR} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: colors.textPrimary }}>
                  {t('smartAlarm.bedByPrefix')} {formatTime(rec.time)}
                </Text>
                <Text style={{ fontSize: Typography.xs, color: colors.textTertiary }}>
                  {t('smartAlarm.cyclesSuffix', { cycles: rec.cycles })} · {t('smartAlarm.durationSuffix', { hours: Math.floor(rec.totalSleepMinutes / 60), minutes: rec.totalSleepMinutes % 60 })}
                </Text>
              </View>
              <Icon name={I18nManager.isRTL ? 'chevron-left' : 'chevron-right'} size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={{ alignItems: 'center', paddingVertical: Spacing.sm }}
            onPress={() => navigation.navigate('CreateAlarm')}
          >
            <Text style={{ fontSize: Typography.sm, fontWeight: Typography.semibold, color: SLEEP_COLOR }}>
              {t('smartAlarm.setCustomTime')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Existing alarms */}
        <View style={{ gap: Spacing.sm }}>
          <Text style={{ fontSize: Typography.xs, fontWeight: Typography.bold, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            {t('smartAlarm.yourAlarms')}
          </Text>
          {alarms.length === 0 ? (
            <Text style={{ fontSize: Typography.sm, color: colors.textTertiary, textAlign: 'center', paddingVertical: Spacing.md }}>
              {t('smartAlarm.noAlarms')}
            </Text>
          ) : (
            alarms.map((alarm) => (
              <View
                key={alarm.id}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: colors.surfaceBorder, padding: Spacing.base, gap: Spacing.md }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: Typography.lg, fontWeight: Typography.bold, color: alarm.enabled ? colors.textPrimary : colors.textTertiary }}>
                    {alarm.time}
                  </Text>
                  <Text style={{ fontSize: Typography.xs, color: colors.textTertiary }}>
                    {repeatSummary(alarm, t)}
                  </Text>
                </View>
                <Switch
                  value={alarm.enabled}
                  onValueChange={(v) => handleToggle(alarm, v)}
                  trackColor={{ false: colors.surfaceBorder, true: SLEEP_COLOR + '80' }}
                  thumbColor={alarm.enabled ? SLEEP_COLOR : colors.textTertiary}
                />
                <TouchableOpacity onPress={() => handleDelete(alarm)} hitSlop={8}>
                  <Icon name="trash-can-outline" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
