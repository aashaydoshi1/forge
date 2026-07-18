import '../global.css';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { LoadingScreen } from '@/components/layout/LoadingScreen';
import { useAuth } from '@/features/auth/context/AuthProvider';
import { Providers } from '@/providers/Providers';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, hasProfile, isLoading, isProfileLoading } = useAuth();

  if (isLoading || (session && isProfileLoading)) {
    return <LoadingScreen message="Starting Forge..." />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0d0d12' } }}>
      {/* Always reachable after email confirmation — no session required */}
      <Stack.Screen name="email-verified" />
      <Stack.Protected guard={!!session && hasProfile}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!!session && !hasProfile}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <Providers>
      <RootNavigator />
    </Providers>
  );
}
