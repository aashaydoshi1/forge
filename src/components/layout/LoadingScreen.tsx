import { ActivityIndicator, View } from 'react-native';

import { Typography } from '@/components/ui/Typography';

export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <View className="flex-1 bg-forge-950 items-center justify-center gap-4">
      <ActivityIndicator size="large" color="#ff6b35" />
      <Typography variant="body">{message}</Typography>
    </View>
  );
}
