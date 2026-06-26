import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type MetricTileProps = {
  label: string;
  style?: StyleProp<ViewStyle>;
  tone?: 'default' | 'success' | 'warning';
  value: string;
};

export function MetricTile({ label, style, tone = 'default', value }: MetricTileProps) {
  const theme = useTheme();
  const toneColor = tone === 'success' ? theme.success : tone === 'warning' ? theme.warning : theme.primary;

  return (
    <View style={[styles.tile, { backgroundColor: theme.surface, borderColor: theme.border }, style]}>
      <Text style={[styles.value, { color: toneColor }]}>{value}</Text>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...Typography.small,
  },
  tile: {
    minHeight: 92,
    borderRadius: Radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    gap: Spacing.one,
    padding: Spacing.three,
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 31,
  },
});
