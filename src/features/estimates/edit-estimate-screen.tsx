import { useFocusEffect, router, type Href } from 'expo-router';
import { useCallback, useState } from 'react';

import { Button, EmptyState, ErrorState, LoadingState, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { listClients } from '@/features/clients/client-repository';
import type { ClientRecord } from '@/features/clients/client.types';
import { listServiceItems } from '@/features/service-items/service-item-repository';
import type { ServiceItemRecord } from '@/features/service-items/service-item.types';
import { ScreenHeader } from '@/features/shell/screen-header';

import { EstimateForm } from './estimate-form';
import { getEstimate, updateEstimate } from './estimate-repository';
import { estimateToFormValues, type EstimateFormValues } from './estimate-schema';
import type { EstimateDetail, EstimateInput } from './estimate.types';

type EditEstimateScreenProps = {
  estimateId: string | null;
};

export function EditEstimateScreen({ estimateId }: EditEstimateScreenProps) {
  const { businessProfile, isDemo, user } = useAuth();
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [defaultValues, setDefaultValues] = useState<EstimateFormValues | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<EstimateDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [serviceItems, setServiceItems] = useState<ServiceItemRecord[]>([]);
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
      const [nextEstimate, nextClients, nextServiceItems] = await Promise.all([
        getEstimate(estimateId, { isDemo, userId }),
        listClients({ isDemo, userId }),
        listServiceItems({ isDemo, userId }),
      ]);

      setEstimate(nextEstimate);
      setClients(nextClients);
      setServiceItems(nextServiceItems);
      setDefaultValues(nextEstimate ? estimateToFormValues(nextEstimate) : null);
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

  async function handleSubmit(values: EstimateInput) {
    if (!estimateId) {
      throw new Error('Estimate id is missing.');
    }

    const updatedEstimate = await updateEstimate(estimateId, values, { isDemo, userId });
    router.replace(`/estimates/${updatedEstimate.id}` as Href);
  }

  if (isLoading) {
    return (
      <Screen>
        <LoadingState label="Loading estimate" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState actionLabel="Try again" message={error} onAction={loadEstimate} title="Unable to load estimate" />
        <Button fullWidth onPress={() => router.back()} variant="ghost">
          Back
        </Button>
      </Screen>
    );
  }

  if (!estimate || !defaultValues) {
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
      <ScreenHeader eyebrow="Edit estimate" title={estimate.estimate_number} subtitle="Revise client, items, and totals." />
      <EstimateForm
        clients={clients}
        currency={estimate.currency ?? businessProfile?.currency ?? 'USD'}
        defaultHourlyRateMinor={businessProfile?.default_hourly_rate_minor ?? 0}
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        serviceItems={serviceItems}
        submitLabel="Save estimate"
      />
      <Button fullWidth onPress={() => router.replace(`/estimates/${estimate.id}` as Href)} variant="ghost">
        Cancel
      </Button>
    </Screen>
  );
}
