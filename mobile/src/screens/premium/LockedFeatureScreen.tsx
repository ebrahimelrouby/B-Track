import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius } from '@/theme';
import Button from '@/components/common/Button';
import { RootStackParamList } from '@/navigation/types';

type RouteProps = RouteProp<RootStackParamList, 'LockedFeature'>;

export default function LockedFeatureScreen() {
  const navigation = useNavigation<any>();
  const { params } = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const features = [
    t('locked.featUnlimitedPlans'),
    t('locked.featAdvancedAnalytics'),
    t('locked.featAiCoach'),
    t('locked.featAppleWatch'),
    t('locked.featFullHistory'),
  ];

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + Spacing['2xl'] }]}>
      <View style={styles.content}>
        <View style={styles.lockIcon}>
          <Icon name="lock" size={40} color={colors.primary} />
        </View>

        <Text style={styles.title}>{params.title}</Text>
        <Text style={styles.description}>{params.description}</Text>

        <View style={styles.features}>
          {features.map((f) => (
            <View key={f} style={styles.featureRow}>
              <Icon name="check-circle" size={18} color={colors.primary} style={{ marginEnd: Spacing.sm }} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        <Button
          title={t('locked.upgradeBtn')}
          onPress={() => { navigation.goBack(); navigation.navigate('Upgrade'); }}
          fullWidth
          style={styles.upgradeButton}
        />

        <Button
          title={t('locked.notNowBtn')}
          variant="ghost"
          onPress={() => navigation.goBack()}
          fullWidth
        />
      </View>
    </View>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background, justifyContent: 'flex-end' },
    content: { padding: Spacing['2xl'] },
    lockIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: c.primaryDim,
      borderWidth: 2,
      borderColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginBottom: Spacing.xl,
    },
    title: {
      fontSize: Typography['2xl'],
      fontWeight: Typography.bold,
      color: c.textPrimary,
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    description: {
      fontSize: Typography.base,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: Spacing.xl,
    },
    features: { marginBottom: Spacing.xl, gap: Spacing.sm },
    featureRow: { flexDirection: 'row', alignItems: 'center' },
    featureText: { fontSize: Typography.base, color: c.textPrimary },
    upgradeButton: { marginBottom: Spacing.sm },
  });
}
