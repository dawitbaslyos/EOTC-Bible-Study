import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

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
          repeats: true,
          every: 'day',
          on: { hour, minute }
        }
      }
    ]
  });
}

const PRAYER_CHANNEL_ID = 'senay_prayer_reminders';
const PRAYER_MORNING_ID = 2001;
const PRAYER_AFTERNOON_ID = 2002;

export async function schedulePrayerTimeReminders(morningHour = 6, morningMinute = 0, afternoonHour = 15, afternoonMinute = 0): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  const perm = await LocalNotifications.checkPermissions();
  if (perm.display !== 'granted') {
    const req = await LocalNotifications.requestPermissions();
    if (req.display !== 'granted') return false;
  }

  // Ensure the Android channel exists (used on Android 26+).
  // This is safe to call repeatedly.
  await LocalNotifications.createChannel({
    id: PRAYER_CHANNEL_ID,
    name: 'Prayer reminders',
    description: 'Morning and afternoon prayer reminders for Senay',
    importance: 4
  });

  // Replace old reminders so the user doesn't get duplicates.
  await LocalNotifications.cancel({
    notifications: [{ id: PRAYER_MORNING_ID }, { id: PRAYER_AFTERNOON_ID }]
  });

  await LocalNotifications.schedule({
    notifications: [
      {
        id: PRAYER_MORNING_ID,
        title: 'Morning Prayer',
        body: 'Time to pray and reflect. Open Senay to continue.',
        largeBody: 'Time to pray and reflect. Open Senay to continue your readings and prayers.',
        summaryText: 'Morning prayer time',
        channelId: PRAYER_CHANNEL_ID,
        schedule: {
          repeats: true,
          every: 'day',
          on: { hour: morningHour, minute: morningMinute }
        }
      },
      {
        id: PRAYER_AFTERNOON_ID,
        title: 'Afternoon Prayer',
        body: 'Afternoon prayer reminder. Keep your mind in prayer.',
        largeBody: 'Afternoon prayer reminder. Open Senay to continue reflecting and reading.',
        summaryText: 'Afternoon prayer time',
        channelId: PRAYER_CHANNEL_ID,
        schedule: {
          repeats: true,
          every: 'day',
          on: { hour: afternoonHour, minute: afternoonMinute }
        }
      }
    ]
  });

  return true;
}

