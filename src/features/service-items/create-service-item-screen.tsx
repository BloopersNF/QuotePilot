import { router } from 'expo-router';

import { Button, Card, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { ScreenHeader } from '@/features/shell/screen-header';

import { ServiceItemForm } from './service-item-form';
import { createServiceItem } from './service-item-repository';
import type { ServiceItemInput } from './service-item.types';

export function CreateServiceItemScreen() {
  const { businessProfile, isDemo, user } = useAuth();
  const currency = businessProfile?.currency ?? 'USD';

  async function handleSubmit(values: ServiceItemInput) {
    await createServiceItem(values, { isDemo, userId: user?.id });
    router.replace('/services');
  }

  return (
    <Screen>
      <ScreenHeader
        eyebrow="New saved service"
        title="Create service item"
        subtitle="Save reusable pricing for future estimate line items."
      />
      <Card>
        <ServiceItemForm currency={currency} onSubmit={handleSubmit} submitLabel="Create service item" />
      </Card>
      <Button fullWidth onPress={() => router.back()} variant="ghost">
        Cancel
      </Button>
    </Screen>
  );
}
