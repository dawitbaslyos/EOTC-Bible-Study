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
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId:
        '1082609416678-1e3dmrq9k1pmh2dbl3cfrp8v34pakrrq.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
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
