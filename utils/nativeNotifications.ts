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

