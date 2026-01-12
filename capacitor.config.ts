import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.senay.app',
  appName: 'Senay',
  webDir: 'dist',
  android: {
    assetsPath: 'public'
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 3000,
      "androidScaleType": "CENTER_CROP",
      "showSpinner": false,
      "splashFullScreen": true,
      "splashImmersive": true
    }
  }
};

export default config;
