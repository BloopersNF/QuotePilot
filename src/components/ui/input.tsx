import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, type StyleProp, type TextInputProps, type ViewStyle, View } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type InputProps = TextInputProps & {
  containerStyle?: StyleProp<ViewStyle>;
  error?: string;
  helperText?: string;
  label: string;
};

export const Input = forwardRef<TextInput, InputProps>(
  ({ containerStyle, error, helperText, label, style, ...props }, ref) => {
    const theme = useTheme();

    return (
      <View style={[styles.wrapper, containerStyle]}>
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
        <TextInput
          ref={ref}
          placeholderTextColor={theme.textMuted}
          style={[
            styles.input,
            {
              backgroundColor: theme.surface,
              borderColor: error ? theme.danger : theme.border,
              color: theme.text,
            },
            style,
          ]}
          {...props}
        />
        {error ? (
          <Text style={[styles.caption, { color: theme.danger }]}>{error}</Text>
        ) : helperText ? (
          <Text style={[styles.caption, { color: theme.textSecondary }]}>{helperText}</Text>
        ) : null}
      </View>
    );
  },
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  caption: {
    ...Typography.small,
  },
  input: {
    ...Typography.body,
    minHeight: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
  },
  label: {
    ...Typography.label,
  },
  wrapper: {
    gap: Spacing.one,
  },
});
