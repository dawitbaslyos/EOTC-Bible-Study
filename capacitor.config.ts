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
