import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions, StatusBar, I18nManager } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Defs, LinearGradient, Stop, RadialGradient,
  Circle, Ellipse, Path, Rect, G,
} from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTranslation } from 'react-i18next';

import { Spacing, Typography, Radius } from '@/theme';
import { AiStackParamList } from '@/navigation/types';

type RouteProps = RouteProp<AiStackParamList, 'BodyScanVisualization'>;

const { width: W } = Dimensions.get('window');

// ─── Body model constants ──────────────────────────────────────────────────────
// SVG viewBox: 0 0 100 290, scaled to fit the screen
const VB_W = 100;
const VB_H = 290;
const BODY_W = Math.min(W * 0.48, 190);
const BODY_H = BODY_W * (VB_H / VB_W);

// ─── Fat-zone helpers ──────────────────────────────────────────────────────────

// Each body region carries a different fraction of total body fat
const REGION_MULT: Record<string, number> = {
  chest:    0.95,
  arms:     0.75,
  abdomen:  1.55,   // highest concentration
  hips:     1.20,
  thighs:   1.10,
  calves:   0.60,
};

function regionFat(totalBf: number, region: string): number {
  return Math.min(99, totalBf * (REGION_MULT[region] ?? 1.0));
}

// Heat-map colour: green (lean) → lime → amber → orange → red (obese)
function fatColor(bf: number): string {
  if (bf < 9)  return '#22C55E';  // athletic
  if (bf < 16) return '#84CC16';  // fitness
  if (bf < 23) return '#AAFF00';  // acceptable-low
  if (bf < 30) return '#F59E0B';  // acceptable-high
  if (bf < 38) return '#F97316';  // high
  return '#EF4444';               // very high
}

function fatLabel(bf: number): string {
  if (bf < 9)  return 'Very Lean';
  if (bf < 16) return 'Lean';
  if (bf < 23) return 'Average';
  if (bf < 30) return 'Elevated';
  if (bf < 38) return 'High';
  return 'Very High';
}

// ─── Simplified human body SVG (front view) ──────────────────────────────────
// Each part is a separate element so it can be coloured independently.
// ViewBox "0 0 100 290", coordinate origin top-left.
function BodyModel({ totalBf }: { totalBf: number }) {
  const chest   = fatColor(regionFat(totalBf, 'chest'));
  const arms    = fatColor(regionFat(totalBf, 'arms'));
  const abd     = fatColor(regionFat(totalBf, 'abdomen'));
  const hips    = fatColor(regionFat(totalBf, 'hips'));
  const thighs  = fatColor(regionFat(totalBf, 'thighs'));
  const calves  = fatColor(regionFat(totalBf, 'calves'));
  const skin    = '#C8A882';  // neutral head/neck/hands/feet tone

  const gradientOpacity = '0.28';

  return (
    <Svg
      width={BODY_W}
      height={BODY_H}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
    >
      <Defs>
        {/* 3D shading gradients for each region */}
        <LinearGradient id="g-chest"  x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0"   stopColor="#000" stopOpacity={gradientOpacity} />
          <Stop offset="0.5" stopColor="#000" stopOpacity="0" />
          <Stop offset="1"   stopColor="#000" stopOpacity={gradientOpacity} />
        </LinearGradient>
        <LinearGradient id="g-arm-l" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0"   stopColor="#000" stopOpacity="0.3" />
          <Stop offset="1"   stopColor="#000" stopOpacity="0" />
        </LinearGradient>
        <LinearGradient id="g-arm-r" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0"   stopColor="#000" stopOpacity="0" />
          <Stop offset="1"   stopColor="#000" stopOpacity="0.3" />
        </LinearGradient>
        <LinearGradient id="g-leg-l" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0"   stopColor="#000" stopOpacity="0.22" />
          <Stop offset="1"   stopColor="#000" stopOpacity="0" />
        </LinearGradient>
        <LinearGradient id="g-leg-r" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0"   stopColor="#000" stopOpacity="0" />
          <Stop offset="1"   stopColor="#000" stopOpacity="0.22" />
        </LinearGradient>
        <RadialGradient id="g-head" cx="0.4" cy="0.35" rx="0.6" ry="0.6">
          <Stop offset="0"   stopColor="#FFF" stopOpacity="0.18" />
          <Stop offset="1"   stopColor="#000" stopOpacity="0.12" />
        </RadialGradient>
      </Defs>

      {/* ── HEAD ─────────────────────────────────────────────────────────── */}
      <Circle cx={50} cy={17} r={14} fill={skin} />
      <Circle cx={50} cy={17} r={14} fill="url(#g-head)" />

      {/* Hair / top shadow */}
      <Ellipse cx={50} cy={6} rx={12} ry={5} fill="#3A2A1A" opacity={0.55} />

      {/* ── NECK ─────────────────────────────────────────────────────────── */}
      <Rect x={44} y={29} width={12} height={10} rx={4} fill={skin} />

      {/* ── LEFT ARM (upper) ─────────────────────────────────────────────── */}
      <Ellipse cx={16} cy={78} rx={9.5} ry={26} fill={arms} />
      <Ellipse cx={16} cy={78} rx={9.5} ry={26} fill="url(#g-arm-l)" />

      {/* ── RIGHT ARM (upper) ────────────────────────────────────────────── */}
      <Ellipse cx={84} cy={78} rx={9.5} ry={26} fill={arms} />
      <Ellipse cx={84} cy={78} rx={9.5} ry={26} fill="url(#g-arm-r)" />

      {/* ── CHEST / TORSO ────────────────────────────────────────────────── */}
      {/* Shoulder sweep */}
      <Path
        d="M 20,40 Q 12,44 12,56 L 12,106 Q 12,112 18,114 L 82,114 Q 88,112 88,106 L 88,56 Q 88,44 80,40 Q 66,36 50,36 Q 34,36 20,40 Z"
        fill={chest}
      />
      <Path
        d="M 20,40 Q 12,44 12,56 L 12,106 Q 12,112 18,114 L 82,114 Q 88,112 88,106 L 88,56 Q 88,44 80,40 Q 66,36 50,36 Q 34,36 20,40 Z"
        fill="url(#g-chest)"
      />

      {/* ── LEFT FOREARM ─────────────────────────────────────────────────── */}
      <Ellipse cx={14} cy={132} rx={7.5} ry={18} fill={arms} />
      <Ellipse cx={14} cy={132} rx={7.5} ry={18} fill="url(#g-arm-l)" />

      {/* ── RIGHT FOREARM ────────────────────────────────────────────────── */}
      <Ellipse cx={86} cy={132} rx={7.5} ry={18} fill={arms} />
      <Ellipse cx={86} cy={132} rx={7.5} ry={18} fill="url(#g-arm-r)" />

      {/* Left hand */}
      <Ellipse cx={13} cy={152} rx={7} ry={5} fill={skin} />
      {/* Right hand */}
      <Ellipse cx={87} cy={152} rx={7} ry={5} fill={skin} />

      {/* ── ABDOMEN ──────────────────────────────────────────────────────── */}
      <Rect x={22} y={114} width={56} height={46} rx={6} fill={abd} />
      <Rect x={22} y={114} width={56} height={46} rx={6} fill="url(#g-chest)" />

      {/* Ab definition lines */}
      <Path
        d="M 35,125 L 65,125 M 33,138 L 67,138 M 50,114 L 50,160"
        stroke="#00000025" strokeWidth={1} fill="none"
      />

      {/* ── HIPS / PELVIS ────────────────────────────────────────────────── */}
      <Path
        d="M 16,160 Q 10,166 10,178 L 30,184 L 70,184 L 90,178 Q 90,166 84,160 Z"
        fill={hips}
      />
      <Path
        d="M 16,160 Q 10,166 10,178 L 30,184 L 70,184 L 90,178 Q 90,166 84,160 Z"
        fill="url(#g-chest)"
      />

      {/* ── LEFT THIGH ───────────────────────────────────────────────────── */}
      <Ellipse cx={30} cy={210} rx={16} ry={30} fill={thighs} />
      <Ellipse cx={30} cy={210} rx={16} ry={30} fill="url(#g-leg-l)" />

      {/* ── RIGHT THIGH ──────────────────────────────────────────────────── */}
      <Ellipse cx={70} cy={210} rx={16} ry={30} fill={thighs} />
      <Ellipse cx={70} cy={210} rx={16} ry={30} fill="url(#g-leg-r)" />

      {/* ── LEFT CALF ────────────────────────────────────────────────────── */}
      <Ellipse cx={28} cy={255} rx={11} ry={20} fill={calves} />
      <Ellipse cx={28} cy={255} rx={11} ry={20} fill="url(#g-leg-l)" />

      {/* ── RIGHT CALF ───────────────────────────────────────────────────── */}
      <Ellipse cx={72} cy={255} rx={11} ry={20} fill={calves} />
      <Ellipse cx={72} cy={255} rx={11} ry={20} fill="url(#g-leg-r)" />

      {/* Left foot */}
      <Ellipse cx={27} cy={278} rx={13} ry={5} fill={skin} />
      {/* Right foot */}
      <Ellipse cx={73} cy={278} rx={13} ry={5} fill={skin} />
    </Svg>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function BodyScanVisualizationScreen() {
  const navigation = useNavigation<any>();
  const { params } = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();

  const { t } = useTranslation();
  const avgBf = (params.minBodyFatPct + params.maxBodyFatPct) / 2;
  const category = params.category ?? 'Unknown';

  const getFatLabel = (bf: number): string => {
    if (bf < 9)  return t('bodyScanViz.fatVeryLean');
    if (bf < 16) return t('bodyScanViz.fatLean');
    if (bf < 23) return t('bodyScanViz.fatAverage');
    if (bf < 30) return t('bodyScanViz.fatElevated');
    if (bf < 38) return t('bodyScanViz.fatHigh');
    return t('bodyScanViz.fatVeryHigh');
  };

  const getCategoryLabel = (cat: string) => ({
    'Essential Fat': t('bodyScanViz.scaleEssential'),
    'Athletic': t('bodyScanViz.scaleAthletic'),
    'Fitness': t('bodyScanViz.scaleFitness'),
    'Acceptable': t('bodyScanViz.scaleAcceptable'),
    'Obese': t('bodyScanViz.scaleObese'),
  }[cat] ?? cat);

  const regions: { label: string; icon: string; region: string }[] = [
    { label: t('bodyScanViz.regionChest'),   icon: 'weight-lifter',  region: 'chest'   },
    { label: t('bodyScanViz.regionArms'),    icon: 'arm-flex',        region: 'arms'    },
    { label: t('bodyScanViz.regionAbdomen'), icon: 'stomach',         region: 'abdomen' },
    { label: t('bodyScanViz.regionHips'),    icon: 'human',           region: 'hips'    },
    { label: t('bodyScanViz.regionThighs'),  icon: 'run',             region: 'thighs'  },
    { label: t('bodyScanViz.regionCalves'),  icon: 'run-fast',        region: 'calves'  },
  ];

  // ── Scan line animation ──────────────────────────────────────────────────────
  const scanAnim   = useRef(new Animated.Value(0)).current;
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const [scanDone, setScanDone] = useState(false);

  useEffect(() => {
    // Sweep once, then loop idle pulse
    Animated.sequence([
      Animated.timing(scanAnim, {
        toValue: 1, duration: 2800, useNativeDriver: true,
      }),
    ]).start(() => {
      setScanDone(true);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.00, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  const scanY = scanAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, BODY_H],
  });

  // ─── Region rows defined above with t() ─────────────────────────────────────

  // Category colour
  const catColors: Record<string, string> = {
    'Essential Fat': '#EF4444',
    'Athletic':      '#AAFF00',
    'Fitness':       '#22C55E',
    'Acceptable':    '#F59E0B',
    'Obese':         '#EF4444',
  };
  const catColor = catColors[category] ?? '#AAFF00';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name={I18nManager.isRTL ? "arrow-right" : "arrow-left"} size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{t('bodyScanViz.title')}</Text>
          <Text style={styles.headerSub}>{t('bodyScanViz.subtitle')}</Text>
        </View>
        <View style={[styles.catBadge, { borderColor: catColor + '80', backgroundColor: catColor + '18' }]}>
          <Text style={[styles.catBadgeText, { color: catColor }]}>{getCategoryLabel(category)}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Body model + scan ─────────────────────────────────────────── */}
        <View style={styles.modelSection}>
          {/* Glow background behind model */}
          <View style={[styles.glowBg, { width: BODY_W * 1.5, height: BODY_H * 0.8 }]} />

          {/* Fat % circle */}
          <View style={styles.bfCircle}>
            <Text style={styles.bfNum}>{avgBf.toFixed(1)}</Text>
            <Text style={styles.bfPct}>%</Text>
            <Text style={styles.bfLabel}>{t('bodyScanViz.bfLabel')}</Text>
          </View>

          {/* Body model with animated scan overlay */}
          <Animated.View style={{ transform: [{ scale: scanDone ? pulseAnim : 1 }] }}>
            <View style={[styles.modelWrap, { width: BODY_W, height: BODY_H }]}>
              <BodyModel totalBf={avgBf} />

              {/* Scan line */}
              {!scanDone && (
                <Animated.View
                  style={[
                    styles.scanLine,
                    { width: BODY_W, transform: [{ translateY: scanY }] },
                  ]}
                />
              )}

              {/* Scan complete: subtle border glow */}
              {scanDone && (
                <View style={[styles.scanComplete, { width: BODY_W, height: BODY_H }]} />
              )}
            </View>
          </Animated.View>

          {/* Scan status */}
          <View style={styles.scanStatus}>
            <View style={[styles.statusDot, { backgroundColor: scanDone ? '#22C55E' : '#AAFF00' }]} />
            <Text style={styles.scanStatusText}>
              {scanDone ? t('bodyScanViz.scanComplete') : t('bodyScanViz.scanning')}
            </Text>
          </View>
        </View>

        {/* ── Regional fat breakdown ──────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="map-marker-outline" size={16} color="#AAFF00" />
            <Text style={styles.cardTitle}>{t('bodyScanViz.regionalTitle')}</Text>
          </View>
          {regions.map(({ label, icon, region }) => {
            const rf    = regionFat(avgBf, region);
            const color = fatColor(rf);
            const lbl   = getFatLabel(rf);
            const pct   = Math.min(100, Math.round(rf));
            return (
              <View key={region} style={styles.regionRow}>
                <View style={[styles.regionIcon, { backgroundColor: color + '20' }]}>
                  <Icon name={icon} size={15} color={color} />
                </View>
                <Text style={styles.regionLabel}>{label}</Text>
                <View style={styles.regionBar}>
                  <View
                    style={[
                      styles.regionFill,
                      { width: `${Math.min(pct, 100)}%`, backgroundColor: color },
                    ]}
                  />
                </View>
                <Text style={[styles.regionPct, { color }]}>{pct}%</Text>
                <View style={[styles.regionLblChip, { backgroundColor: color + '22' }]}>
                  <Text style={[styles.regionLblText, { color }]}>{lbl}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Body fat scale reference ────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="scale-balance" size={16} color="#AAFF00" />
            <Text style={styles.cardTitle}>{t('bodyScanViz.scaleTitle')}</Text>
          </View>
          {[
            { key: 'Essential Fat', label: t('bodyScanViz.scaleEssential'), range: '3–5%  (♂) / 10–13% (♀)', color: '#EF4444' },
            { key: 'Athletic',      label: t('bodyScanViz.scaleAthletic'),  range: '6–13% (♂) / 14–20% (♀)', color: '#AAFF00' },
            { key: 'Fitness',       label: t('bodyScanViz.scaleFitness'),   range: '14–17%(♂) / 21–24% (♀)', color: '#22C55E' },
            { key: 'Acceptable',    label: t('bodyScanViz.scaleAcceptable'),range: '18–24%(♂) / 25–31% (♀)', color: '#F59E0B' },
            { key: 'Obese',         label: t('bodyScanViz.scaleObese'),     range: '≥25%   (♂) / ≥32%  (♀)', color: '#EF4444' },
          ].map(item => (
            <View key={item.key} style={styles.scaleRow}>
              <View style={[styles.scaleDot, { backgroundColor: item.color }]} />
              <Text style={styles.scaleLabel}>{item.label}</Text>
              <Text style={styles.scaleRange}>{item.range}</Text>
              {category === item.key && (
                <View style={[styles.youChip, { backgroundColor: catColor + '22' }]}>
                  <Text style={[styles.youText, { color: catColor }]}>{t('bodyScanViz.youChip')}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* ── Accuracy note ───────────────────────────────────────────────── */}
        <View style={styles.disclaimer}>
          <Icon name="alert-circle-outline" size={15} color="#F59E0B" />
          <Text style={styles.disclaimerText}>
            AI estimate only — typical margin ±3–5%. Fat distribution shown is a model approximation
            based on your overall body fat percentage, not an actual scan. For clinical precision use
            DEXA or hydrostatic weighing.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const CARD_BG     = '#141414';
const BORDER      = '#2A2A2A';
const TEXT_P      = '#FFFFFF';
const TEXT_S      = '#A1A1A1';
const TEXT_T      = '#6B6B6B';
const ACCENT      = '#AAFF00';
const SCAN_COLOR  = '#AAFF0055';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0A' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.base, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: { padding: Spacing.xs },
  headerTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: TEXT_P },
  headerSub:   { fontSize: Typography.xs,   color: TEXT_T, marginTop: 2 },
  catBadge: {
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderRadius: Radius.full, borderWidth: 1,
  },
  catBadgeText: { fontSize: 10, fontWeight: Typography.bold },

  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.base, gap: Spacing.base },

  // ── Model section
  modelSection: {
    alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.md,
    backgroundColor: CARD_BG, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: BORDER, overflow: 'hidden',
  },
  glowBg: {
    position: 'absolute', top: '5%',
    borderRadius: 999,
    backgroundColor: ACCENT,
    opacity: 0.04,
  },

  bfCircle: {
    alignItems: 'center', flexDirection: 'row', gap: 2,
    flexWrap: 'wrap', justifyContent: 'center',
  },
  bfNum:   { fontSize: 52, fontWeight: '900', color: TEXT_P, lineHeight: 58 },
  bfPct:   { fontSize: 26, fontWeight: Typography.bold, color: ACCENT, alignSelf: 'flex-start', marginTop: 10 },
  bfLabel: {
    width: '100%', textAlign: 'center',
    fontSize: Typography.sm, color: TEXT_S, marginTop: -4,
  },

  modelWrap: { position: 'relative', overflow: 'hidden' },

  scanLine: {
    position: 'absolute', left: 0, top: 0,
    height: 3,
    backgroundColor: SCAN_COLOR,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  scanComplete: {
    position: 'absolute', left: 0, top: 0,
    borderWidth: 1,
    borderColor: ACCENT + '40',
    borderRadius: 6,
  },

  scanStatus: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  scanStatusText: { fontSize: Typography.xs, color: TEXT_S },

  // ── Cards
  card: {
    backgroundColor: CARD_BG, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: BORDER, padding: Spacing.base, gap: Spacing.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 4 },
  cardTitle:  { fontSize: Typography.sm, fontWeight: Typography.bold, color: TEXT_P },

  // ── Region rows
  regionRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
  },
  regionIcon: {
    width: 28, height: 28, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
  },
  regionLabel: { width: 58, fontSize: Typography.xs, color: TEXT_S, fontWeight: Typography.medium },
  regionBar: {
    flex: 1, height: 6, borderRadius: 3,
    backgroundColor: '#1C1C1C', overflow: 'hidden',
  },
  regionFill: { height: 6, borderRadius: 3 },
  regionPct:  { fontSize: Typography.xs, fontWeight: Typography.bold, width: 30, textAlign: I18nManager.isRTL ? 'left' : 'right' },
  regionLblChip: {
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  regionLblText: { fontSize: 9, fontWeight: Typography.semibold },

  // ── Reference scale
  scaleRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: BORDER,
  },
  scaleDot:   { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  scaleLabel: { width: 90, fontSize: Typography.xs, fontWeight: Typography.semibold, color: TEXT_P },
  scaleRange: { flex: 1, fontSize: 10, color: TEXT_T },
  youChip: {
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  youText: { fontSize: 9, fontWeight: Typography.bold },

  // ── Disclaimer
  disclaimer: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start',
    backgroundColor: '#F59E0B12', borderRadius: Radius.lg,
    borderWidth: 1, borderColor: '#F59E0B40', padding: Spacing.base,
  },
  disclaimerText: { flex: 1, fontSize: Typography.xs, color: TEXT_S, lineHeight: 18 },
});
