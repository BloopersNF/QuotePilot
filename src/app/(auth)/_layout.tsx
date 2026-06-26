import { Redirect, Stack } from 'expo-router';

import { LoadingState } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';

export default function AuthLayout() {
  const { hasCompletedOnboarding, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState label="Checking session" />;
  }

  if (isAuthenticated && hasCompletedOnboarding) {
    return <Redirect href="/dashboard" />;
  }

  if (isAuthenticated) {
    return <Redirect href="/business" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
