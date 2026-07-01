import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { ScreenHeader } from '@/features/shell/screen-header';

import { ClientForm } from './client-form';
import { createClient } from './client-repository';
import type { ClientInput } from './client.types';

export function CreateClientScreen() {
  const { isDemo, user } = useAuth();

  async function handleSubmit(values: ClientInput) {
    const client = await createClient(values, { isDemo, userId: user?.id });
    router.replace(`/clients/${client.id}` as Href);
  }

  return (
    <Screen>
      <ScreenHeader
        eyebrow="New client"
        title="Create client"
        subtitle="Save the basics now, then use the record on future estimates and invoices."
      />
      <Card>
        <ClientForm onSubmit={handleSubmit} submitLabel="Create client" />
      </Card>
      <View style={styles.actions}>
        <Button fullWidth onPress={() => router.back()} variant="ghost">
          Cancel
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: Spacing.two,
  },
});
