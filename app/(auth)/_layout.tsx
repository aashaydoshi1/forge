import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0d0d12' },
        animation: 'fade',
      }}
    />
  );
}
