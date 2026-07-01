import type { EstimateDiscountType, EstimateLineItemInput } from './estimate.types';

export type EstimateTotals = {
  discount_amount_minor: number;
  subtotal_minor: number;
  taxable_subtotal_minor: number;
  tax_amount_minor: number;
  tax_base_minor: number;
  total_minor: number;
};

type EstimateTotalsInput = {
  discount_rate_bps: number;
  discount_type: EstimateDiscountType;
  discount_value_minor: number;
  line_items: EstimateLineItemInput[];
  tax_rate_bps: number;
};

export function calculateLineTotalMinor(lineItem: Pick<EstimateLineItemInput, 'quantity_milli' | 'unit_price_minor'>) {
  return Math.round((lineItem.quantity_milli * lineItem.unit_price_minor) / 1000);
}

export function calculateEstimateTotals({
  discount_rate_bps,
  discount_type,
  discount_value_minor,
  line_items,
  tax_rate_bps,
}: EstimateTotalsInput): EstimateTotals {
  const subtotal_minor = line_items.reduce((sum, lineItem) => sum + calculateLineTotalMinor(lineItem), 0);
  const taxable_subtotal_minor = line_items.reduce(
    (sum, lineItem) => sum + (lineItem.taxable ? calculateLineTotalMinor(lineItem) : 0),
    0,
  );

  let discount_amount_minor = 0;
  let taxable_discount_minor = 0;

  if (discount_type === 'fixed') {
    discount_amount_minor = Math.min(discount_value_minor, subtotal_minor);
    taxable_discount_minor =
      subtotal_minor > 0 ? Math.round((discount_amount_minor * taxable_subtotal_minor) / subtotal_minor) : 0;
  }

  if (discount_type === 'percent') {
    discount_amount_minor = Math.round((subtotal_minor * discount_rate_bps) / 10000);
    taxable_discount_minor = Math.round((taxable_subtotal_minor * discount_rate_bps) / 10000);
  }

  taxable_discount_minor = Math.min(taxable_discount_minor, taxable_subtotal_minor);
  const tax_base_minor = Math.max(0, taxable_subtotal_minor - taxable_discount_minor);
  const tax_amount_minor = Math.round((tax_base_minor * tax_rate_bps) / 10000);
  const total_minor = Math.max(0, subtotal_minor - discount_amount_minor + tax_amount_minor);

  return {
    discount_amount_minor,
    subtotal_minor,
    tax_amount_minor,
    tax_base_minor,
    taxable_subtotal_minor,
    total_minor,
  };
}

export function quantityStringToMilli(value: string) {
  const normalized = value.trim();
  const [whole = '0', decimal = ''] = normalized.split('.');
  const milli = decimal.padEnd(3, '0').slice(0, 3);

  return Number(whole) * 1000 + Number(milli || '0');
}

export function milliToQuantityString(quantityMilli: number) {
  const whole = Math.floor(quantityMilli / 1000);
  const decimal = String(quantityMilli % 1000).padStart(3, '0').replace(/0+$/, '');

  return decimal ? `${whole}.${decimal}` : String(whole);
}

export function percentStringToBps(value: string) {
  const normalized = value.trim();
  const [whole = '0', decimal = ''] = normalized.split('.');
  const hundredths = decimal.padEnd(2, '0').slice(0, 2);

  return Number(whole) * 100 + Number(hundredths || '0');
}

export function bpsToPercentString(bps: number) {
  const whole = Math.floor(bps / 100);
  const decimal = String(bps % 100).padStart(2, '0').replace(/0+$/, '');

  return decimal ? `${whole}.${decimal}` : String(whole);
}
