import { View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { Typography } from '@/components/ui/Typography';

export default function CoachScreen() {
  return (
    <Screen className="pt-6">
      <View className="gap-4">
        <Typography variant="title">AI Coach</Typography>
        <Typography variant="body">
          Chat with your personal coach powered by OpenAI via Supabase Edge Functions. Coming in
          Phase 3.
        </Typography>
      </View>
    </Screen>
  );
}
