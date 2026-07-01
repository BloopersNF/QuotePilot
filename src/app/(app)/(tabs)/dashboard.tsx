import { router, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, MetricTile, Screen, StatusBadge } from '@/components/ui';
import { Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { ScreenHeader } from '@/features/shell/screen-header';
import { useTheme } from '@/hooks/use-theme';

const newClientRoute = '/clients/new' as Href;

export default function DashboardScreen() {
  const { isDemo } = useAuth();
  const theme = useTheme();

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Today"
        title="Dashboard"
        subtitle="A focused snapshot for quotes, invoices, and follow-ups as the workflow fills in."
      />
      <View style={styles.grid}>
        <MetricTile label="Estimates" style={styles.metric} value="0" />
        <MetricTile label="Pending" style={styles.metric} value="0" tone="warning" />
        <MetricTile label="Unpaid" style={styles.metric} value="$0" />
        <MetricTile label="Paid" style={styles.metric} value="$0" tone="success" />
      </View>
      <Card>
        <StatusBadge label={isDemo ? 'Demo shell' : 'Account shell'} tone="success" />
        <Text style={[styles.cardTitle, { color: theme.text }]}>Clients and setup are ready</Text>
        <Text style={[styles.cardCopy, { color: theme.textSecondary }]}>
          Client records and saved services are available now. Estimates, invoices, PDFs, and follow-ups remain future
          phases.
        </Text>
        <View style={styles.actions}>
          <Button disabled variant="secondary">
            New estimate
          </Button>
          <Button onPress={() => router.push(newClientRoute)} variant="ghost">
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
