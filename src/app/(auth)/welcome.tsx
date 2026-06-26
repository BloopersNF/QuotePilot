import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, Screen, StatusBadge } from '@/components/ui';
import { Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { ScreenHeader } from '@/features/shell/screen-header';
import { useTheme } from '@/hooks/use-theme';

export default function WelcomeScreen() {
  const { startDemo } = useAuth();
  const theme = useTheme();

  async function handleDemoMode() {
    await startDemo();
    router.replace('/dashboard');
  }

  return (
    <Screen>
      <View style={styles.brandMark}>
        <Text style={[styles.brandInitial, { color: theme.primaryText }]}>Q</Text>
      </View>
      <ScreenHeader
        eyebrow="QuotePilot"
        title="Estimates and invoices from the job site."
        subtitle="A focused mobile workspace for contractors who need to quote, follow up, and get paid without waiting until they are back at a desk."
      />
      <Card>
        <StatusBadge label="Android MVP" />
        <Text style={[styles.cardTitle, { color: theme.text }]}>Phase 1/2 shell</Text>
        <Text style={[styles.cardCopy, { color: theme.textSecondary }]}>
          Auth, onboarding, navigation, and clean placeholders are ready. Business data, PDFs, and schema work come next.
        </Text>
      </Card>
      <View style={styles.actions}>
        <Button fullWidth onPress={() => router.push('/signup')}>
          Create account
        </Button>
        <Button fullWidth onPress={() => router.push('/login')} variant="secondary">
          Log in
        </Button>
        <Button fullWidth onPress={handleDemoMode} variant="ghost">
          Try demo mode
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: Spacing.two,
  },
  brandInitial: {
    fontSize: 28,
    fontWeight: '800',
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: '#155EEF',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  cardCopy: {
    ...Typography.body,
  },
  cardTitle: {
    ...Typography.subtitle,
  },
});
