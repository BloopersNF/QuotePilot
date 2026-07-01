import { z } from 'zod';

import type { ClientInput, ClientRecord } from './client.types';

const optionalText = z.string().trim();

export const clientFormSchema = z.object({
  address: optionalText,
  email: z.string().trim().email('Enter a valid email address.').or(z.literal('')),
  name: z.string().trim().min(1, 'Client name is required.'),
  notes: optionalText,
  phone: optionalText,
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;

export const defaultClientFormValues: ClientFormValues = {
  address: '',
  email: '',
  name: '',
  notes: '',
  phone: '',
};

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function formValuesToClientInput(values: ClientFormValues): ClientInput {
  return {
    address: emptyToNull(values.address),
    email: emptyToNull(values.email),
    name: values.name.trim(),
    notes: emptyToNull(values.notes),
    phone: emptyToNull(values.phone),
  };
}

export function clientToFormValues(client: ClientRecord | null): ClientFormValues {
  if (!client) {
    return defaultClientFormValues;
  }

  return {
    address: client.address ?? '',
    email: client.email ?? '',
    name: client.name,
    notes: client.notes ?? '',
    phone: client.phone ?? '',
  };
}
