import { ExpoConfig, ConfigContext } from 'expo/config';

const FORGE_SPLASH_IOS = './assets/images/forge-splash.png';
/** Square logo-on-black for Android Splash Screen API (centered icon, not full-bleed). */
const FORGE_SPLASH_ANDROID = './assets/images/forge-splash-android.png';
const FORGE_SPLASH_BG = '#000000';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Forge',
  slug: 'forge',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'forge',
  userInterfaceStyle: 'automatic',
  // Legacy top-level splash (iOS-oriented full art). Platform overrides + plugin below win.
  splash: {
    image: FORGE_SPLASH_IOS,
    resizeMode: 'contain',
    backgroundColor: FORGE_SPLASH_BG,
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.aashaydoshi1.forge',
    splash: {
      image: FORGE_SPLASH_IOS,
      resizeMode: 'cover',
      backgroundColor: FORGE_SPLASH_BG,
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#0d0d12',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
    },
    package: 'com.aashaydoshi1.forge',
    predictiveBackGestureEnabled: false,
    softwareKeyboardLayoutMode: 'resize',
    splash: {
      image: FORGE_SPLASH_ANDROID,
      resizeMode: 'contain',
      backgroundColor: FORGE_SPLASH_BG,
    },
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-dev-client',
    [
      'expo-splash-screen',
      {
        backgroundColor: FORGE_SPLASH_BG,
        // Defaults favor Android (logo icon). iOS override keeps full-bleed splash art.
        image: FORGE_SPLASH_ANDROID,
        resizeMode: 'contain',
        imageWidth: 200,
        ios: {
          image: FORGE_SPLASH_IOS,
          backgroundColor: FORGE_SPLASH_BG,
          resizeMode: 'cover',
          enableFullScreenImage_legacy: true,
        },
        android: {
          image: FORGE_SPLASH_ANDROID,
          backgroundColor: FORGE_SPLASH_BG,
          resizeMode: 'contain',
          // ~200dp logo sits correctly in Android 12+ splash icon bounds.
          imageWidth: 200,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: '264d56ff-a0ab-4022-b804-7986767b04d0',
    },
  },
  owner: 'aashay1',
});
