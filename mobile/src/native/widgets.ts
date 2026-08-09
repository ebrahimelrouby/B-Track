import { Platform, NativeModules } from 'react-native';
import type { TodayGlanceStats } from '@/widgets/todayStats';

/**
 * Pushes today's stats into the home screen widget on whichever platform we're
 * running on. Android re-renders the RemoteViews tree directly; iOS writes to
 * the shared App Group storage the WidgetKit extension reads from and asks
 * WidgetKit to reload. Safe to call on every dashboard data refresh.
 */
export function refreshHomeScreenWidgets(stats: TodayGlanceStats, primaryColorHex: string): void {
  if (Platform.OS === 'android') {
    const { requestWidgetUpdate } = require('react-native-android-widget');
    const { TodayGlanceWidget } = require('@/widgets/TodayGlanceWidget');
    const { WIDGET_NAME } = require('@/widgets/widget-task-handler');
    const React = require('react');

    requestWidgetUpdate({
      widgetName: WIDGET_NAME,
      renderWidget: () => React.createElement(TodayGlanceWidget, { stats }),
    }).catch(() => {
      // No widget on the home screen yet — nothing to update.
    });
    return;
  }

  if (Platform.OS === 'ios') {
    NativeModules.WidgetBridge?.updateStats({ ...stats, primaryColorHex });
  }
}
