import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SectionList, I18nManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useColors, ColorPalette, Spacing, Typography, Radius } from '@/theme';

type NotifType = 'workout' | 'nutrition' | 'ai' | 'goal' | 'reminder' | 'system';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const ICON_MAP: Record<NotifType, { name: string; color: string; bg: string }> = {
  workout:   { name: 'dumbbell',           color: '#A78BFA', bg: '#3B2D6B' },
  nutrition: { name: 'food-apple',         color: '#34D399', bg: '#1A3A2A' },
  ai:        { name: 'robot',              color: '#F97316', bg: '#3A1A0A' },
  goal:      { name: 'trophy',             color: '#FBBF24', bg: '#3A2A0A' },
  reminder:  { name: 'bell-ring',          color: '#60A5FA', bg: '#1A2D4A' },
  system:    { name: 'information-outline', color: '#9CA3AF', bg: '#1F2937' },
};

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: '1', type: 'reminder', title: 'Time to hydrate!',
    body: "You've only logged 1.2L today. Drink a glass of water to stay on track.",
    time: '2 min ago', read: false,
  },
  {
    id: '2', type: 'workout', title: 'Workout streak: 3 days 🔥',
    body: 'Keep it up! You\'ve worked out 3 days in a row. One more day to hit your weekly goal.',
    time: '1 hr ago', read: false,
  },
  {
    id: '3', type: 'nutrition', title: 'Calorie goal almost reached',
    body: 'You have 320 kcal remaining for today. Consider a protein-rich snack.',
    time: '3 hrs ago', read: false,
  },
  {
    id: '4', type: 'ai', title: 'AI Body Scan ready',
    body: 'Your body fat estimate has been processed. Tap to view your results.',
    time: 'Yesterday', read: true,
  },
  {
    id: '5', type: 'goal', title: 'Weekly steps goal hit! 🎉',
    body: 'You completed 70,000 steps this week. Amazing consistency!',
    time: 'Yesterday', read: true,
  },
  {
    id: '6', type: 'workout', title: 'Rest day reminder',
    body: 'Your plan suggests rest today. Recovery is part of the process.',
    time: '2 days ago', read: true,
  },
  {
    id: '7', type: 'system', title: 'B-Track updated to v1.2',
    body: 'New: AI Calorie Scan improvements, sleep tracking enhancements, and bug fixes.',
    time: '3 days ago', read: true,
  },
];

function groupByDay(notifications: Notification[]) {
  const today: Notification[] = [];
  const earlier: Notification[] = [];
  notifications.forEach((n) => {
    const isToday = n.time.includes('min') || n.time.includes('hr') || n.time === 'Today';
    if (isToday) today.push(n);
    else earlier.push(n);
  });
  const sections: Array<{ title: 'Today' | 'Earlier'; data: Notification[] }> = [];
  if (today.length) sections.push({ title: 'Today', data: today });
  if (earlier.length) sections.push({ title: 'Earlier', data: earlier });
  return sections;
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const { t } = useTranslation();
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const markRead = (id: string) =>
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));

  const sections = groupByDay(notifications);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Icon name={I18nManager.isRTL ? "arrow-right" : "arrow-left"} size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
          {unreadCount > 0 && (
            <View style={[styles.unreadBubble, { backgroundColor: colors.primary }]}>
              <Text style={styles.unreadText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead} activeOpacity={0.7}>
            <Text style={[styles.markAll, { color: colors.primary }]}>{t('notifications.markAllRead')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 72 }} />
        )}
      </View>

      {/* List */}
      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="bell-sleep-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>No notifications</Text>
          <Text style={styles.emptySub}>You're all caught up!</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + Spacing['2xl'] }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionLabel}>
              {section.title === 'Today' ? t('notifications.today') : t('notifications.earlier')}
            </Text>
          )}
          renderItem={({ item }) => {
            const meta = ICON_MAP[item.type];
            return (
              <TouchableOpacity
                style={[styles.card, !item.read && styles.cardUnread]}
                onPress={() => markRead(item.id)}
                activeOpacity={0.7}
              >
                {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
                <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
                  <Icon name={meta.name} size={20} color={meta.color} />
                </View>
                <View style={styles.content}>
                  <Text style={[styles.title, !item.read && styles.titleUnread]}>{item.title}</Text>
                  <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
                  <Text style={styles.time}>{item.time}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

function getStyles(c: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.surfaceBorder,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: c.surfaceElevated,
      alignItems: 'center', justifyContent: 'center',
    },
    headerCenter: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
    },
    headerTitle: {
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      color: c.textPrimary,
    },
    unreadBubble: {
      minWidth: 20, height: 20, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: 5,
    },
    unreadText: {
      fontSize: 11, fontWeight: Typography.bold, color: c.textInverse,
    },
    markAll: { fontSize: Typography.xs, fontWeight: Typography.semibold, width: 72, textAlign: 'right' },

    sectionLabel: {
      fontSize: Typography.xs,
      fontWeight: Typography.semibold,
      color: c.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      paddingHorizontal: Spacing.base,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.sm,
    },

    card: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
      position: 'relative',
    },
    cardUnread: { backgroundColor: c.surfaceElevated + '60' },
    unreadDot: {
      position: 'absolute',
      left: 6,
      top: '50%',
      width: 6, height: 6, borderRadius: 3,
    },
    iconWrap: {
      width: 44, height: 44, borderRadius: Radius.md,
      alignItems: 'center', justifyContent: 'center',
      marginRight: Spacing.md,
      flexShrink: 0,
    },
    content: { flex: 1, gap: 3 },
    title: {
      fontSize: Typography.sm,
      fontWeight: Typography.medium,
      color: c.textSecondary,
      lineHeight: 20,
    },
    titleUnread: { color: c.textPrimary, fontWeight: Typography.semibold },
    body: { fontSize: Typography.xs, color: c.textTertiary, lineHeight: 18 },
    time: { fontSize: 11, color: c.textTertiary },

    separator: {
      height: 1,
      backgroundColor: c.surfaceBorder,
      marginLeft: Spacing.base + 44 + Spacing.md,
    },

    empty: {
      flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    },
    emptyTitle: { fontSize: Typography.lg, fontWeight: Typography.semibold, color: c.textSecondary },
    emptySub: { fontSize: Typography.sm, color: c.textTertiary },
  });
}
