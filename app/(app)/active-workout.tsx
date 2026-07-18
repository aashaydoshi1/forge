import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { KeyboardAwareScreen } from '@/components/layout/KeyboardAwareScreen';
import { FadeInText, FadePresence } from '@/components/motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/features/auth/context/AuthProvider';
import {
  fetchLastWorkoutPerformance,
  finishWorkout,
  type PreviousSetPerformance,
} from '@/lib/supabase/workout-history';

type ActiveSet = {
  id: string;
  weight: string;
  reps: string;
  completed: boolean;
};

type ActiveExercise = {
  id: string;
  name: string;
  targetReps: string;
  sets: ActiveSet[];
};

type PassedExercise = {
  id: string;
  name: string;
  sets: string;
  reps: string;
};

function parseExercises(raw: string | string[] | undefined): PassedExercise[] {
  if (typeof raw !== 'string' || !raw) return [];

  try {
    const parsed = JSON.parse(raw) as PassedExercise[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildActiveExercises(passed: PassedExercise[]): ActiveExercise[] {
  return passed.map((exercise) => {
    const setCount = Math.max(1, Number.parseInt(exercise.sets, 10) || 1);

    return {
      id: exercise.id,
      name: exercise.name,
      targetReps: exercise.reps,
      sets: Array.from({ length: setCount }, (_, index) => ({
        id: `${exercise.id}-set-${index + 1}`,
        weight: '',
        reps: '',
        completed: false,
      })),
    };
  });
}

function parseWeight(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function parseReps(value: string): number | null {
  const parsed = Number.parseInt(value.trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

/** Prefill empty weight/reps from last session; never touches completed. */
function applyPreviousPerformance(
  exercises: ActiveExercise[],
  previous: PreviousSetPerformance[],
): ActiveExercise[] {
  const previousByKey = new Map(
    previous.map((set) => [`${set.exercise_id}:${set.set_number}`, set] as const),
  );

  return exercises.map((exercise) => ({
    ...exercise,
    sets: exercise.sets.map((set, index) => {
      const previousSet = previousByKey.get(`${exercise.id}:${index + 1}`);
      if (!previousSet) return set;

      const nextWeight =
        set.weight.trim() !== ''
          ? set.weight
          : previousSet.weight != null
            ? String(previousSet.weight)
            : set.weight;

      const nextReps = set.reps.trim() !== '' ? set.reps : String(previousSet.reps);

      if (nextWeight === set.weight && nextReps === set.reps) return set;

      return {
        ...set,
        weight: nextWeight,
        reps: nextReps,
      };
    }),
  }));
}

function findPreviousSet(
  previous: PreviousSetPerformance[],
  exerciseId: string,
  setNumber: number,
): PreviousSetPerformance | undefined {
  return previous.find(
    (set) => set.exercise_id === exerciseId && set.set_number === setNumber,
  );
}

/** Higher weight wins; equal weight → higher reps wins. */
function isBetterThanPrevious(
  weight: number | null,
  reps: number,
  previous: PreviousSetPerformance,
): boolean {
  const currentWeight = weight ?? Number.NEGATIVE_INFINITY;
  const previousWeight = previous.weight ?? Number.NEGATIVE_INFINITY;

  if (currentWeight !== previousWeight) {
    return currentWeight > previousWeight;
  }

  return reps > previous.reps;
}

const REST_DURATION_SECONDS = 90;

function formatRestCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id, name, exercises: exercisesParam } = useLocalSearchParams<{
    id?: string;
    name?: string;
    exercises?: string;
  }>();

  const planId = typeof id === 'string' ? id : '';
  const workoutName = typeof name === 'string' ? name : 'Workout';
  const initialExercises = useMemo(
    () => buildActiveExercises(parseExercises(exercisesParam)),
    [exercisesParam],
  );

  const [exercises, setExercises] = useState<ActiveExercise[]>(initialExercises);
  const [previousPerformance, setPreviousPerformance] = useState<PreviousSetPerformance[]>(
    [],
  );
  const [beatLastBySetId, setBeatLastBySetId] = useState<Record<string, string>>({});
  const [restSecondsRemaining, setRestSecondsRemaining] = useState<number | null>(null);
  const [startedAt] = useState(() => new Date().toISOString());
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPreviousPerformance() {
      if (!user?.id || !planId) return;

      setIsLoadingPrevious(true);

      try {
        const previous = await fetchLastWorkoutPerformance(user.id, planId);
        if (!active) return;

        setPreviousPerformance(previous);
        if (previous.length > 0) {
          setExercises((current) => applyPreviousPerformance(current, previous));
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : 'Failed to load previous workout data',
          );
        }
      } finally {
        if (active) setIsLoadingPrevious(false);
      }
    }

    void loadPreviousPerformance();

    return () => {
      active = false;
    };
  }, [user?.id, planId]);

  useEffect(() => {
    if (restSecondsRemaining === null) return;

    if (restSecondsRemaining <= 0) {
      setRestSecondsRemaining(null);
      return;
    }

    const timeout = setTimeout(() => {
      setRestSecondsRemaining((current) => {
        if (current === null) return null;
        return current <= 1 ? null : current - 1;
      });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [restSecondsRemaining]);

  const updateSet = (
    exerciseId: string,
    setId: string,
    field: keyof Pick<ActiveSet, 'weight' | 'reps' | 'completed'>,
    value: string | boolean,
  ) => {
    setExercises((current) =>
      current.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;

        return {
          ...exercise,
          sets: exercise.sets.map((set) =>
            set.id === setId ? { ...set, [field]: value } : set,
          ),
        };
      }),
    );
  };

  const handleSkipRest = () => {
    setRestSecondsRemaining(null);
  };

  const handleToggleSetCompleted = (
    exercise: ActiveExercise,
    set: ActiveSet,
    setNumber: number,
  ) => {
    const nextCompleted = !set.completed;
    updateSet(exercise.id, set.id, 'completed', nextCompleted);

    if (!nextCompleted) {
      setBeatLastBySetId((current) => {
        if (!(set.id in current)) return current;
        const next = { ...current };
        delete next[set.id];
        return next;
      });
      return;
    }

    setRestSecondsRemaining(REST_DURATION_SECONDS);

    const previousSet = findPreviousSet(previousPerformance, exercise.id, setNumber);
    if (!previousSet) return;

    const reps = parseReps(set.reps);
    if (reps === null) return;

    if (isBetterThanPrevious(parseWeight(set.weight), reps, previousSet)) {
      setBeatLastBySetId((current) => ({
        ...current,
        [set.id]: 'Beat last session',
      }));
    }
  };

  const completedSets = exercises.reduce(
    (total, exercise) => total + exercise.sets.filter((set) => set.completed).length,
    0,
  );
  const totalSets = exercises.reduce((total, exercise) => total + exercise.sets.length, 0);

  const handleFinishWorkout = async () => {
    if (!user?.id) {
      setError('You must be signed in to finish a workout');
      return;
    }

    if (!planId) {
      setError('Missing workout plan id');
      return;
    }

    const setsToSave = [];

    for (const exercise of exercises) {
      for (const [index, set] of exercise.sets.entries()) {
        if (!set.completed) continue;

        const reps = parseReps(set.reps);
        if (reps === null) {
          setError(`Enter reps for ${exercise.name}, set ${index + 1}`);
          return;
        }

        setsToSave.push({
          exerciseId: exercise.id,
          weight: parseWeight(set.weight),
          reps,
          setNumber: index + 1,
        });
      }
    }

    if (setsToSave.length === 0) {
      setError('Mark at least one set as done before finishing');
      return;
    }

    setIsSaving(true);
    setError(null);

    const finishedAt = new Date().toISOString();
    const exercisesCompleted = exercises.filter((exercise) =>
      exercise.sets.some((set) => set.completed),
    ).length;
    const setsCompleted = setsToSave.length;
    const beatLastCount = Object.keys(beatLastBySetId).length;

    try {
      await finishWorkout({
        userId: user.id,
        workoutPlanId: planId,
        startedAt,
        completedAt: finishedAt,
        sets: setsToSave,
      });

      router.replace({
        pathname: '/workout-summary',
        params: {
          name: workoutName,
          startedAt,
          finishedAt,
          exercisesCompleted: String(exercisesCompleted),
          setsCompleted: String(setsCompleted),
          beatLastCount: String(beatLastCount),
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save workout');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Active Workout',
          headerShown: true,
          headerStyle: { backgroundColor: '#0d0d12' },
          headerTintColor: '#f5f5f7',
          headerTitleStyle: { fontWeight: '600', color: '#f5f5f7' },
          contentStyle: { backgroundColor: '#0d0d12' },
        }}
      />
      <KeyboardAwareScreen className="pt-2" contentContainerClassName="gap-6 pb-32">
            <View className="overflow-hidden rounded-3xl border border-forge-700 bg-forge-900">
              <View className="h-1.5 w-full bg-accent" />
              <View className="gap-2 px-5 py-5">
                <Text className="text-[11px] font-bold uppercase tracking-[2px] text-accent">
                  Active workout
                </Text>
                <Text className="text-[32px] font-bold leading-9 text-white">{workoutName}</Text>
                <Text className="text-sm text-forge-300">
                  {completedSets}/{totalSets} sets complete
                </Text>
                {restSecondsRemaining !== null ? (
                  <FadePresence className="flex-row items-center justify-between gap-3 pt-1">
                    <Text className="text-sm font-semibold text-accent">
                      Rest {formatRestCountdown(restSecondsRemaining)}
                    </Text>
                    <Pressable
                      onPress={handleSkipRest}
                      accessibilityRole="button"
                      accessibilityLabel="Skip rest timer"
                    >
                      <Text className="text-sm font-semibold text-forge-300">Skip</Text>
                    </Pressable>
                  </FadePresence>
                ) : null}
                {isLoadingPrevious ? (
                  <View className="flex-row items-center gap-2 pt-1">
                    <ActivityIndicator color="#ff6b35" />
                    <Text className="text-sm text-forge-400">Loading previous sets...</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {error ? (
              <View className="rounded-2xl border border-forge-700 bg-forge-900 p-4">
                <Text className="text-red-400">{error}</Text>
              </View>
            ) : null}

            {exercises.length === 0 ? (
              <View className="overflow-hidden rounded-3xl border border-forge-700 bg-forge-900">
                <View className="h-1 w-full bg-accent" />
                <View className="gap-2 px-5 py-6">
                  <Text className="text-lg font-bold text-white">No exercises yet</Text>
                  <Text className="text-sm leading-5 text-forge-300">
                    Go back and add exercises to this workout first.
                  </Text>
                </View>
              </View>
            ) : null}

            {exercises.map((exercise) => (
              <View
                key={exercise.id}
                className="overflow-hidden rounded-3xl border border-forge-700 bg-forge-900"
              >
                <View className="h-1 w-full bg-accent/70" />
                <View className="gap-4 px-5 py-4">
                <View className="gap-1">
                  <Text className="text-lg font-bold text-white">{exercise.name}</Text>
                  <Text className="text-sm text-forge-400">Target reps: {exercise.targetReps}</Text>
                </View>

                {exercise.sets.map((set, index) => (
                  <View
                    key={set.id}
                    className={`rounded-2xl border p-3 gap-3 ${
                      set.completed
                        ? 'border-accent bg-accent/10'
                        : 'border-forge-700 bg-forge-950'
                    }`}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-semibold text-white">Set {index + 1}</Text>
                      <Pressable
                        className="flex-row items-center gap-2"
                        onPress={() => handleToggleSetCompleted(exercise, set, index + 1)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: set.completed }}
                      >
                        <View
                          className={`h-6 w-6 items-center justify-center rounded-md border ${
                            set.completed
                              ? 'border-accent bg-accent'
                              : 'border-forge-500 bg-forge-900'
                          }`}
                        >
                          {set.completed ? (
                            <Text className="text-xs font-bold text-white">✓</Text>
                          ) : null}
                        </View>
                        <Text className={set.completed ? 'text-accent' : 'text-forge-300'}>
                          Done
                        </Text>
                      </Pressable>
                    </View>

                    <View className="flex-row gap-3">
                      <View className="flex-1">
                        <Input
                          label="Weight"
                          value={set.weight}
                          onChangeText={(value) =>
                            updateSet(exercise.id, set.id, 'weight', value)
                          }
                          placeholder="0"
                          keyboardType="decimal-pad"
                        />
                      </View>
                      <View className="flex-1">
                        <Input
                          label="Reps"
                          value={set.reps}
                          onChangeText={(value) =>
                            updateSet(exercise.id, set.id, 'reps', value)
                          }
                          placeholder={exercise.targetReps}
                          keyboardType="number-pad"
                        />
                      </View>
                    </View>

                    {set.completed && beatLastBySetId[set.id] ? (
                      <FadeInText className="text-sm font-semibold text-accent">
                        {beatLastBySetId[set.id]}
                      </FadeInText>
                    ) : null}
                  </View>
                ))}
                </View>
              </View>
            ))}

            <Button
              title="Finish Workout"
              variant="primary"
              loading={isSaving}
              disabled={isSaving || exercises.length === 0}
              onPress={() => {
                void handleFinishWorkout();
              }}
            />
      </KeyboardAwareScreen>
    </>
  );
}
