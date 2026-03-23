import type { RitualTime, UserStats } from '../types';

const DEDUPE_KEY = 'senay_behavior_notify_dedupe';
const PRUNE_MS = 14 * 24 * 60 * 60 * 1000;

function getLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export type BehaviorNotifyInput = {
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'emotional';
  priority: 'low' | 'normal' | 'high';
  mirrorNative?: boolean;
};

function pruneDedupe(obj: Record<string, number>): Record<string, number> {
  const cutoff = Date.now() - PRUNE_MS;
  const next: Record<string, number> = {};
  for (const [k, t] of Object.entries(obj)) {
    if (t > cutoff) next[k] = t;
  }
  return next;
}

function wasBehaviorSent(behaviorId: string, dateKey: string): boolean {
  try {
    const raw = localStorage.getItem(DEDUPE_KEY);
    if (!raw) return false;
    const o = JSON.parse(raw) as Record<string, number>;
    return typeof o[`${behaviorId}:${dateKey}`] === 'number';
  } catch {
    return false;
  }
}

function markBehaviorSent(behaviorId: string, dateKey: string): void {
  try {
    const raw = localStorage.getItem(DEDUPE_KEY);
    const o = pruneDedupe(raw ? (JSON.parse(raw) as Record<string, number>) : {});
    o[`${behaviorId}:${dateKey}`] = Date.now();
    localStorage.setItem(DEDUPE_KEY, JSON.stringify(o));
  } catch {
    /* ignore */
  }
}

const DEFAULT_RITUAL: Record<RitualTime, { hour: number; minute: number }> = {
  day: { hour: 6, minute: 0 },
  night: { hour: 21, minute: 0 }
};

const STREAK_INAPP_HOUR = 18;

function formatTime12(hour: number, minute: number): string {
  const isAm = hour < 12;
  const h12 = hour % 12 || 12;
  const mm = String(minute).padStart(2, '0');
  return `${h12}:${mm} ${isAm ? 'AM' : 'PM'}`;
}

/**
 * In-app (and optionally native tray via `notify`) nudges: streak at risk, routine reminders after due time.
 * Idempotent per local calendar day via `senay_behavior_notify_dedupe`.
 *
 * Routine: for each enabled ritual, once **local clock is at or past** that reminder time and there is no
 * reading logged today, we add one in-app item (and mirror to tray on native). Matches user expectation
 * that “morning routine at 8:00” surfaces in the notification center after 8:00 — not 90+ minutes later.
 */
export function runDailyBehaviorNotifications(
  stats: UserStats,
  notify: (n: BehaviorNotifyInput) => void
): void {
  const now = new Date();
  const todayStr = getLocalDateString(now);
  const sessionsToday = stats.studyHistory[todayStr] ?? 0;
  if (sessionsToday > 0) return;

  const hour = now.getHours();

  if ((stats.streak ?? 0) >= 1 && hour >= STREAK_INAPP_HOUR && !wasBehaviorSent('streak_risk', todayStr)) {
    markBehaviorSent('streak_risk', todayStr);
    notify({
      title: 'Streak at risk',
      body: `You have a ${stats.streak}-day streak. Take a few minutes for today's reading before the day ends.`,
      type: 'warning',
      priority: 'high',
      mirrorNative: true
    });
  }

  // Same default as syncRitualRemindersFromStats so Settings UI + native + in-app stay aligned.
  const rituals: RitualTime[] = stats.preferredRituals?.length ? stats.preferredRituals : ['day'];
  const times = stats.ritualReminderTimes || {};
  const nowMins = now.getHours() * 60 + now.getMinutes();

  for (const r of rituals) {
    const t = times[r] ?? DEFAULT_RITUAL[r];
    const ritualMins = t.hour * 60 + t.minute;
    const dedupeId = `routine_due_${r}`;
    if (nowMins < ritualMins) continue;
    if (wasBehaviorSent(dedupeId, todayStr)) continue;

    markBehaviorSent(dedupeId, todayStr);
    const label = r === 'day' ? 'Morning routine' : 'Evening routine';
    const timeLabel = formatTime12(t.hour, t.minute);
    notify({
      title: label,
      body: `It's past your ${timeLabel} reminder — open Senay for reading and prayer when you're ready.`,
      type: 'info',
      priority: 'normal',
      mirrorNative: true
    });
  }
}
