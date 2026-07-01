import { useFocusEffect, router, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, EmptyState, ErrorState, LoadingState, Screen } from '@/components/ui';
import { Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import type { CurrencyCode } from '@/features/business/business-profile.types';
import { ScreenHeader } from '@/features/shell/screen-header';
import { useTheme } from '@/hooks/use-theme';
import { formatMoneyMinor } from '@/lib/money';

import { listEstimates } from './estimate-repository';
import { EstimateStatusBadge } from './estimate-status-badge';
import type { EstimateSummary } from './estimate.types';

const newEstimateRoute = '/estimates/new' as Href;

export function EstimatesListScreen() {
  const { businessProfile, isDemo, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [estimates, setEstimates] = useState<EstimateSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currency = businessProfile?.currency ?? 'USD';
  const userId = user?.id;

  const loadEstimates = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const nextEstimates = await listEstimates({ isDemo, userId });
      setEstimates(nextEstimates);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load estimates.');
    } finally {
      setIsLoading(false);
    }
  }, [isDemo, userId]);

  useFocusEffect(
    useCallback(() => {
      loadEstimates();
    }, [loadEstimates]),
  );

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Quotes"
        title="Estimates"
        subtitle="Create, revise, and track estimate status before PDFs arrive in the next phase."
      />
      <Button fullWidth onPress={() => router.push(newEstimateRoute)}>
        New estimate
      </Button>
      {isLoading ? (
        <LoadingState label="Loading estimates" />
      ) : error ? (
        <ErrorState actionLabel="Try again" message={error} onAction={loadEstimates} title="Unable to load estimates" />
      ) : estimates.length === 0 ? (
        <EmptyState
          actionLabel="Create estimate"
          message="Build your first estimate with a client, line items, tax, and status tracking."
          onAction={() => router.push(newEstimateRoute)}
          title="No estimates yet"
        />
      ) : (
        <View style={styles.list}>
          {estimates.map((estimate) => (
            <EstimateListRow currency={estimate.currency ?? currency} estimate={estimate} key={estimate.id} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function EstimateListRow({ currency, estimate }: { currency: CurrencyCode; estimate: EstimateSummary }) {
  const theme = useTheme();
  const detailRoute = `/estimates/${estimate.id}` as Href;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(detailRoute)}
      style={({ pressed }) => [pressed && styles.pressed]}>
      <Card compact>
        <View style={styles.cardHeader}>
          <View style={styles.titleGroup}>
            <Text style={[styles.number, { color: theme.primary }]}>{estimate.estimate_number}</Text>
            <Text style={[styles.title, { color: theme.text }]}>{estimate.title}</Text>
            <Text style={[styles.meta, { color: theme.textSecondary }]}>
              {estimate.client_name ?? 'Unknown client'} · {estimate.issue_date}
            </Text>
          </View>
          <View style={styles.amountGroup}>
            <Text style={[styles.amount, { color: theme.text }]}>
              {formatMoneyMinor(estimate.total_minor, currency)}
            </Text>
            <EstimateStatusBadge status={estimate.status} />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  amount: {
    ...Typography.subtitle,
    textAlign: 'right',
  },
  amountGroup: {
    alignItems: 'flex-end',
    gap: Spacing.one,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  list: {
    gap: Spacing.three,
  },
  meta: {
    ...Typography.small,
  },
  number: {
    ...Typography.label,
  },
  pressed: {
    opacity: 0.82,
  },
  title: {
    ...Typography.subtitle,
  },
  titleGroup: {
    flex: 1,
    gap: Spacing.half,
  },
});
