import { z } from 'zod';

import { amountStringToMinor, minorToAmountString } from '@/lib/money';

import {
  bpsToPercentString,
  calculateEstimateTotals,
  milliToQuantityString,
  percentStringToBps,
  quantityStringToMilli,
} from './estimate-calculations';
import {
  estimateDiscountTypes,
  type EstimateDetail,
  type EstimateInput,
  type EstimateLineItemInput,
} from './estimate.types';

const optionalText = z.string().trim();
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const optionalDate = z.string().trim().refine((value) => value === '' || datePattern.test(value), {
  message: 'Use YYYY-MM-DD.',
});
const moneyString = z.string().trim().regex(/^\d+(\.\d{1,2})?$/, 'Use a whole amount or two decimal places.');
const quantityString = z.string().trim().regex(/^\d+(\.\d{1,3})?$/, 'Use a quantity up to three decimals.');
const percentString = z.string().trim().regex(/^\d+(\.\d{1,2})?$/, 'Use a percent up to two decimals.');

export const estimateLineItemFormSchema = z.object({
  description: z.string().trim().min(1, 'Line item description is required.'),
  quantity: quantityString.refine((value) => quantityStringToMilli(value) > 0, 'Quantity must be greater than zero.'),
  taxable: z.boolean(),
  unit_price: moneyString,
});

export const estimateFormSchema = z
  .object({
    client_id: z.string().trim().min(1, 'Client is required.'),
    discount_percent: percentString,
    discount_type: z.enum(estimateDiscountTypes),
    discount_value: moneyString,
    estimate_number: z.string().trim().min(1, 'Estimate number is required.'),
    expiration_date: optionalDate,
    follow_up_date: optionalDate,
    internal_notes: optionalText,
    issue_date: z.string().trim().regex(datePattern, 'Use YYYY-MM-DD.'),
    line_items: z.array(estimateLineItemFormSchema).min(1, 'Add at least one line item.'),
    notes: optionalText,
    tax_rate_percent: percentString,
    terms: optionalText,
    title: z.string().trim().min(1, 'Title is required.'),
  })
  .superRefine((values, context) => {
    if (values.expiration_date && values.expiration_date < values.issue_date) {
      context.addIssue({
        code: 'custom',
        message: 'Expiration date must be on or after the issue date.',
        path: ['expiration_date'],
      });
    }

    const line_items = values.line_items.map((lineItem, index) => formLineItemToInput(lineItem, index));
    const discount_rate_bps =
      values.discount_type === 'percent' ? percentStringToBps(values.discount_percent) : 0;
    const discount_value_minor =
      values.discount_type === 'fixed' ? amountStringToMinor(values.discount_value) : 0;
    const tax_rate_bps = percentStringToBps(values.tax_rate_percent);

    if (discount_rate_bps > 10000) {
      context.addIssue({
        code: 'custom',
        message: 'Percent discount cannot be greater than 100%.',
        path: ['discount_percent'],
      });
    }

    if (tax_rate_bps > 100000) {
      context.addIssue({
        code: 'custom',
        message: 'Tax rate is too high.',
        path: ['tax_rate_percent'],
      });
    }

    const totals = calculateEstimateTotals({
      discount_rate_bps,
      discount_type: values.discount_type,
      discount_value_minor,
      line_items,
      tax_rate_bps,
    });

    if (values.discount_type === 'fixed' && discount_value_minor > totals.subtotal_minor) {
      context.addIssue({
        code: 'custom',
        message: 'Discount cannot be greater than the subtotal.',
        path: ['discount_value'],
      });
    }
  });

export type EstimateFormValues = z.infer<typeof estimateFormSchema>;
export type EstimateLineItemFormValues = z.infer<typeof estimateLineItemFormSchema>;

export function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export function createDefaultEstimateFormValues({
  estimateNumber,
  taxRateBps,
  terms,
}: {
  estimateNumber: string;
  taxRateBps: number;
  terms: string | null;
}): EstimateFormValues {
  return {
    client_id: '',
    discount_percent: '0',
    discount_type: 'none',
    discount_value: '0.00',
    estimate_number: estimateNumber,
    expiration_date: '',
    follow_up_date: '',
    internal_notes: '',
    issue_date: todayDateString(),
    line_items: [createBlankLineItemFormValues()],
    notes: '',
    tax_rate_percent: bpsToPercentString(taxRateBps),
    terms: terms ?? '',
    title: '',
  };
}

export function createBlankLineItemFormValues(): EstimateLineItemFormValues {
  return {
    description: '',
    quantity: '1',
    taxable: true,
    unit_price: '0.00',
  };
}

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function formLineItemToInput(
  lineItem: EstimateLineItemFormValues,
  sort_order: number,
): EstimateLineItemInput {
  return {
    description: lineItem.description.trim(),
    quantity_milli: quantityStringToMilli(lineItem.quantity),
    sort_order,
    taxable: lineItem.taxable,
    unit_price_minor: amountStringToMinor(lineItem.unit_price),
  };
}

export function inputLineItemToFormValues(lineItem: EstimateLineItemInput): EstimateLineItemFormValues {
  return {
    description: lineItem.description,
    quantity: milliToQuantityString(lineItem.quantity_milli),
    taxable: lineItem.taxable,
    unit_price: minorToAmountString(lineItem.unit_price_minor),
  };
}

export function formValuesToEstimateInput(values: EstimateFormValues, currency: EstimateInput['currency']): EstimateInput {
  const discount_type = values.discount_type;

  return {
    client_id: values.client_id,
    currency,
    discount_rate_bps: discount_type === 'percent' ? percentStringToBps(values.discount_percent) : 0,
    discount_type,
    discount_value_minor: discount_type === 'fixed' ? amountStringToMinor(values.discount_value) : 0,
    estimate_number: values.estimate_number.trim(),
    expiration_date: emptyToNull(values.expiration_date),
    follow_up_date: emptyToNull(values.follow_up_date),
    internal_notes: emptyToNull(values.internal_notes),
    issue_date: values.issue_date,
    line_items: values.line_items.map((lineItem, index) => formLineItemToInput(lineItem, index)),
    notes: emptyToNull(values.notes),
    tax_rate_bps: percentStringToBps(values.tax_rate_percent),
    terms: emptyToNull(values.terms),
    title: values.title.trim(),
  };
}

export function estimateToFormValues(estimate: EstimateDetail): EstimateFormValues {
  return {
    client_id: estimate.client_id,
    discount_percent: bpsToPercentString(estimate.discount_rate_bps),
    discount_type: estimate.discount_type,
    discount_value: minorToAmountString(estimate.discount_value_minor),
    estimate_number: estimate.estimate_number,
    expiration_date: estimate.expiration_date ?? '',
    follow_up_date: estimate.follow_up_date ?? '',
    internal_notes: estimate.internal_notes ?? '',
    issue_date: estimate.issue_date,
    line_items: estimate.line_items.map((lineItem) =>
      inputLineItemToFormValues({
        description: lineItem.description,
        quantity_milli: lineItem.quantity_milli,
        sort_order: lineItem.sort_order,
        taxable: lineItem.taxable,
        unit_price_minor: lineItem.unit_price_minor,
      }),
    ),
    notes: estimate.notes ?? '',
    tax_rate_percent: bpsToPercentString(estimate.tax_rate_bps),
    terms: estimate.terms ?? '',
    title: estimate.title,
  };
}
