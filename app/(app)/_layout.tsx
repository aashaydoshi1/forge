import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect, Stack, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';

import { LoadingScreen } from '@/components/layout/LoadingScreen';
import { useAuth } from '@/features/auth/context/AuthProvider';
import { fetchWorkoutPlans } from '@/lib/supabase/workouts';

type FirstRunGate = 'loading' | 'first-run' | 'ready';

function skipStarterKey(userId: string) {
  return `forge:skip-starter:${userId}`;
}

export default function AppLayout() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [gate, setGate] = useState<FirstRunGate>('loading');
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkFirstRun() {
      setIsChecking(true);

      if (!user?.id) {
        if (active) {
          setGate('ready');
          setIsChecking(false);
        }
        return;
      }

      try {
        const [plans, skipped] = await Promise.all([
          fetchWorkoutPlans(user.id),
          AsyncStorage.getItem(skipStarterKey(user.id)),
        ]);

        if (!active) return;

        if (plans.length === 0 && skipped !== '1') {
          setGate('first-run');
        } else {
          setGate('ready');
        }
      } catch {
        if (active) setGate('ready');
      } finally {
        if (active) setIsChecking(false);
      }
    }

    void checkFirstRun();

    return () => {
      active = false;
    };
  }, [user?.id, pathname]);

  const onFirstWorkout = pathname.includes('first-workout');

  if (gate === 'loading') {
    return <LoadingScreen message="Loading Forge..." />;
  }

  return (
    <>
      {gate === 'first-run' && !onFirstWorkout && !isChecking ? (
        <Redirect href="/first-workout" />
      ) : null}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0d0d12' } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="first-workout" />
        <Stack.Screen name="workout-details" />
        <Stack.Screen name="active-workout" />
        <Stack.Screen name="workout-summary" />
        <Stack.Screen name="workout-history-details" />
      </Stack>
    </>
  );
}
