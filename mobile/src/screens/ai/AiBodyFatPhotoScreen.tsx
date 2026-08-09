import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, I18nManager } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';

import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius } from '@/theme';
import { aiApi } from '@/api/ai.api';
import { AiStackParamList } from '@/navigation/types';

type RouteProps = RouteProp<AiStackParamList, 'AiBodyFatPhoto'>;

interface PhotoSlot {
  angle: 'FRONT' | 'SIDE' | 'BACK';
  label: string;
  description: string;
  icon: string;
  uri?: string;
}

const PHOTO_SLOTS: PhotoSlot[] = [
  { angle: 'FRONT', label: 'Front', description: 'Face the camera, arms relaxed at sides', icon: 'human-greeting-variant' },
  { angle: 'SIDE',  label: 'Side',  description: 'Stand sideways, arms relaxed',           icon: 'human-handsdown' },
  { angle: 'BACK',  label: 'Back',  description: 'Back to camera, arms relaxed at sides',  icon: 'human' },
];

export default function AiBodyFatPhotoScreen() {
  const navigation = useNavigation<any>();
  const { params } = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const getSlotLabel = (angle: string) => ({
    FRONT: t('aiBodyFatPhoto.frontLabel'),
    SIDE: t('aiBodyFatPhoto.sideLabel'),
    BACK: t('aiBodyFatPhoto.backLabel'),
  }[angle] ?? angle);

  const getSlotDesc = (angle: string) => ({
    FRONT: t('aiBodyFatPhoto.frontDesc'),
    SIDE: t('aiBodyFatPhoto.sideDesc'),
    BACK: t('aiBodyFatPhoto.backDesc'),
  }[angle] ?? '');

  const [slots, setSlots] = useState<PhotoSlot[]>(PHOTO_SLOTS.map(s => ({ ...s })));

  const addPhoto = async (index: number) => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 1920, maxHeight: 1920 });
    if (result.assets?.[0]?.uri) {
      setSlots(prev => prev.map((s, i) => i === index ? { ...s, uri: result.assets![0].uri } : s));
    }
  };

  const analyzeMutation = useMutation({
    mutationFn: () => {
      const photoUris = slots.map(s => s.uri!);
      const metadata = {
        consentGiven: true,
        heightCm: params.heightCm,
        weightKg: params.weightKg,
        age: params.age,
        gender: params.gender,
        trainingExperience: params.trainingExperience,
        goal: params.goal,
      };
      return aiApi.analyzeBodyFat(photoUris, metadata);
    },
    onSuccess: estimate => {
      queryClient.setQueryData(['ai-body-fat-result', estimate.id], estimate);
      navigation.navigate('AiBodyFatResult', { estimateId: estimate.id });
    },
    onError: () => Alert.alert(t('common.error'), t('aiBodyFatPhoto.errorMsg')),
  });

  const allPhotosSelected = slots.every(s => !!s.uri);
  const selectedCount = slots.filter(s => !!s.uri).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name={I18nManager.isRTL ? "arrow-right" : "arrow-left"} size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('aiBodyFatPhoto.title')}</Text>
          <Text style={styles.headerSub}>{t('aiBodyFatPhoto.photoCount', { count: selectedCount })}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
      >
        <View style={styles.instructionCard}>
          <Icon name="camera-outline" size={20} color={colors.primary} />
          <Text style={styles.instructionText}>
            For best results: good lighting, form-fitting clothing, neutral background.
            Stand straight with arms slightly away from body.
          </Text>
        </View>

        {slots.map((slot, i) => (
          <TouchableOpacity key={slot.angle} style={styles.photoCard} onPress={() => addPhoto(i)}>
            <View style={[styles.photoPreview, slot.uri && styles.photoPreviewSelected]}>
              <Icon
                name={slot.uri ? 'check-circle' : slot.icon}
                size={slot.uri ? 32 : 40}
                color={slot.uri ? colors.success : colors.textTertiary}
              />
              {slot.uri && <Text style={styles.photoSelectedText}>{t('aiBodyFatPhoto.photoSelected')}</Text>}
            </View>
            <View style={styles.photoInfo}>
              <Text style={styles.photoLabel}>{getSlotLabel(slot.angle)} {t('aiBodyFatPhoto.viewLabel')}</Text>
              <Text style={styles.photoDesc}>{getSlotDesc(slot.angle)}</Text>
              <View style={styles.photoAction}>
                <Icon name={slot.uri ? 'pencil-outline' : 'plus'} size={14} color={colors.primary} />
                <Text style={styles.photoActionText}>{slot.uri ? t('aiBodyFatPhoto.changePhoto') : t('aiBodyFatPhoto.selectPhoto')}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.privacyNote}>
          <Icon name="lock-outline" size={14} color={colors.textTertiary} />
          <Text style={styles.privacyNoteText}>
            Photos are encrypted in transit and not permanently stored unless you choose to save results.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.base }]}>
        <TouchableOpacity
          style={[styles.analyzeBtn, (!allPhotosSelected || analyzeMutation.isPending) && styles.btnDisabled]}
          onPress={() => analyzeMutation.mutate()}
          disabled={!allPhotosSelected || analyzeMutation.isPending}
        >
          {analyzeMutation.isPending ? (
            <>
              <ActivityIndicator color={colors.textInverse} size="small" />
              <Text style={styles.analyzeBtnText}>{t('aiBodyFatPhoto.analyzing')}</Text>
            </>
          ) : (
            <>
              <Icon name="brain" size={20} color={colors.textInverse} />
              <Text style={styles.analyzeBtnText}>
                {allPhotosSelected ? t('aiBodyFatPhoto.analyzeBtn') : t('aiBodyFatPhoto.selectAll', { count: selectedCount })}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: c.surfaceBorder,
    },
    backBtn: { padding: Spacing.sm },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: c.textPrimary },
    headerSub: { fontSize: Typography.xs, color: c.textTertiary },

    scroll: { padding: Spacing.base, gap: Spacing.md },

    instructionCard: {
      flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start',
      backgroundColor: c.primaryDim, borderRadius: Radius.lg,
      padding: Spacing.md, borderWidth: 1, borderColor: c.primary + '40',
    },
    instructionText: { flex: 1, fontSize: Typography.sm, color: c.textPrimary, lineHeight: 20 },

    photoCard: {
      flexDirection: 'row', gap: Spacing.base,
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder, overflow: 'hidden',
    },
    photoPreview: {
      width: 100, backgroundColor: c.surfaceElevated,
      alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, minHeight: 100,
    },
    photoPreviewSelected: { backgroundColor: c.success + '15' },
    photoSelectedText: { fontSize: Typography.xs, color: c.success, fontWeight: Typography.semibold },
    photoInfo: { flex: 1, padding: Spacing.base, justifyContent: 'center', gap: 4 },
    photoLabel: { fontSize: Typography.base, fontWeight: Typography.bold, color: c.textPrimary },
    photoDesc: { fontSize: Typography.sm, color: c.textSecondary, lineHeight: 18 },
    photoAction: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    photoActionText: { fontSize: Typography.xs, color: c.primary, fontWeight: Typography.medium },

    privacyNote: {
      flexDirection: 'row', gap: Spacing.xs, alignItems: 'flex-start',
    },
    privacyNoteText: { flex: 1, fontSize: Typography.xs, color: c.textTertiary, lineHeight: 18 },

    footer: {
      padding: Spacing.base, borderTopWidth: 1, borderTopColor: c.surfaceBorder,
      backgroundColor: c.background,
    },
    analyzeBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: Spacing.sm, backgroundColor: c.primary, borderRadius: Radius.lg,
      paddingVertical: Spacing.base,
    },
    btnDisabled: { opacity: 0.45 },
    analyzeBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: c.textInverse },
  });
}
