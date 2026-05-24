import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uz.vokabi.app',
  appName: 'Vokabi',
  webDir: 'dist',
  server: {
    // Production uchun — live URL ishlatadi
    url: 'https://vokabi.uz',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#09090b',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#09090b',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#09090b',
    },
  },
};

export default config;
