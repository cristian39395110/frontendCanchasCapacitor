//capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.canchas.app',
  appName: 'canchas-pwa',
  webDir: 'dist',
  server: {
    cleartext: true
  }
};

export default config;
