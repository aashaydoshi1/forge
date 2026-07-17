import { useState } from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { useAuth } from '@/features/auth/context/AuthProvider';
import { GOAL_OPTIONS, EXPERIENCE_OPTIONS } from '@/features/auth/schemas/profile-schemas';
import { signOut } from '@/lib/supabase/auth';

function getLabel(
  options: { value: string; label: string }[],
  value: string | null | undefined,
) {
  return options.find((option) => option.value === value)?.label ?? '—';
}

export default function ProfileScreen() {
  const { user, profile } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <Screen className="pt-6">
      <View className="gap-6">
        <View className="gap-2">
          <Typography variant="title">Profile</Typography>
          <Typography variant="body">Your account and fitness preferences.</Typography>
        </View>

        <View className="bg-forge-900 border border-forge-700 rounded-xl p-4 gap-3">
          <View>
            <Typography variant="caption">Name</Typography>
            <Typography variant="body">{profile?.name ?? '—'}</Typography>
          </View>
          <View>
            <Typography variant="caption">Email</Typography>
            <Typography variant="body">{user?.email ?? '—'}</Typography>
          </View>
          <View>
            <Typography variant="caption">Age</Typography>
            <Typography variant="body">{profile?.age ?? '—'}</Typography>
          </View>
          <View>
            <Typography variant="caption">Height</Typography>
            <Typography variant="body">
              {profile?.height ? `${profile.height} cm` : '—'}
            </Typography>
          </View>
          <View>
            <Typography variant="caption">Weight</Typography>
            <Typography variant="body">
              {profile?.weight ? `${profile.weight} kg` : '—'}
            </Typography>
          </View>
          <View>
            <Typography variant="caption">Goal</Typography>
            <Typography variant="body">{getLabel(GOAL_OPTIONS, profile?.goal)}</Typography>
          </View>
          <View>
            <Typography variant="caption">Experience</Typography>
            <Typography variant="body">
              {getLabel(EXPERIENCE_OPTIONS, profile?.experience)}
            </Typography>
          </View>
        </View>

        <Button title="Sign Out" variant="secondary" loading={isSigningOut} onPress={handleSignOut} />
      </View>
    </Screen>
  );
}
