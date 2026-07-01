import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Input } from '@/components/ui';
import { Spacing, Typography } from '@/constants/theme';
import type { AuthResult } from '@/features/auth/auth-provider';
import { useTheme } from '@/hooks/use-theme';

import {
  businessProfileFormSchema,
  businessProfileToFormValues,
  defaultBusinessProfileFormValues,
  formValuesToBusinessProfile,
  getCurrencyForCountry,
  type BusinessProfileFormValues,
} from './business-profile-schema';
import type { BusinessProfile, BusinessProfileUpsert } from './business-profile.types';

type BusinessProfileFormProps = {
  businessProfile?: BusinessProfile | null;
  onSubmit: (values: BusinessProfileUpsert) => Promise<AuthResult>;
  onSuccess?: () => void;
  submitLabel?: string;
};

export function BusinessProfileForm({
  businessProfile = null,
  onSubmit,
  onSuccess,
  submitLabel = 'Save business profile',
}: BusinessProfileFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const theme = useTheme();

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    setValue,
  } = useForm<BusinessProfileFormValues>({
    defaultValues: businessProfile ? businessProfileToFormValues(businessProfile) : defaultBusinessProfileFormValues,
    resolver: zodResolver(businessProfileFormSchema),
  });

  useEffect(() => {
    reset(businessProfileToFormValues(businessProfile));
  }, [businessProfile, reset]);

  async function handleValidSubmit(values: BusinessProfileFormValues) {
    setFormError(null);

    const result = await onSubmit(formValuesToBusinessProfile(values));

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    onSuccess?.();
  }

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="business_name"
        render={({ field: { onBlur, onChange, value } }) => (
          <Input
            autoCapitalize="words"
            error={errors.business_name?.message}
            label="Business name"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="Brightside Electrical"
            value={value}
          />
        )}
      />
      <Controller
        control={control}
        name="owner_name"
        render={({ field: { onBlur, onChange, value } }) => (
          <Input
            autoCapitalize="words"
            error={errors.owner_name?.message}
            label="Owner name"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="Alex Morgan"
            value={value}
          />
        )}
      />
      <Controller
        control={control}
        name="trade_type"
        render={({ field: { onBlur, onChange, value } }) => (
          <Input
            autoCapitalize="words"
            error={errors.trade_type?.message}
            label="Trade type"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="Electrician, painter, landscaper"
            value={value}
          />
        )}
      />
      <View style={styles.row}>
        <Controller
          control={control}
          name="country"
          render={({ field: { onBlur, onChange, value } }) => (
            <Input
              autoCapitalize="words"
              error={errors.country?.message}
              label="Country"
              onBlur={onBlur}
              onChangeText={(nextValue) => {
                onChange(nextValue);
                setValue('currency', getCurrencyForCountry(nextValue), { shouldValidate: true });
              }}
              placeholder="Canada"
              containerStyle={styles.rowInput}
              value={value}
            />
          )}
        />
        <Controller
          control={control}
          name="currency"
          render={({ field: { onBlur, onChange, value } }) => (
            <Input
              autoCapitalize="characters"
              error={errors.currency?.message}
              label="Currency"
              maxLength={3}
              onBlur={onBlur}
              onChangeText={(nextValue) => onChange(nextValue.toUpperCase())}
              placeholder="CAD"
              containerStyle={styles.rowInput}
              value={value}
            />
          )}
        />
      </View>
      <View style={styles.row}>
        <Controller
          control={control}
          name="default_tax_rate_bps"
          render={({ field: { onBlur, onChange, value } }) => (
            <Input
              error={errors.default_tax_rate_bps?.message}
              keyboardType="number-pad"
              label="Default tax rate (bps)"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="0"
              containerStyle={styles.rowInput}
              value={value}
            />
          )}
        />
        <Controller
          control={control}
          name="default_hourly_rate_minor"
          render={({ field: { onBlur, onChange, value } }) => (
            <Input
              error={errors.default_hourly_rate_minor?.message}
              keyboardType="number-pad"
              label="Hourly rate (minor units)"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="0"
              containerStyle={styles.rowInput}
              value={value}
            />
          )}
        />
      </View>
      <Controller
        control={control}
        name="business_email"
        render={({ field: { onBlur, onChange, value } }) => (
          <Input
            autoCapitalize="none"
            error={errors.business_email?.message}
            keyboardType="email-address"
            label="Business email"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="hello@example.com"
            value={value}
          />
        )}
      />
      <Controller
        control={control}
        name="business_phone"
        render={({ field: { onBlur, onChange, value } }) => (
          <Input
            error={errors.business_phone?.message}
            keyboardType="phone-pad"
            label="Business phone"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="+1 555 123 4567"
            value={value}
          />
        )}
      />
      <Controller
        control={control}
        name="business_address"
        render={({ field: { onBlur, onChange, value } }) => (
          <Input
            autoCapitalize="words"
            error={errors.business_address?.message}
            label="Business address"
            multiline
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="Street, city, region"
            style={styles.multiline}
            value={value}
          />
        )}
      />
      <View style={styles.row}>
        <Controller
          control={control}
          name="estimate_prefix"
          render={({ field: { onBlur, onChange, value } }) => (
            <Input
              autoCapitalize="characters"
              error={errors.estimate_prefix?.message}
              label="Estimate prefix"
              onBlur={onBlur}
              onChangeText={(nextValue) => onChange(nextValue.toUpperCase())}
              placeholder="EST"
              containerStyle={styles.rowInput}
              value={value}
            />
          )}
        />
        <Controller
          control={control}
          name="invoice_prefix"
          render={({ field: { onBlur, onChange, value } }) => (
            <Input
              autoCapitalize="characters"
              error={errors.invoice_prefix?.message}
              label="Invoice prefix"
              onBlur={onBlur}
              onChangeText={(nextValue) => onChange(nextValue.toUpperCase())}
              placeholder="INV"
              containerStyle={styles.rowInput}
              value={value}
            />
          )}
        />
      </View>
      <Controller
        control={control}
        name="default_terms"
        render={({ field: { onBlur, onChange, value } }) => (
          <Input
            error={errors.default_terms?.message}
            label="Default terms"
            multiline
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="Estimate valid for 30 days."
            style={styles.multiline}
            value={value}
          />
        )}
      />
      <Controller
        control={control}
        name="default_payment_instructions"
        render={({ field: { onBlur, onChange, value } }) => (
          <Input
            error={errors.default_payment_instructions?.message}
            label="Default payment instructions"
            multiline
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="Bank transfer, cheque, or payment details."
            style={styles.multiline}
            value={value}
          />
        )}
      />
      {formError ? <Text style={[styles.feedback, { color: theme.danger }]}>{formError}</Text> : null}
      <Button fullWidth isLoading={isSubmitting} onPress={handleSubmit(handleValidSubmit)}>
        {submitLabel}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  feedback: {
    ...Typography.small,
  },
  form: {
    gap: Spacing.three,
  },
  multiline: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  rowInput: {
    flex: 1,
  },
});
