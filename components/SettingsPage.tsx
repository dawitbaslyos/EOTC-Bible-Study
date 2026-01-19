import React, { useState } from 'react';
import { Icons } from '../constants';
import { Theme, RitualTime } from '../types';

interface Props {
  onClose: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  rituals: RitualTime[];
  setRituals: (rituals: RitualTime[]) => void;
  isPremium?: boolean;
  onTogglePremium: () => void;
  onLogout: () => void;
}

const SettingsPage: React.FC<Props> = ({ 
  onClose, theme, setTheme, rituals, setRituals, isPremium, onTogglePremium, onLogout 
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPurchaseConfirm, setShowPurchaseConfirm] = useState(false);

  const toggleRitual = (r: RitualTime) => {
    if (rituals.includes(r)) {
      if (rituals.length > 1) {
        setRituals(rituals.filter(i => i !== r));
      }
    } else {
      setRituals([...rituals, r]);
    }
  };

  const handlePurchase = () => {
    setShowPurchaseConfirm(false);
    onTogglePremium();
  };

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-primary)] animate-in fade-in duration-500 overflow-y-auto custom-scrollbar h-full">
      <header className="p-8 border-b border-theme flex justify-between items-center sticky top-0 bg-[var(--bg-primary)]/80 z-10 backdrop-blur-md">
        <div>
          <h2 className="text-3xl serif text-[var(--gold)]">Settings</h2>
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-black">Preferences</p>
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
            <h3 className="uppercase text-xs font-black tracking-[0.2em]">Appearance</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setTheme('dark')}
              className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center space-y-3 ${theme === 'dark' ? 'bg-[var(--gold-muted)] border-[var(--gold)] shadow-lg' : 'bg-[var(--card-bg)] border-theme hover:border-[var(--gold)]/30'}`}
            >
              <Icons.Moon className="w-8 h-8 mb-2" />
              <div className="text-sm font-bold">Dark Mode</div>
              <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-tighter text-center">Gentle on eyes</p>
            </button>
            <button 
              onClick={() => setTheme('light')}
              className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center space-y-3 ${theme === 'light' ? 'bg-[var(--gold-muted)] border-[var(--gold)] shadow-lg' : 'bg-[var(--card-bg)] border-theme hover:border-[var(--gold)]/30'}`}
            >
              <Icons.Sun className="w-8 h-8 mb-2" />
              <div className="text-sm font-bold">Light Mode</div>
              <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-tighter text-center">For clear daylight</p>
            </button>
          </div>
        </section>

        {/* Rituals Section */}
        <section className="space-y-6">
          <div className="flex items-center space-x-3 text-[var(--gold)]">
            <Icons.Lotus className="w-5 h-5" />
            <h3 className="uppercase text-xs font-black tracking-[0.2em]">Daily Routine</h3>
          </div>
          <div className="space-y-3">
            {[
              { id: 'day' as RitualTime, label: 'Morning Routine', icon: <Icons.Sun className="w-5 h-5" />, desc: 'Start with clarity' },
              { id: 'night' as RitualTime, label: 'Evening Routine', icon: <Icons.Moon className="w-5 h-5" />, desc: 'End with reflection' }
            ].map((r) => {
              const active = rituals.includes(r.id);
              return (
                <button 
                  key={r.id}
                  onClick={() => toggleRitual(r.id)}
                  className={`w-full p-6 rounded-3xl border-2 flex items-center justify-between transition-all ${active ? 'bg-[var(--gold-muted)] border-[var(--gold)] shadow-md' : 'bg-[var(--card-bg)] border-theme opacity-60'}`}
                >
                  <div className="flex items-center space-x-5">
                    <div className={active ? 'text-[var(--gold)]' : 'text-[var(--text-muted)]'}>{r.icon}</div>
                    <div className="text-left">
                      <div className={`text-sm font-bold ${active ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>{r.label}</div>
                      <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-tighter">{r.desc}</div>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${active ? 'border-[var(--gold)] bg-[var(--gold)]' : 'border-theme'}`}>
                    {active && <Icons.ChevronRight className="w-3 h-3 text-black" />}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Subscription Section */}
        <section className="space-y-6">
          <div className="flex items-center space-x-3 text-[var(--gold)]">
            <Icons.Heart className="w-5 h-5" />
            <h3 className="uppercase text-xs font-black tracking-[0.2em]">Subscription</h3>
          </div>
          <div className="p-8 bg-[var(--gold-muted)] border border-[var(--gold)]/20 rounded-3xl text-center space-y-4">
            {isPremium ? (
              <>
                <div className="w-16 h-16 bg-[var(--gold)] rounded-2xl flex items-center justify-center mx-auto shadow-xl">
                  <Icons.Lotus className="w-8 h-8 text-black" />
                </div>
                <h4 className="serif text-xl">Premium Active</h4>
                <p className="text-xs text-[var(--text-secondary)]">Thank you for supporting this project. Blessings be upon you.</p>
                <button 
                  onClick={onTogglePremium}
                  className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] hover:text-red-500 transition-colors mt-4"
                >
                  Cancel Subscription
                </button>
              </>
            ) : (
              <>
                <h4 className="serif text-xl">Upgrade to Premium</h4>
                <p className="text-xs text-[var(--text-secondary)]">Unlock advanced insights and support the mission of understanding.</p>
                <button 
                  onClick={() => setShowPurchaseConfirm(true)}
                  className="w-full bg-[var(--gold)] text-black font-black py-4 rounded-full uppercase tracking-widest text-xs shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Subscribe for $4.99 / Year
                </button>
              </>
            )}
          </div>
        </section>

        {/* Account Section */}
        <section className="pt-10 border-t border-theme">
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full p-6 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-3"
          >
            <Icons.Close className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </section>
      </div>

      {/* Subscription Confirmation Popup */}
      {showPurchaseConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowPurchaseConfirm(false)} />
          <div className="relative w-full max-w-xs bg-[var(--bg-primary)] border border-theme rounded-[2.5rem] p-8 text-center space-y-6 shadow-2xl">
            <h3 className="serif text-2xl text-[var(--text-primary)]">Unlock Premium?</h3>
            <p className="text-xs text-[var(--text-muted)]">This will activate all premium features for $4.99 per year. Do you wish to proceed?</p>
            <div className="flex flex-col space-y-3">
              <button onClick={handlePurchase} className="w-full bg-[var(--gold)] text-black font-black py-4 rounded-full text-[10px] uppercase tracking-widest shadow-lg">Confirm & Subscribe</button>
              <button onClick={() => setShowPurchaseConfirm(false)} className="w-full bg-[var(--card-bg)] text-[var(--text-muted)] font-bold py-4 rounded-full text-[10px] uppercase tracking-widest border border-theme">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Popup */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative w-full max-w-xs bg-[var(--bg-primary)] border border-theme rounded-[2.5rem] p-8 text-center space-y-6 shadow-2xl">
            <h3 className="serif text-2xl text-[var(--text-primary)]">Sign Out?</h3>
            <p className="text-xs text-[var(--text-muted)]">Your progress will be saved. You can return anytime to continue.</p>
            <div className="flex flex-col space-y-3">
              <button onClick={onLogout} className="w-full bg-red-500 text-white font-black py-4 rounded-full text-[10px] uppercase tracking-widest shadow-lg">Confirm Logout</button>
              <button onClick={() => setShowLogoutConfirm(false)} className="w-full bg-[var(--card-bg)] text-[var(--text-muted)] font-bold py-4 rounded-full text-[10px] uppercase tracking-widest border border-theme">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;