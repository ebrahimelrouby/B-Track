import React from 'react';
import type { WidgetTaskHandler } from 'react-native-android-widget';
import { TodayGlanceWidget } from './TodayGlanceWidget';
import { fetchTodayGlanceStats } from './todayStats';

export const WIDGET_NAME = 'TodayGlanceWidget';

export const todayGlanceWidgetTaskHandler: WidgetTaskHandler = async ({ widgetAction, renderWidget }) => {
  if (widgetAction === 'WIDGET_DELETED') return;

  if (widgetAction === 'WIDGET_CLICK') {
    // Whole widget is a single OPEN_APP click target — nothing extra to handle.
    return;
  }

  const stats = await fetchTodayGlanceStats();
  renderWidget(React.createElement(TodayGlanceWidget, { stats }));
};
