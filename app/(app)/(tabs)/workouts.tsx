import { useCallback, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';

import { KeyboardAwareScreen } from '@/components/layout/KeyboardAwareScreen';
import { FadeInView, ScalePressable } from '@/components/motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { WorkoutsScreenSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth/context/AuthProvider';
import {
  createWorkoutPlan,
  deleteWorkoutPlan,
  fetchWorkoutPlans,
  type WorkoutPlan,
} from '@/lib/supabase/workouts';

export default function WorkoutsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [newPlanName, setNewPlanName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const loadPlans = useCallback(async () => {
    if (!user?.id) {
      setPlans([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchWorkoutPlans(user.id);
      setPlans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workout plans');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      void loadPlans();
    }, [loadPlans]),
  );

  const resetCreateForm = () => {
    setNewPlanName('');
    setIsCreating(false);
  };

  const handleCreatePlan = async () => {
    const trimmedName = newPlanName.trim();

    if (!user?.id) {
      setError('You must be signed in to create a workout plan');
      return;
    }

    if (!trimmedName) {
      setError('Workout name is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const plan = await createWorkoutPlan(user.id, trimmedName);
      setPlans((current) => [...current, plan]);
      resetCreateForm();
      router.push({
        pathname: '/workout-details',
        params: { id: plan.id, name: plan.name },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workout plan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlan = (plan: WorkoutPlan) => {
    if (deletingPlanId) return;

    const planName = plan.name?.trim() || 'this workout';

    Alert.alert(
      'Delete workout plan?',
      `Remove "${planName}"? Exercises and past sessions for this plan will also be deleted. Schedule days using it will be cleared.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setDeletingPlanId(plan.id);
              setError(null);
              try {
                await deleteWorkoutPlan(plan.id);
                setPlans((current) => current.filter((item) => item.id !== plan.id));
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to delete workout plan');
              } finally {
                setDeletingPlanId(null);
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <KeyboardAwareScreen className="pt-2" contentContainerClassName="gap-6 pb-32">
      <FadeInView onceKey="workouts-header" delay={0} className="gap-2 pt-1">
        <Text className="text-[11px] font-bold uppercase tracking-[2px] text-accent">Library</Text>
        <Text className="text-[32px] font-bold leading-9 text-white">Workouts</Text>
        <Text className="text-sm text-forge-400">
          Build and manage the plans you train from.
        </Text>
      </FadeInView>

      {isLoading ? <WorkoutsScreenSkeleton /> : null}

      {error ? (
        <View className="rounded-2xl border border-forge-700 bg-forge-900 p-4">
          <Text className="text-red-400">{error}</Text>
        </View>
      ) : null}

      {!isLoading && !error && plans.length === 0 && !isCreating ? (
        <FadeInView
          onceKey="workouts-empty"
          delay={40}
          className="overflow-hidden rounded-3xl border border-forge-700 bg-forge-900"
        >
          <View className="h-1 w-full bg-accent" />
          <View className="gap-4 px-5 py-6">
            <View className="gap-2">
              <Text className="text-lg font-bold text-white">No plans yet</Text>
              <Text className="text-sm leading-5 text-forge-300">
                Create your own, or start with a recommended Forge starter plan.
              </Text>
            </View>
            <Button
              title="Build Your First Workout"
              variant="secondary"
              onPress={() => router.push('/first-workout')}
            />
          </View>
        </FadeInView>
      ) : null}

      {!isLoading && plans.length > 0 ? (
        <View className="gap-3">
          <View className="flex-row items-center justify-between px-0.5">
            <Text className="text-[11px] font-bold uppercase tracking-[1.5px] text-forge-400">
              Your plans
            </Text>
            <Text className="text-xs font-semibold text-forge-500">
              {plans.length} {plans.length === 1 ? 'plan' : 'plans'}
            </Text>
          </View>

          {plans.map((plan, index) => {
            const isDeleting = deletingPlanId === plan.id;
            const planNumber = String(index + 1).padStart(2, '0');

            return (
              <FadeInView
                key={plan.id}
                onceKey={`workout-plan-${plan.id}`}
                className="overflow-hidden rounded-3xl border border-forge-700 bg-forge-900"
              >
                <View className="h-1 w-full bg-accent/80" />
                <View className="flex-row items-stretch">
                  <Pressable
                    className="flex-1 gap-2 px-5 py-4 active:opacity-80"
                    disabled={isDeleting}
                    onPress={() =>
                      router.push({
                        pathname: '/workout-details',
                        params: { id: plan.id, name: plan.name },
                      })
                    }
                  >
                    <Text className="text-[10px] font-bold uppercase tracking-[1.5px] text-accent">
                      Plan {planNumber}
                    </Text>
                    <Text className="text-xl font-bold text-white">
                      {plan.name || 'Untitled workout'}
                    </Text>
                    <Text className="text-xs font-medium text-forge-400">Tap to open →</Text>
                  </Pressable>

                  <View className="justify-center border-l border-forge-800 px-3">
                    <Pressable
                      className="rounded-xl bg-forge-950 px-3 py-2.5 active:bg-forge-800"
                      disabled={!!deletingPlanId}
                      onPress={() => handleDeletePlan(plan)}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete ${plan.name || 'workout'}`}
                    >
                      {isDeleting ? (
                        <ActivityIndicator color="#ff6b35" />
                      ) : (
                        <Text className="text-xs font-semibold text-red-400">Delete</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              </FadeInView>
            );
          })}
        </View>
      ) : null}

      {isCreating ? (
        <FadeInView
          onceKey="workouts-create-form"
          className="overflow-hidden rounded-3xl border border-accent/30 bg-forge-900"
        >
          <View className="h-1.5 w-full bg-accent" />
          <View className="gap-5 px-5 py-6">
            <View className="gap-2">
              <Text className="text-[11px] font-bold uppercase tracking-[2px] text-accent">
                Step 1
              </Text>
              <Text className="text-2xl font-bold text-white">Name your workout</Text>
              <Text className="text-sm leading-5 text-forge-300">
                Keep it simple — Push, Pull, Legs, or whatever you train.
              </Text>
            </View>

            <Input
              label="Workout name"
              value={newPlanName}
              onChangeText={(value) => {
                setNewPlanName(value);
                if (error === 'Workout name is required') {
                  setError(null);
                }
              }}
              placeholder="e.g. Chest & Triceps"
              autoFocus
            />

            <View className="gap-2.5">
              <Button
                title="Continue"
                variant="primary"
                loading={isSaving}
                disabled={isSaving || !newPlanName.trim()}
                onPress={() => {
                  void handleCreatePlan();
                }}
              />
              <Button
                title="Cancel"
                variant="ghost"
                disabled={isSaving}
                onPress={resetCreateForm}
              />
            </View>
          </View>
        </FadeInView>
      ) : (
        <ScalePressable
          className="overflow-hidden rounded-3xl bg-accent"
          onPress={() => {
            setError(null);
            setIsCreating(true);
          }}
        >
          <View className="items-center px-5 py-4">
            <Text className="text-base font-bold text-white">+ Add Workout</Text>
          </View>
        </ScalePressable>
      )}
    </KeyboardAwareScreen>
  );
}
