import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { format } from 'date-fns';
import { useThemeStore } from '@/store/theme.store';
import { darkColors, orangeColors, midnightColors, pinkColors, azureColors, lightColors, coralColors, goldColors, tealColors } from '@/theme';
import { TodayGlanceStats } from './todayStats';

const PALETTE_MAP: Record<string, typeof darkColors> = {
  dark: darkColors,
  orange: orangeColors,
  midnight: midnightColors,
  pink: pinkColors,
  coral: coralColors,
  gold: goldColors,
  teal: tealColors,
  azure: azureColors,
  light: lightColors,
};

const WATER_COLOR = '#60A5FA';

export function currentWidgetColors() {
  const theme = useThemeStore.getState().theme;
  return PALETTE_MAP[theme] ?? darkColors;
}

function ProgressBar({ progress, color, trackColor }: { progress: number; color: string; trackColor: string }) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <FlexWidget
      style={{
        flexDirection: 'row', height: 6, borderRadius: 3,
        backgroundColor: trackColor as `#${string}`, width: 'match_parent', marginTop: 6,
        overflow: 'hidden',
      }}
    >
      <FlexWidget style={{ flex: Math.max(clamped, 0.02), height: 6, backgroundColor: color as `#${string}`, borderRadius: 3 }} />
      <FlexWidget style={{ flex: Math.max(1 - clamped, 0.001), height: 6 }} />
    </FlexWidget>
  );
}

function StatRow({
  label, value, target, unit, color, trackColor, labelColor,
}: { label: string; value: number; target: number; unit: string; color: string; trackColor: string; labelColor: string }) {
  return (
    <FlexWidget style={{ flexDirection: 'column', width: 'match_parent', marginTop: 10 }}>
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', width: 'match_parent' }}>
        <TextWidget text={label} style={{ fontSize: 11, color: labelColor as `#${string}` }} />
        <TextWidget
          text={`${value.toLocaleString()} / ${target.toLocaleString()} ${unit}`}
          style={{ fontSize: 11, fontWeight: 'bold', color: color as `#${string}` }}
        />
      </FlexWidget>
      <ProgressBar progress={target > 0 ? value / target : 0} color={color} trackColor={trackColor} />
    </FlexWidget>
  );
}

export function TodayGlanceWidget({ stats }: { stats: TodayGlanceStats }) {
  const c = currentWidgetColors();

  if (!stats.signedIn) {
    return (
      <FlexWidget
        clickAction="OPEN_APP"
        style={{
          height: 'match_parent', width: 'match_parent', backgroundColor: c.surface as `#${string}`,
          borderRadius: 20, padding: 16, alignItems: 'center', justifyContent: 'center',
        }}
      >
        <TextWidget text="Open B-Track to sign in" style={{ fontSize: 13, color: c.textSecondary as `#${string}`, textAlign: 'center' }} />
      </FlexWidget>
    );
  }

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent', width: 'match_parent', backgroundColor: c.surface as `#${string}`,
        borderRadius: 20, padding: 14, flexDirection: 'column',
      }}
    >
      {/* Header */}
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: 'match_parent' }}>
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <FlexWidget style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.primary as `#${string}`, marginRight: 6 }} />
          <TextWidget text="B-Track" style={{ fontSize: 12, fontWeight: 'bold', color: c.textPrimary as `#${string}` }} />
        </FlexWidget>
        <TextWidget text={format(new Date(), 'EEE, MMM d')} style={{ fontSize: 10, color: c.textTertiary as `#${string}` }} />
      </FlexWidget>

      <StatRow
        label="Calories" value={stats.caloriesConsumed} target={stats.caloriesTarget} unit="kcal"
        color={c.primary} trackColor={c.surfaceElevated} labelColor={c.textSecondary}
      />
      <StatRow
        label="Water" value={stats.waterMl} target={stats.waterTargetMl} unit="ml"
        color={WATER_COLOR} trackColor={c.surfaceElevated} labelColor={c.textSecondary}
      />

      {/* Footer — steps / sleep */}
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', width: 'match_parent', marginTop: 12 }}>
        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget text={`${stats.stepsToday.toLocaleString()} steps`} style={{ fontSize: 10, fontWeight: 'bold', color: c.success as `#${string}` }} />
          <TextWidget text={`of ${stats.stepsTarget.toLocaleString()} goal`} style={{ fontSize: 9, color: c.textTertiary as `#${string}` }} />
        </FlexWidget>
        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget text={`${stats.sleepHours}h sleep`} style={{ fontSize: 10, fontWeight: 'bold', color: '#8B7CF6' }} />
          <TextWidget text={`of ${stats.sleepTargetHours}h goal`} style={{ fontSize: 9, color: c.textTertiary as `#${string}` }} />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
