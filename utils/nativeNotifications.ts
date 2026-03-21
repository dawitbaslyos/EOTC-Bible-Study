import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { UserStats, RitualTime } from '../types';

export async function sendWelcomeNotification(name: string) {
  if (!Capacitor.isNativePlatform()) return;

  const perm = await LocalNotifications.checkPermissions();
  if (perm.display !== 'granted') {
    const req = await LocalNotifications.requestPermissions();
    if (req.display !== 'granted') return;
  }

  await LocalNotifications.schedule({
    notifications: [
      {
        id: Date.now(),
        title: 'Peace be with you',
        body: `Welcome to your sanctuary, ${name}.`,
        schedule: { at: new Date(Date.now() + 2_000) }
      }
    ]
  });
}

export async function scheduleDailyReminder(hour: number, minute: number) {
  if (!Capacitor.isNativePlatform()) return;

  const perm = await LocalNotifications.checkPermissions();
  if (perm.display !== 'granted') {
    const req = await LocalNotifications.requestPermissions();
    if (req.display !== 'granted') return;
  }

  await LocalNotifications.schedule({
    notifications: [
      {
        id: 1001,
        title: 'Daily Senay time',
        body: 'Return to your prayers and readings.',
        schedule: {
          every: 'day',
          on: { hour, minute },
          allowWhileIdle: true
        }
      }
    ]
  });
}

const PRAYER_CHANNEL_ID = 'senay_prayer_reminders';
const EVENTS_CHANNEL_ID = 'senay_app_events';

export const PRAYER_MORNING_ID = 2001;
export const PRAYER_AFTERNOON_ID = 2002;
export const OPEN_APP_REMINDER_ID = 2003;

const DEFAULT_MORNING = { hour: 6, minute: 0 };
const DEFAULT_EVENING = { hour: 21, minute: 0 };

async function ensureChannels() {
  await LocalNotifications.createChannel({
    id: PRAYER_CHANNEL_ID,
    name: 'Prayer reminders',
    description: 'Morning and evening routine reminders for Senay',
    importance: 4
  });
  await LocalNotifications.createChannel({
    id: EVENTS_CHANNEL_ID,
    name: 'Senay updates',
    description: 'Holidays, fasting, and gentle nudges from Senay',
    importance: 3
  });
}

/** @deprecated Use syncRitualRemindersFromStats — kept for older call sites */
export async function schedulePrayerTimeReminders(
  morningHour = 6,
  morningMinute = 0,
  afternoonHour = 15,
  afternoonMinute = 0
): Promise<boolean> {
  const stats: UserStats = {
    rank: '',
    studyHistory: {},
    bookProgress: {},
    totalSessions: 0,
    streak: 0,
    preferredRituals: ['day', 'night'],
    ritualReminderTimes: {
      day: { hour: morningHour, minute: morningMinute },
      night: { hour: afternoonHour, minute: afternoonMinute }
    }
  };
  return syncRitualRemindersFromStats(stats);
}

/**
 * Schedules only the routines the user enabled (morning = day, evening = night),
 * at the times stored in stats (defaults 6:00 / 21:00 local).
 */
export async function syncRitualRemindersFromStats(stats: UserStats): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  const perm = await LocalNotifications.checkPermissions();
  if (perm.display !== 'granted') {
    const req = await LocalNotifications.requestPermissions();
    if (req.display !== 'granted') return false;
  }

  await ensureChannels();

  await LocalNotifications.cancel({
    notifications: [{ id: PRAYER_MORNING_ID }, { id: PRAYER_AFTERNOON_ID }]
  });

  const rituals = stats.preferredRituals?.length ? stats.preferredRituals : ['day'];
  const times = stats.ritualReminderTimes || {};

  const notifications: {
    id: number;
    title: string;
    body: string;
    largeBody?: string;
    summaryText?: string;
    channelId: string;
    schedule: { every: 'day'; on: { hour: number; minute: number }; allowWhileIdle: boolean };
  }[] = [];

  const pick = (r: RitualTime, defaults: { hour: number; minute: number }) => {
    const t = times[r];
    return {
      hour: t?.hour ?? defaults.hour,
      minute: t?.minute ?? defaults.minute
    };
  };

  if (rituals.includes('day')) {
    const t = pick('day', DEFAULT_MORNING);
    notifications.push({
      id: PRAYER_MORNING_ID,
      title: 'Morning routine',
      body: 'Time for your morning reading and prayer. Open Senay when you are ready.',
      largeBody: 'Time for your morning reading and prayer. Open Senay to continue.',
      summaryText: 'Morning routine',
      channelId: PRAYER_CHANNEL_ID,
      schedule: { every: 'day', on: { hour: t.hour, minute: t.minute }, allowWhileIdle: true }
    });
  }

  if (rituals.includes('night')) {
    const t = pick('night', DEFAULT_EVENING);
    notifications.push({
      id: PRAYER_AFTERNOON_ID,
      title: 'Evening routine',
      body: 'Time for your evening reflection. Open Senay to read and pray.',
      largeBody: 'Evening routine reminder. Open Senay to continue your readings.',
      summaryText: 'Evening routine',
      channelId: PRAYER_CHANNEL_ID,
      schedule: { every: 'day', on: { hour: t.hour, minute: t.minute }, allowWhileIdle: true }
    });
  }

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
  }

  return true;
}

/**
 * Cancels any pending “come back” notification and schedules a new one `daysFromNow` from now.
 * Call whenever the app becomes visible so inactive users get one reminder.
 */
export async function rescheduleOpenAppReminder(daysFromNow = 3): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const perm = await LocalNotifications.checkPermissions();
  if (perm.display !== 'granted') {
    const req = await LocalNotifications.requestPermissions();
    if (req.display !== 'granted') return;
  }

  await ensureChannels();

  await LocalNotifications.cancel({ notifications: [{ id: OPEN_APP_REMINDER_ID }] });

  const at = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  await LocalNotifications.schedule({
    notifications: [
      {
        id: OPEN_APP_REMINDER_ID,
        title: 'Your Senay moment',
        body: "It's been a few days. Step back into prayer and reading when you can.",
        channelId: EVENTS_CHANNEL_ID,
        schedule: { at }
      }
    ]
  });
}

/** Short system notification (e.g. mirror in-app holiday / fasting alerts). */
export async function showTrayNotification(title: string, body: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const perm = await LocalNotifications.checkPermissions();
  if (perm.display !== 'granted') {
    const req = await LocalNotifications.requestPermissions();
    if (req.display !== 'granted') return;
  }

  await ensureChannels();

  const id = 3100 + Math.floor(Math.random() * 89);
  await LocalNotifications.schedule({
    notifications: [
      {
        id,
        title,
        body,
        channelId: EVENTS_CHANNEL_ID,
        schedule: { at: new Date(Date.now() + 750) }
      }
    ]
  });
}
