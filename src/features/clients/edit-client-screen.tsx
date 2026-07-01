import { useFocusEffect, router, type Href } from 'expo-router';
import { useCallback, useState } from 'react';

import { Button, Card, EmptyState, ErrorState, LoadingState, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { ScreenHeader } from '@/features/shell/screen-header';

import { ClientForm } from './client-form';
import { getClient, updateClient } from './client-repository';
import type { ClientInput, ClientRecord } from './client.types';

type EditClientScreenProps = {
  clientId: string | null;
};

export function EditClientScreen({ clientId }: EditClientScreenProps) {
  const { isDemo, user } = useAuth();
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userId = user?.id;

  const loadClient = useCallback(async () => {
    if (!clientId) {
      setError('Client id is missing.');
      setIsLoading(false);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const nextClient = await getClient(clientId, { isDemo, userId });
      setClient(nextClient);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load client.');
    } finally {
      setIsLoading(false);
    }
  }, [clientId, isDemo, userId]);

  useFocusEffect(
    useCallback(() => {
      loadClient();
    }, [loadClient]),
  );

  async function handleSubmit(values: ClientInput) {
    if (!clientId) {
      throw new Error('Client id is missing.');
    }

    const updatedClient = await updateClient(clientId, values, { isDemo, userId });
    router.replace(`/clients/${updatedClient.id}` as Href);
  }

  if (isLoading) {
    return (
      <Screen>
        <LoadingState label="Loading client" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState actionLabel="Try again" message={error} onAction={loadClient} title="Unable to load client" />
        <Button fullWidth onPress={() => router.back()} variant="ghost">
          Back
        </Button>
      </Screen>
    );
  }

  if (!client) {
    return (
      <Screen>
        <EmptyState
          actionLabel="Back to clients"
          message="This client could not be found in your workspace."
          onAction={() => router.replace('/clients')}
          title="Client not found"
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader eyebrow="Edit client" title={client.name} subtitle="Update the customer record." />
      <Card>
        <ClientForm client={client} onSubmit={handleSubmit} submitLabel="Save client" />
      </Card>
      <Button fullWidth onPress={() => router.replace(`/clients/${client.id}` as Href)} variant="ghost">
        Cancel
      </Button>
    </Screen>
  );
}
