import { Link } from 'expo-router';
import { View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { isSupabaseConfigured } from '@/config/env';

export default function WelcomeScreen() {
  return (
    <Screen className="justify-center">
      <View className="flex-1 justify-center gap-6">
        <View className="gap-2">
          <Typography variant="title">Forge</Typography>
          <Typography variant="subtitle">AI-powered gym coaching</Typography>
          <Typography variant="body">
            Train smarter with personalized workouts, progress tracking, and an AI coach in your
            pocket.
          </Typography>
        </View>

        {!isSupabaseConfigured ? (
          <View className="bg-forge-900 border border-forge-700 rounded-xl p-4">
            <Typography variant="caption">
              Supabase is not configured. Copy .env.example to .env and add your project credentials.
            </Typography>
          </View>
        ) : null}

        <View className="gap-3">
          <Link href="/signup" asChild>
            <Button title="Get Started" />
          </Link>
          <Link href="/login" asChild>
            <Button title="Sign In" variant="secondary" />
          </Link>
        </View>
      </View>
    </Screen>
  );
}
