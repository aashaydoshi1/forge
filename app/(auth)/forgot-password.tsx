import { Link } from 'expo-router';
import { View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Typography } from '@/components/ui/Typography';

export default function ForgotPasswordScreen() {
  return (
    <Screen className="justify-center">
      <View className="gap-6">
        <View className="gap-2">
          <Typography variant="title">Reset password</Typography>
          <Typography variant="body">
            Enter your email and we will send you a reset link.
          </Typography>
        </View>

        <Input label="Email" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />

        <View className="gap-3">
          <Button title="Send Reset Link" />
          <Link href="/login" asChild>
            <Button title="Back to Sign In" variant="ghost" />
          </Link>
        </View>
      </View>
    </Screen>
  );
}
