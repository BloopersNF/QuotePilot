import { z } from 'zod';

import { amountStringToMinor, minorToAmountString } from '@/lib/money';

import {
  serviceItemCategories,
  serviceItemUnitTypes,
  type ServiceItemInput,
  type ServiceItemRecord,
} from './service-item.types';

const optionalText = z.string().trim();

export const serviceItemFormSchema = z.object({
  category: z.enum(serviceItemCategories),
  default_price: z
    .string()
    .trim()
    .min(1, 'Default price is required.')
    .regex(/^\d+(\.\d{1,2})?$/, 'Use a whole amount or two decimal places.'),
  description: optionalText,
  name: z.string().trim().min(1, 'Service item name is required.'),
  taxable: z.boolean(),
  unit_type: z.enum(serviceItemUnitTypes),
});

export type ServiceItemFormValues = z.infer<typeof serviceItemFormSchema>;

export const defaultServiceItemFormValues: ServiceItemFormValues = {
  category: 'service',
  default_price: '0.00',
  description: '',
  name: '',
  taxable: true,
  unit_type: 'fixed',
};

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function formValuesToServiceItemInput(values: ServiceItemFormValues): ServiceItemInput {
  return {
    category: values.category,
    default_price_minor: amountStringToMinor(values.default_price),
    description: emptyToNull(values.description),
    name: values.name.trim(),
    taxable: values.taxable,
    unit_type: values.unit_type,
  };
}

export function serviceItemToFormValues(serviceItem: ServiceItemRecord | null): ServiceItemFormValues {
  if (!serviceItem) {
    return defaultServiceItemFormValues;
  }

  return {
    category: serviceItem.category,
    default_price: minorToAmountString(serviceItem.default_price_minor),
    description: serviceItem.description ?? '',
    name: serviceItem.name,
    taxable: serviceItem.taxable,
    unit_type: serviceItem.unit_type,
  };
}
