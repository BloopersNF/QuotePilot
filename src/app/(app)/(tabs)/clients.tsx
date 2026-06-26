import { EmptyState, Screen } from '@/components/ui';
import { ScreenHeader } from '@/features/shell/screen-header';

export default function ClientsScreen() {
  return (
    <Screen>
      <ScreenHeader
        eyebrow="Contacts"
        title="Clients"
        subtitle="Client records will power estimates, invoices, and follow-ups in Phase 4."
      />
      <EmptyState
        title="No clients yet"
        message="Client CRUD is intentionally not implemented in Phase 1/2. This screen is ready for the next slice."
      />
    </Screen>
  );
}
