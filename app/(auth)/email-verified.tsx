import { Link } from 'expo-router';
import { useEffect } from 'react';
import { Platform, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { Screen } from '@/components/layout/Screen';
import { FadeInView } from '@/components/motion';
import { Button } from '@/components/ui/Button';

/**
 * Post-email-confirmation landing (deep link: forge://email-verified).
 * Lives in the auth group so it is only reachable when logged out — never the
 * post-login destination when (auth) unmounts after a successful sign-in.
 */
export default function EmailVerifiedScreen() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    // Drop auth tokens from the URL so the browser never keeps a web session.
    try {
      const url = new URL(window.location.href);
      url.hash = '';
      [
        'code',
        'access_token',
        'refresh_token',
        'token_hash',
        'type',
        'error',
        'error_description',
        'error_code',
      ].forEach((key) => url.searchParams.delete(key));
      window.history.replaceState(null, '', url.pathname + url.search);
    } catch {
      // ignore
    }
  }, []);

  return (
    <Screen className="bg-forge-950">
      <View className="flex-1 justify-center gap-8 pb-10">
        <FadeInView onceKey="email-verified-brand" className="items-center gap-5">
          <View className="rounded-[22px] border border-accent/40 bg-forge-900 p-1.5">
            <Image
              source={require('../../assets/images/forge-logo.png')}
              style={{ width: 72, height: 72, borderRadius: 16 }}
              contentFit="cover"
              accessibilityLabel="Forge logo"
            />
          </View>
          <Text className="text-[28px] font-black tracking-[6px] text-white">FORGE</Text>
        </FadeInView>

        <FadeInView
          onceKey="email-verified-card"
          delay={60}
          className="overflow-hidden rounded-3xl border border-forge-700 bg-forge-900"
        >
          <View className="h-1 w-full bg-accent" />
          <View className="gap-3 px-6 py-8">
            <Text className="text-center text-[26px] font-bold leading-8 text-white">
              Email verified successfully!
            </Text>
            <Text className="text-center text-base leading-6 text-forge-300">
              Return to the Forge app and log in.
            </Text>
          </View>
        </FadeInView>

        <FadeInView onceKey="email-verified-cta" delay={120}>
          <Link href="/login" asChild>
            <Button title="Log in" variant="primary" />
          </Link>
        </FadeInView>
      </View>
    </Screen>
  );
}
