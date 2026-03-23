
import React, { useState } from 'react';
import { Icons } from '../constants';
import type { AppContentLanguage, Theme, RitualTime, UserStats } from '../types';
import { useAppLanguage } from '../contexts/AppLanguageContext';
import { AppLockSettings } from './AppLockSettings';

interface Props {
  onClose: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  rituals: RitualTime[];
  setRituals: (rituals: RitualTime[]) => void;
  ritualReminderTimes?: UserStats['ritualReminderTimes'];
  setRitualReminderTimes: (t: UserStats['ritualReminderTimes']) => void;
  onLogout: () => void;
  /** Android: re-open native permission / alarm setup */
  onOpenAndroidPermissions?: () => void;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

const SettingsPage: React.FC<Props> = ({ 
  onClose, theme, setTheme, rituals, setRituals, ritualReminderTimes, setRitualReminderTimes, onLogout,
  onOpenAndroidPermissions
}) => {
  const { language, setLanguage, t } = useAppLanguage();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const toggleRitual = (r: RitualTime) => {
    if (rituals.includes(r)) {
      if (rituals.length > 1) {
        setRituals(rituals.filter(i => i !== r));
      }
    } else {
      setRituals([...rituals, r]);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-primary)] animate-in fade-in duration-500 overflow-y-auto custom-scrollbar h-full">
      <header className="px-8 pb-8 pt-[max(2rem,env(safe-area-inset-top,0px))] border-b border-theme flex justify-between items-center sticky top-0 bg-[var(--bg-primary)]/95 z-10 backdrop-blur-md">
        <div>
          <h2 className="text-3xl serif text-[var(--gold)]">{t('settings.title')}</h2>
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-black">{t('settings.preferences')}</p>
        </div>
        <button onClick={onClose} className="p-3 bg-[var(--card-bg)] border border-theme rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all">
          <Icons.Close />
        </button>
      </header>

      <div className="p-6 md:p-10 space-y-12 max-w-2xl mx-auto w-full pb-32">
        {/* Appearance Section */}
        <section className="space-y-6">
          <div className="flex items-center space-x-3 text-[var(--gold)]">
            <Icons.Sun className="w-5 h-5" />
            <h3 className="uppercase text-xs font-black tracking-[0.2em]">{t('settings.appearance')}</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center space-y-3 ${theme === 'dark' ? 'bg-[var(--gold-muted)] border-[var(--gold)] shadow-lg' : 'bg-[var(--card-bg)] border-theme hover:border-[var(--gold)]/30'}`}
            >
              <Icons.Moon className={`w-8 h-8 mb-2 shrink-0 ${theme === 'dark' ? 'text-[var(--gold)]' : 'text-[var(--text-secondary)]'}`} />
              <div className="text-sm font-bold text-[var(--text-primary)]">{t('settings.darkMode')}</div>
              <p className="text-[9px] text-[var(--text-secondary)] uppercase tracking-tighter text-center leading-snug">{t('settings.darkModeDesc')}</p>
            </button>
            <button 
              type="button"
              onClick={() => setTheme('light')}
              className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center space-y-3 ${theme === 'light' ? 'bg-[var(--gold-muted)] border-[var(--gold)] shadow-lg' : 'bg-[var(--card-bg)] border-theme hover:border-[var(--gold)]/30'}`}
            >
              <Icons.Sun className={`w-8 h-8 mb-2 shrink-0 ${theme === 'light' ? 'text-[var(--gold)]' : 'text-[var(--text-secondary)]'}`} />
              <div className="text-sm font-bold text-[var(--text-primary)]">{t('settings.lightMode')}</div>
              <p className="text-[9px] text-[var(--text-secondary)] uppercase tracking-tighter text-center leading-snug">{t('settings.lightModeDesc')}</p>
            </button>
          </div>
        </section>

        {/* App language */}
        <section className="space-y-6">
          <div className="flex items-center space-x-3 text-[var(--gold)]">
            <Icons.Feather className="w-5 h-5" />
            <h3 className="uppercase text-xs font-black tracking-[0.2em]">{t('settings.appLanguage')}</h3>
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed -mt-2">{t('settings.appLanguageHint')}</p>
          <div className="grid grid-cols-2 gap-4">
            {(['english', 'amharic'] satisfies AppContentLanguage[]).map((code) => {
              const active = language === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLanguage(code)}
                  className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center space-y-2 ${
                    active
                      ? 'bg-[var(--gold-muted)] border-[var(--gold)] shadow-lg'
                      : 'bg-[var(--card-bg)] border-theme hover:border-[var(--gold)]/30'
                  }`}
                >
                  <div className={`text-sm font-bold ${active ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                    {code === 'english' ? t('settings.langEnglish') : t('settings.langAmharic')}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Rituals Section */}
        <section className="space-y-6">
          <div className="flex items-center space-x-3 text-[var(--gold)]">
            <Icons.Lotus className="w-5 h-5" />
            <h3 className="uppercase text-xs font-black tracking-[0.2em]">{t('settings.dailyRoutine')}</h3>
          </div>
          <div className="space-y-3">
            {[
              { id: 'day' as RitualTime, label: t('settings.morningRoutine'), icon: <Icons.Sun className="w-5 h-5" />, desc: t('settings.morningRoutineDesc') },
              { id: 'night' as RitualTime, label: t('settings.eveningRoutine'), icon: <Icons.Moon className="w-5 h-5" />, desc: t('settings.eveningRoutineDesc') }
            ].map((r) => {
              const active = rituals.includes(r.id);
              const defaults = r.id === 'day' ? { hour: 6, minute: 0 } : { hour: 21, minute: 0 };
              const reminder = ritualReminderTimes?.[r.id] ?? defaults;
              const timeValue = `${pad2(reminder.hour)}:${pad2(reminder.minute)}`;
              return (
                <div key={r.id} className="space-y-2">
                  <button 
                    type="button"
                    onClick={() => toggleRitual(r.id)}
                    className={`w-full p-6 rounded-3xl border-2 flex items-center justify-between transition-all ${active ? 'bg-[var(--gold-muted)] border-[var(--gold)] shadow-md' : 'bg-[var(--card-bg)] border-theme opacity-60'}`}
                  >
                    <div className="flex items-center space-x-5">
                      <div className={active ? 'text-[var(--gold)]' : 'text-[var(--text-secondary)]'}>{r.icon}</div>
                      <div className="text-left">
                        <div className={`text-sm font-bold ${active ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>{r.label}</div>
                        <div className="text-[9px] text-[var(--text-secondary)] uppercase tracking-tighter">{r.desc}</div>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${active ? 'border-[var(--gold)] bg-[var(--gold)]' : 'border-theme'}`}>
                      {active && <Icons.ChevronRight className="w-3 h-3 text-black" />}
                    </div>
                  </button>
                  {active && (
                    <label className="flex items-center justify-between gap-4 px-4 py-3 rounded-2xl bg-[var(--card-bg)] border border-theme">
                      <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">{t('settings.reminderTime')}</span>
                      <input
                        type="time"
                        value={timeValue}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (!v) return;
                          const [hh, mm] = v.split(':').map((x) => parseInt(x, 10));
                          if (Number.isNaN(hh) || Number.isNaN(mm)) return;
                          setRitualReminderTimes({
                            ...ritualReminderTimes,
                            [r.id]: { hour: hh, minute: mm }
                          });
                        }}
                        className="bg-[var(--input-bg)] text-[var(--text-primary)] text-sm font-mono border border-theme rounded-lg px-2 py-1 [color-scheme:inherit]"
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <AppLockSettings />

        {onOpenAndroidPermissions && (
          <section className="space-y-4">
            <div className="flex items-center space-x-3 text-[var(--gold)]">
              <Icons.Bell className="w-5 h-5" />
              <h3 className="uppercase text-xs font-black tracking-[0.2em]">{t('settings.androidPerms')}</h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {t('settings.androidPermsBody')}
            </p>
            <button
              type="button"
              onClick={onOpenAndroidPermissions}
              className="w-full p-5 rounded-3xl border-2 border-theme bg-[var(--card-bg)] text-left text-sm font-bold text-[var(--text-primary)] hover:border-[var(--gold)]/40 transition-all"
            >
              {t('settings.reviewPerms')}
            </button>
          </section>
        )}

        {/* Account Section */}
        <section className="pt-10 border-t border-theme">
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full p-6 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-3"
          >
            <Icons.Close className="w-4 h-4" />
            <span>{t('settings.signOut')}</span>
          </button>
        </section>
      </div>

      {/* Logout Confirmation Popup */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative w-full max-w-xs bg-[var(--bg-primary)] border border-theme rounded-[2.5rem] p-8 text-center space-y-6 shadow-2xl">
            <h3 className="serif text-2xl text-[var(--text-primary)]">{t('settings.signOutTitle')}</h3>
            <p className="text-xs text-[var(--text-muted)]">{t('settings.signOutBody')}</p>
            <div className="flex flex-col space-y-3">
              <button onClick={onLogout} className="w-full bg-red-500 text-white font-black py-4 rounded-full text-[10px] uppercase tracking-widest shadow-lg">{t('settings.confirmLogout')}</button>
              <button onClick={() => setShowLogoutConfirm(false)} className="w-full bg-[var(--card-bg)] text-[var(--text-muted)] font-bold py-4 rounded-full text-[10px] uppercase tracking-widest border border-theme">{t('settings.cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
