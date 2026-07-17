import { View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { Typography } from '@/components/ui/Typography';

export default function HomeScreen() {
  return (
    <Screen className="pt-6">
      <View className="gap-4">
        <Typography variant="title">Home</Typography>
        <Typography variant="body">
          Your training dashboard will live here — today&apos;s workout, streaks, and quick actions.
        </Typography>
      </View>
    </Screen>
  );
}
