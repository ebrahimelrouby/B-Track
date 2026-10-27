import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Sound from 'react-native-sound';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useColors, Spacing, Typography } from '@/theme';
import { RootStackParamList, RootNavigationProp } from '@/navigation/types';
import { useAlarmStore } from '@/store/alarm.store';

const SLEEP_COLOR = '#8B5CF6';

type Route = RouteProp<RootStackParamList, 'AlarmRinging'>;

export default function AlarmRingingScreen() {
  const navigation = useNavigation<RootNavigationProp>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { t } = useTranslation();
  const { alarms, updateAlarm } = useAlarmStore();
  const soundRef = useRef<Sound | null>(null);

  const alarm = alarms.find((a) => a.id === route.params.alarmId);

  useEffect(() => {
    Sound.setCategory('Playback');
    const sound = new Sound('alarm.wav', Sound.MAIN_BUNDLE, (error) => {
      if (error) return;
      sound.setNumberOfLoops(-1);
      sound.play();
    });
    soundRef.current = sound;

    return () => {
      sound.stop(() => sound.release());
    };
  }, []);

  function handleStop() {
    soundRef.current?.stop(() => soundRef.current?.release());
    if (alarm && alarm.repeatDays.length === 0) {
      updateAlarm(alarm.id, { enabled: false });
    }
    navigation.goBack();
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top, alignItems: 'center', justifyContent: 'space-between', paddingBottom: Spacing.xl }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md }}>
        <Icon name="alarm" size={48} color={SLEEP_COLOR} />
        <Text style={{ fontSize: 56, fontWeight: Typography.extrabold, color: colors.textPrimary }}>
          {alarm?.time ?? ''}
        </Text>
        <Text style={{ fontSize: Typography.lg, color: colors.textSecondary }}>
          {t('smartAlarm.ringingWakeUp')}
        </Text>
      </View>

      <TouchableOpacity
        style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: SLEEP_COLOR, alignItems: 'center', justifyContent: 'center' }}
        onPress={handleStop}
      >
        <Text style={{ fontSize: Typography.lg, fontWeight: Typography.bold, color: '#FFFFFF' }}>
          {t('smartAlarm.stop')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
