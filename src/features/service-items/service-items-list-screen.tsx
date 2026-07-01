import { useFocusEffect, router, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button, Card, EmptyState, ErrorState, LoadingState, Screen, StatusBadge } from '@/components/ui';
import { Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import type { CurrencyCode } from '@/features/business/business-profile.types';
import { ScreenHeader } from '@/features/shell/screen-header';
import { useTheme } from '@/hooks/use-theme';
import { formatMoneyMinor } from '@/lib/money';

import { deleteServiceItem, listServiceItems } from './service-item-repository';
import type { ServiceItemRecord } from './service-item.types';

const newServiceItemRoute = '/services/new' as Href;

export function ServiceItemsListScreen() {
  const { businessProfile, isDemo, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [serviceItems, setServiceItems] = useState<ServiceItemRecord[]>([]);
  const currency = businessProfile?.currency ?? 'USD';
  const userId = user?.id;

  const loadServiceItems = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const nextServiceItems = await listServiceItems({ isDemo, userId });
      setServiceItems(nextServiceItems);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load service items.');
    } finally {
      setIsLoading(false);
    }
  }, [isDemo, userId]);

  useFocusEffect(
    useCallback(() => {
      loadServiceItems();
    }, [loadServiceItems]),
  );

  async function handleDelete(serviceItem: ServiceItemRecord) {
    Alert.alert('Delete service item?', `${serviceItem.name} will be removed from saved services.`, [
      { style: 'cancel', text: 'Cancel' },
      {
        onPress: async () => {
          try {
            await deleteServiceItem(serviceItem.id, { isDemo, userId });
            await loadServiceItems();
          } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete service item.');
          }
        },
        style: 'destructive',
        text: 'Delete',
      },
    ]);
  }

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Library"
        title="Saved services"
        subtitle="Reusable labor, material, fee, and service rows for future estimates."
      />
      <Button fullWidth onPress={() => router.push(newServiceItemRoute)}>
        Add service item
      </Button>
      {isLoading ? (
        <LoadingState label="Loading saved services" />
      ) : error ? (
        <ErrorState
          actionLabel="Try again"
          message={error}
          onAction={loadServiceItems}
          title="Unable to load saved services"
        />
      ) : serviceItems.length === 0 ? (
        <EmptyState
          actionLabel="Create service item"
          message="Save common work, materials, and fees so estimating is faster later."
          onAction={() => router.push(newServiceItemRoute)}
          title="No saved services yet"
        />
      ) : (
        <View style={styles.list}>
          {serviceItems.map((serviceItem) => (
            <ServiceItemCard
              currency={currency}
              key={serviceItem.id}
              onDelete={handleDelete}
              serviceItem={serviceItem}
            />
          ))}
        </View>
      )}
      <Button fullWidth onPress={() => router.back()} variant="ghost">
        Back
      </Button>
    </Screen>
  );
}

function ServiceItemCard({
  currency,
  onDelete,
  serviceItem,
}: {
  currency: CurrencyCode;
  onDelete: (serviceItem: ServiceItemRecord) => void;
  serviceItem: ServiceItemRecord;
}) {
  const theme = useTheme();
  const editRoute = `/services/${serviceItem.id}/edit` as Href;

  return (
    <Card compact>
      <View style={styles.cardHeader}>
        <View style={styles.titleGroup}>
          <Text style={[styles.name, { color: theme.text }]}>{serviceItem.name}</Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>
            {serviceItem.category} · {serviceItem.unit_type}
          </Text>
        </View>
        <Text style={[styles.price, { color: theme.text }]}>
          {formatMoneyMinor(serviceItem.default_price_minor, currency)}
        </Text>
      </View>
      {serviceItem.description ? (
        <Text style={[styles.description, { color: theme.textSecondary }]}>{serviceItem.description}</Text>
      ) : null}
      <StatusBadge label={serviceItem.taxable ? 'Taxable' : 'Not taxable'} tone={serviceItem.taxable ? 'success' : 'neutral'} />
      <View style={styles.rowActions}>
        <Button onPress={() => router.push(editRoute)} style={styles.rowButton} variant="secondary">
          Edit
        </Button>
        <Button onPress={() => onDelete(serviceItem)} style={styles.rowButton} variant="danger">
          Delete
        </Button>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  description: {
    ...Typography.body,
  },
  list: {
    gap: Spacing.three,
  },
  meta: {
    ...Typography.small,
    textTransform: 'capitalize',
  },
  name: {
    ...Typography.subtitle,
  },
  price: {
    ...Typography.subtitle,
  },
  rowActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  rowButton: {
    flex: 1,
  },
  titleGroup: {
    flex: 1,
    gap: Spacing.half,
  },
});
