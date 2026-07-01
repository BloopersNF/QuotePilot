import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Input } from '@/components/ui';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import {
  clientFormSchema,
  clientToFormValues,
  defaultClientFormValues,
  formValuesToClientInput,
  type ClientFormValues,
} from './client-schema';
import type { ClientInput, ClientRecord } from './client.types';

type ClientFormProps = {
  client?: ClientRecord | null;
  onSubmit: (values: ClientInput) => Promise<void>;
  submitLabel: string;
};

export function ClientForm({ client = null, onSubmit, submitLabel }: ClientFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const theme = useTheme();

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<ClientFormValues>({
    defaultValues: client ? clientToFormValues(client) : defaultClientFormValues,
    resolver: zodResolver(clientFormSchema),
  });

  useEffect(() => {
    reset(clientToFormValues(client));
  }, [client, reset]);

  async function handleValidSubmit(values: ClientFormValues) {
    setFormError(null);

    try {
      await onSubmit(formValuesToClientInput(values));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save client.');
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
            placeholder="Jamie Carter"
            value={value}
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field: { onBlur, onChange, value } }) => (
          <Input
            autoCapitalize="none"
            error={errors.email?.message}
            keyboardType="email-address"
            label="Email"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="client@example.com"
            value={value}
          />
        )}
      />
      <Controller
        control={control}
        name="phone"
        render={({ field: { onBlur, onChange, value } }) => (
          <Input
            error={errors.phone?.message}
            keyboardType="phone-pad"
            label="Phone"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="+1 555 123 4567"
            value={value}
          />
        )}
      />
      <Controller
        control={control}
        name="address"
        render={({ field: { onBlur, onChange, value } }) => (
          <Input
            autoCapitalize="words"
            error={errors.address?.message}
            label="Address"
            multiline
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="Street, city, region"
            style={styles.multiline}
            value={value}
          />
        )}
      />
      <Controller
        control={control}
        name="notes"
        render={({ field: { onBlur, onChange, value } }) => (
          <Input
            error={errors.notes?.message}
            label="Notes"
            multiline
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="Access notes, preferences, or context"
            style={styles.multiline}
            value={value}
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

const styles = StyleSheet.create({
  error: {
    ...Typography.body,
  },
  form: {
    gap: Spacing.three,
  },
  multiline: {
    minHeight: 96,
    paddingVertical: Spacing.three,
    textAlignVertical: 'top',
  },
});
