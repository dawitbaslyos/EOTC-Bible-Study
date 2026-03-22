import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Icons } from '../constants';
import { auth } from '../firebaseClient';
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  signOut
} from 'firebase/auth';

interface Props {
  onLogin: (profile: any) => void;
}

const WEB_CLIENT_ID =
  '1082609416678-b7qapm38f0o0n7livl18d2mfef1g8d95.apps.googleusercontent.com';

const providerFromUser = (user: any): 'google' | 'facebook' => {
  const providerId = user?.providerData?.[0]?.providerId;
  return providerId === 'facebook.com' ? 'facebook' : 'google';
};

/** Passing `undefined` as the 2nd arg can trigger `auth/argument-error` in some Firebase versions. */
function firebaseGoogleCredential(idToken: string, accessToken?: string | null) {
  const at = accessToken?.trim?.() ? accessToken : null;
  return at ? GoogleAuthProvider.credential(idToken, at) : GoogleAuthProvider.credential(idToken);
}

/**
 * Android: Codetrix GoogleAuth often returns from the account sheet without resolving `signIn()` the first time.
 * Racing with `appStateChange` + `refresh()` mirrors the "tap Sign in again" workaround.
 */
async function androidGoogleUserAfterPicker(): Promise<any> {
  let listener: { remove: () => Promise<void> } | undefined;
  const signal = { done: false };
  let sawInactive = false;

  const resumeRefreshPromise = new Promise<any>((resolve) => {
    void App.addListener('appStateChange', async ({ isActive }) => {
      if (signal.done) return;
      if (!isActive) {
        sawInactive = true;
        return;
      }
      if (!sawInactive) return;
      await new Promise((r) => setTimeout(r, 450));
      if (signal.done) return;
      try {
        // Plugin typings say `refresh()` returns `Authentication`, but runtime returns full User (with `.authentication`).
        const u = (await GoogleAuth.refresh()) as any;
        if (u?.authentication?.idToken) {
          signal.done = true;
          void listener?.remove();
          resolve(u);
        }
      } catch {
        /* ignore */
      }
    }).then((h) => {
      listener = h;
    });
  });

  const signInPromise = GoogleAuth.signIn().then((u) => {
    if (!signal.done) {
      signal.done = true;
      void listener?.remove();
    }
    return u;
  });

  try {
    return await Promise.race([
      withTimeout(signInPromise, 90_000, 'Google sign-in'),
      resumeRefreshPromise
    ]);
  } finally {
    signal.done = true;
    void listener?.remove();
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s. Try again or check your connection.`));
    }, ms);
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(timer);
        reject(e);
      });
  });
}

const LoginPage: React.FC<Props> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const didEnterRef = useRef(false);
  const onLoginRef = useRef(onLogin);
  onLoginRef.current = onLogin;

  const enterFromFirebaseUser = useCallback((user: any) => {
    if (!user) return;
    // Do not skip when didEnterRef is true — that blocked navigation after Google (race with onAuthStateChanged).
    setAuthError(null);
    try {
      onLoginRef.current({
        name: user.displayName || 'Senay User',
        email: user.email || '',
        photoURL: user.photoURL || '',
        uid: user.uid || '',
        firebaseUid: user.uid || undefined,
        provider: providerFromUser(user)
      });
      didEnterRef.current = true;
    } catch (e) {
      console.error('onLogin failed:', e);
      setAuthError('Could not finish sign-in. Please try again.');
    }
  }, []);

  // Native: preload Google Sign-In with explicit Web client ID (must match capacitor.config + strings.xml).
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    GoogleAuth.initialize({
      clientId: WEB_CLIENT_ID,
      scopes: ['profile', 'email', 'openid'],
      grantOfflineAccess: false
    }).catch((err) => {
      console.warn('GoogleAuth.initialize failed:', err);
    });
  }, []);

  const simulateGuestLogin = () => {
    setIsLoading('guest');
    setTimeout(() => {
      // Clear any Firebase session so App sync listener doesn't fight guest mode.
      void signOut(auth).catch(() => {});
      didEnterRef.current = false;
      onLogin({
        name: 'Faithful Seeker',
        email: 'guest@senay.local',
        photoURL: '',
        uid: '',
        provider: 'guest'
      });
      setIsLoading(null);
    }, 600);
  };

  const handleOAuthLogin = async (providerType: 'google' | 'facebook') => {
    setIsLoading(providerType);
    setAuthError(null);
    try {
      if (providerType === 'google') {
        // Android/iOS: native account picker + ID token → Firebase (no external browser tab).
        if (Capacitor.isNativePlatform()) {
          didEnterRef.current = false;
          // Native plugin uses clientId / androidClientId from capacitor.config — ensure init gets explicit clientId too.
          await GoogleAuth.initialize({
            clientId: WEB_CLIENT_ID,
            scopes: ['profile', 'email', 'openid'],
            grantOfflineAccess: false
          });
          await auth.authStateReady();
          const googleUser =
            Capacitor.getPlatform() === 'android'
              ? await androidGoogleUserAfterPicker()
              : await withTimeout(GoogleAuth.signIn(), 90_000, 'Google sign-in');
          const idToken = googleUser.authentication?.idToken;
          if (!idToken) {
            throw new Error('GOOGLE_NO_TOKEN');
          }
          const accessToken = googleUser.authentication?.accessToken;
          const credential = firebaseGoogleCredential(idToken, accessToken);
          try {
            const cred = await signInWithCredential(auth, credential);
            await auth.authStateReady();
            const u = cred.user ?? auth.currentUser;
            if (!u) {
              throw new Error('SIGNIN_NO_USER');
            }
            // Always run app login (welcome + phase) — do not rely only on App’s auth listener on native WebView.
            enterFromFirebaseUser(u);
          } catch (firebaseErr: any) {
            // Very common on Android when debug SHA-1 / Android OAuth client isn’t registered in Firebase.
            console.error('Firebase signInWithCredential failed:', firebaseErr);
            await signOut(auth).catch(() => {});

            const g = googleUser as Record<string, unknown>;
            const gid =
              (g.id as string | undefined) ??
              (g.userId as string | undefined) ??
              (g.sub as string | undefined) ??
              String((g.email as string) || 'unknown');
            const given = g.givenName as string | undefined;
            const family = g.familyName as string | undefined;
            const fromParts = [given, family].filter(Boolean).join(' ');
            const displayName =
              (g.name as string | undefined) || fromParts || 'Senay User';

            didEnterRef.current = false;
            onLoginRef.current({
              name: displayName,
              email: (g.email as string) || '',
              photoURL:
                (g.imageUrl as string | undefined) ||
                (g.picture as string | undefined) ||
                '',
              uid: `native_${gid}`,
              provider: 'google'
            });
            didEnterRef.current = true;
            setAuthError(null);
          }
        } else {
          didEnterRef.current = false;
          await auth.authStateReady();
          const googleProvider = new GoogleAuthProvider();
          googleProvider.addScope('profile');
          googleProvider.addScope('email');
          googleProvider.setCustomParameters({ prompt: 'select_account' });
          const result = await signInWithPopup(auth, googleProvider);
          enterFromFirebaseUser(result.user);
        }
        return;
      }

      const provider = new FacebookAuthProvider();
      await signInWithRedirect(auth, provider);
    } catch (err: any) {
      const code = String(err?.code ?? err?.error?.code ?? err?.error ?? '');
      const msg = String(err?.message ?? err?.error?.message ?? err ?? '');
      const cancelled =
        code === '10' ||
        code === '12501' ||
        /cancel|canceled|12501|SIGN_IN_CANCELLED/i.test(msg);
      if (!cancelled) {
        console.error('OAuth login failed:', err);
        const friendly =
          err?.code === 'auth/invalid-credential' || err?.code === 'auth/account-exists-with-different-credential'
            ? 'Couldn’t verify your Google account. Try again, or use Try as Guest and contact support if it keeps happening.'
            : err?.message === 'GOOGLE_NO_TOKEN'
              ? 'Google sign-in didn’t finish. Please try again.'
              : err?.message === 'SIGNIN_NO_USER'
                ? 'Sign-in didn’t complete. Please try again.'
              : msg
                ? code && !msg.includes(code) && import.meta.env.DEV
                  ? `${msg} (${code})`
                  : msg
                : code && import.meta.env.DEV
                  ? `Sign-in failed (${code}). Please try again.`
                  : 'Sign-in failed. Please try again.';
        setAuthError(friendly);
      }
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[var(--gold)]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-[var(--gold)]/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="z-10 w-full max-w-md space-y-12 animate-in fade-in zoom-in duration-1000">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-24 h-24 bg-[var(--card-bg)] border border-theme rounded-[2.5rem] flex items-center justify-center shadow-2xl relative group overflow-hidden">
            <div className="absolute inset-0 bg-[var(--gold)]/5 animate-pulse" />
            <Icons.Logo className="w-16 h-16 object-contain" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-5xl serif gold-glow text-[var(--gold)] font-bold tracking-[0.2em]">SENAY</h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--text-muted)] font-bold">The Way of Understanding</p>
          </div>
        </div>

        <div className="bg-[var(--bg-secondary)] border border-theme rounded-[3rem] p-10 space-y-8 shadow-2xl">
          <div className="text-center space-y-2">
            <h2 className="text-xl serif text-[var(--text-primary)]">Welcome, Seekers</h2>
            <p className="text-xs text-[var(--text-muted)]">Sign in to sync your progress, or explore as a guest.</p>
          </div>

          {authError && (
            <p className="text-xs text-red-400/90 text-center leading-relaxed px-2" role="alert">
              {authError}
            </p>
          )}

          <div className="space-y-4">
            <button 
              onClick={() => handleOAuthLogin('google')}
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
              onClick={() => handleOAuthLogin('facebook')}
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
                onClick={() => simulateGuestLogin()}
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
