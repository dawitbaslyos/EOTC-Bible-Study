import React, { useState } from 'react';
import { Icons } from '../constants';
import {
  requestAllSenayPermissions,
  openExactAlarmSettings,
  checkSenayPermissionStatus,
  isAndroidNative,
  type SenayPermissionStatus
} from '../utils/appPermissions';
import { syncRitualRemindersFromStats, rescheduleOpenAppReminder } from '../utils/nativeNotifications';
import type { UserStats } from '../types';

export const ANDROID_PERMISSIONS_DONE_KEY = 'senay_android_permissions_flow_done';

interface Props {
  stats: UserStats;
  onFinished: () => void;
  /** When true, user opened this from Settings (“Not now” won’t save a first-run skip). */
  isManualEntry?: boolean;
}

/**
 * Android: native system dialogs for notifications + microphone, then optional exact-alarm settings.
 */
const PermissionSetupModal: React.FC<Props> = ({ stats, onFinished, isManualEntry }) => {
  const [step, setStep] = useState<'intro' | 'summary'>('intro');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<SenayPermissionStatus | null>(null);

  if (!isAndroidNative()) return null;

  const refreshNotifications = () => {
    syncRitualRemindersFromStats(stats).catch(() => {});
    rescheduleOpenAppReminder(3).catch(() => {});
  };

  const markDoneAndClose = () => {
    localStorage.setItem(ANDROID_PERMISSIONS_DONE_KEY, 'true');
    refreshNotifications();
    onFinished();
  };

  const handleAllow = async () => {
    setBusy(true);
    try {
      const s = await requestAllSenayPermissions();
      setStatus(s);
      refreshNotifications();
      setStep('summary');
    } finally {
      setBusy(false);
    }
  };

  const handleOpenExactAlarms = async () => {
    setBusy(true);
    try {
      await openExactAlarmSettings();
      const s = await checkSenayPermissionStatus();
      setStatus(s);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-5 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md bg-[var(--bg-primary)] border border-[var(--gold)]/25 rounded-[2rem] p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-[var(--gold-muted)] border border-[var(--gold)]/30 flex items-center justify-center text-[var(--gold)]">
            <Icons.Bell className="w-8 h-8" />
          </div>
        </div>

        {step === 'intro' && (
          <>
            <div className="text-center space-y-2">
              <h2 className="text-2xl serif text-[var(--gold)] font-bold">Allow Senay</h2>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Android will show the official “Allow” prompts. Senay uses them for reminders, the home
                widget, and voice in Ask Memhir.
              </p>
            </div>
            <ul className="space-y-3 text-left text-xs text-[var(--text-muted)]">
              <li className="flex gap-3">
                <span className="text-[var(--gold)] shrink-0">•</span>
                <span><strong className="text-[var(--text-primary)]">Notifications</strong> — routines, feasts, and gentle reminders</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[var(--gold)] shrink-0">•</span>
                <span><strong className="text-[var(--text-primary)]">Microphone</strong> — voice questions in Ask Memhir</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[var(--gold)] shrink-0">•</span>
                <span><strong className="text-[var(--text-primary)]">Exact alarms (next screen if needed)</strong> — on-time widget &amp; schedules</span>
              </li>
            </ul>
            <button
              type="button"
              disabled={busy}
              onClick={handleAllow}
              className="w-full py-4 rounded-full bg-[var(--gold)] text-black font-black text-sm uppercase tracking-widest hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {busy ? 'Opening…' : 'Continue — system permissions'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isManualEntry) {
                  localStorage.setItem(ANDROID_PERMISSIONS_DONE_KEY, 'skipped');
                }
                onFinished();
              }}
              className="w-full py-3 text-[10px] uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Not now
            </button>
          </>
        )}

        {step === 'summary' && status && (
          <>
            <div className="text-center space-y-2">
              <h2 className="text-xl serif text-[var(--gold)] font-bold">Permissions</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                You can change these anytime in <strong className="text-[var(--text-primary)]">Settings → Apps → Senay</strong>.
              </p>
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] space-y-2 bg-[var(--card-bg)] rounded-xl p-4 border border-theme">
              <div>
                <span className="text-[var(--text-muted)]">Notifications: </span>
                <span className="text-[var(--text-primary)] font-medium">{status.notifications}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Microphone: </span>
                <span className="text-[var(--text-primary)] font-medium">{status.microphone}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Alarms &amp; reminders: </span>
                <span className="text-[var(--text-primary)] font-medium">
                  {status.exactAlarms ? 'Allowed' : 'Not allowed'}
                </span>
              </div>
            </div>
            {!status.exactAlarms && (
              <div className="space-y-2">
                <p className="text-xs text-[var(--text-secondary)] text-center">
                  For the widget clock and precise reminders, allow <strong>Alarms &amp; reminders</strong> for Senay.
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleOpenExactAlarms}
                  className="w-full py-4 rounded-full bg-[var(--card-bg)] border-2 border-[var(--gold)] text-[var(--gold)] font-bold text-xs uppercase tracking-widest hover:bg-[var(--gold-muted)] disabled:opacity-50"
                >
                  Open alarm settings
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={markDoneAndClose}
              className="w-full py-4 rounded-full bg-[var(--gold)] text-black font-black text-sm uppercase tracking-widest hover:brightness-110"
            >
              Continue to Senay
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PermissionSetupModal;
