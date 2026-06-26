import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { AuthForm } from '@/features/auth/auth-form';
import { useAuth } from '@/features/auth/auth-provider';
import { ScreenHeader } from '@/features/shell/screen-header';

export default function SignupScreen() {
  const { startDemo } = useAuth();

  async function handleDemoMode() {
    await startDemo();
    router.replace('/dashboard');
  }

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Start simple"
        title="Create your account"
        subtitle="Phase 2 wires up Supabase Auth now, while business data stays for the next phase."
      />
      <Card>
        <AuthForm mode="signup" />
      </Card>
      <View style={styles.actions}>
        <Button fullWidth onPress={() => router.push('/login')} variant="secondary">
          I already have an account
        </Button>
        <Button fullWidth onPress={handleDemoMode} variant="ghost">
          Continue in demo mode
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: Spacing.two,
  },
});
