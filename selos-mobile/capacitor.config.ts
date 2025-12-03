import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.selos.mobile',
  appName: 'Selos Mobile',
  webDir: 'dist',
  server: {
    androidScheme: 'http'
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    }
  }
};

export default config;

