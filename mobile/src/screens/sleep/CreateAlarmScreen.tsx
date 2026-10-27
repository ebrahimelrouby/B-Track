import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { v4 as uuidv4 } from 'uuid';

import { useColors, Spacing, Typography, Radius } from '@/theme';
import { HealthStackParamList, HealthNavigationProp } from '@/navigation/types';
import { useAlarmStore } from '@/store/alarm.store';
import { Weekday } from '@/types/alarm';
import { requestAlarmPermission, scheduleAlarm } from '@/services/alarmScheduler';

const SLEEP_COLOR = '#8B5CF6';
const DAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

type Route = RouteProp<HealthStackParamList, 'CreateAlarm'>;

function parseHHmm(time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function toHHmm(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function CreateAlarmScreen() {
  const navigation = useNavigation<HealthNavigationProp>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { t } = useTranslation();
  const { addAlarm } = useAlarmStore();

  const { recommendedTime, cycles } = route.params ?? {};
  const [time, setTime] = useState(() => (recommendedTime ? parseHHmm(recommendedTime) : new Date()));
  const [repeatDays, setRepeatDays] = useState<Weekday[]>([]);
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');
  const [saving, setSaving] = useState(false);

  const handleTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'set' && selected) setTime(selected);
  };

  function toggleDay(day: Weekday) {
    setRepeatDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const granted = await requestAlarmPermission();
      if (!granted) {
        Alert.alert(t('common.error'), t('smartAlarm.permissionDenied'));
        return;
      }

      const alarm = {
        id: uuidv4(),
        time: toHHmm(time),
        repeatDays,
        enabled: true,
        cycles,
        notificationIds: {},
      };
      const notificationIds = await scheduleAlarm(alarm);
      addAlarm({ ...alarm, notificationIds });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingTop: Spacing.sm }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="close" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontSize: Typography.lg, fontWeight: Typography.bold, color: colors.textPrimary }}>
          {t('smartAlarm.newAlarm')}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.base, gap: Spacing.lg }} showsVerticalScrollIndicator={false}>
        {/* Time picker */}
        <View style={{ alignItems: 'center', backgroundColor: colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: colors.surfaceBorder, padding: Spacing.md }}>
          {Platform.OS === 'android' && (
            <TouchableOpacity
              style={{ paddingVertical: Spacing.sm }}
              onPress={() => setShowPicker(true)}
            >
              <Text style={{ fontSize: Typography.xl, fontWeight: Typography.extrabold, color: SLEEP_COLOR }}>
                {toHHmm(time)}
              </Text>
            </TouchableOpacity>
          )}
          {showPicker && (
            <DateTimePicker
              value={time}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
          )}
        </View>

        {/* Repeat days */}
        <View style={{ gap: Spacing.sm }}>
          <Text style={{ fontSize: Typography.xs, fontWeight: Typography.bold, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            {t('smartAlarm.repeatLabel')}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {DAYS.map((day) => {
              const selected = repeatDays.includes(day);
              return (
                <TouchableOpacity
                  key={day}
                  onPress={() => toggleDay(day)}
                  style={{
                    width: 40, height: 40, borderRadius: 20,
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: selected ? SLEEP_COLOR : colors.surfaceElevated,
                    borderWidth: 1, borderColor: selected ? SLEEP_COLOR : colors.surfaceBorder,
                  }}
                >
                  <Text style={{ fontSize: Typography.sm, fontWeight: Typography.bold, color: selected ? '#FFFFFF' : colors.textSecondary }}>
                    {t(`smartAlarm.day${day}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Mute-switch note */}
        <View style={{ flexDirection: 'row', gap: Spacing.sm, backgroundColor: colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.sm }}>
          <Icon name="information-outline" size={16} color={colors.textTertiary} />
          <Text style={{ flex: 1, fontSize: Typography.xs, color: colors.textTertiary, lineHeight: 16 }}>
            {t('smartAlarm.muteNotice')}
          </Text>
        </View>

        <TouchableOpacity
          style={{ backgroundColor: SLEEP_COLOR, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center', opacity: saving ? 0.6 : 1 }}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: '#FFFFFF' }}>
            {t('smartAlarm.saveAlarm')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
