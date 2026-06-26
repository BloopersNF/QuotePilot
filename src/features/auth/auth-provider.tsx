import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { supabaseEnv } from '@/lib/config/env';
import { supabase } from '@/lib/supabase/client';

type Credentials = {
  email: string;
  password: string;
};

type AuthResult =
  | {
      message?: string;
      ok: true;
    }
  | {
      message: string;
      ok: false;
    };

type AuthContextValue = {
  completeOnboarding: () => Promise<void>;
  env: typeof supabaseEnv;
  hasCompletedOnboarding: boolean;
  isAuthenticated: boolean;
  isDemo: boolean;
  isLoading: boolean;
  session: Session | null;
  signIn: (credentials: Credentials) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  signUp: (credentials: Credentials) => Promise<AuthResult>;
  startDemo: () => Promise<void>;
  user: User | null;
};

const DEMO_SESSION_KEY = 'quotepilot:demo-session';
const ONBOARDING_PREFIX = 'quotepilot:onboarding-complete:';
const DEMO_USER_KEY = 'demo';

const AuthContext = createContext<AuthContextValue | null>(null);

function getSupabaseUnavailableMessage() {
  return supabaseEnv.isConfigured ? 'Supabase client is not available.' : supabaseEnv.message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  const loadOnboardingState = useCallback(async (userKey: string | null) => {
    if (!userKey) {
      setHasCompletedOnboarding(false);
      return;
    }

    const value = await AsyncStorage.getItem(`${ONBOARDING_PREFIX}${userKey}`);
    setHasCompletedOnboarding(value === 'true');
  }, []);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    async function initializeAuth() {
      const hasDemoSession = (await AsyncStorage.getItem(DEMO_SESSION_KEY)) === 'true';

      if (hasDemoSession) {
        if (!isMounted) {
          return;
        }
        setIsDemo(true);
        setSession(null);
        await loadOnboardingState(DEMO_USER_KEY);
        setIsLoading(false);
        return;
      }

      if (!supabase) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!isMounted) {
        return;
      }

      setSession(data.session);
      await loadOnboardingState(data.session?.user.id ?? null);
      setIsLoading(false);

      const listener = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
        setSession(nextSession);
        setIsDemo(false);
        await AsyncStorage.removeItem(DEMO_SESSION_KEY);
        await loadOnboardingState(nextSession?.user.id ?? null);
      });
      unsubscribe = () => listener.data.subscription.unsubscribe();
    }

    initializeAuth();

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [loadOnboardingState]);

  const signIn = useCallback(
    async ({ email, password }: Credentials): Promise<AuthResult> => {
      if (!supabase) {
        return { ok: false, message: getSupabaseUnavailableMessage() };
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { ok: false, message: error.message };
      }

      await AsyncStorage.removeItem(DEMO_SESSION_KEY);
      setIsDemo(false);
      setSession(data.session);
      await loadOnboardingState(data.session?.user.id ?? null);
      return { ok: true };
    },
    [loadOnboardingState],
  );

  const signUp = useCallback(
    async ({ email, password }: Credentials): Promise<AuthResult> => {
      if (!supabase) {
        return { ok: false, message: getSupabaseUnavailableMessage() };
      }

      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        return { ok: false, message: error.message };
      }

      await AsyncStorage.removeItem(DEMO_SESSION_KEY);
      setIsDemo(false);
      setSession(data.session);
      await loadOnboardingState(data.session?.user.id ?? null);

      if (!data.session) {
        return { ok: true, message: 'Check your email to confirm your account, then log in.' };
      }

      return { ok: true };
    },
    [loadOnboardingState],
  );

  const startDemo = useCallback(async () => {
    await AsyncStorage.setItem(DEMO_SESSION_KEY, 'true');
    await AsyncStorage.setItem(`${ONBOARDING_PREFIX}${DEMO_USER_KEY}`, 'true');
    setSession(null);
    setIsDemo(true);
    setHasCompletedOnboarding(true);
  }, []);

  const completeOnboarding = useCallback(async () => {
    const key = isDemo ? DEMO_USER_KEY : session?.user.id;

    if (!key) {
      return;
    }

    await AsyncStorage.setItem(`${ONBOARDING_PREFIX}${key}`, 'true');
    setHasCompletedOnboarding(true);
  }, [isDemo, session?.user.id]);

  const signOut = useCallback(async () => {
    if (supabase && session) {
      await supabase.auth.signOut();
    }

    await AsyncStorage.removeItem(DEMO_SESSION_KEY);
    setSession(null);
    setIsDemo(false);
    setHasCompletedOnboarding(false);
  }, [session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      completeOnboarding,
      env: supabaseEnv,
      hasCompletedOnboarding,
      isAuthenticated: Boolean(session) || isDemo,
      isDemo,
      isLoading,
      session,
      signIn,
      signOut,
      signUp,
      startDemo,
      user: session?.user ?? null,
    }),
    [
      completeOnboarding,
      hasCompletedOnboarding,
      isDemo,
      isLoading,
      session,
      signIn,
      signOut,
      signUp,
      startDemo,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return value;
}
