import { useFocusEffect, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { Button, Card, EmptyState, ErrorState, LoadingState, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { ScreenHeader } from '@/features/shell/screen-header';

import { ServiceItemForm } from './service-item-form';
import { deleteServiceItem, getServiceItem, updateServiceItem } from './service-item-repository';
import type { ServiceItemInput, ServiceItemRecord } from './service-item.types';

type EditServiceItemScreenProps = {
  serviceItemId: string | null;
};

export function EditServiceItemScreen({ serviceItemId }: EditServiceItemScreenProps) {
  const { businessProfile, isDemo, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [serviceItem, setServiceItem] = useState<ServiceItemRecord | null>(null);
  const currency = businessProfile?.currency ?? 'USD';
  const userId = user?.id;

  const loadServiceItem = useCallback(async () => {
    if (!serviceItemId) {
      setError('Service item id is missing.');
      setIsLoading(false);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const nextServiceItem = await getServiceItem(serviceItemId, { isDemo, userId });
      setServiceItem(nextServiceItem);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load service item.');
    } finally {
      setIsLoading(false);
    }
  }, [isDemo, serviceItemId, userId]);

  useFocusEffect(
    useCallback(() => {
      loadServiceItem();
    }, [loadServiceItem]),
  );

  async function handleSubmit(values: ServiceItemInput) {
    if (!serviceItemId) {
      throw new Error('Service item id is missing.');
    }

    await updateServiceItem(serviceItemId, values, { isDemo, userId });
    router.replace('/services');
  }

  function confirmDelete() {
    if (!serviceItem || !serviceItemId) {
      return;
    }

    Alert.alert('Delete service item?', `${serviceItem.name} will be removed from saved services.`, [
      { style: 'cancel', text: 'Cancel' },
      {
        onPress: async () => {
          setIsDeleting(true);
          try {
            await deleteServiceItem(serviceItemId, { isDemo, userId });
            router.replace('/services');
          } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete service item.');
          } finally {
            setIsDeleting(false);
          }
        },
        style: 'destructive',
        text: 'Delete',
      },
    ]);
  }

  if (isLoading) {
    return (
      <Screen>
        <LoadingState label="Loading service item" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState
          actionLabel="Try again"
          message={error}
          onAction={loadServiceItem}
          title="Unable to load service item"
        />
        <Button fullWidth onPress={() => router.back()} variant="ghost">
          Back
        </Button>
      </Screen>
    );
  }

  if (!serviceItem) {
    return (
      <Screen>
        <EmptyState
          actionLabel="Back to saved services"
          message="This saved service could not be found in your workspace."
          onAction={() => router.replace('/services')}
          title="Service item not found"
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader eyebrow="Edit saved service" title={serviceItem.name} subtitle="Update reusable pricing." />
      <Card>
        <ServiceItemForm
          currency={currency}
          onSubmit={handleSubmit}
          serviceItem={serviceItem}
          submitLabel="Save service item"
        />
      </Card>
      <Button fullWidth isLoading={isDeleting} onPress={confirmDelete} variant="danger">
        Delete service item
      </Button>
      <Button fullWidth onPress={() => router.replace('/services')} variant="ghost">
        Cancel
      </Button>
    </Screen>
  );
}
