import { useFocusEffect, router, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, EmptyState, ErrorState, LoadingState, Screen } from '@/components/ui';
import { Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { ScreenHeader } from '@/features/shell/screen-header';
import { useTheme } from '@/hooks/use-theme';

import { listClients } from './client-repository';
import type { ClientRecord } from './client.types';

const newClientRoute = '/clients/new' as Href;

export function ClientsListScreen() {
  const { isDemo, user } = useAuth();
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userId = user?.id;

  const loadClients = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const nextClients = await listClients({ isDemo, userId });
      setClients(nextClients);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load clients.');
    } finally {
      setIsLoading(false);
    }
  }, [isDemo, userId]);

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [loadClients]),
  );

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Contacts"
        title="Clients"
        subtitle="Keep contact details ready for estimates, invoices, and follow-ups."
      />
      <Button fullWidth onPress={() => router.push(newClientRoute)}>
        Add client
      </Button>
      {isLoading ? (
        <LoadingState label="Loading clients" />
      ) : error ? (
        <ErrorState actionLabel="Try again" message={error} onAction={loadClients} title="Unable to load clients" />
      ) : clients.length === 0 ? (
        <EmptyState
          actionLabel="Create client"
          message="Add your first customer record with contact details and job notes."
          onAction={() => router.push(newClientRoute)}
          title="No clients yet"
        />
      ) : (
        <View style={styles.list}>
          {clients.map((client) => (
            <ClientListRow client={client} key={client.id} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function ClientListRow({ client }: { client: ClientRecord }) {
  const theme = useTheme();
  const detailRoute = `/clients/${client.id}` as Href;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(detailRoute)}
      style={({ pressed }) => [pressed && styles.pressed]}>
      <Card compact>
        <View style={styles.rowHeader}>
          <View style={styles.rowTitleGroup}>
            <Text style={[styles.name, { color: theme.text }]}>{client.name}</Text>
            <Text style={[styles.meta, { color: theme.textSecondary }]}>
              {[client.email, client.phone].filter(Boolean).join(' · ') || 'No contact details yet'}
            </Text>
          </View>
          <Text style={[styles.chevron, { color: theme.textMuted }]}>›</Text>
        </View>
        {client.address ? <Text style={[styles.address, { color: theme.textSecondary }]}>{client.address}</Text> : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  address: {
    ...Typography.small,
  },
  chevron: {
    fontSize: 28,
    lineHeight: 30,
  },
  list: {
    gap: Spacing.three,
  },
  meta: {
    ...Typography.small,
  },
  name: {
    ...Typography.subtitle,
  },
  pressed: {
    opacity: 0.82,
  },
  rowHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  rowTitleGroup: {
    flex: 1,
    gap: Spacing.half,
  },
});
