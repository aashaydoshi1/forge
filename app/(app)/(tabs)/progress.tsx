import { View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { Typography } from '@/components/ui/Typography';

export default function ProgressScreen() {
  return (
    <Screen className="pt-6">
      <View className="gap-4">
        <Typography variant="title">Progress</Typography>
        <Typography variant="body">
          Track strength gains, volume trends, and personal records over time. Coming in Phase 4.
        </Typography>
      </View>
    </Screen>
  );
}
