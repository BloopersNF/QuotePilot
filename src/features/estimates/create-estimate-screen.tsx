import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';

import { Button, EmptyState, ErrorState, LoadingState, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { listClients } from '@/features/clients/client-repository';
import type { ClientRecord } from '@/features/clients/client.types';
import { listServiceItems } from '@/features/service-items/service-item-repository';
import type { ServiceItemRecord } from '@/features/service-items/service-item.types';
import { ScreenHeader } from '@/features/shell/screen-header';

import { EstimateForm } from './estimate-form';
import { createEstimate, generateNextEstimateNumber } from './estimate-repository';
import { createDefaultEstimateFormValues, type EstimateFormValues } from './estimate-schema';
import type { EstimateInput } from './estimate.types';

const newClientRoute = '/clients/new' as Href;

export function CreateEstimateScreen() {
  const { businessProfile, isDemo, user } = useAuth();
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [defaultValues, setDefaultValues] = useState<EstimateFormValues | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [serviceItems, setServiceItems] = useState<ServiceItemRecord[]>([]);
  const currency = businessProfile?.currency ?? 'USD';
  const estimatePrefix = businessProfile?.estimate_prefix ?? 'EST';
  const userId = user?.id;

  useEffect(() => {
    let isMounted = true;

    async function loadSetup() {
      setError(null);
      setIsLoading(true);

      try {
        const [nextClients, nextServiceItems, estimateNumber] = await Promise.all([
          listClients({ isDemo, userId }),
          listServiceItems({ isDemo, userId }),
          generateNextEstimateNumber({ isDemo, userId }, estimatePrefix),
        ]);

        if (!isMounted) {
          return;
        }

        setClients(nextClients);
        setServiceItems(nextServiceItems);
        setDefaultValues(
          createDefaultEstimateFormValues({
            estimateNumber,
            taxRateBps: businessProfile?.default_tax_rate_bps ?? 0,
            terms: businessProfile?.default_terms ?? null,
          }),
        );
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to prepare the estimate form.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSetup();

    return () => {
      isMounted = false;
    };
  }, [businessProfile?.default_tax_rate_bps, businessProfile?.default_terms, estimatePrefix, isDemo, userId]);

  async function handleSubmit(values: EstimateInput) {
    const estimate = await createEstimate(values, { isDemo, userId }, estimatePrefix);
    router.replace(`/estimates/${estimate.id}` as Href);
  }

  return (
    <Screen>
      <ScreenHeader
        eyebrow="New estimate"
        title="Create estimate"
        subtitle="Select a client, add line items, and review totals before sending later."
      />
      {isLoading || !defaultValues ? (
        <LoadingState label="Preparing estimate" />
      ) : error ? (
        <ErrorState message={error} title="Unable to prepare estimate" />
      ) : clients.length === 0 ? (
        <EmptyState
          actionLabel="Add client"
          message="Create a client first so the estimate can be tied to a customer record."
          onAction={() => router.push(newClientRoute)}
          title="No clients available"
        />
      ) : (
        <EstimateForm
          clients={clients}
          currency={currency}
          defaultHourlyRateMinor={businessProfile?.default_hourly_rate_minor ?? 0}
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          serviceItems={serviceItems}
          showQuickQuote
          submitLabel="Create estimate"
        />
      )}
      <Button fullWidth onPress={() => router.back()} variant="ghost">
        Cancel
      </Button>
    </Screen>
  );
}
