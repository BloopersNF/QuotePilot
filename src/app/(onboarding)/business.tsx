import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Button, Card, ErrorState, Screen, StatusBadge } from '@/components/ui';
import { Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { BusinessProfileForm } from '@/features/business/business-profile-form';
import type { BusinessProfileUpsert } from '@/features/business/business-profile.types';
import { ScreenHeader } from '@/features/shell/screen-header';
import { useTheme } from '@/hooks/use-theme';

export default function BusinessOnboardingScreen() {
  const { businessProfile, completeOnboarding, env, isDemo, saveBusinessProfile, workspaceError } = useAuth();
  const theme = useTheme();

  async function handleSubmit(values: BusinessProfileUpsert) {
    if (isDemo) {
      await completeOnboarding();
      return { ok: true as const };
    }

    return saveBusinessProfile(values);
  }

  function handleSuccess() {
    router.replace('/dashboard');
  }

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Business setup"
        title="Set up your business profile"
        subtitle="Add the defaults that will appear on future estimates and invoices."
      />
      <Card>
        <StatusBadge label={isDemo ? 'Demo mode' : 'Signed in'} tone="success" />
        <Text style={[styles.copy, { color: theme.textSecondary }]}>
          Keep this lightweight for now. You can refine these defaults later from settings.
        </Text>
        {!env.isConfigured && !isDemo ? (
          <ErrorState
            title="Supabase is not configured"
            message={`${env.message} Missing: ${env.missing.join(', ')}.`}
          />
        ) : workspaceError && !isDemo ? (
          <ErrorState title="Unable to load workspace" message={workspaceError} />
        ) : (
          <BusinessProfileForm
            businessProfile={businessProfile}
            onSubmit={handleSubmit}
            onSuccess={handleSuccess}
            submitLabel={isDemo ? 'Continue demo' : 'Save and continue'}
          />
        )}
      </Card>
      {isDemo ? (
        <Button fullWidth onPress={handleSuccess} variant="ghost">
          Skip setup in demo mode
        </Button>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  copy: {
    ...Typography.body,
    marginBottom: Spacing.two,
  },
});
