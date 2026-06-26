import { StyleSheet, Text, View } from 'react-native';

import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenHeaderProps = {
  eyebrow?: string;
  subtitle?: string;
  title: string;
};

export function ScreenHeader({ eyebrow, subtitle, title }: ScreenHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.header}>
      {eyebrow ? <Text style={[styles.eyebrow, { color: theme.primary }]}>{eyebrow}</Text> : null}
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    ...Typography.label,
    textTransform: 'uppercase',
  },
  header: {
    gap: Spacing.one,
  },
  subtitle: {
    ...Typography.body,
  },
  title: {
    ...Typography.title,
  },
});
