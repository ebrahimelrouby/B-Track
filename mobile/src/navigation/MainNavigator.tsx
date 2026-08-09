import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import { MainTabParamList } from './types';
import { useColors, ColorPalette, Spacing, Typography } from '@/theme';
import DashboardScreen  from '@/screens/dashboard/DashboardScreen';
import WorkoutNavigator from './WorkoutNavigator';
import HealthNavigator  from './HealthNavigator';
import NutritionScreen  from '@/screens/nutrition/NutritionScreen';
import ProgressScreen   from '@/screens/progress/ProgressScreen';
import ProfileScreen    from '@/screens/profile/ProfileScreen';

const TAB_ICONS: Record<string, string> = {
  Dashboard: 'view-dashboard',
  Workout:   'dumbbell',
  Nutrition: 'food-apple',
  Health:    'heart-pulse',
  Progress:  'chart-line',
  Profile:   'account-circle',
};

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { t } = useTranslation();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const count  = state.routes.length;

  const TAB_LABELS: Record<string, string> = {
    Dashboard: t('nav.home'),
    Workout:   t('nav.workout'),
    Nutrition: t('nav.nutrition'),
    Health:    t('nav.health'),
    Progress:  t('nav.progress'),
    Profile:   t('nav.profile'),
  };

  const activeRouteName = state.routes[state.index]?.name;
  if (activeRouteName === 'Workout' || activeRouteName === 'Profile') return null;

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom + Spacing.sm }]}>
      <View style={styles.pill}>
        {state.routes.map((route, index) => {
          const isFocused   = state.index === index;
          const iconName    = TAB_ICONS[route.name] ?? 'circle';
          const label       = TAB_LABELS[route.name] ?? route.name;
          const activeColor = colors.primary;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.8}
              style={[styles.tab, count > 5 && styles.tabCompact]}
            >
              {isFocused ? (
                <View style={[styles.activeCircle, { backgroundColor: activeColor }]}>
                  <Icon name={iconName} size={18} color={colors.textInverse} />
                </View>
              ) : (
                <Icon name={iconName} size={20} color={colors.textTertiary} />
              )}
              <Text style={[styles.label, isFocused && { color: activeColor, fontWeight: Typography.semibold }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { position: 'absolute', backgroundColor: 'transparent', borderTopWidth: 0, elevation: 0 },
      }}
      sceneContainerStyle={{ backgroundColor: 'transparent' }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Workout"   component={WorkoutNavigator} />
      <Tab.Screen name="Nutrition" component={NutritionScreen} />
      <Tab.Screen name="Health"    component={HealthNavigator} />
      <Tab.Screen name="Progress"  component={ProgressScreen} />
      <Tab.Screen name="Profile"   component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    wrapper: {
      position: 'absolute',
      left: Spacing.md,
      right: Spacing.md,
      backgroundColor: 'transparent',
    },
    pill: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: 28,
      paddingVertical: 8, paddingHorizontal: 6,
      alignItems: 'center',
      borderWidth: 1, borderColor: c.surfaceBorder,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.35, shadowRadius: 24,
      elevation: 20,
    },
    tab: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      gap: 3, paddingVertical: 4,
    },
    tabCompact: { gap: 2, paddingVertical: 2 },
    activeCircle: {
      width: 38, height: 38, borderRadius: 19,
      alignItems: 'center', justifyContent: 'center',
    },
    label: { fontSize: 9, fontWeight: Typography.medium, color: c.textTertiary },
  });
}
