import { Link } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { Screen } from '@/components/layout/Screen';
import { FadeInView } from '@/components/motion';
import { Button } from '@/components/ui/Button';
import { isSupabaseConfigured } from '@/config/env';

const PILLARS = [
  'Personalized workouts & weekly schedule',
  'Progress, streaks, and personal records',
  'Forge AI Coach between sessions',
] as const;

/** Auth entry (`/`) — first screen after splash when logged out. */
export default function WelcomeScreen() {
  return (
    <Screen className="bg-forge-950">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="flex-grow justify-between gap-10 pb-6 pt-6"
        bounces={false}
      >
        <FadeInView onceKey="welcome-brand" delay={0} className="gap-10">
          <View className="items-center gap-5 pt-2">
            <View className="rounded-[22px] border border-accent/40 bg-forge-900 p-1.5">
              <Image
                source={require('../../assets/images/forge-logo.png')}
                style={{ width: 88, height: 88, borderRadius: 18 }}
                contentFit="cover"
                accessibilityLabel="Forge logo"
              />
            </View>

            <View className="items-center gap-3">
              <Text className="text-center text-[42px] font-black tracking-[8px] text-white">
                FORGE
              </Text>
              <View className="h-px w-14 bg-accent" />
              <Text className="text-center text-[11px] font-semibold uppercase tracking-[3.5px] text-accent">
                AI-powered training
              </Text>
            </View>
          </View>

          <View className="gap-3 px-1">
            <Text className="text-center text-[26px] font-bold leading-8 text-white">
              Built for athletes who{'\n'}refuse to coast.
            </Text>
            <Text className="text-center text-[15px] leading-6 text-forge-300">
              One system for training, recovery insight, and progress — designed to feel as serious
              as the work you put in.
            </Text>
          </View>

          <View className="overflow-hidden rounded-3xl border border-forge-800 bg-forge-900">
            <View className="h-1 w-full bg-accent" />
            <View className="gap-0 px-5 py-1">
              {PILLARS.map((line, index) => (
                <View
                  key={line}
                  className={`flex-row items-center gap-3.5 py-3.5 ${
                    index < PILLARS.length - 1 ? 'border-b border-forge-800' : ''
                  }`}
                >
                  <View className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <Text className="flex-1 text-[15px] font-medium leading-5 text-forge-100">
                    {line}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </FadeInView>

        <FadeInView onceKey="welcome-cta" delay={100} className="gap-3">
          {!isSupabaseConfigured ? (
            <View className="rounded-2xl border border-forge-700 bg-forge-900 p-4">
              <Text className="text-center text-sm text-forge-300">
                Supabase is not configured. Copy .env.example to .env and add your project
                credentials.
              </Text>
            </View>
          ) : null}

          <Link href="/signup" asChild>
            <Button title="Start Training" variant="primary" />
          </Link>
          <Link href="/login" asChild>
            <Button title="Sign In" variant="ghost" />
          </Link>
        </FadeInView>
      </ScrollView>
    </Screen>
  );
}
