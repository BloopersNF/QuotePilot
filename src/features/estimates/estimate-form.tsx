import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Input, StatusBadge } from '@/components/ui';
import { Radius, Spacing, Typography } from '@/constants/theme';
import type { ClientRecord } from '@/features/clients/client.types';
import type { CurrencyCode } from '@/features/business/business-profile.types';
import type { ServiceItemRecord } from '@/features/service-items/service-item.types';
import { useTheme } from '@/hooks/use-theme';
import { amountStringToMinor, formatMoneyMinor, minorToAmountString } from '@/lib/money';

import {
  calculateEstimateTotals,
  percentStringToBps,
  quantityStringToMilli,
} from './estimate-calculations';
import {
  createBlankLineItemFormValues,
  estimateFormSchema,
  formValuesToEstimateInput,
  inputLineItemToFormValues,
  type EstimateFormValues,
  type EstimateLineItemFormValues,
} from './estimate-schema';
import type { EstimateDiscountType, EstimateInput } from './estimate.types';
import { parseQuickQuote } from './quick-quote';

type EstimateFormProps = {
  clients: ClientRecord[];
  currency: CurrencyCode;
  defaultHourlyRateMinor: number;
  defaultValues: EstimateFormValues;
  onSubmit: (values: EstimateInput) => Promise<void>;
  serviceItems: ServiceItemRecord[];
  showQuickQuote?: boolean;
  submitLabel: string;
};

type Option<TValue extends string> = {
  caption?: string;
  label: string;
  value: TValue;
};

const discountOptions: Option<EstimateDiscountType>[] = [
  { label: 'None', value: 'none' },
  { label: 'Fixed', value: 'fixed' },
  { label: 'Percent', value: 'percent' },
];

function toSafeLineItem(lineItem: Partial<EstimateLineItemFormValues> | undefined, index: number) {
  return {
    description: lineItem?.description ?? '',
    quantity_milli: quantityStringToMilli(lineItem?.quantity || '0'),
    sort_order: index,
    taxable: Boolean(lineItem?.taxable),
    unit_price_minor: amountStringToMinor(lineItem?.unit_price || '0'),
  };
}

export function EstimateForm({
  clients,
  currency,
  defaultHourlyRateMinor,
  defaultValues,
  onSubmit,
  serviceItems,
  showQuickQuote = false,
  submitLabel,
}: EstimateFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [quickQuoteText, setQuickQuoteText] = useState('');
  const theme = useTheme();

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<EstimateFormValues>({
    defaultValues,
    resolver: zodResolver(estimateFormSchema),
  });

  const { append, fields, remove } = useFieldArray({
    control,
    name: 'line_items',
  });
  const watchedValues = useWatch({ control });
  const watchedLineItems = watchedValues.line_items ?? [];
  const discountType = watchedValues.discount_type ?? 'none';
  const totals = calculateEstimateTotals({
    discount_rate_bps: discountType === 'percent' ? percentStringToBps(watchedValues.discount_percent || '0') : 0,
    discount_type: discountType,
    discount_value_minor: discountType === 'fixed' ? amountStringToMinor(watchedValues.discount_value || '0') : 0,
    line_items: watchedLineItems.map(toSafeLineItem),
    tax_rate_bps: percentStringToBps(watchedValues.tax_rate_percent || '0'),
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  async function handleValidSubmit(values: EstimateFormValues) {
    setFormError(null);

    try {
      await onSubmit(formValuesToEstimateInput(values, currency));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save estimate.');
    }
  }

  function appendLineItem(lineItem?: EstimateLineItemFormValues) {
    append(lineItem ?? createBlankLineItemFormValues());
  }

  function appendServiceItem(serviceItem: ServiceItemRecord) {
    appendLineItem({
      description: serviceItem.description || serviceItem.name,
      quantity: '1',
      taxable: serviceItem.taxable,
      unit_price: minorToAmountString(serviceItem.default_price_minor),
    });
  }

  function handleGenerateDraftItems() {
    const suggestions = parseQuickQuote(quickQuoteText, { defaultHourlyRateMinor });

    suggestions.forEach((suggestion) => {
      appendLineItem(inputLineItemToFormValues(suggestion));
    });

    if (suggestions.length > 0) {
      setQuickQuoteText('');
    }
  }

  return (
    <View style={styles.form}>
      <Card>
        <StatusBadge label="Auto-generated" />
        <Controller
          control={control}
          name="estimate_number"
          render={({ field: { value } }) => (
            <Input
              editable={false}
              error={errors.estimate_number?.message}
              label="Estimate number"
              value={value}
            />
          )}
        />
        <Controller
          control={control}
          name="title"
          render={({ field: { onBlur, onChange, value } }) => (
            <Input
              autoCapitalize="words"
              error={errors.title?.message}
              label="Title"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Kitchen lighting update"
              value={value}
            />
          )}
        />
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Client</Text>
        {clients.length === 0 ? (
          <Text style={[styles.copy, { color: theme.textSecondary }]}>Create a client before saving an estimate.</Text>
        ) : (
          <Controller
            control={control}
            name="client_id"
            render={({ field: { onChange, value } }) => (
              <OptionGroup
                error={errors.client_id?.message}
                onChange={onChange}
                options={clients.map((client) => ({
                  caption: [client.email, client.phone].filter(Boolean).join(' · '),
                  label: client.name,
                  value: client.id,
                }))}
                value={value}
              />
            )}
          />
        )}
      </Card>

      {showQuickQuote ? (
        <Card>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Quote Assistant</Text>
          <Input
            label="Draft prompt"
            multiline
            onChangeText={setQuickQuoteText}
            placeholder="Example: Replace 3 light switches, 2 hours labor, $40 materials."
            style={styles.quickQuoteInput}
            value={quickQuoteText}
          />
          <Button fullWidth onPress={handleGenerateDraftItems} variant="secondary">
            Generate draft items
          </Button>
        </Card>
      ) : null}

      {serviceItems.length > 0 ? (
        <Card>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Saved service items</Text>
          <View style={styles.savedItems}>
            {serviceItems.map((serviceItem) => (
              <Pressable
                accessibilityRole="button"
                key={serviceItem.id}
                onPress={() => appendServiceItem(serviceItem)}
                style={({ pressed }) => [
                  styles.savedItem,
                  { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.savedItemName, { color: theme.text }]}>{serviceItem.name}</Text>
                <Text style={[styles.savedItemPrice, { color: theme.textSecondary }]}>
                  {formatMoneyMinor(serviceItem.default_price_minor, currency)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Line items</Text>
        <Button onPress={() => appendLineItem()} style={styles.compactButton} variant="secondary">
          Add line item
        </Button>
      </View>
      {typeof errors.line_items?.message === 'string' ? (
        <Text style={[styles.error, { color: theme.danger }]}>{errors.line_items.message}</Text>
      ) : null}
      <View style={styles.lineItems}>
        {fields.map((field, index) => (
          <LineItemEditor
            control={control}
            currency={currency}
            error={errors.line_items?.[index]}
            index={index}
            key={field.id}
            onRemove={() => remove(index)}
            canRemove={fields.length > 1}
          />
        ))}
      </View>

      <Card>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Dates</Text>
        <View style={styles.row}>
          <Controller
            control={control}
            name="issue_date"
            render={({ field: { onBlur, onChange, value } }) => (
              <Input
                error={errors.issue_date?.message}
                label="Issue date"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="YYYY-MM-DD"
                containerStyle={styles.rowInput}
                value={value}
              />
            )}
          />
          <Controller
            control={control}
            name="expiration_date"
            render={({ field: { onBlur, onChange, value } }) => (
              <Input
                error={errors.expiration_date?.message}
                label="Expires"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Optional"
                containerStyle={styles.rowInput}
                value={value}
              />
            )}
          />
        </View>
        <Controller
          control={control}
          name="follow_up_date"
          render={({ field: { onBlur, onChange, value } }) => (
            <Input
              error={errors.follow_up_date?.message}
              label="Follow-up date"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Optional YYYY-MM-DD"
              value={value}
            />
          )}
        />
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Discount and tax</Text>
        <Controller
          control={control}
          name="discount_type"
          render={({ field: { onChange, value } }) => (
            <OptionGroup onChange={onChange} options={discountOptions} value={value} />
          )}
        />
        {discountType === 'fixed' ? (
          <Controller
            control={control}
            name="discount_value"
            render={({ field: { onBlur, onChange, value } }) => (
              <Input
                error={errors.discount_value?.message}
                keyboardType="decimal-pad"
                label={`Fixed discount (${currency})`}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
        ) : null}
        {discountType === 'percent' ? (
          <Controller
            control={control}
            name="discount_percent"
            render={({ field: { onBlur, onChange, value } }) => (
              <Input
                error={errors.discount_percent?.message}
                keyboardType="decimal-pad"
                label="Discount percent"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
        ) : null}
        <Controller
          control={control}
          name="tax_rate_percent"
          render={({ field: { onBlur, onChange, value } }) => (
            <Input
              error={errors.tax_rate_percent?.message}
              keyboardType="decimal-pad"
              label="Tax rate percent"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Notes</Text>
        <Controller
          control={control}
          name="notes"
          render={({ field: { onBlur, onChange, value } }) => (
            <Input
              error={errors.notes?.message}
              label="Customer notes"
              multiline
              onBlur={onBlur}
              onChangeText={onChange}
              style={styles.multiline}
              value={value}
            />
          )}
        />
        <Controller
          control={control}
          name="terms"
          render={({ field: { onBlur, onChange, value } }) => (
            <Input
              error={errors.terms?.message}
              label="Terms"
              multiline
              onBlur={onBlur}
              onChangeText={onChange}
              style={styles.multiline}
              value={value}
            />
          )}
        />
        <Controller
          control={control}
          name="internal_notes"
          render={({ field: { onBlur, onChange, value } }) => (
            <Input
              error={errors.internal_notes?.message}
              label="Internal notes"
              multiline
              onBlur={onBlur}
              onChangeText={onChange}
              style={styles.multiline}
              value={value}
            />
          )}
        />
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Totals</Text>
        <SummaryRow label="Subtotal" value={formatMoneyMinor(totals.subtotal_minor, currency)} />
        <SummaryRow label="Discount" value={`-${formatMoneyMinor(totals.discount_amount_minor, currency)}`} />
        <SummaryRow label="Tax" value={formatMoneyMinor(totals.tax_amount_minor, currency)} />
        <View style={[styles.totalRow, { borderTopColor: theme.border }]}>
          <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
          <Text style={[styles.totalValue, { color: theme.text }]}>
            {formatMoneyMinor(totals.total_minor, currency)}
          </Text>
        </View>
      </Card>

      {formError ? <Text style={[styles.error, { color: theme.danger }]}>{formError}</Text> : null}
      <Button fullWidth disabled={clients.length === 0} isLoading={isSubmitting} onPress={handleSubmit(handleValidSubmit)}>
        {submitLabel}
      </Button>
    </View>
  );
}

function LineItemEditor({
  canRemove,
  control,
  currency,
  error,
  index,
  onRemove,
}: {
  canRemove: boolean;
  control: ReturnType<typeof useForm<EstimateFormValues>>['control'];
  currency: CurrencyCode;
  error?: {
    description?: { message?: string };
    quantity?: { message?: string };
    unit_price?: { message?: string };
  };
  index: number;
  onRemove: () => void;
}) {
  const theme = useTheme();

  return (
    <Card>
      <View style={styles.sectionHeader}>
        <Text style={[styles.lineItemTitle, { color: theme.text }]}>Item {index + 1}</Text>
        <Button disabled={!canRemove} onPress={onRemove} style={styles.compactButton} variant="danger">
          Remove
        </Button>
      </View>
      <Controller
        control={control}
        name={`line_items.${index}.description`}
        render={({ field: { onBlur, onChange, value } }) => (
          <Input
            error={error?.description?.message}
            label="Description"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="Labor, material, or service"
            value={value}
          />
        )}
      />
      <View style={styles.row}>
        <Controller
          control={control}
          name={`line_items.${index}.quantity`}
          render={({ field: { onBlur, onChange, value } }) => (
            <Input
              error={error?.quantity?.message}
              keyboardType="decimal-pad"
              label="Qty"
              onBlur={onBlur}
              onChangeText={onChange}
              containerStyle={styles.rowInput}
              value={value}
            />
          )}
        />
        <Controller
          control={control}
          name={`line_items.${index}.unit_price`}
          render={({ field: { onBlur, onChange, value } }) => (
            <Input
              error={error?.unit_price?.message}
              keyboardType="decimal-pad"
              label={`Price (${currency})`}
              onBlur={onBlur}
              onChangeText={onChange}
              containerStyle={styles.rowInput}
              value={value}
            />
          )}
        />
      </View>
      <Controller
        control={control}
        name={`line_items.${index}.taxable`}
        render={({ field: { onChange, value } }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => onChange(!value)}
            style={({ pressed }) => [
              styles.taxToggle,
              {
                backgroundColor: value ? theme.successSoft : theme.surfaceMuted,
                borderColor: value ? theme.success : theme.border,
              },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.taxToggleText, { color: value ? theme.success : theme.textSecondary }]}>
              {value ? 'Taxable' : 'Not taxable'}
            </Text>
          </Pressable>
        )}
      />
    </Card>
  );
}

function OptionGroup<TValue extends string>({
  error,
  onChange,
  options,
  value,
}: {
  error?: string;
  onChange: (value: TValue) => void;
  options: Option<TValue>[];
  value: TValue;
}) {
  const theme = useTheme();

  return (
    <View style={styles.optionGroup}>
      <View style={styles.optionWrap}>
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <Pressable
              accessibilityRole="button"
              key={option.value}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: isSelected ? theme.primarySoft : theme.surface,
                  borderColor: isSelected ? theme.primary : theme.border,
                },
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.optionLabel, { color: isSelected ? theme.primary : theme.text }]}>
                {option.label}
              </Text>
              {option.caption ? (
                <Text style={[styles.optionCaption, { color: theme.textSecondary }]}>{option.caption}</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  compactButton: {
    minHeight: 44,
    paddingHorizontal: Spacing.three,
  },
  copy: {
    ...Typography.body,
  },
  error: {
    ...Typography.small,
  },
  form: {
    gap: Spacing.three,
  },
  lineItemTitle: {
    ...Typography.subtitle,
  },
  lineItems: {
    gap: Spacing.three,
  },
  multiline: {
    minHeight: 88,
    paddingVertical: Spacing.three,
    textAlignVertical: 'top',
  },
  option: {
    borderRadius: Radius.md,
    borderWidth: 1,
    flexGrow: 1,
    minHeight: 52,
    minWidth: '45%',
    padding: Spacing.three,
  },
  optionCaption: {
    ...Typography.small,
    marginTop: Spacing.half,
  },
  optionGroup: {
    gap: Spacing.one,
  },
  optionLabel: {
    ...Typography.label,
  },
  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.82,
  },
  quickQuoteInput: {
    minHeight: 104,
    paddingVertical: Spacing.three,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  rowInput: {
    flex: 1,
  },
  savedItem: {
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.half,
    minHeight: 56,
    padding: Spacing.three,
  },
  savedItemName: {
    ...Typography.label,
  },
  savedItemPrice: {
    ...Typography.small,
  },
  savedItems: {
    gap: Spacing.two,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...Typography.subtitle,
  },
  summaryLabel: {
    ...Typography.body,
  },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryValue: {
    ...Typography.body,
  },
  taxToggle: {
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  taxToggleText: {
    ...Typography.label,
  },
  totalLabel: {
    ...Typography.subtitle,
  },
  totalRow: {
    alignItems: 'center',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  totalValue: {
    ...Typography.subtitle,
  },
});
