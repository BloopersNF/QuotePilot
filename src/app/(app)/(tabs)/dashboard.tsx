import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, MetricTile, Screen, StatusBadge } from '@/components/ui';
import { Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { ScreenHeader } from '@/features/shell/screen-header';
import { useTheme } from '@/hooks/use-theme';

export default function DashboardScreen() {
  const { isDemo } = useAuth();
  const theme = useTheme();

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Today"
        title="Dashboard"
        subtitle="A focused snapshot for quotes, invoices, and follow-ups. Live business data starts in Phase 3."
      />
      <View style={styles.grid}>
        <MetricTile label="Estimates" style={styles.metric} value="0" />
        <MetricTile label="Pending" style={styles.metric} value="0" tone="warning" />
        <MetricTile label="Unpaid" style={styles.metric} value="$0" />
        <MetricTile label="Paid" style={styles.metric} value="$0" tone="success" />
      </View>
      <Card>
        <StatusBadge label={isDemo ? 'Demo shell' : 'Account shell'} tone="success" />
        <Text style={[styles.cardTitle, { color: theme.text }]}>Ready for the core workflow</Text>
        <Text style={[styles.cardCopy, { color: theme.textSecondary }]}>
          Clients, estimates, invoices, PDFs, and follow-ups are intentionally placeholders until the next phases.
        </Text>
        <View style={styles.actions}>
          <Button disabled variant="secondary">
            New estimate
          </Button>
          <Button disabled variant="ghost">
            Add client
          </Button>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: Spacing.two,
  },
  cardCopy: {
    ...Typography.body,
  },
  cardTitle: {
    ...Typography.subtitle,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  metric: {
    flexBasis: '48%',
    flexGrow: 1,
  },
});
