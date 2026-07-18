import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { FadeInView } from '@/components/motion';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/context/AuthProvider';
import {
  WEEK_DAYS,
  fetchWorkoutSchedule,
  upsertWorkoutScheduleDay,
  type WorkoutScheduleWithPlan,
} from '@/lib/supabase/schedule';
import { fetchWorkoutPlans, type WorkoutPlan } from '@/lib/supabase/workouts';
import { getScheduleDayOfWeek } from '@/lib/workout-streak';

type DayAssignment = {
  dayOfWeek: number;
  planId: string | null;
  planName: string | null;
};

function buildWeekAssignments(schedule: WorkoutScheduleWithPlan[]): DayAssignment[] {
  const byDay = new Map(
    schedule.map((row) => [
      row.day_of_week,
      {
        dayOfWeek: row.day_of_week,
        planId: row.workout_plan_id,
        planName: row.workout_plans?.name ?? null,
      } satisfies DayAssignment,
    ]),
  );

  return WEEK_DAYS.map((day) => {
    const existing = byDay.get(day.value);
    return (
      existing ?? {
        dayOfWeek: day.value,
        planId: null,
        planName: null,
      }
    );
  });
}

export default function ScheduleScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [assignments, setAssignments] = useState<DayAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const loadSchedule = useCallback(async () => {
    if (!user?.id) {
      setPlans([]);
      setAssignments(buildWeekAssignments([]));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [planData, scheduleData] = await Promise.all([
        fetchWorkoutPlans(user.id),
        fetchWorkoutSchedule(user.id),
      ]);
      setPlans(planData);
      setAssignments(buildWeekAssignments(scheduleData));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedule');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      void loadSchedule();
    }, [loadSchedule]),
  );

  const selectedDayLabel = useMemo(() => {
    if (selectedDay === null) return '';
    return WEEK_DAYS.find((day) => day.value === selectedDay)?.label ?? '';
  }, [selectedDay]);

  const todayDayOfWeek = getScheduleDayOfWeek();

  const scheduledCount = useMemo(
    () => assignments.filter((day) => !!day.planId).length,
    [assignments],
  );

  const handleAssign = async (planId: string | null) => {
    if (!user?.id || selectedDay === null) return;

    setIsSaving(true);
    setError(null);

    try {
      const saved = await upsertWorkoutScheduleDay(user.id, selectedDay, planId);
      setAssignments((current) =>
        current.map((day) =>
          day.dayOfWeek === selectedDay
            ? {
                dayOfWeek: selectedDay,
                planId: saved.workout_plan_id,
                planName: saved.workout_plans?.name ?? null,
              }
            : day,
        ),
      );
      setSelectedDay(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save schedule');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Screen className="pt-2">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-6 pb-10">
        <FadeInView onceKey="schedule-header" delay={0} className="gap-2 pt-1">
          <Text className="text-[11px] font-bold uppercase tracking-[2px] text-accent">Week</Text>
          <Text className="text-[32px] font-bold leading-9 text-white">Schedule</Text>
          <Text className="text-sm text-forge-400">
            Tap a day to assign a workout or keep it as rest.
          </Text>
        </FadeInView>

        {isLoading ? (
          <View className="items-center py-10">
            <ActivityIndicator color="#ff6b35" />
          </View>
        ) : null}

        {error ? (
          <View className="rounded-2xl border border-forge-700 bg-forge-900 p-4">
            <Text className="text-red-400">{error}</Text>
          </View>
        ) : null}

        {!isLoading && plans.length === 0 ? (
          <View className="overflow-hidden rounded-3xl border border-forge-700 bg-forge-900">
            <View className="h-1 w-full bg-accent" />
            <View className="gap-2 px-5 py-6">
              <Text className="text-lg font-bold text-white">No workouts yet</Text>
              <Text className="text-sm leading-5 text-forge-300">
                Create a workout first, then assign it to days here.
              </Text>
            </View>
          </View>
        ) : null}

        {!isLoading ? (
          <FadeInView onceKey="schedule-week" delay={40} className="gap-3">
            <View className="flex-row items-center justify-between px-0.5">
              <Text className="text-[11px] font-bold uppercase tracking-[1.5px] text-forge-400">
                This week
              </Text>
              <Text className="text-xs font-semibold text-forge-500">
                {scheduledCount} training · {7 - scheduledCount} rest
              </Text>
            </View>

            {WEEK_DAYS.map((day) => {
              const assignment = assignments.find((item) => item.dayOfWeek === day.value);
              const hasPlan = !!assignment?.planId;
              const isToday = day.value === todayDayOfWeek;

              return (
                <Pressable
                  key={day.value}
                  className={`overflow-hidden rounded-3xl border bg-forge-900 active:bg-forge-800 ${
                    isToday ? 'border-accent/50' : 'border-forge-700'
                  }`}
                  onPress={() => setSelectedDay(day.value)}
                  disabled={isSaving}
                >
                  <View className={`h-1 w-full ${hasPlan ? 'bg-accent' : 'bg-forge-700'}`} />
                  <View className="flex-row items-center gap-4 px-5 py-4">
                    <View className="w-14 gap-0.5">
                      <Text
                        className={`text-[10px] font-bold uppercase tracking-[1.5px] ${
                          isToday ? 'text-accent' : 'text-forge-400'
                        }`}
                      >
                        {day.short}
                      </Text>
                    </View>

                    <View className="h-10 w-px bg-forge-800" />

                    <View className="flex-1 gap-1">
                      <Text className="text-base font-bold text-white">{day.label}</Text>
                      <Text
                        className={`text-sm ${hasPlan ? 'font-semibold text-forge-100' : 'text-forge-400'}`}
                      >
                        {assignment?.planName ?? 'Rest day'}
                      </Text>
                    </View>

                    <View className="rounded-full bg-accent/15 px-3 py-1">
                      <Text className="text-[11px] font-bold uppercase tracking-wide text-accent">
                        Edit
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </FadeInView>
        ) : null}
      </ScrollView>

      <Modal
        visible={selectedDay !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDay(null)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/75"
          onPress={() => {
            if (!isSaving) setSelectedDay(null);
          }}
        >
          <Pressable
            className="gap-5 rounded-t-3xl border-t border-forge-700 bg-forge-950 px-6 pb-10 pt-5"
            onPress={(event) => event.stopPropagation()}
          >
            <View className="items-center">
              <View className="mb-4 h-1 w-10 rounded-full bg-forge-700" />
              <View className="w-full gap-1">
                <Text className="text-[11px] font-bold uppercase tracking-[2px] text-accent">
                  {selectedDayLabel}
                </Text>
                <Text className="text-2xl font-bold text-white">Assign workout</Text>
                <Text className="text-sm text-forge-400">
                  Pick a workout for this day, or keep it as rest.
                </Text>
              </View>
            </View>

            <ScrollView className="max-h-80" showsVerticalScrollIndicator={false}>
              <View className="gap-3">
                <Pressable
                  className="overflow-hidden rounded-2xl border border-forge-700 bg-forge-900 active:bg-forge-800"
                  disabled={isSaving}
                  onPress={() => {
                    void handleAssign(null);
                  }}
                >
                  <View className="h-1 w-full bg-forge-600" />
                  <View className="gap-1 px-4 py-4">
                    <Text className="text-base font-bold text-white">Rest day</Text>
                    <Text className="text-sm text-forge-400">No workout scheduled</Text>
                  </View>
                </Pressable>

                {plans.map((plan) => {
                  const isSelected =
                    selectedDay !== null &&
                    assignments.find((day) => day.dayOfWeek === selectedDay)?.planId === plan.id;

                  return (
                    <Pressable
                      key={plan.id}
                      className={`overflow-hidden rounded-2xl border bg-forge-900 active:bg-forge-800 ${
                        isSelected ? 'border-accent/50' : 'border-forge-700'
                      }`}
                      disabled={isSaving}
                      onPress={() => {
                        void handleAssign(plan.id);
                      }}
                    >
                      <View className={`h-1 w-full ${isSelected ? 'bg-accent' : 'bg-accent/40'}`} />
                      <View className="flex-row items-center justify-between px-4 py-4">
                        <Text className="text-base font-bold text-white">{plan.name}</Text>
                        {isSelected ? (
                          <Text className="text-xs font-bold uppercase tracking-wide text-accent">
                            Current
                          </Text>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            {isSaving ? (
              <View className="items-center py-2">
                <ActivityIndicator color="#ff6b35" />
              </View>
            ) : (
              <Button title="Cancel" variant="ghost" onPress={() => setSelectedDay(null)} />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
