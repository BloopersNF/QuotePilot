import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

import { Button, ErrorState, Input } from '@/components/ui';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { useAuth } from './auth-provider';
import { authFormSchema, type AuthFormValues } from './schemas';

type AuthFormProps = {
  mode: 'login' | 'signup';
};

export function AuthForm({ mode }: AuthFormProps) {
  const { env, signIn, signUp } = useAuth();
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const theme = useTheme();

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm<AuthFormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(authFormSchema),
  });

  const submitLabel = mode === 'login' ? 'Log in' : 'Create account';

  async function onSubmit(values: AuthFormValues) {
    setFormError(null);
    setFormMessage(null);

    const result = mode === 'login' ? await signIn(values) : await signUp(values);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    if (result.message) {
      setFormMessage(result.message);
      return;
    }

    router.replace('/');
  }

  if (!env.isConfigured) {
    return (
      <ErrorState
        title="Supabase is not configured"
        message={`${env.message} Missing: ${env.missing.join(', ')}.`}
      />
    );
  }

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="email"
        render={({ field: { onBlur, onChange, value } }) => (
          <Input
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email?.message}
            keyboardType="email-address"
            label="Email"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="you@example.com"
            value={value}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { onBlur, onChange, value } }) => (
          <Input
            autoCapitalize="none"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            error={errors.password?.message}
            label="Password"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="At least 6 characters"
            secureTextEntry
            value={value}
          />
        )}
      />
      {formError ? <Text style={[styles.feedback, { color: theme.danger }]}>{formError}</Text> : null}
      {formMessage ? <Text style={[styles.feedback, { color: theme.success }]}>{formMessage}</Text> : null}
      <Button fullWidth isLoading={isSubmitting} onPress={handleSubmit(onSubmit)}>
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
});
