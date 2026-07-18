import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import {
  deleteWorkoutSession,
  fetchWorkoutSessionDetails,
  type CompletedSetWithExercise,
  type WorkoutSessionDetails,
} from '@/lib/supabase/workout-history';

function formatCompletedDate(value: string | null): string {
  if (!value) return 'Unknown date';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatWeight(weight: number | null): string {
  if (weight === null || weight === undefined) return '—';
  return `${weight}`;
}

type ExerciseGroup = {
  exerciseId: string;
  name: string;
  sets: CompletedSetWithExercise[];
};

function groupSetsByExercise(sets: CompletedSetWithExercise[]): ExerciseGroup[] {
  const groups = new Map<string, ExerciseGroup>();

  for (const set of sets) {
    const existing = groups.get(set.exercise_id);
    if (existing) {
      existing.sets.push(set);
      continue;
    }

    groups.set(set.exercise_id, {
      exerciseId: set.exercise_id,
      name: set.exercises?.exercise_name ?? 'Exercise',
      sets: [set],
    });
  }

  return Array.from(groups.values());
}

export default function WorkoutHistoryDetailsScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id?: string; name?: string }>();
  const sessionId = typeof id === 'string' ? id : '';
  const fallbackName = typeof name === 'string' ? name : 'Workout';

  const [details, setDetails] = useState<WorkoutSessionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadDetails() {
        if (!sessionId) {
          if (active) {
            setDetails(null);
            setIsLoading(false);
            setError('Missing workout session id');
          }
          return;
        }

        setIsLoading(true);
        setError(null);

        try {
          const data = await fetchWorkoutSessionDetails(sessionId);
          if (!active) return;

          if (!data) {
            setDetails(null);
            setError('Workout session not found');
            return;
          }

          setDetails(data);
        } catch (err) {
          if (active) {
            setError(err instanceof Error ? err.message : 'Failed to load workout details');
          }
        } finally {
          if (active) setIsLoading(false);
        }
      }

      void loadDetails();

      return () => {
        active = false;
      };
    }, [sessionId]),
  );

  const workoutName = details?.workout_plans?.name ?? fallbackName;
  const exerciseGroups = useMemo(
    () => groupSetsByExercise(details?.completed_sets ?? []),
    [details?.completed_sets],
  );

  const handleDelete = () => {
    if (!sessionId || isDeleting) return;

    Alert.alert(
      'Delete workout?',
      'This removes the session from your history. Sets, PRs, and streak may update. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setIsDeleting(true);
              setError(null);
              try {
                await deleteWorkoutSession(sessionId);
                router.back();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to delete workout');
                setIsDeleting(false);
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: workoutName,
          headerShown: true,
          headerStyle: { backgroundColor: '#0d0d12' },
          headerTintColor: '#f5f5f7',
          headerTitleStyle: { fontWeight: '600', color: '#f5f5f7' },
          contentStyle: { backgroundColor: '#0d0d12' },
        }}
      />
      <Screen className="pt-2">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-6 pb-10">
          <View className="overflow-hidden rounded-3xl border border-forge-700 bg-forge-900">
            <View className="h-1.5 w-full bg-accent" />
            <View className="gap-2 px-5 py-5">
              <Text className="text-[11px] font-bold uppercase tracking-[2px] text-accent">
                Workout history
              </Text>
              <Text className="text-[32px] font-bold leading-9 text-white">{workoutName}</Text>
              <Text className="text-sm text-forge-300">
                Completed {formatCompletedDate(details?.completed_at ?? null)}
              </Text>
            </View>
          </View>

          {isLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator color="#ff6b35" />
            </View>
          ) : null}

          {error ? (
            <View className="rounded-2xl border border-forge-700 bg-forge-900 p-4">
              <Text className="text-red-400">{error}</Text>
            </View>
          ) : null}

          {!isLoading && !error && exerciseGroups.length === 0 ? (
            <View className="overflow-hidden rounded-3xl border border-forge-700 bg-forge-900">
              <View className="h-1 w-full bg-accent" />
              <View className="gap-2 px-5 py-6">
                <Text className="text-lg font-bold text-white">No sets recorded</Text>
                <Text className="text-sm leading-5 text-forge-300">
                  No completed sets were saved for this workout.
                </Text>
              </View>
            </View>
          ) : null}

          {exerciseGroups.map((group) => (
            <View
              key={group.exerciseId}
              className="overflow-hidden rounded-3xl border border-forge-700 bg-forge-900"
            >
              <View className="h-1 w-full bg-accent/70" />
              <View className="gap-3 px-5 py-4">
                <Text className="text-lg font-bold text-white">{group.name}</Text>

                {group.sets.map((set) => (
                  <View
                    key={set.id}
                    className="gap-2 rounded-2xl border border-forge-700 bg-forge-950 p-3"
                  >
                    <Text className="text-sm font-semibold text-accent">Set {set.set_number}</Text>
                    <View className="flex-row gap-6">
                      <View>
                        <Text className="mb-1 text-[10px] font-bold uppercase tracking-wide text-forge-400">
                          Weight
                        </Text>
                        <Text className="text-base font-semibold text-white">
                          {formatWeight(set.weight)}
                        </Text>
                      </View>
                      <View>
                        <Text className="mb-1 text-[10px] font-bold uppercase tracking-wide text-forge-400">
                          Reps
                        </Text>
                        <Text className="text-base font-semibold text-white">{set.reps}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}

          {!isLoading && details ? (
            <Button
              title="Delete Workout"
              variant="ghost"
              loading={isDeleting}
              disabled={isDeleting}
              onPress={handleDelete}
            />
          ) : null}
        </ScrollView>
      </Screen>
    </>
  );
}
