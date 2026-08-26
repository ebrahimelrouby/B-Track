import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  FlatList, Modal, ActivityIndicator, Alert, I18nManager, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Circle } from 'react-native-svg';

import { useTranslation } from 'react-i18next';

import { useColors, ColorPalette, Spacing, Typography, Radius } from '@/theme';
import { nutritionApi, Food, MealEntry } from '@/api/nutrition.api';
import PremiumTag from '@/components/common/PremiumTag';

type MealName = 'breakfast' | 'lunch' | 'dinner' | 'snack';
const MEALS: { key: MealName; label: string; icon: string; color: string }[] = [
  { key: 'breakfast', label: 'Breakfast', icon: 'weather-sunset-up', color: '#FB923C' },
  { key: 'lunch',     label: 'Lunch',     icon: 'white-balance-sunny', color: '#FACC15' },
  { key: 'dinner',    label: 'Dinner',    icon: 'weather-night',  color: '#818CF8' },
  { key: 'snack',     label: 'Snack',     icon: 'food-apple-outline', color: '#34D399' },
];

const WATER_OPTIONS = [200, 250, 330, 500];

function today() { return new Date().toISOString().split('T')[0]; }

// Parsing "YYYY-MM-DD" via `new Date(iso)` reads it as UTC midnight, which can
// display as the previous day in negative-UTC-offset timezones — build the
// Date from local parts instead.
function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Calorie ring
function CalRing({ eaten, goal, size, colors }: { eaten: number; goal: number; size: number; colors: ColorPalette }) {
  const sw  = 12;
  const r   = (size - sw) / 2;
  const cx  = size / 2;
  const c   = 2 * Math.PI * r;
  const pct = Math.min(eaten / Math.max(goal, 1), 1);
  const off = c * (1 - pct);
  const col = pct > 1 ? colors.error : pct > 0.85 ? colors.warning : colors.primary;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={cx} cy={cx} r={r} stroke={colors.surfaceElevated} strokeWidth={sw} fill="none" />
        <Circle cx={cx} cy={cx} r={r} stroke={col} strokeWidth={sw} fill="none"
          strokeDasharray={c} strokeDashoffset={off}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cx})`} />
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 20, fontWeight: Typography.extrabold, color: col }}>{Math.round(eaten)}</Text>
        <Text style={{ fontSize: 9, color: colors.textTertiary }}>kcal</Text>
      </View>
    </View>
  );
}

export default function NutritionScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const colors = useColors();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const { t } = useTranslation();

  const [date, setDate] = useState(today());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [diary, setDiary] = useState<MealEntry[]>([]);
  const [waterMl, setWaterMl] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [activeMeal, setActiveMeal] = useState<MealName>('breakfast');
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [servings, setServings] = useState('1');

  const loadDiary = useCallback(async () => {
    const [entries, water] = await Promise.all([
      nutritionApi.getDiaryForDate(date),
      nutritionApi.getWater(date),
    ]);
    setDiary(entries);
    setWaterMl(water);
  }, [date]);

  useFocusEffect(useCallback(() => { loadDiary(); }, [loadDiary]));
  // Reload immediately when the user picks a different date — useFocusEffect
  // only fires on focus/blur transitions, not on every dependency change
  // while already focused.
  useEffect(() => { loadDiary(); }, [loadDiary]);

  const handleDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selected) {
      setDate(toIsoDate(selected));
    }
  };

  const doSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try { setSearchResults(await nutritionApi.searchFoods(q)); }
    finally { setSearching(false); }
  };

  const openSearch = (meal: MealName) => {
    setActiveMeal(meal);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedFood(null);
    setServings('1');
    setShowSearch(true);
    nutritionApi.searchFoods('').then(setSearchResults);
  };

  const selectFood = (food: Food) => { setSelectedFood(food); setServings('1'); };

  const logEntry = async () => {
    if (!selectedFood) return;
    const sv = parseFloat(servings);
    if (isNaN(sv) || sv <= 0) return;
    await nutritionApi.logFood({ foodId: selectedFood.id, servings: sv, meal: activeMeal, date });
    setShowSearch(false);
    loadDiary();
  };

  const removeEntry = (entryId: string) => {
    Alert.alert(t('nutrition.removeTitle'), t('nutrition.removeMsg'), [
      { text: t('nutrition.cancelBtn'), style: 'cancel' },
      { text: t('nutrition.removeBtn'), style: 'destructive', onPress: async () => {
        await nutritionApi.removeEntry(date, entryId);
        loadDiary();
      }},
    ]);
  };

  const logWater = async (ml: number) => {
    await nutritionApi.logWater(date, ml);
    setWaterMl(w => w + ml);
  };

  const totals = diary.reduce((acc, e) => {
    const mult = e.servings;
    return {
      cal:     acc.cal     + e.food.calories * mult,
      protein: acc.protein + e.food.proteinG * mult,
      carbs:   acc.carbs   + e.food.carbsG   * mult,
      fat:     acc.fat     + e.food.fatG     * mult,
    };
  }, { cal: 0, protein: 0, carbs: 0, fat: 0 });

  const goals      = { cal: 2200, protein: 150, carbs: 250, fat: 70 };
  const remaining  = Math.max(0, goals.cal - Math.round(totals.cal));
  const isOver     = totals.cal > goals.cal;
  const dateLabel  = date === today()
    ? t('nutrition.today')
    : parseLocalDate(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const MACROS = [
    { label: t('nutrition.protein'), value: totals.protein, goal: goals.protein, color: colors.info,    icon: 'arm-flex' },
    { label: t('nutrition.carbs'),   value: totals.carbs,   goal: goals.carbs,   color: colors.warning, icon: 'grain' },
    { label: t('nutrition.fat'),     value: totals.fat,      goal: goals.fat,     color: '#F472B6',     icon: 'water-outline' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.screenHeader}>
        {/* Row 1: title + history icon */}
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.screenTitle}>{t('nutrition.title')}</Text>
            <Text style={styles.screenDate}>{dateLabel}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <PremiumTag />
            <TouchableOpacity
              style={[styles.headerIconBtn, { backgroundColor: colors.surfaceElevated }]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.75}
            >
              <Icon name="calendar-month-outline" size={19} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={parseLocalDate(date)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            onChange={handleDateChange}
          />
        )}

        {/* Row 2: Full-width AI scan banner */}
        <TouchableOpacity
          style={[styles.aiBanner, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('AiStack', { screen: 'AiFoodEntry' })}
          activeOpacity={0.85}
        >
          <View style={styles.aiBannerIconBox}>
            <Icon name="brain" size={22} color="#000" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiBannerTitle}>{t('nutrition.aiScanTitle')}</Text>
            <Text style={styles.aiBannerSub}>{t('nutrition.aiScanSubtitle')}</Text>
          </View>
          <View style={styles.aiBannerArrow}>
            <Icon name="arrow-right" size={16} color="#000" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Macro summary ───────────────────────────────────────────── */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            {/* Ring */}
            <CalRing eaten={totals.cal} goal={goals.cal} size={110} colors={colors} />

            {/* Stats */}
            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <Text style={[styles.summaryStatVal, { color: isOver ? colors.error : colors.success }]}>
                  {isOver ? `+${Math.abs(Math.round(totals.cal) - goals.cal)}` : remaining}
                </Text>
                <Text style={styles.summaryStatLbl}>{isOver ? t('nutrition.overGoal') : t('nutrition.remaining')}</Text>
              </View>
              <View style={[styles.summaryStatDivider, { backgroundColor: colors.surfaceBorder }]} />
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatVal}>{goals.cal}</Text>
                <Text style={styles.summaryStatLbl}>{t('nutrition.goal')}</Text>
              </View>
              <View style={[styles.summaryStatDivider, { backgroundColor: colors.surfaceBorder }]} />
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatVal}>
                  {diary.reduce((s, e) => s + e.servings, 0).toFixed(0)}
                </Text>
                <Text style={styles.summaryStatLbl}>{t('nutrition.items')}</Text>
              </View>
            </View>
          </View>

          {/* Macro bars */}
          <View style={styles.macroRow}>
            {MACROS.map(m => {
              const pct = Math.min(m.value / Math.max(m.goal, 1), 1);
              return (
                <View key={m.label} style={styles.macroItem}>
                  <View style={styles.macroItemHeader}>
                    <View style={[styles.macroIconBox, { backgroundColor: m.color + '20' }]}>
                      <Icon name={m.icon} size={11} color={m.color} />
                    </View>
                    <Text style={[styles.macroLabel, { color: m.color }]}>{m.label}</Text>
                  </View>
                  <Text style={styles.macroVal}>{Math.round(m.value)}<Text style={styles.macroUnit}>g</Text></Text>
                  <View style={styles.macroBarBg}>
                    <View style={[styles.macroBarFill, { width: `${pct * 100}%`, backgroundColor: m.color }]} />
                  </View>
                  <Text style={styles.macroGoal}>/ {m.goal}g</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Water ───────────────────────────────────────────────────── */}
        <View style={[styles.waterCard, { borderColor: colors.info + '30' }]}>
          <View style={styles.waterHeader}>
            <View style={styles.waterLeft}>
              <View style={[styles.waterIconBox, { backgroundColor: colors.info + '18' }]}>
                <Icon name="water" size={16} color={colors.info} />
              </View>
              <View>
                <Text style={styles.waterTitle}>{t('nutrition.water')}</Text>
                <Text style={styles.waterSub}>{t('nutrition.waterIntake')}</Text>
              </View>
            </View>
            <View style={styles.waterAmountBox}>
              <Text style={[styles.waterAmount, { color: colors.info }]}>
                {(waterMl / 1000).toFixed(1)}
                <Text style={styles.waterAmountUnit}> / 2.5L</Text>
              </Text>
              <Text style={[styles.waterPct, { color: colors.info + '88' }]}>
                {Math.round((waterMl / 2500) * 100)}%
              </Text>
            </View>
          </View>
          <View style={[styles.waterBar, { backgroundColor: colors.info + '18' }]}>
            <View style={[styles.waterFill, {
              width: `${Math.min(waterMl / 2500, 1) * 100}%`,
              backgroundColor: colors.info,
            }]} />
          </View>
          <View style={styles.waterBtns}>
            {WATER_OPTIONS.map(ml => (
              <TouchableOpacity
                key={ml}
                style={[styles.waterBtn, { borderColor: colors.info + '40', backgroundColor: colors.info + '0E' }]}
                onPress={() => logWater(ml)}
              >
                <Icon name="plus" size={10} color={colors.info} />
                <Text style={[styles.waterBtnText, { color: colors.info }]}>{ml}ml</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Meal sections ───────────────────────────────────────────── */}
        {MEALS.map(meal => {
          const entries = diary.filter(e => e.meal === meal.key);
          const mealCal = entries.reduce((s, e) => s + e.food.calories * e.servings, 0);
          const mealProt = entries.reduce((s, e) => s + e.food.proteinG * e.servings, 0);
          return (
            <View key={meal.key} style={[styles.mealSection, { borderColor: colors.surfaceBorder }]}>
              <View style={[styles.mealHeader, { borderBottomColor: colors.surfaceBorder }]}>
                <View style={[styles.mealIconBox, { backgroundColor: meal.color + '18' }]}>
                  <Icon name={meal.icon} size={16} color={meal.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mealTitle}>{t(`nutrition.${meal.key}`)}</Text>
                  {mealCal > 0 && (
                    <Text style={[styles.mealCal, { color: meal.color }]}>
                      {Math.round(mealCal)} kcal · {Math.round(mealProt)}g P
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: meal.color + '18', borderColor: meal.color + '40' }]}
                  onPress={() => openSearch(meal.key)}
                >
                  <Icon name="plus" size={15} color={meal.color} />
                </TouchableOpacity>
              </View>

              {entries.length === 0 ? (
                <TouchableOpacity style={styles.emptyMeal} onPress={() => openSearch(meal.key)}>
                  <Icon name="plus-circle-outline" size={18} color={colors.textTertiary} />
                  <Text style={styles.emptyMealText}>{t('nutrition.addMeal', { meal: t(`nutrition.${meal.key}`) })}</Text>
                </TouchableOpacity>
              ) : (
                <>
                  {entries.map(e => (
                    <View key={e.id} style={[styles.entryRow, { borderTopColor: colors.surfaceBorder }]}>
                      <View style={[styles.entryDot, { backgroundColor: meal.color }]} />
                      <View style={styles.entryInfo}>
                        <Text style={styles.entryName} numberOfLines={1}>{e.food.name}</Text>
                        <Text style={styles.entrySub}>{e.servings} × {e.food.servingLabel}</Text>
                      </View>
                      <View style={styles.entryMacros}>
                        <Text style={styles.entryCal}>{Math.round(e.food.calories * e.servings)} kcal</Text>
                        <Text style={[styles.entryPro, { color: colors.info }]}>
                          {Math.round(e.food.proteinG * e.servings)}g P
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeEntry(e.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={[styles.entryRemove, { backgroundColor: colors.error + '15' }]}
                      >
                        <Icon name="close" size={12} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={[styles.addMoreRow, { borderTopColor: colors.surfaceBorder }]}
                    onPress={() => openSearch(meal.key)}
                  >
                    <Icon name="plus" size={13} color={meal.color} />
                    <Text style={[styles.addMoreText, { color: meal.color }]}>{t('nutrition.addMore')}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* ── Food search modal ────────────────────────────────────────── */}
      <Modal visible={showSearch} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { paddingTop: insets.top + Spacing.base }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {t('nutrition.addToMeal', { meal: t(`nutrition.${activeMeal}`) })}
            </Text>
            <TouchableOpacity onPress={() => setShowSearch(false)}>
              <Icon name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {!selectedFood ? (
            <>
              <View style={styles.searchBox}>
                <Icon name="magnify" size={18} color={colors.textTertiary} />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={doSearch}
                  placeholder={t('nutrition.searchFoods')}
                  placeholderTextColor={colors.textTertiary}
                  autoFocus
                />
                {searching ? <ActivityIndicator size="small" color={colors.primary} /> : null}
              </View>
              <FlatList
                data={searchResults}
                keyExtractor={f => f.id}
                renderItem={({ item: f }) => (
                  <TouchableOpacity style={styles.foodRow} onPress={() => selectFood(f)}>
                    <View style={styles.foodInfo}>
                      <Text style={styles.foodName}>{f.name}</Text>
                      <Text style={styles.foodSub}>{f.servingLabel} · {f.category}</Text>
                    </View>
                    <View style={styles.foodMacros}>
                      <Text style={styles.foodCal}>{f.calories} kcal</Text>
                      <Text style={styles.foodPro}>{f.proteinG}g P</Text>
                    </View>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => (
                  <View style={{ height: 1, backgroundColor: colors.surfaceBorder }} />
                )}
                contentContainerStyle={{ paddingBottom: insets.bottom + Spacing['2xl'] }}
              />
            </>
          ) : (
            <ScrollView contentContainerStyle={styles.foodDetail}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedFood(null)}>
                <Icon name={I18nManager.isRTL ? "arrow-right" : "arrow-left"} size={18} color={colors.textSecondary} />
                <Text style={styles.backText}>{t('nutrition.backToSearch')}</Text>
              </TouchableOpacity>
              <Text style={styles.foodDetailName}>{selectedFood.name}</Text>
              <Text style={styles.foodDetailSub}>{selectedFood.servingLabel} · {selectedFood.category}</Text>

              <View style={styles.macroGrid}>
                {[
                  { label: t('nutrition.calories'), value: Math.round(selectedFood.calories  * parseFloat(servings || '1')), unit: 'kcal', color: colors.primary },
                  { label: t('nutrition.protein'),  value: Math.round(selectedFood.proteinG  * parseFloat(servings || '1')), unit: 'g',    color: colors.info },
                  { label: t('nutrition.carbs'),    value: Math.round(selectedFood.carbsG    * parseFloat(servings || '1')), unit: 'g',    color: colors.warning },
                  { label: t('nutrition.fat'),      value: Math.round(selectedFood.fatG      * parseFloat(servings || '1')), unit: 'g',    color: '#F472B6' },
                ].map(m => (
                  <View key={m.label} style={[styles.macroBox, { borderColor: m.color + '30' }]}>
                    <Text style={[styles.macroBoxVal, { color: m.color }]}>{m.value}{m.unit}</Text>
                    <Text style={styles.macroBoxLbl}>{m.label}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.servingsLabel}>{t('nutrition.servings')}</Text>
              <View style={styles.servingsRow}>
                <TouchableOpacity style={styles.servBtn} onPress={() => setServings(v => String(Math.max(0.5, parseFloat(v || '1') - 0.5)))}>
                  <Icon name="minus" size={18} color={colors.textPrimary} />
                </TouchableOpacity>
                <TextInput
                  style={styles.servInput}
                  value={servings}
                  onChangeText={setServings}
                  keyboardType="numeric"
                  textAlign="center"
                />
                <TouchableOpacity style={styles.servBtn} onPress={() => setServings(v => String(parseFloat(v || '1') + 0.5))}>
                  <Icon name="plus" size={18} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.logFoodBtn, { backgroundColor: colors.primary }]} onPress={logEntry}>
                <Text style={styles.logFoodBtnText}>{t('nutrition.addToMeal', { meal: t(`nutrition.${activeMeal}`) })}</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    root:   { flex: 1, backgroundColor: c.background },
    scroll: { padding: Spacing.base, gap: Spacing.base },

    // ── Header ──────────────────────────────────────────────────────────
    screenHeader: {
      paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: Spacing.base,
      borderBottomWidth: 1, borderBottomColor: c.surfaceBorder,
      gap: Spacing.md,
    },
    headerTitleRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    screenTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: c.textPrimary },
    screenDate:  { fontSize: Typography.sm, color: c.textTertiary, marginTop: 2 },
    headerIconBtn: {
      width: 38, height: 38, borderRadius: 19,
      alignItems: 'center', justifyContent: 'center',
    },

    // AI banner
    aiBanner: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      borderRadius: Radius.lg, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
      shadowColor: c.primary, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4, shadowRadius: 14, elevation: 8,
    },
    aiBannerIconBox: {
      width: 44, height: 44, borderRadius: 13,
      backgroundColor: '#00000018', alignItems: 'center', justifyContent: 'center',
    },
    aiBannerTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: '#000' },
    aiBannerSub:   { fontSize: 11, color: '#00000099', marginTop: 2 },
    aiBannerArrow: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: '#FFFFFF22', alignItems: 'center', justifyContent: 'center',
    },

    // ── Summary card ────────────────────────────────────────────────────
    summaryCard: {
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: c.surfaceBorder,
      padding: Spacing.base, gap: Spacing.base,
    },
    summaryTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base },
    summaryStats: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    summaryStat: { flex: 1, alignItems: 'center', gap: 3 },
    summaryStatVal: { fontSize: Typography.lg, fontWeight: Typography.bold, color: c.textPrimary },
    summaryStatLbl: { fontSize: 10, color: c.textTertiary },
    summaryStatDivider: { width: 1, height: 32, marginHorizontal: 4 },

    macroRow: { flexDirection: 'row', gap: Spacing.sm },
    macroItem: { flex: 1, gap: 4 },
    macroItemHeader: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    macroIconBox: { width: 18, height: 18, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
    macroLabel: { fontSize: 10, fontWeight: Typography.semibold },
    macroVal:  { fontSize: Typography.base, fontWeight: Typography.bold, color: c.textPrimary },
    macroUnit: { fontSize: 10, color: c.textTertiary },
    macroBarBg: { height: 5, backgroundColor: c.surfaceElevated, borderRadius: 3, overflow: 'hidden' },
    macroBarFill: { height: 5, borderRadius: 3 },
    macroGoal: { fontSize: 9, color: c.textTertiary },

    // ── Water ───────────────────────────────────────────────────────────
    waterCard: {
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, padding: Spacing.base, gap: Spacing.md,
    },
    waterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    waterLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    waterIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    waterTitle: { fontSize: Typography.sm, fontWeight: Typography.bold, color: c.textPrimary },
    waterSub:   { fontSize: 10, color: c.textTertiary },
    waterAmountBox: { alignItems: 'flex-end' },
    waterAmount: { fontSize: Typography.base, fontWeight: Typography.bold },
    waterAmountUnit: { fontSize: Typography.sm, fontWeight: Typography.regular as any },
    waterPct: { fontSize: 10, marginTop: 1 },
    waterBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
    waterFill: { height: 8, borderRadius: 4 },
    waterBtns: { flexDirection: 'row', gap: Spacing.sm },
    waterBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 3, paddingVertical: Spacing.sm,
      borderRadius: Radius.md, borderWidth: 1,
    },
    waterBtnText: { fontSize: Typography.xs, fontWeight: Typography.bold },

    // ── Meal sections ───────────────────────────────────────────────────
    mealSection: {
      backgroundColor: c.surface, borderRadius: Radius.lg,
      borderWidth: 1, overflow: 'hidden',
    },
    mealHeader: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      padding: Spacing.base, borderBottomWidth: 1,
    },
    mealIconBox: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    mealTitle: { fontSize: Typography.sm, fontWeight: Typography.bold, color: c.textPrimary },
    mealCal:   { fontSize: 10, marginTop: 1 },
    addBtn: {
      width: 30, height: 30, borderRadius: 9,
      alignItems: 'center', justifyContent: 'center', borderWidth: 1,
    },
    emptyMeal: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      padding: Spacing.base, justifyContent: 'center',
    },
    emptyMealText: { fontSize: Typography.sm, color: c.textTertiary },
    entryRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
      borderTopWidth: 1, gap: Spacing.sm,
    },
    entryDot: { width: 4, height: 32, borderRadius: 2 },
    entryInfo: { flex: 1 },
    entryName: { fontSize: Typography.sm, fontWeight: Typography.medium, color: c.textPrimary },
    entrySub:  { fontSize: Typography.xs, color: c.textTertiary, marginTop: 2 },
    entryMacros: { alignItems: 'flex-end' },
    entryCal: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: c.textPrimary },
    entryPro: { fontSize: Typography.xs, marginTop: 2 },
    entryRemove: {
      width: 24, height: 24, borderRadius: 7,
      alignItems: 'center', justifyContent: 'center',
    },
    addMoreRow: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      padding: Spacing.md, borderTopWidth: 1, justifyContent: 'center',
    },
    addMoreText: { fontSize: Typography.xs, fontWeight: Typography.semibold },

    // ── Modal ───────────────────────────────────────────────────────────
    modal: { flex: 1, backgroundColor: c.background },
    modalHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: Spacing.base, paddingBottom: Spacing.base,
      borderBottomWidth: 1, borderBottomColor: c.surfaceBorder,
    },
    modalTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: c.textPrimary },
    searchBox: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: c.surface, borderRadius: Radius.md,
      borderWidth: 1, borderColor: c.surfaceBorder,
      paddingHorizontal: Spacing.md, margin: Spacing.base,
    },
    searchInput: { flex: 1, fontSize: Typography.base, color: c.textPrimary, paddingVertical: Spacing.md },
    foodRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, gap: Spacing.md },
    foodInfo: { flex: 1 },
    foodName: { fontSize: Typography.base, fontWeight: Typography.medium, color: c.textPrimary },
    foodSub:  { fontSize: Typography.xs, color: c.textTertiary, marginTop: 2 },
    foodMacros: { alignItems: 'flex-end' },
    foodCal: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: c.primary },
    foodPro: { fontSize: Typography.xs, color: c.info, marginTop: 2 },

    foodDetail: { padding: Spacing.base, gap: Spacing.base },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    backText: { fontSize: Typography.sm, color: c.textSecondary },
    foodDetailName: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: c.textPrimary },
    foodDetailSub:  { fontSize: Typography.sm, color: c.textTertiary },
    macroGrid: { flexDirection: 'row', gap: Spacing.sm },
    macroBox: {
      flex: 1, backgroundColor: c.surface, borderRadius: Radius.md,
      borderWidth: 1, padding: Spacing.md, alignItems: 'center',
    },
    macroBoxVal: { fontSize: Typography.md, fontWeight: Typography.bold },
    macroBoxLbl: { fontSize: Typography.xs, color: c.textTertiary, marginTop: 2 },

    servingsLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: c.textSecondary },
    servingsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    servBtn: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: c.surface, borderWidth: 1, borderColor: c.surfaceBorder,
      alignItems: 'center', justifyContent: 'center',
    },
    servInput: {
      flex: 1, fontSize: Typography.xl, fontWeight: Typography.bold, color: c.textPrimary,
      backgroundColor: c.surface, borderRadius: Radius.md,
      borderWidth: 1, borderColor: c.surfaceBorder,
      paddingVertical: Spacing.sm,
    },
    logFoodBtn: {
      borderRadius: Radius.lg, paddingVertical: Spacing.base,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: c.primary, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
    },
    logFoodBtnText: { fontSize: Typography.base, fontWeight: Typography.bold, color: c.textInverse },
  });
}
