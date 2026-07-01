import { StatusBadge } from '@/components/ui';

import type { EstimateStatus } from './estimate.types';

export function getEstimateStatusTone(status: EstimateStatus) {
  const tones = {
    accepted: 'success',
    declined: 'danger',
    draft: 'neutral',
    sent: 'warning',
  } as const;

  return tones[status];
}

export function EstimateStatusBadge({ status }: { status: EstimateStatus }) {
  return <StatusBadge label={status} tone={getEstimateStatusTone(status)} />;
}
