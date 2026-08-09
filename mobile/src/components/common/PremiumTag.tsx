import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '@/store/auth.store';
import { useColors, Spacing, Typography, Radius } from '@/theme';

export default function PremiumTag() {
  const navigation = useNavigation<any>();
  const { entitlements } = useAuthStore();
  const colors = useColors();
  const isPremium = entitlements?.isPremium;

  if (isPremium) {
    return (
      <View style={[styles.pill, { backgroundColor: colors.primaryDim, borderColor: colors.primary + '66' }]}>
        <Icon name="crown" size={12} color={colors.primary} />
        <Text style={[styles.label, { color: colors.primary }]}>PRO</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.pill, styles.pillUnlocked, { borderColor: colors.surfaceBorder, backgroundColor: colors.surfaceElevated }]}
      onPress={() => navigation.navigate('Upgrade')}
      activeOpacity={0.8}
    >
      <Icon name="crown-outline" size={12} color="#F59E0B" />
      <Text style={[styles.label, { color: '#F59E0B' }]}>Go Pro</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  pillUnlocked: {},
  label: {
    fontSize: 11,
    fontWeight: Typography.bold,
    letterSpacing: 0.3,
  },
});
