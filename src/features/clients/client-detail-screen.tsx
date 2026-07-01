import { useFocusEffect, router, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button, Card, EmptyState, ErrorState, LoadingState, Screen, StatusBadge } from '@/components/ui';
import { Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { ScreenHeader } from '@/features/shell/screen-header';
import { useTheme } from '@/hooks/use-theme';

import { deleteClient, getClient } from './client-repository';
import type { ClientRecord } from './client.types';

type ClientDetailScreenProps = {
  clientId: string | null;
};

export function ClientDetailScreen({ clientId }: ClientDetailScreenProps) {
  const { isDemo, user } = useAuth();
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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

  function confirmDelete() {
    if (!clientId || !client) {
      return;
    }

    Alert.alert('Delete client?', `${client.name} will be removed from this workspace.`, [
      { style: 'cancel', text: 'Cancel' },
      {
        onPress: async () => {
          setIsDeleting(true);
          try {
            await deleteClient(clientId, { isDemo, userId });
            router.replace('/clients');
          } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete client.');
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
        <LoadingState label="Loading client" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState actionLabel="Try again" message={error} onAction={loadClient} title="Unable to load client" />
        <Button fullWidth onPress={() => router.replace('/clients')} variant="ghost">
          Back to clients
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
      <ScreenHeader eyebrow="Client" title={client.name} subtitle="Contact details and future client history." />
      <View style={styles.actions}>
        <Button fullWidth onPress={() => router.push(`/clients/${client.id}/edit` as Href)} variant="secondary">
          Edit client
        </Button>
        <Button fullWidth isLoading={isDeleting} onPress={confirmDelete} variant="danger">
          Delete client
        </Button>
      </View>
      <ClientDetailsCard client={client} />
      <FutureSection
        title="Estimates"
        message="Estimates for this client will appear here after the estimate flow is built."
      />
      <FutureSection
        title="Invoices"
        message="Invoices for this client will appear here after invoice creation is available."
      />
      <Button fullWidth onPress={() => router.replace('/clients')} variant="ghost">
        Back to clients
      </Button>
    </Screen>
  );
}

function ClientDetailsCard({ client }: { client: ClientRecord }) {
  return (
    <Card>
      <StatusBadge label="Saved client" tone="success" />
      <View style={styles.infoRows}>
        <InfoRow label="Name" value={client.name} />
        <InfoRow label="Email" value={client.email} />
        <InfoRow label="Phone" value={client.phone} />
        <InfoRow label="Address" value={client.address} multiline />
        <InfoRow label="Notes" value={client.notes} multiline />
      </View>
    </Card>
  );
}

function FutureSection({ message, title }: { message: string; title: string }) {
  const theme = useTheme();

  return (
    <Card>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.sectionCopy, { color: theme.textSecondary }]}>{message}</Text>
    </Card>
  );
}

function InfoRow({ label, multiline, value }: { label: string; multiline?: boolean; value: string | null }) {
  const theme = useTheme();

  return (
    <View style={styles.infoRow}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[multiline ? styles.multilineValue : styles.value, { color: theme.text }]}>
        {value || 'Not set'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: Spacing.two,
  },
  infoRow: {
    gap: Spacing.half,
  },
  infoRows: {
    gap: Spacing.three,
  },
  label: {
    ...Typography.small,
  },
  multilineValue: {
    ...Typography.body,
  },
  sectionCopy: {
    ...Typography.body,
  },
  sectionTitle: {
    ...Typography.subtitle,
  },
  value: {
    ...Typography.body,
  },
});
