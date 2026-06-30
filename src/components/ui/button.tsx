import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { Radius, Spacing, Typography, type ThemePalette } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = PressableProps & {
  children: string;
  fullWidth?: boolean;
  isLoading?: boolean;
  variant?: ButtonVariant;
};

export function Button({
  children,
  disabled,
  fullWidth,
  isLoading,
  style,
  variant = 'primary',
  ...props
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || isLoading;
  const stylesForVariant = getVariantStyles(variant, theme);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={(state) => [
        styles.base,
        stylesForVariant.container,
        fullWidth && styles.fullWidth,
        state.pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}>
      {isLoading ? (
        <ActivityIndicator color={stylesForVariant.text.color} />
      ) : (
        <Text style={[styles.label, stylesForVariant.text]}>{children}</Text>
      )}
    </Pressable>
  );
}

function getVariantStyles(variant: ButtonVariant, theme: ThemePalette) {
  const variants = {
    primary: {
      container: { backgroundColor: theme.primary, borderColor: theme.primary },
      text: { color: theme.primaryText },
    },
    secondary: {
      container: { backgroundColor: theme.primarySoft, borderColor: theme.primarySoft },
      text: { color: theme.primary },
    },
    ghost: {
      container: { backgroundColor: 'transparent', borderColor: theme.border },
      text: { color: theme.text },
    },
    danger: {
      container: { backgroundColor: theme.dangerSoft, borderColor: theme.dangerSoft },
      text: { color: theme.danger },
    },
  } satisfies Record<ButtonVariant, { container: object; text: { color: string } }>;

  return variants[variant];
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  disabled: {
    opacity: 0.55,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  label: {
    ...Typography.label,
  },
  pressed: {
    opacity: 0.82,
  },
});
