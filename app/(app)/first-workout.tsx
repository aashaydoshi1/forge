import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { FadeInView, ScalePressable } from '@/components/motion';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/context/AuthProvider';
import {
  createStarterProgram,
  getRecommendedStarterProgramId,
  getStarterPrograms,
  type StarterProgramId,
} from '@/lib/starter-workouts';

function skipStarterKey(userId: string) {
  return `forge:skip-starter:${userId}`;
}

export default function FirstWorkoutScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [selectedId, setSelectedId] = useState<StarterProgramId | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const programs = useMemo(
    () => getStarterPrograms(profile?.experience),
    [profile?.experience],
  );

  const recommendedId = useMemo(
    () => getRecommendedStarterProgramId(profile?.goal, profile?.experience),
    [profile?.goal, profile?.experience],
  );

  const activeId = selectedId ?? recommendedId;
  const firstName = profile?.name?.trim().split(/\s+/)[0] || 'Athlete';

  const handleCreate = async () => {
    if (!user?.id || isCreating) return;

    setIsCreating(true);
    setError(null);

    try {
      await createStarterProgram(user.id, activeId, profile?.experience);
      await AsyncStorage.removeItem(skipStarterKey(user.id));
      router.replace('/(app)/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create your starter plan');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSkip = async () => {
    if (!user?.id || isSkipping || isCreating) return;

    setIsSkipping(true);
    setError(null);

    try {
      await AsyncStorage.setItem(skipStarterKey(user.id), '1');
      router.replace('/(app)/(tabs)/workouts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not continue');
    } finally {
      setIsSkipping(false);
    }
  };

  return (
    <Screen className="pt-2">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-6 pb-10"
        showsVerticalScrollIndicator={false}
      >
        <FadeInView onceKey="first-workout-brand" delay={0} className="gap-5 pt-1">
          <View className="flex-row items-center gap-3.5">
            <View className="rounded-2xl border border-forge-700 bg-forge-900 p-1">
              <Image
                source={require('../../assets/images/forge-logo.png')}
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
                  First session
                </Text>
              </View>
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-[30px] font-bold leading-9 text-white">
              Build your first workout, {firstName}.
            </Text>
            <Text className="text-base leading-6 text-forge-300">
              Pick a starter plan matched to your goal and experience. We will create the
              workouts and lock them into your week.
            </Text>
          </View>
        </FadeInView>

        <FadeInView onceKey="first-workout-plans" delay={80} className="gap-3">
          {programs.map((program) => {
            const isSelected = program.id === activeId;
            const isRecommended = program.id === recommendedId;

            return (
              <ScalePressable
                key={program.id}
                onPress={() => setSelectedId(program.id)}
                disabled={isCreating || isSkipping}
              >
                <View
                  className={`overflow-hidden rounded-3xl border ${
                    isSelected
                      ? 'border-accent bg-forge-900'
                      : 'border-forge-700 bg-forge-900/80'
                  }`}
                >
                  <View className={`h-1 w-full ${isSelected ? 'bg-accent' : 'bg-accent/40'}`} />
                  <View className="gap-3 px-5 py-4">
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1 gap-1">
                        <Text className="text-lg font-bold text-white">{program.title}</Text>
                        <Text className="text-sm leading-5 text-forge-300">
                          {program.subtitle}
                        </Text>
                      </View>
                      <View
                        className={`mt-1 h-5 w-5 items-center justify-center rounded-full border ${
                          isSelected
                            ? 'border-accent bg-accent'
                            : 'border-forge-600 bg-transparent'
                        }`}
                      >
                        {isSelected ? (
                          <View className="h-2 w-2 rounded-full bg-white" />
                        ) : null}
                      </View>
                    </View>

                    <View className="flex-row flex-wrap items-center gap-2">
                      {isRecommended ? (
                        <View className="rounded-full bg-accent/15 px-3 py-1">
                          <Text className="text-[11px] font-semibold uppercase tracking-[1.5px] text-accent">
                            Recommended
                          </Text>
                        </View>
                      ) : null}
                      <View className="rounded-full bg-forge-800 px-3 py-1">
                        <Text className="text-[11px] font-medium text-forge-200">
                          {program.daysPerWeek}x / week
                        </Text>
                      </View>
                      <View className="rounded-full bg-forge-800 px-3 py-1">
                        <Text className="text-[11px] font-medium text-forge-200">
                          {program.days.length} workout
                          {program.days.length === 1 ? '' : 's'}
                        </Text>
                      </View>
                    </View>

                    <Text className="text-xs text-forge-400">{program.bestFor}</Text>

                    <View className="gap-1.5 border-t border-forge-800 pt-3">
                      {program.days.map((day) => (
                        <Text key={day.name} className="text-sm text-forge-200">
                          <Text className="font-semibold text-white">{day.name}</Text>
                          {'  ·  '}
                          {day.exercises.length} exercises
                        </Text>
                      ))}
                    </View>
                  </View>
                </View>
              </ScalePressable>
            );
          })}
        </FadeInView>

        {error ? (
          <View className="overflow-hidden rounded-3xl border border-red-500/40 bg-red-500/10">
            <View className="h-1 w-full bg-red-500" />
            <Text className="px-5 py-4 text-sm text-red-300">{error}</Text>
          </View>
        ) : null}

        <FadeInView onceKey="first-workout-cta" delay={140} className="gap-3">
          <Button
            title="Create my plan"
            onPress={() => void handleCreate()}
            loading={isCreating}
            disabled={isSkipping}
          />
          <Pressable
            onPress={() => void handleSkip()}
            disabled={isCreating || isSkipping}
            className="items-center py-3 active:opacity-70"
          >
            <Text className="text-sm font-medium text-forge-300">
              {isSkipping ? 'Opening workouts…' : "I'll build my own"}
            </Text>
          </Pressable>
        </FadeInView>
      </ScrollView>
    </Screen>
  );
}
