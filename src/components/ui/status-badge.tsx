import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type StatusTone = 'neutral' | 'success' | 'warning' | 'danger';

type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
};

export function StatusBadge({ label, tone = 'neutral' }: StatusBadgeProps) {
  const theme = useTheme();
  const colors = {
    neutral: { backgroundColor: theme.surfaceMuted, color: theme.textSecondary },
    success: { backgroundColor: theme.successSoft, color: theme.success },
    warning: { backgroundColor: theme.warningSoft, color: theme.warning },
    danger: { backgroundColor: theme.dangerSoft, color: theme.danger },
  } satisfies Record<StatusTone, { backgroundColor: string; color: string }>;

  return (
    <View style={[styles.badge, { backgroundColor: colors[tone].backgroundColor }]}>
      <Text style={[styles.label, { color: colors[tone].color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  label: {
    ...Typography.small,
    fontWeight: '700',
  },
});
