
import React, { useState } from 'react';
import { Icons } from '../constants';

interface Props {
  onLogin: (profile: any) => void;
}

const LoginPage: React.FC<Props> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const simulateLogin = (provider: 'google' | 'facebook' | 'guest') => {
    setIsLoading(provider);
    setTimeout(() => {
      if (provider === 'guest') {
        onLogin({
          name: 'Faithful Seeker',
          email: 'guest@senay.local',
          photoURL: '',
          provider: 'guest'
        });
      } else {
        onLogin({
          name: provider === 'google' ? 'Yared Tesfaye' : 'Selamawit Kassa',
          email: provider === 'google' ? 'yared.t@example.com' : 'selam.k@example.com',
          photoURL: '', 
          provider
        });
      }
      setIsLoading(null);
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[var(--gold)]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-[var(--gold)]/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="z-10 w-full max-w-md space-y-12 animate-in fade-in zoom-in duration-1000">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-24 h-24 bg-[var(--card-bg)] border border-theme rounded-[2.5rem] flex items-center justify-center text-[var(--gold)] shadow-2xl relative group overflow-hidden">
            <div className="absolute inset-0 bg-[var(--gold)]/5 animate-pulse" />
            <Icons.Lotus className="w-12 h-12" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-5xl serif gold-glow tracking-[0.2em] text-[var(--gold)] font-bold">SENAY</h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--text-muted)] font-bold">The Way of Understanding</p>
          </div>
        </div>

        <div className="bg-[var(--card-bg)] border border-theme rounded-[3rem] p-10 space-y-8 shadow-2xl backdrop-blur-sm">
          <div className="text-center space-y-2">
            <h2 className="text-xl serif text-[var(--text-primary)]">Welcome, Seekers</h2>
            <p className="text-xs text-[var(--text-muted)]">Sign in to sync your progress, or explore as a guest.</p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => simulateLogin('google')}
              disabled={!!isLoading}
              className="w-full flex items-center justify-center space-x-4 bg-[var(--text-primary)] text-[var(--bg-primary)] py-4 rounded-full font-bold transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {isLoading === 'google' ? (
                <div className="w-5 h-5 border-2 border-[var(--bg-primary)]/20 border-t-[var(--bg-primary)] rounded-full animate-spin" />
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.712s.102-1.173.282-1.712V4.956H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.044l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.454 0 2.423 2.044.957 4.956l3.007 2.332c.708-2.127 2.692-3.711 5.036-3.711z" fill="#EA4335"/></svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <button 
              onClick={() => simulateLogin('facebook')}
              disabled={!!isLoading}
              className="w-full flex items-center justify-center space-x-4 bg-[#1877F2] text-white py-4 rounded-full font-bold transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {isLoading === 'facebook' ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 18 18"><path d="M18 9c0-4.97-4.03-9-9-9S0 4.03 0 9c0 4.49 3.28 8.21 7.59 8.89v-6.29H5.3v-2.6h2.29V6.41c0-2.26 1.34-3.51 3.4-3.51.99 0 2.02.18 2.02.18v2.22h-1.14c-1.12 0-1.47.7-1.47 1.41v1.69h2.5l-.4 2.6h-2.1v6.29C14.72 17.21 18 13.49 18 9z" fill="white"/></svg>
                  <span>Continue with Facebook</span>
                </>
              )}
            </button>
            
            <div className="pt-2">
              <button 
                onClick={() => simulateLogin('guest')}
                disabled={!!isLoading}
                className="w-full py-4 rounded-full border border-theme text-[var(--text-muted)] hover:text-[var(--gold)] hover:border-[var(--gold)]/30 transition-all text-sm font-bold active:scale-95 flex items-center justify-center space-x-2"
              >
                <span>Try as Guest</span>
              </button>
            </div>
          </div>

          <p className="text-[9px] text-[var(--text-muted)] text-center uppercase tracking-widest leading-loose">
            By entering, you accept our <br/> sacred terms of service and privacy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
