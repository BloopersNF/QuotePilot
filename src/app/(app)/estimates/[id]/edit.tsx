import { useLocalSearchParams } from 'expo-router';

import { EditEstimateScreen } from '@/features/estimates/edit-estimate-screen';

function getRouteId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? null;
}

export default function EditEstimateRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();

  return <EditEstimateScreen estimateId={getRouteId(id)} />;
}
