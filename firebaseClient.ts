import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  browserLocalPersistence,
  browserPopupRedirectResolver
} from 'firebase/auth';
import type { Auth } from 'firebase/auth';

// Firebase configuration
// (edit here if you change Firebase project)
const firebaseConfig = {
  apiKey: 'AIzaSyAd3iBHh-CgTio1o64FHKt8PuUXrWdNOMQ',
  authDomain: 'senay-8f8de.firebaseapp.com',
  projectId: 'senay-8f8de',
  storageBucket: 'senay-8f8de.firebasestorage.app',
  messagingSenderId: '1082609416678',
  appId: '1:1082609416678:web:88a93f20be14131ee7fe27'
};

const app = initializeApp(firebaseConfig);

/**
 * Web: `signInWithPopup` / redirect need `browserPopupRedirectResolver` or Firebase throws
 * `auth/argument-error` (modular SDK). Native WebView still uses the same Auth for `signInWithCredential`.
 */
function createAuth(): Auth {
  try {
    return initializeAuth(app, {
      persistence: browserLocalPersistence,
      popupRedirectResolver: browserPopupRedirectResolver
    });
  } catch {
    return getAuth(app);
  }
}

export const auth = createAuth();
export const firebaseApp = app;
