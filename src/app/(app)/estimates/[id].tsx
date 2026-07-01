import { useLocalSearchParams } from 'expo-router';

import { EstimateDetailScreen } from '@/features/estimates/estimate-detail-screen';

function getRouteId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? null;
}

export default function EstimateDetailRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();

  return <EstimateDetailScreen estimateId={getRouteId(id)} />;
}
