import { StyleSheet, Text, View } from 'react-native';

import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Button } from './button';

type ErrorStateProps = {
  actionLabel?: string;
  message: string;
  onAction?: () => void;
  title?: string;
};

export function ErrorState({ actionLabel, message, onAction, title = 'Something needs attention' }: ErrorStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
      {actionLabel && onAction ? (
        <Button onPress={onAction} variant="secondary">
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
  message: {
    ...Typography.body,
  },
  title: {
    ...Typography.subtitle,
  },
});
