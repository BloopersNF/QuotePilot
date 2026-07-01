import { useLocalSearchParams } from 'expo-router';

import { ClientDetailScreen } from '@/features/clients/client-detail-screen';

function getRouteId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? null;
}

export default function ClientDetailRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();

  return <ClientDetailScreen clientId={getRouteId(id)} />;
}
