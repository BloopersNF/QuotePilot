import { useLocalSearchParams } from 'expo-router';

import { EditClientScreen } from '@/features/clients/edit-client-screen';

function getRouteId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? null;
}

export default function EditClientRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();

  return <EditClientScreen clientId={getRouteId(id)} />;
}
