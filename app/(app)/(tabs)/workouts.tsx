import { View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { Typography } from '@/components/ui/Typography';

export default function WorkoutsScreen() {
  return (
    <Screen className="pt-6">
      <View className="gap-4">
        <Typography variant="title">Workouts</Typography>
        <Typography variant="body">
          Browse templates, start a session, and log sets. Coming in Phase 2.
        </Typography>
      </View>
    </Screen>
  );
}
