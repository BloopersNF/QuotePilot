import { Redirect, Stack } from 'expo-router';

import { LoadingState } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';

export default function OnboardingLayout() {
  const { hasCompletedOnboarding, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState label="Checking setup" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/welcome" />;
  }

  if (hasCompletedOnboarding) {
    return <Redirect href="/dashboard" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
