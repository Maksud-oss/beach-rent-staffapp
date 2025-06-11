import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.staffapp',
  appName: 'staffapp',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  }
};

export default config;
