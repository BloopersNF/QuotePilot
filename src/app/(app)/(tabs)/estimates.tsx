import { EmptyState, Screen } from '@/components/ui';
import { ScreenHeader } from '@/features/shell/screen-header';

export default function EstimatesScreen() {
  return (
    <Screen>
      <ScreenHeader
        eyebrow="Quotes"
        title="Estimates"
        subtitle="The estimate workflow, quick quote assistant, and PDF export are reserved for later phases."
      />
      <EmptyState
        title="No estimates yet"
        message="Phase 1/2 only sets up the navigation, auth, and shell for the estimates experience."
      />
    </Screen>
  );
}
