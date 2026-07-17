import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OptionPicker } from '@/components/ui/OptionPicker';
import { Typography } from '@/components/ui/Typography';
import { useAuth } from '@/features/auth/context/AuthProvider';
import {
  EXPERIENCE_OPTIONS,
  GOAL_OPTIONS,
  profileSchema,
  type ProfileForm,
  type ProfileFormInput,
} from '@/features/auth/schemas/profile-schemas';
import { createProfile } from '@/lib/supabase/profile';

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
    <Screen className="pt-6">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-8">
          <View className="gap-6">
            <View className="gap-2">
              <Typography variant="title">Set up your profile</Typography>
              <Typography variant="body">
                Tell us about yourself so Forge can personalize your training.
              </Typography>
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
              <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <Typography variant="caption" className="text-red-400">
                  {submitError}
                </Typography>
              </View>
            ) : null}

            <Button
              title="Complete Setup"
              loading={isSubmitting}
              onPress={handleSubmit(onSubmit)}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
