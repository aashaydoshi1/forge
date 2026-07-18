import { zodResolver } from '@hookform/resolvers/zod';
import { Link, type Href } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { KeyboardAwareScreen } from '@/components/layout/KeyboardAwareScreen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Typography } from '@/components/ui/Typography';
import { isSupabaseConfigured } from '@/config/env';
import { signInSchema, type SignInForm } from '@/features/auth/schemas/auth-schemas';
import { signInWithEmail } from '@/lib/supabase/auth';

export default function LoginScreen() {
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: SignInForm) => {
    setAuthError(null);

    if (!isSupabaseConfigured) {
      setAuthError('Supabase is not configured. Add your credentials to .env');
      return;
    }

    try {
      await signInWithEmail(values.email, values.password);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Failed to sign in');
    }
  };

  return (
    <KeyboardAwareScreen contentContainerClassName="flex-grow justify-center pb-8">
      <View className="gap-6">
        <View className="gap-2">
          <Typography variant="title">Welcome back</Typography>
          <Typography variant="body">Sign in to continue your training.</Typography>
        </View>

        <View className="gap-4">
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="Your password"
                secureTextEntry
                autoComplete="password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
              />
            )}
          />
        </View>

        {authError ? (
          <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <Typography variant="caption" className="text-red-400">
              {authError}
            </Typography>
          </View>
        ) : null}

        <View className="gap-3">
          <Button title="Sign In" loading={isSubmitting} onPress={handleSubmit(onSubmit)} />
          <Link href={'/forgot-password' as Href} asChild>
            <Button title="Forgot Password?" variant="ghost" />
          </Link>
          <Link href="/signup" asChild>
            <Button title="Create Account" variant="secondary" />
          </Link>
        </View>
      </View>
    </KeyboardAwareScreen>
  );
}
