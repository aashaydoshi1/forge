import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';

import { KeyboardAwareScreen } from '@/components/layout/KeyboardAwareScreen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Typography } from '@/components/ui/Typography';
import { isSupabaseConfigured } from '@/config/env';
import {
  forgotPasswordSchema,
  type ForgotPasswordForm,
} from '@/features/auth/schemas/auth-schemas';
import { resetPassword } from '@/lib/supabase/auth';

export default function ForgotPasswordScreen() {
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordForm) => {
    setFormError(null);
    setSuccessMessage(null);

    if (!isSupabaseConfigured) {
      setFormError('Supabase is not configured. Add your credentials to .env');
      return;
    }

    try {
      await resetPassword(values.email.trim());
      setSuccessMessage(
        'If an account exists for that email, a password reset link has been sent. Check your inbox.',
      );
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Failed to send password reset email',
      );
    }
  };

  return (
    <KeyboardAwareScreen contentContainerClassName="flex-grow justify-center pb-8">
      <View className="gap-6">
        <View className="gap-2">
          <Typography variant="title">Reset password</Typography>
          <Typography variant="body">
            Enter your email and we will send you a reset link.
          </Typography>
        </View>

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
              editable={!isSubmitting}
            />
          )}
        />

        {formError ? (
          <View className="rounded-xl bg-forge-900 border border-forge-700 p-4">
            <Text className="text-red-400">{formError}</Text>
          </View>
        ) : null}

        {successMessage ? (
          <View className="rounded-xl bg-forge-900 border border-forge-700 p-4">
            <Text className="text-forge-200">{successMessage}</Text>
          </View>
        ) : null}

        <View className="gap-3">
          <Button
            title="Send Reset Link"
            loading={isSubmitting}
            disabled={isSubmitting}
            onPress={() => {
              void handleSubmit(onSubmit)();
            }}
          />
          <Link href="/login" asChild>
            <Button title="Back to Sign In" variant="ghost" disabled={isSubmitting} />
          </Link>
        </View>
      </View>
    </KeyboardAwareScreen>
  );
}
