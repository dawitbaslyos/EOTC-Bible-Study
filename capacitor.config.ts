import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.senay.app',
  appName: 'Senay',
  webDir: 'dist',
  android: {
    assetsPath: 'public',
    iconColor: '#d4af37',
    backgroundColor: '#0a0a0c'
  },
  ios: {
    iconColor: '#d4af37',
    backgroundColor: '#0a0a0c'
  },
  plugins: {
    // Native Google Sign-In → Firebase needs the Web OAuth client ID as serverClientId
    // (same value as in android/app/google-services.json oauth_client client_type 3).
    // Native Android reads androidClientId / clientId — NOT serverClientId (see plugin GoogleAuth.java).
    // Must be the Web OAuth client ID (same as Firebase “Web client” / ID token audience).
    GoogleAuth: {
      scopes: ['profile', 'email'],
      // Must match Web OAuth client in google-services.json (type 3) for Firebase ID tokens.
      serverClientId:
        '1082609416678-b7qapm38f0o0n7livl18d2mfef1g8d95.apps.googleusercontent.com',
      clientId:
        '1082609416678-b7qapm38f0o0n7livl18d2mfef1g8d95.apps.googleusercontent.com',
      // Android OAuth client (type 1): upload / local debug SHA. google-services.json also lists
      // Play App Signing client (ak97urfu…) + Google Play SHA — both are merged at build time.
      androidClientId:
        '1082609416678-iu2u58qe89a2lilcbr8devge8pcbj0rr.apps.googleusercontent.com',
      // Extra server auth step often hangs after account/email picker on some devices.
      forceCodeForRefreshToken: false
    },
    SplashScreen: {
      launchShowDuration: 3000,
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      backgroundColor: '#0a0a0c'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0a0a0c'
    }
  }
};

export default config;
