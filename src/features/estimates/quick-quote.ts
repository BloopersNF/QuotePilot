import { amountStringToMinor } from '@/lib/money';

import { quantityStringToMilli } from './estimate-calculations';
import type { EstimateLineItemInput } from './estimate.types';

type QuickQuoteOptions = {
  defaultHourlyRateMinor: number;
};

const currencyPattern = /(?:[$£€]\s*|USD\s*|CAD\s*|AUD\s*|GBP\s*|EUR\s*)(\d+(?:,\d{3})*(?:\.\d{1,2})?)/gi;

function parseCurrencyAmounts(text: string) {
  const amounts: number[] = [];
  let match = currencyPattern.exec(text);

  while (match) {
    amounts.push(amountStringToMinor(match[1].replace(/,/g, '')));
    match = currencyPattern.exec(text);
  }

  return amounts;
}

function createLineItem(
  description: string,
  quantity_milli: number,
  unit_price_minor: number,
  taxable = true,
): EstimateLineItemInput {
  return {
    description,
    quantity_milli,
    sort_order: 0,
    taxable,
    unit_price_minor,
  };
}

export function parseQuickQuote(text: string, { defaultHourlyRateMinor }: QuickQuoteOptions): EstimateLineItemInput[] {
  const trimmed = text.trim();

  if (!trimmed) {
    return [];
  }

  const lowerText = trimmed.toLowerCase();
  const currencyAmounts = parseCurrencyAmounts(trimmed);
  const suggestions: EstimateLineItemInput[] = [];
  const hoursMatch = lowerText.match(/(\d+(?:\.\d{1,3})?)\s*(?:hours?|hrs?|hr)\b/);
  const mentionsLabor = /labor|labour|hour|hours|hrs?\b/.test(lowerText);
  const mentionsMaterials = /materials?|supplies|parts/.test(lowerText);

  if (mentionsLabor || hoursMatch) {
    const quantity_milli = hoursMatch ? quantityStringToMilli(hoursMatch[1]) : 1000;
    const unit_price_minor = defaultHourlyRateMinor > 0 ? defaultHourlyRateMinor : currencyAmounts[0] ?? 0;

    suggestions.push(createLineItem('Labor', quantity_milli, unit_price_minor));
  }

  if (mentionsMaterials) {
    const materialAmount = currencyAmounts[suggestions.length > 0 ? 1 : 0] ?? currencyAmounts[0] ?? 0;
    suggestions.push(createLineItem('Materials', 1000, materialAmount));
  }

  if (suggestions.length === 0) {
    suggestions.push(createLineItem(trimmed, 1000, currencyAmounts[0] ?? 0));
  }

  return suggestions.map((suggestion, index) => ({
    ...suggestion,
    sort_order: index,
  }));
}
