import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AuthForm } from '@/features/auth/auth-form';
import { useAuth } from '@/features/auth/auth-provider';
import { ScreenHeader } from '@/features/shell/screen-header';
import { Button, Card, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';

export default function LoginScreen() {
  const { startDemo } = useAuth();

  async function handleDemoMode() {
    await startDemo();
    router.replace('/dashboard');
  }

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Welcome back"
        title="Log in to QuotePilot"
        subtitle="Use your Supabase-backed account, or keep exploring with demo mode."
      />
      <Card>
        <AuthForm mode="login" />
      </Card>
      <View style={styles.actions}>
        <Button fullWidth onPress={() => router.push('/signup')} variant="secondary">
          Create account
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
