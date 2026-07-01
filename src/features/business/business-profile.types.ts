export const currencyOptions = ['USD', 'CAD', 'GBP', 'AUD', 'EUR'] as const;

export type CurrencyCode = (typeof currencyOptions)[number];

export type Profile = {
  created_at: string;
  email: string;
  id: string;
  updated_at: string;
  user_id: string;
};

export type BusinessProfile = {
  business_address: string | null;
  business_email: string | null;
  business_name: string;
  business_phone: string | null;
  country: string;
  created_at: string;
  currency: CurrencyCode;
  default_hourly_rate_minor: number;
  default_payment_instructions: string | null;
  default_tax_rate_bps: number;
  default_terms: string | null;
  estimate_prefix: string;
  id: string;
  invoice_prefix: string;
  logo_url: string | null;
  owner_name: string | null;
  trade_type: string | null;
  updated_at: string;
  user_id: string;
};

export type BusinessProfileUpsert = {
  business_address: string | null;
  business_email: string | null;
  business_name: string;
  business_phone: string | null;
  country: string;
  currency: CurrencyCode;
  default_hourly_rate_minor: number;
  default_payment_instructions: string | null;
  default_tax_rate_bps: number;
  default_terms: string | null;
  estimate_prefix: string;
  invoice_prefix: string;
  owner_name: string | null;
  trade_type: string | null;
};
