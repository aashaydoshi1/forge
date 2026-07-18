import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { FadeInView } from '@/components/motion';
import { Button } from '@/components/ui/Button';
import { HomeScreenSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth/context/AuthProvider';
import {
  WEEK_DAYS,
  fetchWorkoutSchedule,
  type WorkoutScheduleWithPlan,
} from '@/lib/supabase/schedule';
import {
  fetchCompletedWorkoutSessions,
  type WorkoutSessionHistoryItem,
} from '@/lib/supabase/workout-history';
import {
  calculateScheduleAwareStreak,
  getScheduleDayOfWeek,
} from '@/lib/workout-streak';

function startOfLocalDay(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Monday 00:00 local — matches schedule week (0 = Monday). */
function startOfWeekMonday(date = new Date()): Date {
  const start = startOfLocalDay(date);
  const scheduleDay = getScheduleDayOfWeek(start);
  start.setDate(start.getDate() - scheduleDay);
  return start;
}

function isThisWeek(value: string | null, now = new Date()): boolean {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const weekStart = startOfWeekMonday(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return date >= weekStart && date < weekEnd;
}

function isSameLocalDay(value: string | null, now = new Date()): boolean {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/** Display-only focus label from the plan name — no extra data fetch. */
function inferMuscleFocus(planName: string): { label: string; chips: string[] } {
  const name = planName.toLowerCase();

  if (/push|chest|shoulder|press/.test(name)) {
    return { label: 'Push focus', chips: ['Chest', 'Shoulders', 'Triceps'] };
  }
  if (/pull|back|row|lat/.test(name)) {
    return { label: 'Pull focus', chips: ['Back', 'Biceps', 'Rear delts'] };
  }
  if (/leg|lower|squat|quad|glute|ham/.test(name)) {
    return { label: 'Lower body', chips: ['Quads', 'Glutes', 'Hamstrings'] };
  }
  if (/upper/.test(name)) {
    return { label: 'Upper body', chips: ['Chest', 'Back', 'Arms'] };
  }
  if (/arm|bicep|tricep/.test(name)) {
    return { label: 'Arms focus', chips: ['Biceps', 'Triceps', 'Forearms'] };
  }
  if (/core|abs/.test(name)) {
    return { label: 'Core focus', chips: ['Abs', 'Obliques', 'Stability'] };
  }
  if (/full|total|body/.test(name)) {
    return { label: 'Full body', chips: ['Compounds', 'Accessories', 'Conditioning'] };
  }

  return { label: 'Strength session', chips: ['Compounds', 'Accessories', 'Finisher'] };
}

function getTimeOfDayGreeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user, profile } = useAuth();
  const [schedule, setSchedule] = useState<WorkoutScheduleWithPlan[]>([]);
  const [sessions, setSessions] = useState<WorkoutSessionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadDashboard() {
        if (!user?.id) {
          if (active) {
            setSchedule([]);
            setSessions([]);
            setIsLoading(false);
          }
          return;
        }

        setIsLoading(true);
        setError(null);

        try {
          const [scheduleData, sessionData] = await Promise.all([
            fetchWorkoutSchedule(user.id),
            fetchCompletedWorkoutSessions(user.id),
          ]);

          if (!active) return;
          setSchedule(scheduleData);
          setSessions(sessionData);
        } catch (err) {
          if (active) {
            setError(err instanceof Error ? err.message : 'Failed to load dashboard');
          }
        } finally {
          if (active) setIsLoading(false);
        }
      }

      void loadDashboard();

      return () => {
        active = false;
      };
    }, [user?.id]),
  );

  const todayDayOfWeek = getScheduleDayOfWeek();
  const todayLabel = WEEK_DAYS.find((day) => day.value === todayDayOfWeek)?.label ?? 'Today';
  const todaySchedule = useMemo(
    () => schedule.find((row) => row.day_of_week === todayDayOfWeek),
    [schedule, todayDayOfWeek],
  );

  const todayPlanId = todaySchedule?.workout_plan_id ?? null;
  const todayPlanName = todaySchedule?.workout_plans?.name ?? null;
  const hasTodayWorkout = !!todayPlanId && !!todayPlanName;

  const workoutsThisWeek = useMemo(
    () => sessions.filter((session) => isThisWeek(session.completed_at)).length,
    [sessions],
  );
  const currentStreak = useMemo(
    () => calculateScheduleAwareStreak(sessions, schedule),
    [sessions, schedule],
  );
  const scheduledDaysCount = useMemo(
    () => schedule.filter((row) => !!row.workout_plan_id).length,
    [schedule],
  );
  const weekProgressPercent = useMemo(() => {
    if (scheduledDaysCount <= 0) return 0;
    return Math.min(100, Math.round((workoutsThisWeek / scheduledDaysCount) * 100));
  }, [workoutsThisWeek, scheduledDaysCount]);

  const greetingName = profile?.name?.trim() || 'Athlete';
  const timeGreeting = getTimeOfDayGreeting();

  const todayCompleted = useMemo(() => {
    if (!todayPlanId) return false;
    return sessions.some(
      (session) =>
        session.workout_plan_id === todayPlanId && isSameLocalDay(session.completed_at),
    );
  }, [sessions, todayPlanId]);

  const muscleFocus = useMemo(
    () => (todayPlanName ? inferMuscleFocus(todayPlanName) : null),
    [todayPlanName],
  );

  const sessionProgress = todayCompleted ? 100 : 0;

  const handleStartWorkout = () => {
    if (!hasTodayWorkout || !todayPlanId || !todayPlanName) return;

    router.push({
      pathname: '/workout-details',
      params: { id: todayPlanId, name: todayPlanName },
    });
  };

  return (
    <Screen className="pt-2">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-6 pb-10">
        {isLoading ? (
          <HomeScreenSkeleton />
        ) : (
          <>
            <FadeInView onceKey="home-header" delay={0} className="gap-7 pt-1">
              <View className="flex-row items-center gap-3.5">
                <View className="rounded-2xl border border-forge-700 bg-forge-900 p-1">
                  <Image
                    source={require('../../../assets/images/forge-logo.png')}
                    style={{ width: 48, height: 48, borderRadius: 12 }}
                    contentFit="cover"
                    accessibilityLabel="Forge logo"
                  />
                </View>
                <View className="flex-1 gap-1">
                  <Text className="text-[28px] font-black leading-none tracking-[4px] text-white">
                    FORGE
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <View className="h-1 w-1 rounded-full bg-accent" />
                    <Text className="text-[11px] font-semibold uppercase tracking-[2.5px] text-accent">
                      Built for the work
                    </Text>
                  </View>
                </View>
              </View>

              <View className="gap-2">
                <Text className="text-base font-medium text-forge-200">
                  {timeGreeting},{' '}
                  <Text className="font-semibold text-white">{greetingName}</Text>
                </Text>
                <Text className="text-[32px] font-bold leading-9 text-white">
                  {hasTodayWorkout
                    ? todayCompleted
                      ? 'Session complete.'
                      : 'Your session is ready.'
                    : 'Recovery day.'}
                </Text>
              </View>
            </FadeInView>

            {error ? (
              <View className="rounded-2xl border border-forge-700 bg-forge-900 p-4">
                <Text className="text-red-400">{error}</Text>
              </View>
            ) : null}

            {!error ? (
              <>
                <FadeInView onceKey="home-todays-workout" delay={40}>
                  <View className="overflow-hidden rounded-3xl border border-forge-700 bg-forge-900">
                    <View className="h-1.5 w-full bg-accent" />

                    <View className="gap-5 px-5 pb-5 pt-6">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-[11px] font-bold uppercase tracking-[2px] text-accent">
                          Today&apos;s workout
                        </Text>
                        <Text className="text-xs font-semibold uppercase tracking-wide text-forge-400">
                          {todayLabel}
                        </Text>
                      </View>

                      {hasTodayWorkout && muscleFocus ? (
                        <>
                          <View className="gap-3">
                            <Text className="text-4xl font-bold leading-tight text-white">
                              {todayPlanName}
                            </Text>
                            <View className="gap-2">
                              <Text className="text-xs font-bold uppercase tracking-[1.5px] text-forge-400">
                                {muscleFocus.label}
                              </Text>
                              <View className="flex-row flex-wrap gap-2">
                                {muscleFocus.chips.map((chip) => (
                                  <View
                                    key={chip}
                                    className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1"
                                  >
                                    <Text className="text-xs font-semibold text-accent">{chip}</Text>
                                  </View>
                                ))}
                              </View>
                            </View>
                          </View>

                          <View className="gap-2">
                            <View className="flex-row items-center justify-between">
                              <Text className="text-xs font-bold uppercase tracking-[1.5px] text-forge-400">
                                Progress
                              </Text>
                              <Text className="text-xs font-semibold text-forge-300">
                                {todayCompleted ? 'Complete' : 'Not started'} · {sessionProgress}%
                              </Text>
                            </View>
                            <View className="h-2 overflow-hidden rounded-full bg-forge-800">
                              <View
                                className="h-full rounded-full bg-accent"
                                style={{ width: `${sessionProgress}%` }}
                              />
                            </View>
                          </View>

                          <View className="gap-2.5 pt-1">
                            <Button
                              title={todayCompleted ? 'View Workout' : 'Start Workout'}
                              variant="primary"
                              onPress={handleStartWorkout}
                            />
                            <Button
                              title="Choose Another Workout"
                              variant="ghost"
                              onPress={() => router.push('/workouts')}
                            />
                          </View>
                        </>
                      ) : (
                        <>
                          <View className="gap-3">
                            <Text className="text-4xl font-bold leading-tight text-white">
                              No workout scheduled
                            </Text>
                            <Text className="text-base leading-6 text-forge-300">
                              Assign a plan in Schedule, or pick something from your library.
                            </Text>
                          </View>
                          <View className="pt-1">
                            <Button
                              title="Open Schedule"
                              variant="primary"
                              onPress={() => router.push('/schedule')}
                            />
                          </View>
                        </>
                      )}
                    </View>
                  </View>
                </FadeInView>

                <FadeInView onceKey="home-stats" delay={100}>
                  <View className="overflow-hidden rounded-3xl border border-forge-700 bg-forge-900">
                    <View className="h-1 w-full bg-accent" />
                    <View className="gap-5 px-5 py-5">
                      <View className="flex-row items-end justify-between gap-3">
                        <View className="flex-1 gap-1">
                          <Text className="text-[11px] font-bold uppercase tracking-[2px] text-accent">
                            Progress
                          </Text>
                          <Text className="text-xl font-bold text-white">This week</Text>
                        </View>
                        {scheduledDaysCount > 0 ? (
                          <Text className="text-sm font-semibold text-forge-300">
                            {workoutsThisWeek}
                            <Text className="text-forge-500"> / {scheduledDaysCount}</Text>
                          </Text>
                        ) : (
                          <Text className="text-sm font-semibold text-forge-300">
                            {workoutsThisWeek}{' '}
                            <Text className="text-forge-500">
                              {workoutsThisWeek === 1 ? 'session' : 'sessions'}
                            </Text>
                          </Text>
                        )}
                      </View>

                      {scheduledDaysCount > 0 ? (
                        <View className="gap-2">
                          <View className="h-2 overflow-hidden rounded-full bg-forge-800">
                            <View
                              className="h-full rounded-full bg-accent"
                              style={{ width: `${weekProgressPercent}%` }}
                            />
                          </View>
                          <Text className="text-xs text-forge-400">
                            {weekProgressPercent}% of scheduled sessions done
                          </Text>
                        </View>
                      ) : null}

                      <View className="flex-row gap-3">
                        <View className="flex-1 rounded-2xl border border-forge-800 bg-forge-950 px-4 py-4">
                          <Text className="text-[10px] font-bold uppercase tracking-[1.5px] text-forge-400">
                            Sessions
                          </Text>
                          <Text className="mt-2 text-3xl font-bold text-white">
                            {workoutsThisWeek}
                          </Text>
                        </View>
                        <View className="flex-1 rounded-2xl border border-forge-800 bg-forge-950 px-4 py-4">
                          <Text className="text-[10px] font-bold uppercase tracking-[1.5px] text-forge-400">
                            Streak
                          </Text>
                          <Text className="mt-2 text-3xl font-bold text-accent">{currentStreak}</Text>
                          <Text className="mt-0.5 text-xs text-forge-500">
                            {currentStreak === 1 ? 'day' : 'days'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </FadeInView>

                <FadeInView onceKey="home-secondary" delay={160}>
                  <View className="overflow-hidden rounded-3xl border border-accent/35 bg-forge-900">
                    <View className="h-1.5 w-full bg-accent" />
                    <View className="gap-6 px-5 pb-5 pt-6">
                      <View className="gap-4">
                        <View className="flex-row items-center gap-3">
                          <View className="h-14 w-14 items-center justify-center rounded-2xl border border-accent/40 bg-accent/15">
                            <Text className="text-lg font-black text-accent">AI</Text>
                          </View>
                          <View className="flex-1 gap-0.5">
                            <Text className="text-[11px] font-bold uppercase tracking-[2px] text-accent">
                              Forge AI Coach
                            </Text>
                            <Text className="text-xs font-medium text-forge-400">
                              Always on · Built around you
                            </Text>
                          </View>
                        </View>

                        <View className="gap-2">
                          <Text className="text-2xl font-bold leading-8 text-white">
                            Your personal training intelligence
                          </Text>
                          <Text className="text-sm leading-5 text-forge-300">
                            Ask about form, recovery, or programming — get sharp answers tuned to
                            how you train.
                          </Text>
                        </View>
                      </View>

                      <Button
                        title="Open AI Coach"
                        variant="primary"
                        onPress={() => router.push('/coach')}
                      />
                    </View>
                  </View>
                </FadeInView>
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
