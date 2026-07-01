import { z } from 'zod';

import { currencyOptions, type BusinessProfile, type BusinessProfileUpsert, type CurrencyCode } from './business-profile.types';

export const countryCurrencyDefaults: Record<string, CurrencyCode> = {
  australia: 'AUD',
  canada: 'CAD',
  ireland: 'EUR',
  'united kingdom': 'GBP',
  'united states': 'USD',
};

export function getCurrencyForCountry(country: string): CurrencyCode {
  return countryCurrencyDefaults[country.trim().toLowerCase()] ?? 'USD';
}

const optionalText = z.string().trim();

export const businessProfileFormSchema = z.object({
  business_address: optionalText,
  business_email: z.string().trim().email('Enter a valid email address.').or(z.literal('')),
  business_name: z.string().trim().min(1, 'Business name is required.'),
  business_phone: optionalText,
  country: z.string().trim().min(1, 'Country is required.'),
  currency: z.enum(currencyOptions),
  default_hourly_rate_minor: z.string().trim().regex(/^\d+$/, 'Use a whole number of minor units.'),
  default_payment_instructions: optionalText,
  default_tax_rate_bps: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Use whole basis points.')
    .refine((value) => Number(value) <= 100000, 'Tax rate is too high.'),
  default_terms: optionalText,
  estimate_prefix: z.string().trim().min(1, 'Estimate prefix is required.').max(12, 'Keep the prefix short.'),
  invoice_prefix: z.string().trim().min(1, 'Invoice prefix is required.').max(12, 'Keep the prefix short.'),
  owner_name: optionalText,
  trade_type: optionalText,
});

export type BusinessProfileFormValues = z.infer<typeof businessProfileFormSchema>;

export const defaultBusinessProfileFormValues: BusinessProfileFormValues = {
  business_address: '',
  business_email: '',
  business_name: '',
  business_phone: '',
  country: '',
  currency: 'USD',
  default_hourly_rate_minor: '0',
  default_payment_instructions: '',
  default_tax_rate_bps: '0',
  default_terms: '',
  estimate_prefix: 'EST',
  invoice_prefix: 'INV',
  owner_name: '',
  trade_type: '',
};

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function formValuesToBusinessProfile(values: BusinessProfileFormValues): BusinessProfileUpsert {
  return {
    business_address: emptyToNull(values.business_address),
    business_email: emptyToNull(values.business_email),
    business_name: values.business_name.trim(),
    business_phone: emptyToNull(values.business_phone),
    country: values.country.trim(),
    currency: values.currency,
    default_hourly_rate_minor: Number(values.default_hourly_rate_minor),
    default_payment_instructions: emptyToNull(values.default_payment_instructions),
    default_tax_rate_bps: Number(values.default_tax_rate_bps),
    default_terms: emptyToNull(values.default_terms),
    estimate_prefix: values.estimate_prefix.trim().toUpperCase(),
    invoice_prefix: values.invoice_prefix.trim().toUpperCase(),
    owner_name: emptyToNull(values.owner_name),
    trade_type: emptyToNull(values.trade_type),
  };
}

export function businessProfileToFormValues(profile: BusinessProfile | null): BusinessProfileFormValues {
  if (!profile) {
    return defaultBusinessProfileFormValues;
  }

  return {
    business_address: profile.business_address ?? '',
    business_email: profile.business_email ?? '',
    business_name: profile.business_name,
    business_phone: profile.business_phone ?? '',
    country: profile.country,
    currency: profile.currency,
    default_hourly_rate_minor: String(profile.default_hourly_rate_minor),
    default_payment_instructions: profile.default_payment_instructions ?? '',
    default_tax_rate_bps: String(profile.default_tax_rate_bps),
    default_terms: profile.default_terms ?? '',
    estimate_prefix: profile.estimate_prefix,
    invoice_prefix: profile.invoice_prefix,
    owner_name: profile.owner_name ?? '',
    trade_type: profile.trade_type ?? '',
  };
}
