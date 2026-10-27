import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image, RefreshControl, Animated,
} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { format, subDays, formatDistanceToNow } from 'date-fns';
import { ar as arLocale } from 'date-fns/locale';
import Svg, {
  Circle, Rect, Text as SvgText, G,
  Defs, RadialGradient, Stop, Ellipse,
} from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius, Shadows, TAB_BAR_PADDING } from '@/theme';
import { useAuthStore } from '@/store/auth.store';
import { useLangStore } from '@/store/language.store';
import PremiumTag from '@/components/common/PremiumTag';
import { useActiveWorkoutStore } from '@/store/activeWorkout.store';
import { userApi } from '@/api/user.api';
import { workoutApi } from '@/api/workout.api';
import { nutritionApi, MealEntry } from '@/api/nutrition.api';
import { aiApi } from '@/api/ai.api';
import { DashboardNavigationProp } from '@/navigation/types';
import { WorkoutSession } from '@/types';
import { refreshHomeScreenWidgets } from '@/native/widgets';

// The scan artwork is a fixed image for both tiles, not tinted per theme.
const FOOD_SCAN_ICON = require('@/assets/images/food-scan-icon.png');
const BODY_SCAN_ICON = require('@/assets/images/body-scan-icon.png');

const W = Dimensions.get('window').width;
const today = () => new Date().toISOString().split('T')[0];

// ─── Sub-components ─────────────────────────────────────────────────────────────

function RingChart({ size, strokeWidth, progress, color, bg, children }: {
  size: number; strokeWidth: number; progress: number;
  color: string; bg: string; children?: React.ReactNode;
}) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(Math.max(progress, 0), 1));
  const cx = size / 2;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={cx} cy={cx} r={r} stroke={bg} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={cx} cy={cx} r={r}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={c} strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cx})`}
        />
      </Svg>
      {children}
    </View>
  );
}

function WeekBarChart({ data, maxValue, barColor, goalColor, goal, height, colors }: {
  data: { label: string; value: number }[];
  maxValue: number; barColor: string; goalColor?: string;
  goal?: number; height: number; colors: ColorPalette;
}) {
  const chartW = W - Spacing.base * 4;
  const gap = 6;
  const barW = Math.floor((chartW - gap * (data.length - 1)) / data.length);
  const safeMax = maxValue || 1;

  return (
    <View>
      <Svg width={chartW} height={height}>
        {data.map((d, i) => {
          const barH = Math.max(2, (d.value / safeMax) * (height - 22));
          const x = i * (barW + gap);
          const y = height - 18 - barH;
          const isToday = i === data.length - 1;
          return (
            <G key={i}>
              <Rect
                x={x} y={y} width={barW} height={barH}
                rx={3} fill={d.value > 0 ? (isToday ? barColor : barColor + 'AA') : colors.surfaceElevated}
              />
              <SvgText
                x={x + barW / 2} y={height - 2}
                fontSize={9} fill={isToday ? colors.textPrimary : colors.textTertiary}
                textAnchor="middle" fontWeight={isToday ? 'bold' : 'normal'}
              >
                {d.label}
              </SvgText>
            </G>
          );
        })}
        {goal != null && goalColor && (
          <Rect
            x={0} y={height - 18 - (goal / safeMax) * (height - 22)}
            width={chartW} height={1}
            fill={goalColor + '60'}
          />
        )}
      </Svg>
    </View>
  );
}

function MacroBar({ label, value, target, color, colors }: {
  label: string; value: number; target: number; color: string; colors: ColorPalette;
}) {
  const pct = Math.min(value / Math.max(target, 1), 1);
  const pctText = Math.round(pct * 100);
  return (
    <View style={{ gap: 5 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
          <Text style={{ fontSize: Typography.xs, color: colors.textSecondary, fontWeight: Typography.semibold }}>
            {label}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
          <Text style={{ fontSize: Typography.sm, fontWeight: Typography.bold, color: colors.textPrimary }}>
            {Math.round(value)}
          </Text>
          <Text style={{ fontSize: Typography.xs, color: colors.textTertiary }}>/{target}g</Text>
          <Text style={{ fontSize: 10, color: pct >= 1 ? color : colors.textTertiary, fontWeight: Typography.semibold, marginLeft: 4 }}>
            {pctText}%
          </Text>
        </View>
      </View>
      <View style={{ height: 7, backgroundColor: colors.surfaceElevated, borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ height: 7, width: `${pct * 100}%`, backgroundColor: color, borderRadius: 4 }} />
      </View>
    </View>
  );
}

function SmallRingCard({ icon, title, value, subtitle, progress, color, colors, onPress }: {
  icon: string; title: string; value: string; subtitle: string;
  progress: number; color: string; colors: ColorPalette; onPress?: () => void;
}) {
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  return (
    <TouchableOpacity style={styles.miniCard} onPress={onPress} activeOpacity={0.75}>
      <RingChart size={64} strokeWidth={7} progress={progress} color={color} bg={colors.surfaceElevated}>
        <Icon name={icon} size={20} color={color} />
      </RingChart>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.miniCardTitle}>{title}</Text>
        <Text style={styles.miniCardValue}>{value}</Text>
        <Text style={styles.miniCardSub}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Sleep palette (inspired by AutoSleep aesthetic) ─────────────────────────────
const SLEEP_COLOR   = '#8B5CF6';   // vivid violet
const SLEEP_OUTER   = '#7C3AED';   // deeper purple (outer ring)
const SLEEP_LAVEND  = '#C4B5FD';   // soft lavender (inner ring)
const SLEEP_DIM     = '#4C1D9520'; // very dark purple bg

// Dual-ring sleep component matching the AutoSleep ring design
function SleepRing({ size, hoursSlept, hoursGoal }: { size: number; hoursSlept: number; hoursGoal: number }) {
  const { t } = useTranslation();
  const sw    = 9;
  const swIn  = 5;
  const r     = (size - sw) / 2;
  const rIn   = r - sw / 2 - swIn / 2 - 2;
  const c     = 2 * Math.PI * r;
  const cIn   = 2 * Math.PI * rIn;
  const prog  = Math.min(hoursSlept / hoursGoal, 1);
  const off   = c   * (1 - prog);
  const offIn = cIn * (1 - prog);
  const cx    = size / 2;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {/* Outer track */}
        <Circle cx={cx} cy={cx} r={r}   stroke={SLEEP_OUTER + '30'} strokeWidth={sw}   fill="none" />
        {/* Outer fill */}
        <Circle cx={cx} cy={cx} r={r}   stroke={SLEEP_OUTER}        strokeWidth={sw}   fill="none"
          strokeDasharray={c}   strokeDashoffset={off}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cx})`} />
        {/* Inner track */}
        <Circle cx={cx} cy={cx} r={rIn} stroke={SLEEP_LAVEND + '25'} strokeWidth={swIn} fill="none" />
        {/* Inner fill */}
        <Circle cx={cx} cy={cx} r={rIn} stroke={SLEEP_LAVEND}        strokeWidth={swIn} fill="none"
          strokeDasharray={cIn} strokeDashoffset={offIn}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cx})`} />
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 12, fontWeight: Typography.extrabold, color: '#FFFFFF', lineHeight: 14 }}>
          {hoursSlept}
        </Text>
        <Text style={{ fontSize: 7, color: SLEEP_LAVEND, lineHeight: 9 }}>{t('dashboard.hrsLabel')}</Text>
      </View>
    </View>
  );
}

// ─── AI scan hero badge — simple glyph in a ringed circle ─────────────────────────
function HeroIconBadge({ icon, accent, size = 72 }: { icon: string; accent: string; size?: number }) {
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: accent + '1F', borderWidth: 1.5, borderColor: accent + '55',
      }}
    >
      <View
        style={{
          width: size * 0.72, height: size * 0.72, borderRadius: (size * 0.72) / 2,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: accent + '22',
        }}
      >
        <Icon name={icon} size={size * 0.42} color={accent} />
      </View>
    </View>
  );
}

// ─── Ambient glow behind hero icons ────────────────────────────────────────────────
// The custom artwork (food-scan-icon.png / body-scan-icon.png) already bakes in its
// own corner brackets and viewfinder ring, so this just adds a soft ambient wash —
// percentage-based (not a fixed viewBox) so it always matches the card's actual size
// instead of assuming a fixed aspect ratio.
function ScanFrame({ accent }: { accent: string }) {
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
      <Defs>
        <RadialGradient id="scanFrameGlow" cx="50%" cy="42%" r="65%">
          <Stop offset="0%" stopColor={accent} stopOpacity={0.18} />
          <Stop offset="100%" stopColor={accent} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#scanFrameGlow)" />
      <Ellipse cx="30%" cy="14%" rx="45%" ry="18%" fill="#FFFFFF" opacity={0.035} />
      <Circle cx="88%" cy="20%" r={1.4} fill={accent} opacity={0.55} />
      <Circle cx="10%" cy="78%" r={1} fill={accent} opacity={0.35} />
    </Svg>
  );
}

// Subtle press-in scale + haptic tick, shared by both AI scan cards so they
// feel tactile instead of a flat opacity fade.
function ScanCardPress({
  onPress, style, children,
}: { onPress: () => void; style?: object; children: React.ReactNode }) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  };
  const handlePress = () => {
    ReactNativeHapticFeedback.trigger('impactLight');
    onPress();
  };

  return (
    // Shadow lives on this (non-clipping) wrapper — aiGridCard itself needs
    // overflow:hidden to clip the hero art to its rounded corners, and on iOS
    // overflow:hidden silently clips shadows on the same view to nothing.
    <Animated.View style={[{ flex: 1, transform: [{ scale }] }, Shadows.sm]}>
      <TouchableOpacity
        style={style}
        activeOpacity={0.85}
        onPress={handlePress}
        onPressIn={pressIn}
        onPressOut={pressOut}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

// Small looping opacity/scale pulse — makes the "LIVE AI" dot actually read
// as live instead of a static colored circle.
function PulsingDot({ color }: { color: string }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });

  return (
    <View style={{ width: 6, height: 6, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute', width: 6, height: 6, borderRadius: 3,
          backgroundColor: color, transform: [{ scale }], opacity,
        }}
      />
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
    </View>
  );
}

// ─── Meal config ─────────────────────────────────────────────────────────────────
const MEAL_CONFIG = {
  breakfast: { icon: 'weather-sunset-up' },
  lunch:     { icon: 'white-balance-sunny' },
  dinner:    { icon: 'weather-night'       },
  snack:     { icon: 'food-apple-outline'  },
} as const;
type MealType = keyof typeof MEAL_CONFIG;

// ─── Main Screen ─────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<DashboardNavigationProp>();
  const insets = useSafeAreaInsets();
  const { user, entitlements } = useAuthStore();
  const { isWorkoutActive, activeWorkout } = useActiveWorkoutStore();
  const { lang } = useLangStore();
  const colors = useColors();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [localAvatar, setLocalAvatar] = useState<string | null>(null);

  const { data: profileData, refetch: refetchProfile } = useQuery({ queryKey: ['me'], queryFn: userApi.getMe });
  const profile = profileData?.profile;

  const { data: plans, refetch: refetchPlans } = useQuery({ queryKey: ['workout-plans'], queryFn: workoutApi.getPlans });

  const { data: diary = [], refetch: refetchDiary } = useQuery({
    queryKey: ['diary-today'],
    queryFn: () => nutritionApi.getDiaryForDate(today()),
  });

  const { data: waterMl = 0, refetch: refetchWater } = useQuery({
    queryKey: ['water-today'],
    queryFn: () => nutritionApi.getWater(today()),
  });

  const { data: historyData, refetch: refetchHistory } = useQuery({
    queryKey: ['workout-history-dash'],
    queryFn: () => workoutApi.getHistory(0, 50),
  });

  const { data: lastNutritionPage, refetch: refetchLastNutrition } = useQuery({
    queryKey: ['ai-nutrition-last'],
    queryFn: () => aiApi.getNutritionHistory(0, 1),
  });
  const { data: lastBodyFatPage, refetch: refetchLastBodyFat } = useQuery({
    queryKey: ['ai-bodyfat-last'],
    queryFn: () => aiApi.getBodyFatHistory(0, 1),
  });
  const lastNutrition = lastNutritionPage?.content?.[0];
  const lastBodyFat = lastBodyFatPage?.content?.[0];

  const relTime = useCallback((iso?: string) => {
    if (!iso) return '';
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: lang === 'ar' ? arLocale : undefined });
  }, [lang]);

  const [refreshing, setRefreshing] = useState(false);
  const refetchAll = useCallback(async () => {
    await Promise.all([
      refetchProfile(), refetchPlans(), refetchDiary(), refetchWater(),
      refetchHistory(), refetchLastNutrition(), refetchLastBodyFat(),
    ]);
  }, [refetchProfile, refetchPlans, refetchDiary, refetchWater, refetchHistory, refetchLastNutrition, refetchLastBodyFat]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchAll();
    } finally {
      setRefreshing(false);
    }
  }, [refetchAll]);

  useFocusEffect(useCallback(() => {
    refetchDiary();
    refetchWater();
  }, [refetchDiary, refetchWater]));

  // ── Targets ──────────────────────────────────────────────────────────────────
  const targets = {
    calories: profile?.targetCalories ?? 2200,
    protein:  profile?.targetProteinG  ?? 165,
    carbs:    profile?.targetCarbsG    ?? 220,
    fat:      profile?.targetFatsG     ?? 70,
    water:    profile?.targetWaterMl   ?? 2500,
    steps:    profile?.targetSteps     ?? 10000,
  };

  // ── Today's totals from diary ─────────────────────────────────────────────────
  const todayTotals = useMemo(() => diary.reduce(
    (acc: { cal: number; protein: number; carbs: number; fat: number }, e: MealEntry) => ({
      cal:     acc.cal     + e.food.calories * e.servings,
      protein: acc.protein + e.food.proteinG * e.servings,
      carbs:   acc.carbs   + e.food.carbsG   * e.servings,
      fat:     acc.fat     + e.food.fatG     * e.servings,
    }),
    { cal: 0, protein: 0, carbs: 0, fat: 0 },
  ), [diary]);

  // ── Meal breakdown by type ────────────────────────────────────────────────────
  const mealGroups = useMemo(() => {
    const calories: Record<MealType, number> = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
    const counts:   Record<MealType, number> = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
    diary.forEach((e: MealEntry) => {
      calories[e.meal] += e.food.calories * e.servings;
      counts[e.meal]++;
    });
    return { calories, counts };
  }, [diary]);

  // ── Calorie ring color (green below 85%, warning 85–100%, error over) ─────────
  const calorieProgress  = todayTotals.cal / targets.calories;
  const ringColor        = calorieProgress > 1 ? colors.error
                         : calorieProgress > 0.85 ? colors.warning
                         : colors.success;
  const calorieRemaining = targets.calories - Math.round(todayTotals.cal);
  const isOver           = calorieRemaining < 0;

  const steps = { today: 6200, target: targets.steps }; // replace with steps API when available

  // ── Push today's stats to the home screen widget (Android RemoteViews / iOS WidgetKit) ──
  useEffect(() => {
    refreshHomeScreenWidgets(
      {
        signedIn: true,
        caloriesConsumed: Math.round(todayTotals.cal),
        caloriesTarget: targets.calories,
        waterMl,
        waterTargetMl: targets.water,
        stepsToday: steps.today,
        stepsTarget: steps.target,
        sleepHours: 7.5,
        sleepTargetHours: 8,
      },
      colors.primary,
    );
  }, [todayTotals.cal, targets.calories, waterMl, targets.water, steps.today, steps.target, colors.primary]);

  // ── Weekly workout data from history ─────────────────────────────────────────
  const sessions: WorkoutSession[] = historyData?.content ?? [];
  const weekWorkoutData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = i === 6 ? t('dashboard.todayBarLabel') : format(d, 'EEE').slice(0, 1);
      const daySessions = sessions.filter(s => s.startedAt?.split('T')[0] === dateStr);
      const duration = daySessions.reduce((acc, s) => acc + (s.durationSeconds ?? 0) / 60, 0);
      return { label: dayLabel, value: Math.round(duration), sessions: daySessions.length };
    });
  }, [sessions]);
  const maxWorkoutMin = Math.max(...weekWorkoutData.map(d => d.value), 60);

  // ── Weekly calorie data (mock per-day, replace with aggregate API) ────────────
  const weekCalorieData = useMemo(() => {
    const baseValues = [2050, 1820, 2300, 1950, 2100, 1700, todayTotals.cal];
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dayLabel = i === 6 ? t('dashboard.todayBarLabel') : format(d, 'EEE').slice(0, 1);
      return { label: dayLabel, value: Math.round(baseValues[i]) };
    });
  }, [todayTotals.cal]);
  const maxCalDay = Math.max(...weekCalorieData.map(d => d.value), targets.calories);

  // ── Weekly session count summary ──────────────────────────────────────────────
  const weekSessionCount = weekWorkoutData.reduce((a, d) => a + d.sessions, 0);
  const totalVolume = sessions.slice(0, 7).reduce((a, s) => a + (s.totalVolumeKg ?? 0), 0);

  const getMealLabel = (meal: MealType): string => ({
    breakfast: t('dashboard.mealBreakfast'),
    lunch:     t('dashboard.mealLunch'),
    dinner:    t('dashboard.mealDinner'),
    snack:     t('dashboard.mealSnack'),
  }[meal]);

  const h = new Date().getHours();
  const greeting = h < 12 ? t('dashboard.goodMorning') : h < 17 ? t('dashboard.goodAfternoon') : t('dashboard.goodEvening');
  const todayLabel = format(new Date(), 'EEEE, MMM d');

  const avatarUri = localAvatar ?? profile?.avatarUrl ?? null;
  const initials = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .map(n => n![0].toUpperCase())
    .join('');

  const handlePickAvatar = useCallback(() => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8, selectionLimit: 1 }, (res) => {
      if (res.didCancel || res.errorCode) return;
      const uri = res.assets?.[0]?.uri;
      if (uri) {
        setLocalAvatar(uri);
        userApi.updateProfile({ avatarUrl: uri }).then(() => refetchProfile());
      }
    });
  }, [refetchProfile]);

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top }]}
      contentContainerStyle={[styles.scroll, { paddingBottom: TAB_BAR_PADDING }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.headerCard}>
        {/* Row 1: logo + actions */}
        <View style={styles.headerTopRow}>
          {/* Logo mark + app name */}
          <View style={styles.headerLogo}>
            <View style={[styles.headerLogoMark, { backgroundColor: colors.primary }]}>
              <Icon name="lightning-bolt" size={15} color="#000" />
            </View>
            <Text style={styles.headerAppName}>B-Track</Text>
          </View>

          {/* Actions: premium tag + bell + avatar */}
          <View style={styles.headerRight}>
            <PremiumTag />
            <TouchableOpacity
              style={[styles.notifBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Icon name="bell-outline" size={18} color={colors.textSecondary} />
              <View style={[styles.notifBadge, { backgroundColor: colors.primary, borderColor: colors.surface }]}>
                <Text style={styles.notifBadgeText}>2</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.avatarWrap} onPress={() => navigation.navigate('Profile')} activeOpacity={0.8}>
              <View style={[styles.avatarRing, { borderColor: colors.primary + '70' }]}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
                ) : (
                  <View style={[styles.avatarImg, styles.avatarFallback, { backgroundColor: colors.primaryDim }]}>
                    <Text style={[styles.avatarInitialsText, { color: colors.primary }]}>
                      {initials || '?'}
                    </Text>
                  </View>
                )}
              </View>
              {entitlements?.isPremium && (
                <View style={[styles.avatarProBadge, { backgroundColor: '#F59E0B', borderColor: colors.surface }]}>
                  <Icon name="crown" size={7} color="#000" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Row 2: greeting + name */}
        <View style={styles.headerGreetingRow}>
          <Text style={styles.headerGreeting}>{greeting},</Text>
          <Text style={styles.headerName} numberOfLines={1}>
            {user?.firstName ?? 'Athlete'} 👋
          </Text>
        </View>

      </View>

      {/* ── Active Workout Banner ──────────────────────────────────────────── */}
      {isWorkoutActive && activeWorkout && (
        <TouchableOpacity
          style={styles.activeBanner}
          onPress={() => navigation.navigate('Workout')}
          activeOpacity={0.85}
        >
          <View style={styles.activePulse}>
            <Icon name="dumbbell" size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.activeBannerTitle}>{t('dashboard.workoutInProgress')}</Text>
            <Text style={styles.activeBannerName}>{activeWorkout.name}</Text>
          </View>
          <Icon name="chevron-right" size={20} color={colors.primary} />
        </TouchableOpacity>
      )}

      {/* ── Today at a Glance ─────────────────────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="view-dashboard-outline" size={16} color={colors.primary} />
          <Text style={styles.cardTitle}>{t('dashboard.todayAtAGlance')}</Text>
          <Text style={styles.summaryDateText}>{format(new Date(), 'EEE, MMM d')}</Text>
        </View>

        {/* Row 1 — 3 progress rings */}
        <View style={styles.summaryRingRow}>
          {/* Calories */}
          <View style={styles.summaryRingCell}>
            <RingChart size={80} strokeWidth={9} progress={calorieProgress} color={ringColor} bg={colors.surfaceElevated}>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.sRingVal}>
                  {todayTotals.cal >= 1000
                    ? `${(todayTotals.cal / 1000).toFixed(1)}k`
                    : Math.round(todayTotals.cal).toString()}
                </Text>
                <Text style={styles.sRingUnit}>kcal</Text>
              </View>
            </RingChart>
            <View style={styles.sRingMeta}>
              <Icon name="fire" size={11} color={ringColor} />
              <Text style={styles.sRingLabel}>{t('dashboard.calories')}</Text>
            </View>
            <Text style={[styles.sRingPct, { color: ringColor }]}>{Math.round(calorieProgress * 100)}%</Text>
          </View>

          <View style={styles.summaryRingDivider} />

          {/* Steps */}
          <View style={styles.summaryRingCell}>
            <RingChart size={80} strokeWidth={9} progress={steps.today / steps.target} color={colors.success} bg={colors.surfaceElevated}>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.sRingVal}>
                  {steps.today >= 1000
                    ? `${(steps.today / 1000).toFixed(1)}k`
                    : steps.today.toString()}
                </Text>
                <Text style={styles.sRingUnit}>{t('dashboard.stepsSuffix')}</Text>
              </View>
            </RingChart>
            <View style={styles.sRingMeta}>
              <Icon name="shoe-sneaker" size={11} color={colors.success} />
              <Text style={styles.sRingLabel}>{t('dashboard.steps')}</Text>
            </View>
            <Text style={[styles.sRingPct, { color: colors.success }]}>
              {Math.round((steps.today / steps.target) * 100)}%
            </Text>
          </View>

          <View style={styles.summaryRingDivider} />

          {/* Sleep (mocked until Sleep API is added) */}
          <View style={styles.summaryRingCell}>
            <SleepRing size={80} hoursSlept={7.5} hoursGoal={8} />
            <View style={styles.sRingMeta}>
              <Icon name="sleep" size={11} color={SLEEP_COLOR} />
              <Text style={styles.sRingLabel}>{t('dashboard.sleepLabel')}</Text>
            </View>
            <Text style={[styles.sRingPct, { color: SLEEP_COLOR }]}>94%</Text>
          </View>
        </View>

        {/* Row 2 — Water + Workout side by side */}
        <View style={styles.summaryBottomRow}>
          {/* Water */}
          <TouchableOpacity
            style={styles.summaryHalfCard}
            onPress={() => navigation.navigate('Nutrition')}
            activeOpacity={0.75}
          >
            <View style={styles.summaryHalfHeader}>
              <View style={[styles.summaryHalfIcon, { backgroundColor: colors.info + '20' }]}>
                <Icon name="water" size={13} color={colors.info} />
              </View>
              <Text style={styles.summaryBarLabel}>{t('dashboard.water')}</Text>
              <Text style={[styles.summaryBarValue, { color: colors.info }]}>
                {(waterMl / 1000).toFixed(1)}
                <Text style={styles.summaryBarUnit}> / {(targets.water / 1000).toFixed(0)}L</Text>
              </Text>
            </View>
            <View style={styles.summaryProgressBg}>
              <View style={[styles.summaryProgressFill, {
                width: `${Math.min((waterMl / targets.water) * 100, 100)}%`,
                backgroundColor: colors.info,
              }]} />
            </View>
          </TouchableOpacity>

          {/* Workout */}
          <TouchableOpacity
            style={styles.summaryHalfCard}
            onPress={() => navigation.navigate('Workout')}
            activeOpacity={0.75}
          >
            <View style={styles.summaryHalfHeader}>
              <View style={[styles.summaryHalfIcon, { backgroundColor: colors.primaryDim }]}>
                <Icon name="dumbbell" size={13} color={colors.primary} />
              </View>
              <Text style={styles.summaryBarLabel}>{t('dashboard.workoutLabel')}</Text>
              {weekWorkoutData[6].sessions > 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Icon name="check-circle" size={12} color={colors.success} />
                  <Text style={[styles.summaryBarValue, { color: colors.success }]}>
                    {weekWorkoutData[6].value}m
                  </Text>
                </View>
              ) : (
                <Text style={[styles.summaryBarValue, { color: colors.textTertiary }]}>{t('dashboard.restDay')}</Text>
              )}
            </View>
            {/* 7-day streak mini-dots */}
            <View style={styles.summaryStreakRow}>
              {weekWorkoutData.map((d, i) => (
                <View
                  key={i}
                  style={[
                    styles.summaryStreakDot,
                    {
                      backgroundColor: d.sessions > 0 ? colors.primary : colors.surfaceElevated,
                      opacity: i === 6 ? 1 : d.sessions > 0 ? 0.8 : 0.4,
                    },
                  ]}
                />
              ))}
            </View>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: colors.surfaceBorder }} />

        {/* Mini workout bar chart */}
        <View style={{ gap: Spacing.sm }}>
          <Text style={styles.summaryChartTitle}>{t('dashboard.workoutThisWeek')}</Text>
          <View style={styles.summaryMiniChart}>
            {weekWorkoutData.map((d, i) => {
              const isToday = i === 6;
              const maxH = 44;
              const barH = d.value > 0 ? Math.max(5, Math.round((d.value / maxWorkoutMin) * maxH)) : 3;
              return (
                <View key={i} style={styles.summaryMiniBarCol}>
                  <View style={[styles.summaryMiniBar, {
                    height: barH,
                    backgroundColor: d.value > 0
                      ? (isToday ? colors.primary : colors.primary + 'AA')
                      : colors.surfaceElevated,
                  }]} />
                  <Text style={[
                    styles.summaryMiniBarLabel,
                    isToday && { color: colors.primary, fontWeight: Typography.bold },
                  ]}>
                    {d.label.slice(0, 1)}
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={styles.summaryStatsRow}>
            <View style={styles.summaryStat}>
              <Icon name="dumbbell" size={10} color={colors.primary} />
              <Text style={styles.summaryStatText}>{t('dashboard.sessionCount', { n: weekSessionCount })}</Text>
            </View>
            <View style={styles.summaryStat}>
              <Icon name="calendar-check" size={10} color={colors.success} />
              <Text style={styles.summaryStatText}>{t('dashboard.activeDays', { n: weekWorkoutData.filter(d => d.value > 0).length })}</Text>
            </View>
            <View style={styles.summaryStat}>
              <Icon name="weight" size={10} color={colors.warning} />
              <Text style={styles.summaryStatText}>
                {totalVolume > 0 ? t('dashboard.volumeKg', { n: (totalVolume / 1000).toFixed(1) }) : t('dashboard.noVolume')}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── AI Scan Cards ─────────────────────────────────────────────────── */}
      <View style={styles.aiSectionWrap}>
        <View style={styles.aiSectionHeader}>
          <View style={styles.aiSectionTitleRow}>
            <View style={[styles.aiSectionIconBox, { backgroundColor: colors.primaryDim }]}>
              <Icon name="atom" size={14} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.aiSectionTitle}>{t('dashboard.aiAnalysis')}</Text>
              <Text style={styles.aiSectionSub}>{t('dashboard.instantResults')}</Text>
            </View>
          </View>
          <View style={[styles.aiSectionBadge, { backgroundColor: colors.primaryDim, borderColor: colors.primary + '40' }]}>
            <PulsingDot color={colors.primary} />
            <Text style={[styles.aiSectionBadgeText, { color: colors.primary }]}>{t('dashboard.liveAI')}</Text>
          </View>
        </View>

        <View style={styles.aiGridRow}>
          {/* ── Food Scan tile ─────────────────────────────────────── */}
          <ScanCardPress
            style={[styles.aiGridCard, { borderColor: colors.primary + '35' }]}
            onPress={() => navigation.navigate('AiStack', { screen: 'AiFoodEntry' })}
          >
            <View style={[styles.aiGridHero, { backgroundColor: colors.primaryDim, overflow: 'hidden' }]}>
              <ScanFrame accent="#00E5FF" />
              <Image source={FOOD_SCAN_ICON} style={styles.aiGridHeroIcon} resizeMode="contain" />
              <View style={[styles.aiGridTopBadge, { backgroundColor: colors.primaryDim, borderColor: colors.primary + '50' }]}>
                <Icon name="camera-outline" size={8} color={colors.primary} />
                <Text style={[styles.aiGridTopBadgeText, { color: colors.primary }]}>{t('dashboard.photo')}</Text>
              </View>
            </View>
            <View style={styles.aiGridBody}>
              <Text style={styles.aiGridTitle} numberOfLines={1}>{t('dashboard.calorieScan')}</Text>
              <View style={styles.aiGridStats}>
                <View style={[styles.aiGridStat, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '35' }]}>
                  <Icon name="lightning-bolt" size={7} color={colors.primary} />
                  <Text style={[styles.aiGridStatText, { color: colors.primary }]} numberOfLines={1}>{t('dashboard.lessThan5sec')}</Text>
                </View>
                <View style={[styles.aiGridStat, { backgroundColor: colors.primary + '0C', borderColor: colors.primary + '20' }]}>
                  <Icon name="food-apple" size={7} color={colors.primary + '88'} />
                  <Text style={[styles.aiGridStatText, { color: colors.primary + '88' }]} numberOfLines={1}>{t('dashboard.calMacros')}</Text>
                </View>
              </View>
            </View>
            <View style={[styles.aiGridCta, { borderTopColor: colors.primary + '20', backgroundColor: colors.primary + '0C' }]}>
              <Text style={[styles.aiGridCtaText, { color: colors.primary }]}>{t('dashboard.scanMeal')}</Text>
              <View style={[styles.aiGridCtaArrow, { backgroundColor: colors.primary + '25' }]}>
                <Icon name="arrow-right" size={11} color={colors.primary} />
              </View>
            </View>
          </ScanCardPress>

          {/* ── Body Scan tile ─────────────────────────────────────── */}
          <ScanCardPress
            style={[styles.aiGridCard, { borderColor: colors.primary + '35' }]}
            onPress={() => navigation.navigate('AiStack', { screen: 'AiBodyFatConsent' })}
          >
            <View style={[styles.aiGridHero, { backgroundColor: colors.primaryDim, overflow: 'hidden' }]}>
              <ScanFrame accent="#00E5FF" />
              <Image source={BODY_SCAN_ICON} style={styles.aiGridHeroIcon} resizeMode="contain" />
              <View style={[styles.aiGridTopBadge, { backgroundColor: colors.primaryDim, borderColor: colors.primary + '50' }]}>
                <Icon name="human-male-board" size={8} color={colors.primary} />
                <Text style={[styles.aiGridTopBadgeText, { color: colors.primary }]}>{t('dashboard.scan')}</Text>
              </View>
            </View>
            <View style={styles.aiGridBody}>
              <Text style={styles.aiGridTitle} numberOfLines={1}>{t('dashboard.bodyFatScan')}</Text>
              <View style={styles.aiGridStats}>
                <View style={[styles.aiGridStat, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '35' }]}>
                  <Icon name="shield-check-outline" size={7} color={colors.primary} />
                  <Text style={[styles.aiGridStatText, { color: colors.primary }]} numberOfLines={1}>{t('dashboard.private')}</Text>
                </View>
                <View style={[styles.aiGridStat, { backgroundColor: colors.primary + '0C', borderColor: colors.primary + '20' }]}>
                  <Icon name="chart-donut" size={7} color={colors.primary + '88'} />
                  <Text style={[styles.aiGridStatText, { color: colors.primary + '88' }]} numberOfLines={1}>{t('dashboard.visual3D')}</Text>
                </View>
              </View>
            </View>
            <View style={[styles.aiGridCta, { borderTopColor: colors.primary + '20', backgroundColor: colors.primaryDim }]}>
              <Text style={[styles.aiGridCtaText, { color: colors.primary }]}>{t('dashboard.scanBody')}</Text>
              <View style={[styles.aiGridCtaArrow, { backgroundColor: colors.primary + '25' }]}>
                <Icon name="arrow-right" size={11} color={colors.primary} />
              </View>
            </View>
          </ScanCardPress>
        </View>

        {/* ── Last-result insight strip ─────────────────────────────── */}
        <View style={styles.aiInsightRow}>
          <TouchableOpacity
            style={[
              styles.aiInsightPill,
              lastNutrition && { backgroundColor: '#FB923C14', borderColor: '#FB923C40' },
            ]}
            activeOpacity={0.75}
            onPress={() =>
              lastNutrition
                ? navigation.navigate('AiStack', { screen: 'AiNutritionHistory' })
                : navigation.navigate('AiStack', { screen: 'AiFoodEntry' })
            }
          >
            <Icon
              name="food-apple-outline"
              size={12}
              color={lastNutrition ? '#FB923C' : colors.textTertiary}
            />
            <Text
              style={[styles.aiInsightPillText, lastNutrition && { color: '#FB923C', fontWeight: Typography.semibold }]}
              numberOfLines={1}
            >
              {lastNutrition
                ? t('dashboard.lastFoodScan', {
                    cal: Math.round(lastNutrition.confirmedCalories ?? lastNutrition.estimatedCalories ?? 0),
                    time: relTime(lastNutrition.createdAt),
                  })
                : t('dashboard.noFoodScanYet')}
            </Text>
            <Icon name="chevron-right" size={12} color={lastNutrition ? '#FB923C' : colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.aiInsightPill,
              lastBodyFat && { backgroundColor: colors.primaryDim, borderColor: colors.primary + '40' },
            ]}
            activeOpacity={0.75}
            onPress={() =>
              lastBodyFat
                ? navigation.navigate('AiStack', { screen: 'AiBodyFatHistory' })
                : navigation.navigate('AiStack', { screen: 'AiBodyFatConsent' })
            }
          >
            <Icon
              name="human-male-board"
              size={12}
              color={lastBodyFat ? colors.primary : colors.textTertiary}
            />
            <Text
              style={[styles.aiInsightPillText, lastBodyFat && { color: colors.primary, fontWeight: Typography.semibold }]}
              numberOfLines={1}
            >
              {lastBodyFat
                ? t('dashboard.lastBodyScan', {
                    min: lastBodyFat.minBodyFatPct,
                    max: lastBodyFat.maxBodyFatPct,
                    time: relTime(lastBodyFat.createdAt),
                  })
                : t('dashboard.noBodyScanYet')}
            </Text>
            <Icon name="chevron-right" size={12} color={lastBodyFat ? colors.primary : colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Compact Calories / Nutrition Card ─────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="fire" size={16} color={ringColor} />
          <Text style={styles.cardTitle}>{t('dashboard.nutritionTitle')}</Text>
          <View style={[styles.calPctChip, { backgroundColor: ringColor + '20', borderColor: ringColor + '50' }]}>
            <Text style={[styles.calPctChipText, { color: ringColor }]}>
              {Math.round(calorieProgress * 100)}%
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Nutrition')} style={styles.seeAllBtn}>
            <Text style={styles.seeAllText}>{t('dashboard.logFood')}</Text>
            <Icon name="chevron-right" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.compactCalRow}>
          <RingChart size={96} strokeWidth={11} progress={calorieProgress} color={ringColor} bg={colors.surfaceElevated}>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.compactRingNum}>{Math.round(todayTotals.cal)}</Text>
              <Text style={styles.compactRingLabel}>kcal</Text>
            </View>
          </RingChart>

          <View style={styles.compactCalSide}>
            <View style={styles.compactCalStats}>
              <View>
                <Text style={styles.compactMetaLabel}>{isOver ? t('dashboard.overBy') : t('dashboard.remaining')}</Text>
                <Text style={[styles.compactMetaVal, { color: isOver ? colors.error : colors.success }]}>
                  {Math.abs(calorieRemaining).toLocaleString()}
                </Text>
                <Text style={styles.compactMetaUnit}>kcal</Text>
              </View>
              <View style={[styles.compactMetaDivider, { backgroundColor: colors.surfaceBorder }]} />
              <View>
                <Text style={styles.compactMetaLabel}>{t('dashboard.goal')}</Text>
                <Text style={styles.compactMetaVal}>{targets.calories.toLocaleString()}</Text>
                <Text style={styles.compactMetaUnit}>kcal</Text>
              </View>
            </View>

            <View style={styles.compactMacros}>
              {([
                { label: t('dashboard.protein'), val: todayTotals.protein, tgt: targets.protein, color: colors.info },
                { label: t('dashboard.carbs'),   val: todayTotals.carbs,   tgt: targets.carbs,   color: colors.warning },
                { label: t('dashboard.fat'),     val: todayTotals.fat,      tgt: targets.fat,     color: colors.success },
              ]).map(m => (
                <View key={m.label} style={styles.compactMacroRow}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                    <Text style={{ fontSize: 10, color: m.color, fontWeight: Typography.semibold }}>{m.label}</Text>
                    <Text style={{ fontSize: 10, color: colors.textTertiary }}>
                      {Math.round(m.val)}<Text style={{ fontSize: 9 }}>/{m.tgt}g</Text>
                    </Text>
                  </View>
                  <View style={{ height: 5, backgroundColor: colors.surfaceElevated, borderRadius: 3 }}>
                    <View style={{
                      height: 5, borderRadius: 3,
                      width: `${Math.min((m.val / m.tgt) * 100, 100)}%`,
                      backgroundColor: m.color,
                    }} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Meal pills */}
        <View style={styles.mealPillsSection}>
          <Text style={styles.mealSectionTitle}>{t('dashboard.meals')}</Text>
          <View style={styles.mealPillsRow}>
            {(Object.keys(MEAL_CONFIG) as MealType[]).map((meal) => {
              const cal   = mealGroups.calories[meal];
              const count = mealGroups.counts[meal];
              const cfg   = MEAL_CONFIG[meal];
              return (
                <TouchableOpacity
                  key={meal}
                  style={[
                    styles.mealPill,
                    count > 0 && { borderColor: colors.primary + '60', backgroundColor: colors.primaryDim },
                  ]}
                  onPress={() => navigation.navigate('Nutrition')}
                  activeOpacity={0.7}
                >
                  <Icon name={cfg.icon} size={14} color={count > 0 ? colors.primary : colors.textTertiary} />
                  {count > 0 ? (
                    <>
                      <Text style={[styles.mealPillVal, { color: colors.textPrimary }]}>{Math.round(cal)}</Text>
                      <Text style={styles.mealPillUnit}>kcal</Text>
                    </>
                  ) : (
                    <Text style={styles.mealPillEmpty}>{getMealLabel(meal).slice(0, 3)}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* ── Weekly Nutrition Chart ─────────────────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="chart-bar" size={16} color={colors.primary} />
          <Text style={styles.cardTitle}>{t('dashboard.calorieTrend')}</Text>
        </View>
        <View style={styles.chartLegendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>{t('dashboard.dailyIntake')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: colors.textTertiary }]} />
            <Text style={styles.legendText}>{t('dashboard.goalKcal', { n: targets.calories })}</Text>
          </View>
        </View>
        <WeekBarChart
          data={weekCalorieData}
          maxValue={maxCalDay}
          barColor={colors.primary}
          goalColor={colors.textSecondary}
          goal={targets.calories}
          height={110}
          colors={colors}
        />
        <View style={styles.chartStats}>
          <ChartStat
            label={t('dashboard.sevenDayAvg')}
            value={`${Math.round(weekCalorieData.slice(0, 6).reduce((a, d) => a + d.value, 0) / 6)} kcal`}
            colors={colors}
          />
          <ChartStat
            label={t('dashboard.bestDay')}
            value={`${Math.max(...weekCalorieData.map(d => d.value))} kcal`}
            colors={colors}
          />
          <ChartStat
            label={t('dashboard.onTarget')}
            value={`${weekCalorieData.filter(d => d.value > 0 && Math.abs(d.value - targets.calories) < 200).length}/7`}
            colors={colors}
          />
        </View>
      </View>

      {/* ── Today's Workout ───────────────────────────────────────────────── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('dashboard.todaysWorkout')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Workout')} style={styles.seeAllBtn}>
          <Text style={styles.seeAllText}>{t('dashboard.allPlans')}</Text>
          <Icon name="chevron-right" size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {plans && plans.length > 0 ? (
        <TouchableOpacity
          style={styles.workoutCard}
          onPress={() => navigation.navigate('Workout')}
          activeOpacity={0.8}
        >
          <View style={styles.workoutCardIcon}>
            <Icon name="dumbbell" size={26} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.workoutCardName}>{plans[0].name}</Text>
            <Text style={styles.workoutCardMeta}>
              {t('dashboard.daysTapStart', { n: plans[0].days?.length ?? 0 })}
            </Text>
          </View>
          <View style={styles.workoutCardArrow}>
            <Icon name="play" size={16} color={colors.textInverse} />
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.emptyWorkoutCard} onPress={() => navigation.navigate('Workout')}>
          <Icon name="plus-circle-outline" size={36} color={colors.textTertiary} />
          <Text style={styles.emptyWorkoutTitle}>{t('dashboard.noWorkoutPlan')}</Text>
          <Text style={styles.emptyWorkoutSub}>{t('dashboard.createFirstPlan')}</Text>
        </TouchableOpacity>
      )}

      {/* ── AI Coach (Premium) ────────────────────────────────────────────── */}
      {entitlements?.isPremium && (
        <TouchableOpacity
          style={styles.aiCard}
          onPress={() => navigation.navigate('Nutrition')}
          activeOpacity={0.8}
        >
          <View style={styles.aiCardLeft}>
            <View style={styles.aiIconBg}>
              <Icon name="brain" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.aiCardTitle}>{t('dashboard.aiCoachTip')}</Text>
              <Text style={styles.aiCardText}>{t('dashboard.aiCoachText')}</Text>
              <Text style={styles.aiCardDisclaimer}>{t('dashboard.aiCoachDisclaimer')}</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function ChartStat({ label, value, colors }: { label: string; value: string; colors: ColorPalette }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ fontSize: Typography.sm, fontWeight: Typography.bold, color: colors.textPrimary }}>{value}</Text>
      <Text style={{ fontSize: 10, color: colors.textTertiary, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    scroll: { padding: Spacing.base, gap: Spacing.md },

    // Header
    headerCard: {
      gap: Spacing.md,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.sm,
      marginBottom: Spacing.xs,
    },

    // Row 1
    headerTopRow: { flexDirection: 'row', alignItems: 'center' },
    headerLogo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    headerLogoMark: {
      width: 32, height: 32, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
    },
    headerAppName: {
      fontSize: Typography.xl, fontWeight: Typography.bold,
      color: c.textPrimary, letterSpacing: 0.3,
    },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },

    // Row 2: greeting
    headerGreetingRow: { gap: 2 },
    headerGreeting: { fontSize: Typography.sm, color: c.textTertiary, fontWeight: Typography.medium },
    headerName: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: c.textPrimary, lineHeight: 30 },

    // Avatar
    avatarWrap: { position: 'relative', flexShrink: 0 },
    avatarRing: {
      width: 40, height: 40, borderRadius: 20,
      borderWidth: 2, padding: 2,
    },
    avatarImg: { width: '100%', height: '100%', borderRadius: 100 } as any,
    avatarFallback: { alignItems: 'center', justifyContent: 'center' },
    avatarInitialsText: { fontSize: Typography.sm, fontWeight: Typography.bold },
    avatarCamBadge: {
      position: 'absolute', bottom: 0, right: 0,
      width: 20, height: 20, borderRadius: 10,
      borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    },
    avatarProBadge: {
      position: 'absolute', top: 0, right: 0,
      width: 14, height: 14, borderRadius: 7,
      borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    },

    // Notification bell
    notifBtn: {
      width: 40, height: 40, borderRadius: 20, borderWidth: 1,
      alignItems: 'center', justifyContent: 'center',
      position: 'relative', flexShrink: 0,
    },
    notifBadge: {
      position: 'absolute', top: 4, right: 4,
      minWidth: 15, height: 15, borderRadius: 8,
      borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: 3,
    },
    notifBadgeText: { fontSize: 8, fontWeight: Typography.bold, color: c.textInverse },

    planBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: Spacing.sm, paddingVertical: 4,
      borderRadius: Radius.sm, borderWidth: 1,
      backgroundColor: c.surfaceElevated, borderColor: c.surfaceBorder,
    },
    planBadgePro: { backgroundColor: c.primaryDim, borderColor: c.primary },
    planBadgeText: {
      fontSize: Typography.xs, fontWeight: Typography.bold,
      color: c.textTertiary, letterSpacing: 0.5,
    },

    // Active Banner
    activeBanner: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      backgroundColor: c.primaryDim, borderWidth: 1, borderColor: c.primary,
      borderRadius: Radius.lg, padding: Spacing.base,
    },
    activePulse: {
      width: 34, height: 34, borderRadius: 17,
      backgroundColor: c.primary + '30',
      alignItems: 'center', justifyContent: 'center',
    },
    activeBannerTitle: { fontSize: Typography.xs, color: c.primary, fontWeight: Typography.medium },
    activeBannerName: { fontSize: Typography.base, fontWeight: Typography.bold, color: c.textPrimary },

    // Cards
    card: {
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder, padding: Spacing.base, gap: Spacing.md,
    },
    cardHeader: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    },
    cardTitle: {
      flex: 1, fontSize: Typography.sm, fontWeight: Typography.semibold, color: c.textPrimary,
    },
    seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    seeAllText: { fontSize: Typography.xs, color: c.primary, fontWeight: Typography.medium },

    mealSectionTitle: {
      fontSize: 9, color: c.textTertiary, fontWeight: Typography.semibold,
      letterSpacing: 0.7,
    },

    // Mini cards row (kept for SmallRingCard if used elsewhere)
    miniRow: { flexDirection: 'row', gap: Spacing.md },
    miniCard: {
      flex: 1, backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder,
      padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    },
    miniCardTitle: { fontSize: Typography.xs, color: c.textTertiary, fontWeight: Typography.medium },
    miniCardValue: { fontSize: Typography.lg, fontWeight: Typography.bold, color: c.textPrimary },
    miniCardSub: { fontSize: Typography.xs, color: c.textTertiary },

    // Chart stats row
    chartStats: {
      flexDirection: 'row', borderTopWidth: 1,
      borderTopColor: c.surfaceBorder, paddingTop: Spacing.md,
    },
    chartLegendRow: { flexDirection: 'row', gap: Spacing.xl },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendLine: { width: 16, height: 1 },
    legendText: { fontSize: Typography.xs, color: c.textTertiary },

    // Section header
    sectionHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    sectionTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: c.textPrimary },

    // Workout card
    workoutCard: {
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder,
      padding: Spacing.base, flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    },
    workoutCardIcon: {
      width: 50, height: 50, borderRadius: Radius.md,
      backgroundColor: c.primaryDim, alignItems: 'center', justifyContent: 'center',
    },
    workoutCardName: { fontSize: Typography.base, fontWeight: Typography.bold, color: c.textPrimary },
    workoutCardMeta: { fontSize: Typography.xs, color: c.textTertiary, marginTop: 3 },
    workoutCardArrow: {
      width: 34, height: 34, borderRadius: 17,
      backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center',
    },
    emptyWorkoutCard: {
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder, borderStyle: 'dashed',
      padding: Spacing['2xl'], alignItems: 'center', gap: Spacing.sm,
    },
    emptyWorkoutTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: c.textPrimary },
    emptyWorkoutSub: { fontSize: Typography.sm, color: c.textTertiary, textAlign: 'center' },

    // ── Today summary card ───────────────────────────────────────────────
    summaryDateText: { fontSize: Typography.xs, color: c.textTertiary, fontWeight: Typography.medium },

    summaryRingRow: {
      flexDirection: 'row', alignItems: 'flex-start',
      paddingVertical: Spacing.xs,
    },
    summaryRingCell: { flex: 1, alignItems: 'center', gap: 5 },
    summaryRingDivider: { width: 1, alignSelf: 'stretch', backgroundColor: c.surfaceBorder, marginHorizontal: 4 },
    sRingVal: { fontSize: 13, fontWeight: Typography.bold, color: c.textPrimary, lineHeight: 16 },
    sRingUnit: { fontSize: 8, color: c.textTertiary, lineHeight: 10 },
    sRingMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    sRingLabel: { fontSize: 10, color: c.textSecondary, fontWeight: Typography.medium },
    sRingPct: { fontSize: 9, fontWeight: Typography.bold },

    summaryBottomRow: { flexDirection: 'row', gap: Spacing.sm },
    summaryHalfCard: {
      flex: 1, backgroundColor: c.surfaceElevated, borderRadius: Radius.md,
      padding: Spacing.sm, gap: 8, borderWidth: 1, borderColor: c.surfaceBorder,
    },
    summaryHalfHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    summaryHalfIcon: {
      width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    summaryBarLabel: { fontSize: 11, color: c.textSecondary, fontWeight: Typography.semibold, flex: 1 },
    summaryBarValue: { fontSize: 12, fontWeight: Typography.bold },
    summaryBarUnit: { fontSize: 10, fontWeight: Typography.regular, color: c.textTertiary },
    summaryProgressBg: { height: 5, backgroundColor: c.surface, borderRadius: 3, overflow: 'hidden' },
    summaryProgressFill: { height: 5, borderRadius: 3 },

    summaryStreakRow: { flexDirection: 'row', gap: 3 },
    summaryStreakDot: { flex: 1, height: 5, borderRadius: 3 },

    summaryChartTitle: {
      fontSize: 9, color: c.textTertiary, fontWeight: Typography.semibold, letterSpacing: 0.7,
    },
    summaryMiniChart: {
      flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 58,
    },
    summaryMiniBarCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4, height: 58 },
    summaryMiniBar: { width: '75%', borderRadius: 3, minHeight: 3 },
    summaryMiniBarLabel: { fontSize: 8, color: c.textTertiary },

    summaryStatsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    summaryStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    summaryStatText: { fontSize: 10, color: c.textTertiary },

    // ── Compact Nutrition card ───────────────────────────────────────────
    calPctChip: {
      paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radius.sm, borderWidth: 1, marginLeft: 2,
    },
    calPctChipText: { fontSize: 9, fontWeight: Typography.bold },

    compactCalRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base },
    compactCalSide: { flex: 1, gap: Spacing.sm },
    compactCalStats: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.base },
    compactMetaLabel: { fontSize: 9, color: c.textTertiary, fontWeight: Typography.medium, marginBottom: 1 },
    compactMetaVal: { fontSize: Typography.lg, fontWeight: Typography.bold, color: c.textPrimary, lineHeight: 22 },
    compactMetaUnit: { fontSize: 9, color: c.textTertiary },
    compactMetaDivider: { width: 1, alignSelf: 'stretch', marginHorizontal: 2 },
    compactMacros: { gap: 6 },
    compactMacroRow: {},
    compactRingNum: { fontSize: 18, fontWeight: Typography.bold, color: c.textPrimary, lineHeight: 20 },
    compactRingLabel: { fontSize: 9, color: c.textTertiary },

    // Meal pills (compact row)
    mealPillsSection: { borderTopWidth: 1, borderTopColor: c.surfaceBorder, paddingTop: Spacing.sm, gap: Spacing.xs },
    mealPillsRow: { flexDirection: 'row', gap: Spacing.xs },
    mealPill: {
      flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, paddingHorizontal: 4,
      borderRadius: Radius.md, borderWidth: 1, borderColor: c.surfaceBorder,
      backgroundColor: c.surfaceElevated, gap: 2,
    },
    mealPillVal: { fontSize: 11, fontWeight: Typography.bold, lineHeight: 14 },
    mealPillUnit: { fontSize: 8, color: c.textTertiary },
    mealPillEmpty: { fontSize: 9, color: c.textTertiary, fontWeight: Typography.medium },

    // AI Analysis badge chip (section header)
    aiBadgeChip: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: Spacing.sm, paddingVertical: 3,
      borderRadius: Radius.sm, borderWidth: 1,
      backgroundColor: c.primaryDim, borderColor: c.primary + '50',
    },
    aiBadgeChipText: { fontSize: 9, fontWeight: Typography.bold, color: c.primary, letterSpacing: 0.4 },

    // AI section wrapper
    aiSectionWrap: {
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.primary + '25',
      padding: Spacing.base, gap: Spacing.md,
      ...Shadows.sm,
    },
    aiSectionHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    aiSectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    aiSectionIconBox: {
      width: 34, height: 34, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
    },
    aiSectionTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: c.textPrimary },
    aiSectionSub: { fontSize: 10, color: c.textTertiary, marginTop: 1 },
    aiSectionBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: Spacing.sm, paddingVertical: 4,
      borderRadius: Radius.full, borderWidth: 1,
    },
    aiSectionDot: { width: 6, height: 6, borderRadius: 3 },
    aiSectionBadgeText: { fontSize: 9, fontWeight: Typography.bold, letterSpacing: 0.6 },

    // AI Scan 2-column grid
    aiGridRow: { flexDirection: 'row', gap: Spacing.sm },
    aiGridCard: {
      flex: 1, borderRadius: Radius.lg, borderWidth: 1,
      backgroundColor: c.surfaceElevated, overflow: 'hidden',
    },
    aiGridHero: {
      height: 160, alignItems: 'center', justifyContent: 'center', position: 'relative',
    },
    aiGridGlow: {
      position: 'absolute', width: 84, height: 84,
      borderRadius: 42, borderWidth: 1,
    },
    aiGridHeroIcon: {
      width: 152, height: 152,
    },
    aiGridTopBadge: {
      position: 'absolute', top: 6, right: 6,
      flexDirection: 'row', alignItems: 'center', gap: 2,
      paddingHorizontal: 5, paddingVertical: 2,
      borderRadius: Radius.sm, borderWidth: 1,
    },
    aiGridTopBadgeText: { fontSize: 7, fontWeight: Typography.bold, letterSpacing: 0.4 },
    aiGridBody: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: 4 },
    aiGridTitle: {
      fontSize: Typography.sm, fontWeight: Typography.bold,
      color: c.textPrimary,
    },
    // nowrap — these two chips must always sit on one line per tile; sized
    // down (padding/font/icon) specifically so they fit without wrapping.
    aiGridStats: { flexDirection: 'row', gap: 4, flexWrap: 'nowrap' },
    aiGridStat: {
      flexDirection: 'row', alignItems: 'center', gap: 3,
      paddingHorizontal: 5, paddingVertical: 3,
      borderRadius: Radius.sm, borderWidth: 1,
      flexShrink: 1,
    },
    aiGridStatText: { fontSize: 8, fontWeight: Typography.bold, flexShrink: 1 },
    aiGridCta: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderTopWidth: 1,
    },
    aiGridCtaText: { fontSize: Typography.xs, fontWeight: Typography.bold },
    aiGridCtaArrow: {
      width: 20, height: 20, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
    },

    // AI last-result insight strip
    aiInsightRow: { flexDirection: 'row', gap: Spacing.sm },
    aiInsightPill: {
      flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: Spacing.sm, paddingVertical: 7,
      borderRadius: Radius.md, borderWidth: 1,
      backgroundColor: c.surfaceElevated, borderColor: c.surfaceBorder,
    },
    aiInsightPillText: { flexShrink: 1, fontSize: 10, fontWeight: Typography.medium, color: c.textSecondary },

    // AI Card
    aiCard: {
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.primary + '50',
      padding: Spacing.base,
    },
    aiCardLeft: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
    aiIconBg: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: c.primaryDim, alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    },
    aiCardTitle: { fontSize: Typography.sm, fontWeight: Typography.bold, color: c.primary },
    aiCardText: { fontSize: Typography.sm, color: c.textPrimary, lineHeight: 20 },
    aiCardDisclaimer: { fontSize: Typography.xs, color: c.textTertiary, fontStyle: 'italic', marginTop: 2 },
  });
}
