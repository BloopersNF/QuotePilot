import type { CurrencyCode } from '@/features/business/business-profile.types';

export function formatMoneyMinor(amountMinor: number, currency: CurrencyCode = 'USD') {
  const amount = amountMinor / 100;

  try {
    return new Intl.NumberFormat(undefined, {
      currency,
      style: 'currency',
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function amountStringToMinor(value: string) {
  const [whole = '0', cents = ''] = value.trim().split('.');
  const normalizedCents = cents.padEnd(2, '0').slice(0, 2);

  return Number(whole) * 100 + Number(normalizedCents || '0');
}

export function minorToAmountString(amountMinor: number) {
  return (amountMinor / 100).toFixed(2);
}
