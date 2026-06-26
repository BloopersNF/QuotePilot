import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Button, Card, Screen, StatusBadge } from '@/components/ui';
import { Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { ScreenHeader } from '@/features/shell/screen-header';
import { useTheme } from '@/hooks/use-theme';

export default function MoreScreen() {
  const { env, isDemo, signOut, user } = useAuth();
  const theme = useTheme();

  async function handleLogout() {
    await signOut();
    router.replace('/welcome');
  }

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Workspace"
        title="More"
        subtitle="Account, setup, and future settings live here as the product grows."
      />
      <Card>
        <StatusBadge label={isDemo ? 'Demo mode' : 'Signed in'} tone="success" />
        <Text style={[styles.title, { color: theme.text }]}>
          {isDemo ? 'QuotePilot demo session' : user?.email ?? 'QuotePilot account'}
        </Text>
        <Text style={[styles.copy, { color: theme.textSecondary }]}>
          Supabase env: {env.isConfigured ? 'configured' : 'missing'}. Database-backed settings begin in Phase 3.
        </Text>
      </Card>
      <Card>
        <Text style={[styles.title, { color: theme.text }]}>Coming later</Text>
        <Text style={[styles.copy, { color: theme.textSecondary }]}>
          Settings, follow-ups, pricing, and document defaults stay out of this Phase 1/2 build.
        </Text>
      </Card>
      <Button fullWidth onPress={handleLogout} variant="danger">
        Log out
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  copy: {
    ...Typography.body,
  },
  title: {
    ...Typography.subtitle,
    marginBottom: Spacing.one,
  },
});
