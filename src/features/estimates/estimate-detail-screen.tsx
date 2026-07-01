import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, router, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button, Card, EmptyState, ErrorState, LoadingState, Screen } from '@/components/ui';
import { Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { ScreenHeader } from '@/features/shell/screen-header';
import { useTheme } from '@/hooks/use-theme';
import { formatMoneyMinor } from '@/lib/money';

import { calculateEstimateTotals, calculateLineTotalMinor, bpsToPercentString } from './estimate-calculations';
import { deleteEstimate, getEstimate, updateEstimateStatus } from './estimate-repository';
import { EstimateStatusBadge } from './estimate-status-badge';
import { estimateStatuses, type EstimateDetail, type EstimateLineItemRecord, type EstimateStatus } from './estimate.types';

type EstimateDetailScreenProps = {
  estimateId: string | null;
};

export function EstimateDetailScreen({ estimateId }: EstimateDetailScreenProps) {
  const { isDemo, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<EstimateDetail | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const userId = user?.id;

  const loadEstimate = useCallback(async () => {
    if (!estimateId) {
      setError('Estimate id is missing.');
      setIsLoading(false);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const nextEstimate = await getEstimate(estimateId, { isDemo, userId });
      setEstimate(nextEstimate);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load estimate.');
    } finally {
      setIsLoading(false);
    }
  }, [estimateId, isDemo, userId]);

  useFocusEffect(
    useCallback(() => {
      loadEstimate();
    }, [loadEstimate]),
  );

  async function handleStatusChange(status: EstimateStatus) {
    if (!estimateId) {
      return;
    }

    setIsUpdatingStatus(true);
    setError(null);

    try {
      const updatedEstimate = await updateEstimateStatus(estimateId, status, { isDemo, userId });
      setEstimate(updatedEstimate);
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Unable to update estimate status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  function confirmDelete() {
    if (!estimate || !estimateId) {
      return;
    }

    Alert.alert('Delete estimate?', `${estimate.estimate_number} will be removed from this workspace.`, [
      { style: 'cancel', text: 'Cancel' },
      {
        onPress: async () => {
          setIsDeleting(true);
          try {
            await deleteEstimate(estimateId, { isDemo, userId });
            router.replace('/estimates');
          } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete estimate.');
          } finally {
            setIsDeleting(false);
          }
        },
        style: 'destructive',
        text: 'Delete',
      },
    ]);
  }

  async function copyFollowUpMessage() {
    if (!estimate) {
      return;
    }

    const clientName = estimate.client?.name ?? 'there';
    const message = `Hi ${clientName}, just checking in on the estimate for ${estimate.title}. Let me know if you have any questions or would like me to make any changes.`;

    await Clipboard.setStringAsync(message);
    Alert.alert('Copied', 'Follow-up message copied to clipboard.');
  }

  if (isLoading) {
    return (
      <Screen>
        <LoadingState label="Loading estimate" />
      </Screen>
    );
  }

  if (error && !estimate) {
    return (
      <Screen>
        <ErrorState actionLabel="Try again" message={error} onAction={loadEstimate} title="Unable to load estimate" />
        <Button fullWidth onPress={() => router.replace('/estimates')} variant="ghost">
          Back to estimates
        </Button>
      </Screen>
    );
  }

  if (!estimate) {
    return (
      <Screen>
        <EmptyState
          actionLabel="Back to estimates"
          message="This estimate could not be found in your workspace."
          onAction={() => router.replace('/estimates')}
          title="Estimate not found"
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        eyebrow={estimate.estimate_number}
        title={estimate.title}
        subtitle="Estimate details, status, and follow-up copy."
      />
      {error ? <ErrorState message={error} title="Estimate action failed" /> : null}
      <View style={styles.actions}>
        <Button fullWidth onPress={() => router.push(`/estimates/${estimate.id}/edit` as Href)} variant="secondary">
          Edit estimate
        </Button>
        <Button fullWidth onPress={copyFollowUpMessage} variant="ghost">
          Copy follow-up message
        </Button>
        <Button fullWidth isLoading={isDeleting} onPress={confirmDelete} variant="danger">
          Delete estimate
        </Button>
      </View>
      <EstimateOverviewCard estimate={estimate} />
      <StatusActions
        currentStatus={estimate.status}
        isLoading={isUpdatingStatus}
        onChangeStatus={handleStatusChange}
      />
      <LineItemsCard estimate={estimate} />
      <TotalsCard estimate={estimate} />
      <NotesCard estimate={estimate} />
      <Button fullWidth onPress={() => router.replace('/estimates')} variant="ghost">
        Back to estimates
      </Button>
    </Screen>
  );
}

function EstimateOverviewCard({ estimate }: { estimate: EstimateDetail }) {
  return (
    <Card>
      <EstimateStatusBadge status={estimate.status} />
      <View style={styles.infoRows}>
        <InfoRow label="Estimate number" value={estimate.estimate_number} />
        <InfoRow label="Client" value={estimate.client?.name ?? 'Unknown client'} />
        <InfoRow label="Client email" value={estimate.client?.email ?? null} />
        <InfoRow label="Client phone" value={estimate.client?.phone ?? null} />
        <InfoRow label="Issue date" value={estimate.issue_date} />
        <InfoRow label="Expiration date" value={estimate.expiration_date} />
        <InfoRow label="Follow-up date" value={estimate.follow_up_date} />
      </View>
    </Card>
  );
}

function StatusActions({
  currentStatus,
  isLoading,
  onChangeStatus,
}: {
  currentStatus: EstimateStatus;
  isLoading: boolean;
  onChangeStatus: (status: EstimateStatus) => void;
}) {
  const theme = useTheme();

  return (
    <Card>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Status</Text>
      <View style={styles.statusActions}>
        {estimateStatuses.map((status) => (
          <Button
            disabled={status === currentStatus || isLoading}
            key={status}
            onPress={() => onChangeStatus(status)}
            style={styles.statusButton}
            variant={status === currentStatus ? 'secondary' : 'ghost'}>
            {status === 'draft'
              ? 'Mark draft'
              : status === 'sent'
                ? 'Mark sent'
                : status === 'accepted'
                  ? 'Mark accepted'
                  : 'Mark declined'}
          </Button>
        ))}
      </View>
    </Card>
  );
}

function LineItemsCard({ estimate }: { estimate: EstimateDetail }) {
  const theme = useTheme();

  return (
    <Card>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Line items</Text>
      <View style={styles.lineItems}>
        {estimate.line_items.map((lineItem) => (
          <LineItemRow currency={estimate.currency} key={lineItem.id} lineItem={lineItem} />
        ))}
      </View>
    </Card>
  );
}

function LineItemRow({ currency, lineItem }: { currency: EstimateDetail['currency']; lineItem: EstimateLineItemRecord }) {
  const theme = useTheme();

  return (
    <View style={[styles.lineItemRow, { borderBottomColor: theme.border }]}>
      <View style={styles.lineItemText}>
        <Text style={[styles.lineItemDescription, { color: theme.text }]}>{lineItem.description}</Text>
        <Text style={[styles.lineItemMeta, { color: theme.textSecondary }]}>
          Qty {lineItem.quantity_milli / 1000} · {formatMoneyMinor(lineItem.unit_price_minor, currency)} ·{' '}
          {lineItem.taxable ? 'taxable' : 'not taxable'}
        </Text>
      </View>
      <Text style={[styles.lineItemTotal, { color: theme.text }]}>
        {formatMoneyMinor(calculateLineTotalMinor(lineItem), currency)}
      </Text>
    </View>
  );
}

function TotalsCard({ estimate }: { estimate: EstimateDetail }) {
  const totals = calculateEstimateTotals({
    discount_rate_bps: estimate.discount_rate_bps,
    discount_type: estimate.discount_type,
    discount_value_minor: estimate.discount_value_minor,
    line_items: estimate.line_items,
    tax_rate_bps: estimate.tax_rate_bps,
  });
  const discountLabel =
    estimate.discount_type === 'percent'
      ? `Discount (${bpsToPercentString(estimate.discount_rate_bps)}%)`
      : 'Discount';

  return (
    <Card>
      <SummaryRow currency={estimate.currency} label="Subtotal" value={estimate.subtotal_minor} />
      <SummaryRow currency={estimate.currency} label={discountLabel} prefix="-" value={totals.discount_amount_minor} />
      <SummaryRow
        currency={estimate.currency}
        label={`Tax (${bpsToPercentString(estimate.tax_rate_bps)}%)`}
        value={estimate.tax_amount_minor}
      />
      <TotalRow currency={estimate.currency} value={estimate.total_minor} />
    </Card>
  );
}

function NotesCard({ estimate }: { estimate: EstimateDetail }) {
  const theme = useTheme();

  return (
    <Card>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Notes</Text>
      <InfoRow label="Customer notes" value={estimate.notes} multiline />
      <InfoRow label="Terms" value={estimate.terms} multiline />
      <InfoRow label="Internal notes" value={estimate.internal_notes} multiline />
    </Card>
  );
}

function InfoRow({ label, multiline, value }: { label: string; multiline?: boolean; value: string | null }) {
  const theme = useTheme();

  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[multiline ? styles.multilineValue : styles.infoValue, { color: theme.text }]}>
        {value || 'Not set'}
      </Text>
    </View>
  );
}

function SummaryRow({
  currency,
  label,
  prefix = '',
  value,
}: {
  currency: EstimateDetail['currency'];
  label: string;
  prefix?: string;
  value: number;
}) {
  const theme = useTheme();

  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: theme.text }]}>
        {prefix}
        {formatMoneyMinor(value, currency)}
      </Text>
    </View>
  );
}

function TotalRow({ currency, value }: { currency: EstimateDetail['currency']; value: number }) {
  const theme = useTheme();

  return (
    <View style={[styles.totalRow, { borderTopColor: theme.border }]}>
      <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
      <Text style={[styles.totalValue, { color: theme.text }]}>{formatMoneyMinor(value, currency)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: Spacing.two,
  },
  infoLabel: {
    ...Typography.small,
  },
  infoRow: {
    gap: Spacing.half,
  },
  infoRows: {
    gap: Spacing.three,
  },
  infoValue: {
    ...Typography.body,
  },
  lineItemDescription: {
    ...Typography.body,
  },
  lineItemMeta: {
    ...Typography.small,
  },
  lineItemRow: {
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
    paddingBottom: Spacing.two,
  },
  lineItemText: {
    flex: 1,
    gap: Spacing.half,
  },
  lineItemTotal: {
    ...Typography.body,
    fontWeight: '700',
  },
  lineItems: {
    gap: Spacing.two,
  },
  multilineValue: {
    ...Typography.body,
  },
  sectionTitle: {
    ...Typography.subtitle,
  },
  statusActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  statusButton: {
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 48,
  },
  summaryLabel: {
    ...Typography.body,
  },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryValue: {
    ...Typography.body,
  },
  totalLabel: {
    ...Typography.subtitle,
  },
  totalRow: {
    alignItems: 'center',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  totalValue: {
    ...Typography.subtitle,
  },
});
