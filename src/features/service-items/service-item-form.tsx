import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Input } from '@/components/ui';
import { Radius, Spacing, Typography } from '@/constants/theme';
import type { CurrencyCode } from '@/features/business/business-profile.types';
import { useTheme } from '@/hooks/use-theme';

import {
  defaultServiceItemFormValues,
  formValuesToServiceItemInput,
  serviceItemFormSchema,
  serviceItemToFormValues,
  type ServiceItemFormValues,
} from './service-item-schema';
import {
  serviceItemCategories,
  serviceItemUnitTypes,
  type ServiceItemCategory,
  type ServiceItemInput,
  type ServiceItemRecord,
  type ServiceItemUnitType,
} from './service-item.types';

type ServiceItemFormProps = {
  currency: CurrencyCode;
  onSubmit: (values: ServiceItemInput) => Promise<void>;
  serviceItem?: ServiceItemRecord | null;
  submitLabel: string;
};

const unitLabels: Record<ServiceItemUnitType, string> = {
  day: 'Day',
  fixed: 'Fixed',
  hour: 'Hour',
  item: 'Item',
};

const categoryLabels: Record<ServiceItemCategory, string> = {
  fee: 'Fee',
  labor: 'Labor',
  material: 'Material',
  other: 'Other',
  service: 'Service',
};

export function ServiceItemForm({ currency, onSubmit, serviceItem = null, submitLabel }: ServiceItemFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const theme = useTheme();

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<ServiceItemFormValues>({
    defaultValues: serviceItem ? serviceItemToFormValues(serviceItem) : defaultServiceItemFormValues,
    resolver: zodResolver(serviceItemFormSchema),
  });

  useEffect(() => {
    reset(serviceItemToFormValues(serviceItem));
  }, [reset, serviceItem]);

  async function handleValidSubmit(values: ServiceItemFormValues) {
    setFormError(null);

    try {
      await onSubmit(formValuesToServiceItemInput(values));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save service item.');
    }
  }

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="name"
        render={({ field: { onBlur, onChange, value } }) => (
          <Input
            autoCapitalize="words"
            error={errors.name?.message}
            label="Name"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="Hourly labor"
            value={value}
          />
        )}
      />
      <Controller
        control={control}
        name="description"
        render={({ field: { onBlur, onChange, value } }) => (
          <Input
            error={errors.description?.message}
            label="Description"
            multiline
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="Short description for estimate line items"
            style={styles.multiline}
            value={value}
          />
        )}
      />
      <Controller
        control={control}
        name="default_price"
        render={({ field: { onBlur, onChange, value } }) => (
          <Input
            error={errors.default_price?.message}
            helperText={`Displayed and stored as ${currency} minor units.`}
            keyboardType="decimal-pad"
            label={`Default price (${currency})`}
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="125.00"
            value={value}
          />
        )}
      />
      <Controller
        control={control}
        name="unit_type"
        render={({ field: { onChange, value } }) => (
          <OptionGroup
            label="Unit type"
            onChange={onChange}
            options={serviceItemUnitTypes.map((unitType) => ({
              label: unitLabels[unitType],
              value: unitType,
            }))}
            value={value}
          />
        )}
      />
      <Controller
        control={control}
        name="category"
        render={({ field: { onChange, value } }) => (
          <OptionGroup
            label="Category"
            onChange={onChange}
            options={serviceItemCategories.map((category) => ({
              label: categoryLabels[category],
              value: category,
            }))}
            value={value}
          />
        )}
      />
      <Controller
        control={control}
        name="taxable"
        render={({ field: { onChange, value } }) => (
          <OptionGroup
            label="Tax"
            onChange={(nextValue) => onChange(nextValue === 'taxable')}
            options={[
              { label: 'Taxable', value: 'taxable' },
              { label: 'Not taxable', value: 'not-taxable' },
            ]}
            value={value ? 'taxable' : 'not-taxable'}
          />
        )}
      />
      {formError ? <Text style={[styles.error, { color: theme.danger }]}>{formError}</Text> : null}
      <Button fullWidth isLoading={isSubmitting} onPress={handleSubmit(handleValidSubmit)}>
        {submitLabel}
      </Button>
    </View>
  );
}

function OptionGroup<TValue extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: TValue) => void;
  options: { label: string; value: TValue }[];
  value: TValue;
}) {
  const theme = useTheme();

  return (
    <View style={styles.optionGroup}>
      <Text style={[styles.optionLabel, { color: theme.text }]}>{label}</Text>
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
              <Text style={[styles.optionText, { color: isSelected ? theme.primary : theme.textSecondary }]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  error: {
    ...Typography.body,
  },
  form: {
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
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  optionGroup: {
    gap: Spacing.one,
  },
  optionLabel: {
    ...Typography.label,
  },
  optionText: {
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
});
