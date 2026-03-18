import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

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
export const auth = getAuth(app);
export const firebaseApp = app;

