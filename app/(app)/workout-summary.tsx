import { Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { FadeInView } from '@/components/motion';
import { Button } from '@/components/ui/Button';

function parseCount(value: string | string[] | undefined): number {
  const raw = typeof value === 'string' ? value : Array.isArray(value) ? value[0] : '0';
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function formatDuration(startedAt: string, finishedAt: string): string {
  const startMs = new Date(startedAt).getTime();
  const endMs = new Date(finishedAt).getTime();

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) {
    return '0:00';
  }

  const totalSeconds = Math.round((endMs - startMs) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function WorkoutSummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    name?: string;
    startedAt?: string;
    finishedAt?: string;
    exercisesCompleted?: string;
    setsCompleted?: string;
    beatLastCount?: string;
  }>();

  const workoutName =
    typeof params.name === 'string' && params.name.trim() ? params.name.trim() : 'Workout';
  const startedAt = typeof params.startedAt === 'string' ? params.startedAt : '';
  const finishedAt = typeof params.finishedAt === 'string' ? params.finishedAt : '';
  const exercisesCompleted = parseCount(params.exercisesCompleted);
  const setsCompleted = parseCount(params.setsCompleted);
  const beatLastCount = parseCount(params.beatLastCount);
  const durationLabel = formatDuration(startedAt, finishedAt);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Workout Complete',
          headerShown: true,
          headerBackVisible: false,
          gestureEnabled: false,
          headerStyle: { backgroundColor: '#0d0d12' },
          headerTintColor: '#f5f5f7',
          headerTitleStyle: { fontWeight: '600', color: '#f5f5f7' },
          contentStyle: { backgroundColor: '#0d0d12' },
        }}
      />
      <Screen className="pt-2">
        <FadeInView className="flex-1 gap-6 pb-10">
          <View className="overflow-hidden rounded-3xl border border-forge-700 bg-forge-900">
            <View className="h-1.5 w-full bg-accent" />
            <View className="gap-2 px-5 py-5">
              <Text className="text-[11px] font-bold uppercase tracking-[2px] text-accent">
                Workout complete
              </Text>
              <Text className="text-[32px] font-bold leading-9 text-white">{workoutName}</Text>
            </View>
          </View>

          <View className="overflow-hidden rounded-3xl border border-forge-700 bg-forge-900">
            <View className="h-1 w-full bg-accent/80" />
            <View className="gap-4 px-5 py-5">
              <View className="gap-1">
                <Text className="text-[10px] font-bold uppercase tracking-[1.5px] text-forge-400">
                  Duration
                </Text>
                <Text className="text-2xl font-bold text-white">{durationLabel}</Text>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1 gap-1">
                  <Text className="text-[10px] font-bold uppercase tracking-[1.5px] text-forge-400">
                    Exercises
                  </Text>
                  <Text className="text-2xl font-bold text-white">{exercisesCompleted}</Text>
                </View>
                <View className="flex-1 gap-1">
                  <Text className="text-[10px] font-bold uppercase tracking-[1.5px] text-forge-400">
                    Sets
                  </Text>
                  <Text className="text-2xl font-bold text-accent">{setsCompleted}</Text>
                </View>
              </View>

              <View className="gap-1">
                <Text className="text-[10px] font-bold uppercase tracking-[1.5px] text-forge-400">
                  Beat last session
                </Text>
                <Text className="text-2xl font-bold text-white">
                  {beatLastCount} {beatLastCount === 1 ? 'set' : 'sets'}
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-auto">
            <Button
              title="Done"
              variant="primary"
              onPress={() => {
                router.replace('/');
              }}
            />
          </View>
        </FadeInView>
      </Screen>
    </>
  );
}
