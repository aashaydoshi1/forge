import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { KeyboardAwareScreen } from '@/components/layout/KeyboardAwareScreen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Typography } from '@/components/ui/Typography';
import { isSupabaseConfigured } from '@/config/env';
import { signUpSchema, type SignUpForm } from '@/features/auth/schemas/auth-schemas';
import { signUpWithEmail } from '@/lib/supabase/auth';

export default function SignupScreen() {
  const [authError, setAuthError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (values: SignUpForm) => {
    setAuthError(null);
    setSuccessMessage(null);

    if (!isSupabaseConfigured) {
      setAuthError('Supabase is not configured. Add your credentials to .env');
      return;
    }

    try {
      const { session } = await signUpWithEmail(values.email, values.password);

      if (!session) {
        setSuccessMessage('Check your email to confirm your account, then sign in.');
      }
    } catch (error) {
      console.log('SIGNUP ERROR:', error);

      if (error instanceof Error) {
        console.log('MESSAGE:', error.message);
        console.log('STACK:', error.stack);
        setAuthError(error.message);
      } else {
        console.log('UNKNOWN ERROR:', error);
        setAuthError('Failed to create account');
      }
    }
  };

  return (
    <KeyboardAwareScreen contentContainerClassName="flex-grow justify-center pb-8">
      <View className="gap-6">
        <View className="gap-2">
          <Typography variant="title">Create account</Typography>
          <Typography variant="body">Start forging your best self.</Typography>
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
                placeholder="At least 8 characters"
                secureTextEntry
                autoComplete="new-password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirm Password"
                placeholder="Repeat password"
                secureTextEntry
                autoComplete="new-password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
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

        {successMessage ? (
          <View className="bg-forge-900 border border-forge-700 rounded-xl p-4">
            <Typography variant="caption">{successMessage}</Typography>
          </View>
        ) : null}

        <View className="gap-3">
          <Button title="Sign Up" loading={isSubmitting} onPress={handleSubmit(onSubmit)} />
          <Link href="/login" asChild>
            <Button title="Already have an account?" variant="ghost" />
          </Link>
        </View>
      </View>
    </KeyboardAwareScreen>
  );
}
