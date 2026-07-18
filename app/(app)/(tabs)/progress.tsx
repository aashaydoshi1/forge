import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { FadeInView } from '@/components/motion';
import { ProgressScreenSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth/context/AuthProvider';
import { fetchWorkoutSchedule, type WorkoutScheduleWithPlan } from '@/lib/supabase/schedule';
import {
  fetchCompletedWorkoutSessions,
  fetchPersonalRecords,
  type PersonalRecordSet,
  type WorkoutSessionHistoryItem,
} from '@/lib/supabase/workout-history';
import { calculateScheduleAwareStreak } from '@/lib/workout-streak';

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

function formatPrLoad(weight: number | null): string {
  if (weight === null || weight === undefined) return 'BW';
  return `${weight}`;
}

function isBetterPrSet(candidate: PersonalRecordSet, current: PersonalRecordSet): boolean {
  const candidateWeight = candidate.weight ?? Number.NEGATIVE_INFINITY;
  const currentWeight = current.weight ?? Number.NEGATIVE_INFINITY;

  if (candidateWeight !== currentWeight) {
    return candidateWeight > currentWeight;
  }

  return candidate.reps > current.reps;
}

function calculateBestSetsPerExercise(sets: PersonalRecordSet[]): PersonalRecordSet[] {
  const bestByExercise = new Map<string, PersonalRecordSet>();

  for (const set of sets) {
    const current = bestByExercise.get(set.exerciseName);
    if (!current || isBetterPrSet(set, current)) {
      bestByExercise.set(set.exerciseName, set);
    }
  }

  return [...bestByExercise.values()].sort((a, b) =>
    a.exerciseName.localeCompare(b.exerciseName),
  );
}

function isSameMonth(value: string | null, now = new Date()): boolean {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

export default function ProgressScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<WorkoutSessionHistoryItem[]>([]);
  const [schedule, setSchedule] = useState<WorkoutScheduleWithPlan[]>([]);
  const [prSets, setPrSets] = useState<PersonalRecordSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadHistory() {
        if (!user?.id) {
          if (active) {
            setSessions([]);
            setSchedule([]);
            setPrSets([]);
            setIsLoading(false);
          }
          return;
        }

        setIsLoading(true);
        setError(null);

        try {
          const [sessionData, scheduleData, personalRecordData] = await Promise.all([
            fetchCompletedWorkoutSessions(user.id),
            fetchWorkoutSchedule(user.id),
            fetchPersonalRecords(user.id),
          ]);
          if (active) {
            setSessions(sessionData);
            setSchedule(scheduleData);
            setPrSets(personalRecordData);
          }
        } catch (err) {
          if (active) {
            setError(err instanceof Error ? err.message : 'Failed to load workout history');
          }
        } finally {
          if (active) setIsLoading(false);
        }
      }

      void loadHistory();

      return () => {
        active = false;
      };
    }, [user?.id]),
  );

  const totalWorkouts = sessions.length;
  const workoutsThisMonth = useMemo(
    () => sessions.filter((session) => isSameMonth(session.completed_at)).length,
    [sessions],
  );
  const currentStreak = useMemo(
    () => calculateScheduleAwareStreak(sessions, schedule),
    [sessions, schedule],
  );
  const personalRecords = useMemo(() => calculateBestSetsPerExercise(prSets), [prSets]);

  return (
    <Screen className="pt-2">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-6 pb-10">
        <FadeInView onceKey="progress-header" delay={0} className="gap-2 pt-1">
          <Text className="text-[11px] font-bold uppercase tracking-[2px] text-accent">
            Analytics
          </Text>
          <Text className="text-[32px] font-bold leading-9 text-white">Progress</Text>
          <Text className="text-sm text-forge-400">
            Consistency, strength marks, and session history.
          </Text>
        </FadeInView>

        {isLoading ? <ProgressScreenSkeleton /> : null}

        {error ? (
          <View className="rounded-2xl border border-forge-700 bg-forge-900 p-4">
            <Text className="text-red-400">{error}</Text>
          </View>
        ) : null}

        {!isLoading && !error ? (
          <>
            <FadeInView onceKey="progress-stats" delay={40} className="gap-3">
              <View className="overflow-hidden rounded-3xl border border-forge-700 bg-forge-900">
                <View className="h-1.5 w-full bg-accent" />
                <View className="gap-5 px-5 py-5">
                  <View className="gap-1">
                    <Text className="text-[11px] font-bold uppercase tracking-[2px] text-accent">
                      Training overview
                    </Text>
                    <Text className="text-xl font-bold text-white">Your numbers</Text>
                  </View>

                  <View className="flex-row gap-3">
                    <View className="flex-1 rounded-2xl border border-forge-800 bg-forge-950 px-4 py-4">
                      <Text className="text-[10px] font-bold uppercase tracking-[1.5px] text-forge-400">
                        All time
                      </Text>
                      <Text className="mt-2 text-3xl font-bold text-white">{totalWorkouts}</Text>
                      <Text className="mt-0.5 text-xs text-forge-500">workouts</Text>
                    </View>
                    <View className="flex-1 rounded-2xl border border-forge-800 bg-forge-950 px-4 py-4">
                      <Text className="text-[10px] font-bold uppercase tracking-[1.5px] text-forge-400">
                        This month
                      </Text>
                      <Text className="mt-2 text-3xl font-bold text-accent">{workoutsThisMonth}</Text>
                      <Text className="mt-0.5 text-xs text-forge-500">sessions</Text>
                    </View>
                  </View>

                  <View className="rounded-2xl border border-forge-800 bg-forge-950 px-4 py-4">
                    <View className="flex-row items-end justify-between">
                      <View className="gap-1">
                        <Text className="text-[10px] font-bold uppercase tracking-[1.5px] text-forge-400">
                          Current streak
                        </Text>
                        <Text className="text-3xl font-bold text-white">
                          {currentStreak}
                          <Text className="text-lg font-semibold text-forge-400">
                            {' '}
                            {currentStreak === 1 ? 'day' : 'days'}
                          </Text>
                        </Text>
                      </View>
                      <View className="rounded-full bg-accent/15 px-3 py-1">
                        <Text className="text-[11px] font-bold uppercase tracking-wide text-accent">
                          Active
                        </Text>
                      </View>
                    </View>
                    <Text className="mt-2 text-sm text-forge-400">
                      Built from scheduled training days you complete.
                    </Text>
                  </View>
                </View>
              </View>
            </FadeInView>

            <FadeInView onceKey="progress-prs" delay={100} className="gap-3">
              <View className="flex-row items-center justify-between px-0.5">
                <Text className="text-[11px] font-bold uppercase tracking-[1.5px] text-forge-400">
                  Personal records
                </Text>
                <Text className="text-xs font-semibold text-forge-500">
                  {personalRecords.length}
                </Text>
              </View>

              {personalRecords.length === 0 ? (
                <View className="overflow-hidden rounded-3xl border border-forge-700 bg-forge-900">
                  <View className="h-1 w-full bg-accent" />
                  <View className="gap-2 px-5 py-6">
                    <Text className="text-lg font-bold text-white">No PRs yet</Text>
                    <Text className="text-sm leading-5 text-forge-300">
                      Complete sets in a workout to start tracking your strongest lifts.
                    </Text>
                  </View>
                </View>
              ) : null}

              {personalRecords.map((record, index) => {
                const recordNumber = String(index + 1).padStart(2, '0');

                return (
                  <FadeInView
                    key={record.exerciseName}
                    onceKey={`progress-pr-${record.exerciseName}`}
                    className="overflow-hidden rounded-3xl border border-forge-700 bg-forge-900"
                  >
                    <View className="h-1 w-full bg-accent/80" />
                    <View className="flex-row items-center gap-4 px-5 py-4">
                      <Text className="text-sm font-black text-accent">{recordNumber}</Text>
                      <View className="flex-1 gap-1">
                        <Text className="text-lg font-bold text-white">{record.exerciseName}</Text>
                        <Text className="text-xs font-medium uppercase tracking-wide text-forge-400">
                          Best set
                        </Text>
                      </View>
                      <View className="items-end gap-0.5">
                        <Text className="text-xl font-bold text-accent">
                          {formatPrLoad(record.weight)}
                        </Text>
                        <Text className="text-xs font-semibold text-forge-300">
                          × {record.reps} reps
                        </Text>
                      </View>
                    </View>
                  </FadeInView>
                );
              })}
            </FadeInView>

            <FadeInView onceKey="progress-history" delay={160} className="gap-3">
              <View className="flex-row items-center justify-between px-0.5">
                <Text className="text-[11px] font-bold uppercase tracking-[1.5px] text-forge-400">
                  Workout history
                </Text>
                <Text className="text-xs font-semibold text-forge-500">{sessions.length}</Text>
              </View>

              {sessions.length === 0 ? (
                <View className="overflow-hidden rounded-3xl border border-forge-700 bg-forge-900">
                  <View className="h-1 w-full bg-accent" />
                  <View className="gap-2 px-5 py-6">
                    <Text className="text-lg font-bold text-white">No sessions yet</Text>
                    <Text className="text-sm leading-5 text-forge-300">
                      Finish a workout to build your training history here.
                    </Text>
                  </View>
                </View>
              ) : null}

              {sessions.map((session) => {
                const workoutName = session.workout_plans?.name ?? 'Untitled workout';

                return (
                  <FadeInView key={session.id} onceKey={`progress-session-${session.id}`}>
                    <Pressable
                      className="overflow-hidden rounded-3xl border border-forge-700 bg-forge-900 active:bg-forge-800"
                      onPress={() =>
                        router.push({
                          pathname: '/workout-history-details',
                          params: {
                            id: session.id,
                            name: workoutName,
                          },
                        })
                      }
                    >
                      <View className="h-1 w-full bg-accent/60" />
                      <View className="flex-row items-center gap-3 px-5 py-4">
                        <View className="flex-1 gap-1">
                          <Text className="text-lg font-bold text-white">{workoutName}</Text>
                          <Text className="text-sm text-forge-400">
                            {formatCompletedDate(session.completed_at)}
                          </Text>
                        </View>
                        <Text className="text-sm font-semibold text-accent">View →</Text>
                      </View>
                    </Pressable>
                  </FadeInView>
                );
              })}
            </FadeInView>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
