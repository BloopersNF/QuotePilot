import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, EmptyState, ErrorState, Screen, StatusBadge } from '@/components/ui';
import { Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { ScreenHeader } from '@/features/shell/screen-header';
import { useTheme } from '@/hooks/use-theme';

export default function SettingsScreen() {
  const { businessProfile, isDemo, refreshWorkspace, workspaceError } = useAuth();
  const theme = useTheme();

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Settings"
        title="Business profile"
        subtitle="A simple read-only snapshot of your saved defaults for Phase 4."
      />
      {workspaceError && !isDemo ? (
        <ErrorState
          actionLabel="Try again"
          message={workspaceError}
          onAction={refreshWorkspace}
          title="Unable to load business profile"
        />
      ) : isDemo ? (
        <Card>
          <StatusBadge label="Demo mode" tone="success" />
          <Text style={[styles.title, { color: theme.text }]}>Local demo workspace</Text>
          <Text style={[styles.copy, { color: theme.textSecondary }]}>
            Demo mode does not require Supabase and does not save a business profile.
          </Text>
        </Card>
      ) : businessProfile ? (
        <Card>
          <StatusBadge label="Saved" tone="success" />
          <Text style={[styles.title, { color: theme.text }]}>{businessProfile.business_name}</Text>
          <View style={styles.rows}>
            <InfoRow label="Owner" value={businessProfile.owner_name} />
            <InfoRow label="Trade" value={businessProfile.trade_type} />
            <InfoRow label="Country" value={businessProfile.country} />
            <InfoRow label="Currency" value={businessProfile.currency} />
            <InfoRow label="Tax rate bps" value={String(businessProfile.default_tax_rate_bps)} />
            <InfoRow label="Hourly rate minor" value={String(businessProfile.default_hourly_rate_minor)} />
            <InfoRow label="Estimate prefix" value={businessProfile.estimate_prefix} />
            <InfoRow label="Invoice prefix" value={businessProfile.invoice_prefix} />
            <InfoRow label="Email" value={businessProfile.business_email} />
            <InfoRow label="Phone" value={businessProfile.business_phone} />
          </View>
        </Card>
      ) : (
        <EmptyState
          actionLabel="Set up business"
          message="Your account does not have a business profile yet."
          onAction={() => router.replace('/business')}
          title="No business profile"
        />
      )}
      <Button fullWidth onPress={() => router.back()} variant="ghost">
        Back
      </Button>
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  const theme = useTheme();

  return (
    <View style={styles.infoRow}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.value, { color: theme.text }]}>{value || 'Not set'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  copy: {
    ...Typography.body,
  },
  infoRow: {
    gap: Spacing.half,
  },
  label: {
    ...Typography.small,
  },
  rows: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  title: {
    ...Typography.subtitle,
  },
  value: {
    ...Typography.body,
  },
});
