import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <Screen className="justify-center">
        <View className="gap-6 items-center">
          <Typography variant="title">Page not found</Typography>
          <Typography variant="body" className="text-center">
            This screen doesn&apos;t exist.
          </Typography>
          <Link href="/" asChild>
            <Button title="Go Home" variant="secondary" />
          </Link>
        </View>
      </Screen>
    </>
  );
}
