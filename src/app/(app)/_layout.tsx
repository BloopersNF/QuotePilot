import { Redirect, Stack } from 'expo-router';

import { LoadingState } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';

export default function AppLayout() {
  const { hasCompletedOnboarding, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState label="Loading workspace" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/welcome" />;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/business" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
