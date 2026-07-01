import type { ClientRecord } from '@/features/clients/client.types';
import type { CurrencyCode } from '@/features/business/business-profile.types';

export const estimateStatuses = ['draft', 'sent', 'accepted', 'declined'] as const;
export const estimateDiscountTypes = ['none', 'fixed', 'percent'] as const;

export type EstimateStatus = (typeof estimateStatuses)[number];
export type EstimateDiscountType = (typeof estimateDiscountTypes)[number];

export type EstimateLineItemRecord = {
  created_at: string;
  description: string;
  estimate_id: string;
  id: string;
  quantity_milli: number;
  sort_order: number;
  taxable: boolean;
  unit_price_minor: number;
  updated_at: string;
  user_id: string;
};

export type EstimateLineItemInput = {
  description: string;
  quantity_milli: number;
  sort_order: number;
  taxable: boolean;
  unit_price_minor: number;
};

export type EstimateRecord = {
  client_id: string;
  created_at: string;
  currency: CurrencyCode;
  discount_rate_bps: number;
  discount_type: EstimateDiscountType;
  discount_value_minor: number;
  estimate_number: string;
  expiration_date: string | null;
  follow_up_date: string | null;
  id: string;
  internal_notes: string | null;
  issue_date: string;
  last_follow_up_date: string | null;
  notes: string | null;
  status: EstimateStatus;
  subtotal_minor: number;
  tax_amount_minor: number;
  tax_rate_bps: number;
  terms: string | null;
  title: string;
  total_minor: number;
  updated_at: string;
  user_id: string;
};

export type EstimateInput = {
  client_id: string;
  currency: CurrencyCode;
  discount_rate_bps: number;
  discount_type: EstimateDiscountType;
  discount_value_minor: number;
  estimate_number?: string;
  expiration_date: string | null;
  follow_up_date: string | null;
  internal_notes: string | null;
  issue_date: string;
  line_items: EstimateLineItemInput[];
  notes: string | null;
  tax_rate_bps: number;
  terms: string | null;
  title: string;
};

export type EstimateSummary = EstimateRecord & {
  client_name: string | null;
};

export type EstimateDetail = EstimateRecord & {
  client: ClientRecord | null;
  line_items: EstimateLineItemRecord[];
};
