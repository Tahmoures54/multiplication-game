import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.arsha.fishmath',
  appName: 'ماهیگیری جدول ضرب',
  webDir: 'dist',
  android: {
    buildOptions: {
      // برای گوگل‌پلی بهتر است AAB استفاده شود
      releaseType: 'AAB',
    },
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#0B3D91',
      showSpinner: false,
    },
  },
};

export default config;
