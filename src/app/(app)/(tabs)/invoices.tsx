import { EmptyState, Screen } from '@/components/ui';
import { ScreenHeader } from '@/features/shell/screen-header';

export default function InvoicesScreen() {
  return (
    <Screen>
      <ScreenHeader
        eyebrow="Payments"
        title="Invoices"
        subtitle="Invoice creation, status tracking, and PDF generation are intentionally deferred."
      />
      <EmptyState
        title="No invoices yet"
        message="The screen is present so the mobile app shell feels real while avoiding Phase 3+ work."
      />
    </Screen>
  );
}
