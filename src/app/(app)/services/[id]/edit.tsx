import { useLocalSearchParams } from 'expo-router';

import { EditServiceItemScreen } from '@/features/service-items/edit-service-item-screen';

function getRouteId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? null;
}

export default function EditServiceItemRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();

  return <EditServiceItemScreen serviceItemId={getRouteId(id)} />;
}
