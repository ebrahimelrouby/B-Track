import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert, I18nManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';

import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius } from '@/theme';
import { aiApi } from '@/api/ai.api';
import { AiNavigationProp } from '@/navigation/types';

type Nav = AiNavigationProp;

export default function AiFoodEntryScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [mode, setMode] = useState<'text' | 'photo'>('text');
  const [description, setDescription] = useState('');
  const [selectedPhotoUri, setSelectedPhotoUri] = useState<string | null>(null);
  const [selectedMimeType, setSelectedMimeType] = useState<string>('image/jpeg');

  const textMutation = useMutation({
    mutationFn: (desc: string) => aiApi.estimateNutritionFromText(desc),
    onSuccess: estimate => {
      queryClient.setQueryData(['ai-estimate-result', estimate.id], estimate);
      navigation.navigate('AiEstimateReview', { estimateId: estimate.id });
    },
    onError: () => Alert.alert(t('aiFoodEntry.errorTitle'), t('aiFoodEntry.errorMsg')),
  });

  const photoMutation = useMutation({
    mutationFn: ({ uri, mime }: { uri: string; mime: string }) =>
      aiApi.estimateNutritionFromPhoto(uri, mime),
    onSuccess: estimate => {
      queryClient.setQueryData(['ai-estimate-result', estimate.id], estimate);
      navigation.navigate('AiEstimateReview', { estimateId: estimate.id });
    },
    onError: () => Alert.alert(t('aiFoodEntry.errorTitle'), t('aiFoodEntry.photoErrorMsg')),
  });

  const isLoading = textMutation.isPending || photoMutation.isPending;

  const handleSelectPhoto = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1920,
    });
    if (result.assets && result.assets[0]?.uri) {
      setSelectedPhotoUri(result.assets[0].uri);
      setSelectedMimeType(result.assets[0].type ?? 'image/jpeg');
    }
  };

  const handleAnalyze = () => {
    if (mode === 'text') {
      if (description.trim().length < 3) {
        Alert.alert(t('aiFoodEntry.tooShortTitle'), t('aiFoodEntry.tooShortMsg'));
        return;
      }
      textMutation.mutate(description.trim());
    } else {
      if (!selectedPhotoUri) {
        Alert.alert(t('aiFoodEntry.noPhotoTitle'), t('aiFoodEntry.noPhotoMsg'));
        return;
      }
      photoMutation.mutate({ uri: selectedPhotoUri, mime: selectedMimeType });
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name={I18nManager.isRTL ? "arrow-right" : "arrow-left"} size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('aiFoodEntry.title')}</Text>
          <Text style={styles.headerSub}>{t('aiFoodEntry.subtitle')}</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('AiNutritionHistory')}
          style={styles.backBtn}
        >
          <Icon name="history" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.modeRow}>
          {(['text', 'photo'] as const).map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
              onPress={() => setMode(m)}
            >
              <Icon
                name={m === 'text' ? 'text-box-outline' : 'camera-outline'}
                size={18}
                color={mode === m ? colors.textInverse : colors.textSecondary}
              />
              <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>
                {m === 'text' ? t('aiFoodEntry.tabDescribe') : t('aiFoodEntry.tabScan')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === 'text' ? (
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>{t('aiFoodEntry.whatDidYouEat')}</Text>
            <TextInput
              style={styles.textInput}
              value={description}
              onChangeText={setDescription}
              placeholder={t('aiFoodEntry.describePlaceholder')}
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{description.length}/500</Text>
            <View style={styles.tipRow}>
              <Icon name="lightbulb-outline" size={14} color={colors.primary} />
              <Text style={styles.tipText}>{t('aiFoodEntry.describeTip')}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>{t('aiFoodEntry.foodPhoto')}</Text>
            <TouchableOpacity style={styles.photoArea} onPress={handleSelectPhoto}>
              {selectedPhotoUri ? (
                <>
                  <Icon name="check-circle" size={36} color={colors.success} />
                  <Text style={styles.photoSelected}>{t('aiFoodEntry.photoSelected')}</Text>
                  <Text style={styles.photoChange}>{t('aiFoodEntry.tapToChange')}</Text>
                </>
              ) : (
                <>
                  <Icon name="camera-plus-outline" size={48} color={colors.textTertiary} />
                  <Text style={styles.photoPrompt}>{t('aiFoodEntry.tapToSelect')}</Text>
                  <Text style={styles.photoSub}>{t('aiFoodEntry.photoFormats')}</Text>
                </>
              )}
            </TouchableOpacity>
            <View style={styles.tipRow}>
              <Icon name="lightbulb-outline" size={14} color={colors.primary} />
              <Text style={styles.tipText}>{t('aiFoodEntry.photoTip')}</Text>
            </View>
          </View>
        )}

        <View style={styles.disclaimerCard}>
          <Icon name="information-outline" size={16} color={colors.textTertiary} />
          <Text style={styles.disclaimerText}>{t('aiFoodEntry.disclaimer')}</Text>
        </View>

        <TouchableOpacity
          style={[styles.analyzeBtn, isLoading && styles.analyzeBtnDisabled]}
          onPress={handleAnalyze}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <ActivityIndicator color={colors.textInverse} size="small" />
              <Text style={styles.analyzeBtnText}>
                {mode === 'photo' ? t('aiFoodEntry.analyzingPhoto') : t('aiFoodEntry.estimatingMacros')}
              </Text>
            </>
          ) : (
            <>
              <Icon name="brain" size={20} color={colors.textInverse} />
              <Text style={styles.analyzeBtnText}>{t('aiFoodEntry.estimateBtn')}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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

    scroll: { padding: Spacing.base, gap: Spacing.base },

    modeRow: {
      flexDirection: 'row', gap: Spacing.sm,
      backgroundColor: c.surface, borderRadius: Radius.lg,
      padding: 4, borderWidth: 1, borderColor: c.surfaceBorder,
    },
    modeBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: Spacing.xs, paddingVertical: Spacing.sm, borderRadius: Radius.md,
    },
    modeBtnActive: { backgroundColor: c.primary },
    modeBtnText: { fontSize: Typography.sm, fontWeight: Typography.medium, color: c.textSecondary },
    modeBtnTextActive: { color: c.textInverse },

    inputCard: {
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder, padding: Spacing.base, gap: Spacing.sm,
    },
    inputLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: c.textPrimary },
    textInput: {
      backgroundColor: c.surfaceElevated, borderRadius: Radius.md, borderWidth: 1,
      borderColor: c.surfaceBorder, padding: Spacing.md, color: c.textPrimary,
      fontSize: Typography.base, minHeight: 100,
    },
    charCount: { fontSize: Typography.xs, color: c.textTertiary, textAlign: I18nManager.isRTL ? 'left' : 'right' },

    photoArea: {
      height: 160, backgroundColor: c.surfaceElevated, borderRadius: Radius.lg,
      borderWidth: 2, borderColor: c.surfaceBorder, borderStyle: 'dashed',
      alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    },
    photoSelected: { fontSize: Typography.base, fontWeight: Typography.semibold, color: c.textPrimary },
    photoChange: { fontSize: Typography.xs, color: c.textTertiary },
    photoPrompt: { fontSize: Typography.sm, fontWeight: Typography.medium, color: c.textSecondary },
    photoSub: { fontSize: Typography.xs, color: c.textTertiary },

    tipRow: { flexDirection: 'row', gap: Spacing.xs, alignItems: 'flex-start' },
    tipText: { flex: 1, fontSize: Typography.xs, color: c.textSecondary, lineHeight: 18 },

    disclaimerCard: {
      flexDirection: 'row', gap: Spacing.sm, backgroundColor: c.surfaceElevated,
      borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'flex-start',
    },
    disclaimerText: { flex: 1, fontSize: Typography.xs, color: c.textTertiary, lineHeight: 18 },

    analyzeBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: Spacing.sm, backgroundColor: c.primary, borderRadius: Radius.lg,
      paddingVertical: Spacing.base, marginTop: Spacing.sm,
    },
    analyzeBtnDisabled: { opacity: 0.6 },
    analyzeBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: c.textInverse },
  });
}
