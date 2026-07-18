import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { KeyboardAwareScreen } from '@/components/layout/KeyboardAwareScreen';
import { FadeInView } from '@/components/motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  createExercise,
  deleteExercise,
  fetchExercises,
  updateExercise,
} from '@/lib/supabase/workouts';

type ExerciseForm = {
  id: string;
  name: string;
  sets: string;
  reps: string;
};

function toForm(exercise: {
  id: string;
  exercise_name: string;
  sets: number;
  reps: string;
}): ExerciseForm {
  return {
    id: exercise.id,
    name: exercise.exercise_name,
    sets: String(exercise.sets),
    reps: exercise.reps,
  };
}

function parseSets(value: string): number | null {
  const parsed = Number.parseInt(value.trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export default function WorkoutDetailsScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id?: string; name?: string }>();
  const planId = typeof id === 'string' ? id : '';
  const workoutName = typeof name === 'string' ? name : 'Workout';

  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exercises, setExercises] = useState<ExerciseForm[]>([]);
  const [draftExercises, setDraftExercises] = useState<ExerciseForm[]>([]);
  const [newName, setNewName] = useState('');
  const [newSets, setNewSets] = useState('');
  const [newReps, setNewReps] = useState('');

  const loadExercises = useCallback(async () => {
    if (!planId) {
      setExercises([]);
      setIsLoading(false);
      setError('Missing workout plan id');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchExercises(planId);
      const forms = data.map(toForm);
      setExercises(forms);
      setDraftExercises(forms);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exercises');
    } finally {
      setIsLoading(false);
    }
  }, [planId]);

  useFocusEffect(
    useCallback(() => {
      void loadExercises();
    }, [loadExercises]),
  );

  const displayedExercises = isEditing ? draftExercises : exercises;

  const updateDraftExercise = (
    exerciseId: string,
    field: keyof Omit<ExerciseForm, 'id'>,
    value: string,
  ) => {
    setDraftExercises((current) =>
      current.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, [field]: value } : exercise,
      ),
    );
  };

  const resetAddForm = () => {
    setNewName('');
    setNewSets('');
    setNewReps('');
    setIsAdding(false);
  };

  const handleAddExercise = async () => {
    const trimmedName = newName.trim();
    const trimmedReps = newReps.trim();
    const sets = parseSets(newSets);

    if (!planId || !trimmedName || sets === null || !trimmedReps) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const created = await createExercise({
        workout_plan_id: planId,
        exercise_name: trimmedName,
        sets,
        reps: trimmedReps,
      });
      const form = toForm(created);
      setExercises((current) => [...current, form]);
      setDraftExercises((current) => [...current, form]);
      resetAddForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add exercise');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    setIsSaving(true);
    setError(null);

    try {
      await deleteExercise(exerciseId);
      setExercises((current) => current.filter((exercise) => exercise.id !== exerciseId));
      setDraftExercises((current) => current.filter((exercise) => exercise.id !== exerciseId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete exercise');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEdit = async () => {
    if (!isEditing) {
      setDraftExercises(exercises);
      setIsEditing(true);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const originalById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
      const next: ExerciseForm[] = [];

      for (const draft of draftExercises) {
        const original = originalById.get(draft.id);
        const trimmedName = draft.name.trim();
        const trimmedReps = draft.reps.trim();
        const sets = parseSets(draft.sets);

        if (!trimmedName || sets === null || !trimmedReps) {
          throw new Error('Each exercise needs a name, sets, and reps');
        }

        const changed =
          !original ||
          original.name !== trimmedName ||
          original.sets !== String(sets) ||
          original.reps !== trimmedReps;

        if (changed) {
          const updated = await updateExercise(draft.id, {
            exercise_name: trimmedName,
            sets,
            reps: trimmedReps,
          });
          next.push(toForm(updated));
        } else {
          next.push(original);
        }
      }

      setExercises(next);
      setDraftExercises(next);
      setIsEditing(false);
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : 'Failed to save exercises');
      setError(err instanceof Error ? err.message : 'Failed to save exercises');
    } finally {
      setIsSaving(false);
    }
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
          headerShadowVisible: false,
          contentStyle: { backgroundColor: '#0d0d12' },
        }}
      />
      <KeyboardAwareScreen className="pt-2" contentContainerClassName="gap-6 pb-32">
        <FadeInView
          onceKey={`workout-details-hero-${planId}`}
          className="overflow-hidden rounded-3xl border border-forge-700 bg-forge-900"
        >
          <View className="h-1.5 w-full bg-accent" />
          <View className="gap-2 px-5 py-5">
            <Text className="text-[11px] font-bold uppercase tracking-[2px] text-accent">
              Workout
            </Text>
            <Text className="text-3xl font-bold leading-tight text-white">{workoutName}</Text>
            <Text className="text-sm text-forge-300">
              {displayedExercises.length}{' '}
              {displayedExercises.length === 1 ? 'exercise' : 'exercises'} in this session
            </Text>
          </View>
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

        {!isLoading ? (
          <View className="gap-3">
            <Button
              title="Start Workout"
              variant="primary"
              disabled={isSaving || isEditing || exercises.length === 0}
              onPress={() =>
                router.push({
                  pathname: '/active-workout',
                  params: {
                    id: planId,
                    name: workoutName,
                    exercises: JSON.stringify(exercises),
                  },
                })
              }
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button
                  title={isEditing ? 'Done' : 'Edit Workout'}
                  variant={isEditing ? 'secondary' : 'ghost'}
                  onPress={() => {
                    void handleToggleEdit();
                  }}
                  loading={isSaving && isEditing}
                  disabled={isSaving}
                />
              </View>
              <View className="flex-1">
                <Button
                  title={isAdding ? 'Cancel' : 'Add Exercise'}
                  variant={isAdding ? 'secondary' : 'primary'}
                  disabled={isSaving || !planId}
                  onPress={() => {
                    if (isAdding) {
                      resetAddForm();
                    } else {
                      setIsAdding(true);
                    }
                  }}
                />
              </View>
            </View>
          </View>
        ) : null}

        {isAdding ? (
          <View className="overflow-hidden rounded-3xl border border-accent/30 bg-forge-900">
            <View className="h-1.5 w-full bg-accent" />
            <View className="gap-4 px-5 py-5">
              <View className="gap-1">
                <Text className="text-[11px] font-bold uppercase tracking-[1.5px] text-accent">
                  Add exercise
                </Text>
                <Text className="text-xl font-bold text-white">Build your session</Text>
                <Text className="text-sm text-forge-400">
                  Name it, set the volume, then add it to the workout.
                </Text>
              </View>
              <Input
                label="Exercise name"
                value={newName}
                onChangeText={setNewName}
                placeholder="e.g. Bench Press"
              />
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Input
                    label="Sets"
                    value={newSets}
                    onChangeText={setNewSets}
                    placeholder="3"
                    keyboardType="number-pad"
                  />
                </View>
                <View className="flex-1">
                  <Input
                    label="Reps"
                    value={newReps}
                    onChangeText={setNewReps}
                    placeholder="8–12"
                  />
                </View>
              </View>
              <Button
                title="Add to Workout"
                variant="primary"
                onPress={() => {
                  void handleAddExercise();
                }}
                loading={isSaving}
                disabled={
                  isSaving || !newName.trim() || !newSets.trim() || !newReps.trim() || !planId
                }
              />
            </View>
          </View>
        ) : null}

        {!isLoading ? (
          <View className="gap-3">
            <View className="flex-row items-center justify-between px-0.5">
              <Text className="text-[11px] font-bold uppercase tracking-[1.5px] text-forge-400">
                Exercises
              </Text>
              <Text className="text-xs font-semibold text-forge-500">
                {displayedExercises.length}
              </Text>
            </View>

            {displayedExercises.map((exercise, index) => {
              const exerciseNumber = String(index + 1).padStart(2, '0');

              return (
                <View
                  key={exercise.id}
                  className="overflow-hidden rounded-3xl border border-forge-700 bg-forge-900"
                >
                  <View className="h-1 w-full bg-accent/70" />
                  <View className="gap-3 px-5 py-4">
                    {isEditing ? (
                      <>
                        <Text className="text-[10px] font-bold uppercase tracking-[1.5px] text-accent">
                          Exercise {exerciseNumber}
                        </Text>
                        <Input
                          label="Exercise"
                          value={exercise.name}
                          onChangeText={(value) => updateDraftExercise(exercise.id, 'name', value)}
                          placeholder="Exercise name"
                        />
                        <View className="flex-row gap-3">
                          <View className="flex-1">
                            <Input
                              label="Sets"
                              value={exercise.sets}
                              onChangeText={(value) =>
                                updateDraftExercise(exercise.id, 'sets', value)
                              }
                              placeholder="3"
                              keyboardType="number-pad"
                            />
                          </View>
                          <View className="flex-1">
                            <Input
                              label="Reps"
                              value={exercise.reps}
                              onChangeText={(value) =>
                                updateDraftExercise(exercise.id, 'reps', value)
                              }
                              placeholder="8–12"
                            />
                          </View>
                        </View>
                        <Pressable
                          className="items-center rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 active:bg-red-500/20"
                          disabled={isSaving}
                          onPress={() => {
                            void handleDeleteExercise(exercise.id);
                          }}
                        >
                          <Text className="font-semibold text-red-400">Delete Exercise</Text>
                        </Pressable>
                      </>
                    ) : (
                      <View className="flex-row items-start gap-4">
                        <Text className="pt-0.5 text-sm font-black text-accent">
                          {exerciseNumber}
                        </Text>
                        <View className="flex-1 gap-3">
                          <Text className="text-lg font-bold text-white">{exercise.name}</Text>
                          <View className="flex-row gap-6">
                            <View>
                              <Text className="mb-1 text-[10px] font-bold uppercase tracking-wide text-forge-400">
                                Sets
                              </Text>
                              <Text className="text-base font-semibold text-accent">
                                {exercise.sets}
                              </Text>
                            </View>
                            <View>
                              <Text className="mb-1 text-[10px] font-bold uppercase tracking-wide text-forge-400">
                                Reps
                              </Text>
                              <Text className="text-base font-semibold text-white">
                                {exercise.reps}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            {displayedExercises.length === 0 ? (
              <View className="overflow-hidden rounded-3xl border border-forge-700 bg-forge-900">
                <View className="h-1 w-full bg-accent" />
                <View className="gap-2 px-5 py-6">
                  <Text className="text-lg font-bold text-white">No exercises yet</Text>
                  <Text className="text-sm leading-5 text-forge-300">
                    Tap Add Exercise to build this workout — name, sets, and reps.
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        ) : null}
      </KeyboardAwareScreen>
    </>
  );
}
