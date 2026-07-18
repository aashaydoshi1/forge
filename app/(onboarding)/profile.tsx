import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';

import { KeyboardAwareScreen } from '@/components/layout/KeyboardAwareScreen';
import { FadeInView } from '@/components/motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OptionPicker } from '@/components/ui/OptionPicker';
import { useAuth } from '@/features/auth/context/AuthProvider';
import {
  EXPERIENCE_OPTIONS,
  GOAL_OPTIONS,
  profileSchema,
  type ProfileForm,
  type ProfileFormInput,
} from '@/features/auth/schemas/profile-schemas';
import { createProfile } from '@/lib/supabase/profile';

const VALUE_POINTS = [
  {
    title: 'Train with intent',
    detail: 'Build workouts and lock them into your week.',
  },
  {
    title: 'Track what matters',
    detail: 'Streaks, sessions, and personal records in one place.',
  },
  {
    title: 'Forge AI Coach',
    detail: 'Sharp advice on form, recovery, and programming.',
  },
] as const;

export default function OnboardingProfileScreen() {
  const { user, refreshProfile } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormInput, unknown, ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      age: '',
      height: '',
      weight: '',
      goal: undefined,
      experience: undefined,
    },
  });

  const onSubmit = async (values: ProfileForm) => {
    if (!user?.id) {
      setSubmitError('You must be signed in to complete onboarding.');
      return;
    }

    setSubmitError(null);

    try {
      await createProfile({
        id: user.id,
        name: values.name,
        age: values.age,
        height: values.height,
        weight: values.weight,
        goal: values.goal,
        experience: values.experience,
      });

      await refreshProfile();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save profile');
    }
  };

  return (
    <KeyboardAwareScreen className="pt-2" contentContainerClassName="gap-6 pb-32">
      <FadeInView onceKey="onboarding-brand" delay={0} className="gap-6 pt-1">
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
                Built for the work
              </Text>
            </View>
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-[32px] font-bold leading-9 text-white">
            Ready to train with purpose.
          </Text>
          <Text className="text-base leading-6 text-forge-300">
            Set up your athlete profile and step into a sharper training system — workouts,
            schedule, progress, and AI coaching.
          </Text>
        </View>
      </FadeInView>

      <FadeInView onceKey="onboarding-value" delay={60} className="gap-3">
        {VALUE_POINTS.map((point, index) => (
          <View
            key={point.title}
            className="overflow-hidden rounded-3xl border border-forge-700 bg-forge-900"
          >
            <View className={`h-1 w-full ${index === 0 ? 'bg-accent' : 'bg-accent/60'}`} />
            <View className="flex-row items-start gap-4 px-5 py-4">
              <Text className="pt-0.5 text-sm font-black text-accent">
                {String(index + 1).padStart(2, '0')}
              </Text>
              <View className="flex-1 gap-1">
                <Text className="text-base font-bold text-white">{point.title}</Text>
                <Text className="text-sm leading-5 text-forge-400">{point.detail}</Text>
              </View>
            </View>
          </View>
        ))}
      </FadeInView>

      <FadeInView
        onceKey="onboarding-form"
        delay={120}
        className="overflow-hidden rounded-3xl border border-accent/30 bg-forge-900"
      >
        <View className="h-1.5 w-full bg-accent" />
        <View className="gap-5 px-5 py-5">
          <View className="gap-1">
            <Text className="text-[11px] font-bold uppercase tracking-[2px] text-accent">
              Your profile
            </Text>
            <Text className="text-xl font-bold text-white">Tell Forge who you are</Text>
            <Text className="text-sm text-forge-400">
              This helps personalize coaching and keep your training dialed in.
            </Text>
          </View>

          <View className="gap-4">
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Name"
                  placeholder="Your name"
                  autoCapitalize="words"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.name?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="age"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Age"
                  placeholder="25"
                  keyboardType="number-pad"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.age?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="height"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Height (cm)"
                  placeholder="175"
                  keyboardType="number-pad"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.height?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="weight"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Weight (kg)"
                  placeholder="75"
                  keyboardType="decimal-pad"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.weight?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="goal"
              render={({ field: { onChange, value } }) => (
                <OptionPicker
                  label="Fitness goal"
                  options={GOAL_OPTIONS}
                  value={value}
                  onChange={onChange}
                  error={errors.goal?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="experience"
              render={({ field: { onChange, value } }) => (
                <OptionPicker
                  label="Experience level"
                  options={EXPERIENCE_OPTIONS}
                  value={value}
                  onChange={onChange}
                  error={errors.experience?.message}
                />
              )}
            />
          </View>

          {submitError ? (
            <View className="rounded-2xl border border-forge-700 bg-forge-950 p-4">
              <Text className="text-sm text-red-400">{submitError}</Text>
            </View>
          ) : null}

          <Button
            title="Start Training"
            loading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
          />
        </View>
      </FadeInView>
    </KeyboardAwareScreen>
  );
}
