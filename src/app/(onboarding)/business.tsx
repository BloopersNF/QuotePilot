import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Button, Card, Input, Screen, StatusBadge } from '@/components/ui';
import { Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { ScreenHeader } from '@/features/shell/screen-header';
import { useTheme } from '@/hooks/use-theme';

export default function BusinessOnboardingScreen() {
  const { completeOnboarding, isDemo } = useAuth();
  const theme = useTheme();

  async function handleFinish() {
    await completeOnboarding();
    router.replace('/dashboard');
  }

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Business setup"
        title="Set up your business profile"
        subtitle="This placeholder keeps the onboarding route ready. Full profile fields arrive in Phase 3."
      />
      <Card>
        <StatusBadge label={isDemo ? 'Demo mode' : 'Signed in'} tone="success" />
        <Text style={[styles.copy, { color: theme.textSecondary }]}>
          The final version will collect business name, trade, country, currency, tax rate, terms, and payment details here.
        </Text>
        <Input editable={false} label="Business name" placeholder="Phase 3 field placeholder" />
        <Input editable={false} label="Country" placeholder="Canada, United Kingdom, Australia, Ireland" />
        <Button fullWidth onPress={handleFinish}>
          Finish setup placeholder
        </Button>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  copy: {
    ...Typography.body,
    marginBottom: Spacing.two,
  },
});
