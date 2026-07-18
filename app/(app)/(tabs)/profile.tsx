import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useLayoutEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';
import { useNavigation } from 'expo-router';

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
import { signOut } from '@/lib/supabase/auth';
import { updateProfile } from '@/lib/supabase/profile';

function getLabel(
  options: { value: string; label: string }[],
  value: string | null | undefined,
) {
  return options.find((option) => option.value === value)?.label ?? '—';
}

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, profile, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const {
    control,
    handleSubmit,
    reset,
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

  useEffect(() => {
    if (!profile) return;

    reset({
      name: profile.name ?? '',
      age: profile.age != null ? String(profile.age) : '',
      height: profile.height != null ? String(profile.height) : '',
      weight: profile.weight != null ? String(profile.weight) : '',
      goal: profile.goal ?? undefined,
      experience: profile.experience ?? undefined,
    });
  }, [profile, reset]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleCancelEdit = () => {
    setSubmitError(null);
    setIsEditing(false);

    if (!profile) return;

    reset({
      name: profile.name ?? '',
      age: profile.age != null ? String(profile.age) : '',
      height: profile.height != null ? String(profile.height) : '',
      weight: profile.weight != null ? String(profile.weight) : '',
      goal: profile.goal ?? undefined,
      experience: profile.experience ?? undefined,
    });
  };

  const onSubmit = async (values: ProfileForm) => {
    if (!user?.id) {
      setSubmitError('You must be signed in to update your profile.');
      return;
    }

    setSubmitError(null);

    try {
      await updateProfile(user.id, {
        name: values.name,
        age: values.age,
        height: values.height,
        weight: values.weight,
        goal: values.goal,
        experience: values.experience,
      });
      await refreshProfile();
      setIsEditing(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  const displayName = profile?.name?.trim() || 'Athlete';
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <KeyboardAwareScreen className="pt-2" contentContainerClassName="gap-6 pb-32">
      <FadeInView onceKey="profile-header" delay={0} className="gap-2 pt-1">
        <Text className="text-[11px] font-bold uppercase tracking-[2px] text-accent">Account</Text>
        <Text className="text-[32px] font-bold leading-9 text-white">Profile</Text>
        <Text className="text-sm text-forge-400">Your athlete identity and preferences.</Text>
      </FadeInView>

      {isEditing ? (
        <FadeInView
          onceKey="profile-edit"
          className="overflow-hidden rounded-3xl border border-accent/30 bg-forge-900"
        >
          <View className="h-1.5 w-full bg-accent" />
          <View className="gap-4 px-5 py-5">
            <View className="gap-1">
              <Text className="text-[11px] font-bold uppercase tracking-[1.5px] text-accent">
                Edit profile
              </Text>
              <Text className="text-xl font-bold text-white">Update your details</Text>
            </View>

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

            {submitError ? (
              <View className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
                <Text className="text-sm text-red-400">{submitError}</Text>
              </View>
            ) : null}

            <View className="flex-row gap-3 pt-1">
              <View className="flex-1">
                <Button
                  title="Cancel"
                  variant="ghost"
                  disabled={isSubmitting}
                  onPress={handleCancelEdit}
                />
              </View>
              <View className="flex-1">
                <Button
                  title="Save"
                  variant="primary"
                  loading={isSubmitting}
                  onPress={handleSubmit(onSubmit)}
                />
              </View>
            </View>
          </View>
        </FadeInView>
      ) : (
        <>
          <FadeInView
            onceKey="profile-identity"
            delay={40}
            className="overflow-hidden rounded-3xl border border-forge-700 bg-forge-900"
          >
            <View className="h-1.5 w-full bg-accent" />
            <View className="gap-5 px-5 py-5">
              <View className="flex-row items-center gap-4">
                <View className="h-16 w-16 items-center justify-center rounded-2xl border border-accent/40 bg-accent/15">
                  <Text className="text-xl font-black text-accent">{initials || 'F'}</Text>
                </View>
                <View className="flex-1 gap-1">
                  <Text className="text-[11px] font-bold uppercase tracking-[1.5px] text-accent">
                    Athlete
                  </Text>
                  <Text className="text-2xl font-bold text-white">{displayName}</Text>
                  <Text className="text-sm text-forge-400">
                    {getLabel(EXPERIENCE_OPTIONS, profile?.experience)}
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1 rounded-2xl border border-forge-800 bg-forge-950 px-3 py-3">
                  <Text className="text-[10px] font-bold uppercase tracking-[1.5px] text-forge-400">
                    Age
                  </Text>
                  <Text className="mt-1.5 text-xl font-bold text-white">{profile?.age ?? '—'}</Text>
                </View>
                <View className="flex-1 rounded-2xl border border-forge-800 bg-forge-950 px-3 py-3">
                  <Text className="text-[10px] font-bold uppercase tracking-[1.5px] text-forge-400">
                    Height
                  </Text>
                  <Text className="mt-1.5 text-xl font-bold text-white">
                    {profile?.height != null ? `${profile.height}` : '—'}
                  </Text>
                  {profile?.height != null ? (
                    <Text className="text-xs text-forge-500">cm</Text>
                  ) : null}
                </View>
                <View className="flex-1 rounded-2xl border border-forge-800 bg-forge-950 px-3 py-3">
                  <Text className="text-[10px] font-bold uppercase tracking-[1.5px] text-forge-400">
                    Weight
                  </Text>
                  <Text className="mt-1.5 text-xl font-bold text-accent">
                    {profile?.weight != null ? `${profile.weight}` : '—'}
                  </Text>
                  {profile?.weight != null ? (
                    <Text className="text-xs text-forge-500">kg</Text>
                  ) : null}
                </View>
              </View>
            </View>
          </FadeInView>

          <FadeInView onceKey="profile-prefs" delay={100} className="gap-3">
            <Text className="px-0.5 text-[11px] font-bold uppercase tracking-[1.5px] text-forge-400">
              Training preferences
            </Text>
            <View className="overflow-hidden rounded-3xl border border-forge-700 bg-forge-900">
              <View className="gap-0">
                <View className="flex-row items-center justify-between border-b border-forge-800 px-5 py-4">
                  <Text className="text-sm text-forge-400">Fitness goal</Text>
                  <Text className="text-base font-semibold text-white">
                    {getLabel(GOAL_OPTIONS, profile?.goal)}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between px-5 py-4">
                  <Text className="text-sm text-forge-400">Experience</Text>
                  <Text className="text-base font-semibold text-white">
                    {getLabel(EXPERIENCE_OPTIONS, profile?.experience)}
                  </Text>
                </View>
              </View>
            </View>
          </FadeInView>

          <FadeInView onceKey="profile-settings" delay={160} className="gap-3">
            <Text className="px-0.5 text-[11px] font-bold uppercase tracking-[1.5px] text-forge-400">
              Settings
            </Text>
            <View className="gap-3">
              <Button title="Edit Profile" variant="primary" onPress={() => setIsEditing(true)} />
              <Button
                title="Sign Out"
                variant="ghost"
                loading={isSigningOut}
                onPress={() => {
                  void handleSignOut();
                }}
              />
            </View>
          </FadeInView>
        </>
      )}
    </KeyboardAwareScreen>
  );
}
