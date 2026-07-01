import { router, type Href } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Button, Card, Screen, StatusBadge } from '@/components/ui';
import { Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { ScreenHeader } from '@/features/shell/screen-header';
import { useTheme } from '@/hooks/use-theme';

const settingsRoute = '/settings' as Href;

export default function MoreScreen() {
  const { businessProfile, env, isDemo, signOut, user } = useAuth();
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
          {isDemo ? 'QuotePilot demo session' : businessProfile?.business_name ?? user?.email ?? 'QuotePilot account'}
        </Text>
        <Text style={[styles.copy, { color: theme.textSecondary }]}>
          Supabase env: {env.isConfigured ? 'configured' : 'missing'}. Business profile:{' '}
          {businessProfile ? 'saved' : isDemo ? 'local demo' : 'missing'}.
        </Text>
      </Card>
      <Card>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
        <Text style={[styles.copy, { color: theme.textSecondary }]}>
          View your saved business defaults. Editing and richer settings can come after the core workflows.
        </Text>
        <Button fullWidth onPress={() => router.push(settingsRoute)} variant="secondary">
          View business profile
        </Button>
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
