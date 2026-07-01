import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  ensureProfile,
  getBusinessProfile,
  saveBusinessProfile as persistBusinessProfile,
} from '@/features/business/business-profile-service';
import type { BusinessProfile, BusinessProfileUpsert, Profile } from '@/features/business/business-profile.types';
import { supabaseEnv } from '@/lib/config/env';
import { supabase } from '@/lib/supabase/client';

type Credentials = {
  email: string;
  password: string;
};

export type AuthResult =
  | {
      message?: string;
      ok: true;
    }
  | {
      message: string;
      ok: false;
    };

type AuthContextValue = {
  businessProfile: BusinessProfile | null;
  completeOnboarding: () => Promise<void>;
  env: typeof supabaseEnv;
  hasCompletedOnboarding: boolean;
  isAuthenticated: boolean;
  isDemo: boolean;
  isLoading: boolean;
  profile: Profile | null;
  refreshWorkspace: () => Promise<void>;
  saveBusinessProfile: (values: BusinessProfileUpsert) => Promise<AuthResult>;
  session: Session | null;
  signIn: (credentials: Credentials) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  signUp: (credentials: Credentials) => Promise<AuthResult>;
  startDemo: () => Promise<void>;
  user: User | null;
  workspaceError: string | null;
};

const DEMO_SESSION_KEY = 'quotepilot:demo-session';

const AuthContext = createContext<AuthContextValue | null>(null);

function getSupabaseUnavailableMessage() {
  return supabaseEnv.isConfigured ? 'Supabase client is not available.' : supabaseEnv.message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);

  const loadWorkspaceForSession = useCallback(async (nextSession: Session | null, throwOnError = false) => {
    if (!nextSession?.user) {
      setProfile(null);
      setBusinessProfile(null);
      setWorkspaceError(null);
      return;
    }

    try {
      const nextProfile = await ensureProfile(nextSession.user);
      const nextBusinessProfile = await getBusinessProfile(nextSession.user.id);

      setProfile(nextProfile);
      setBusinessProfile(nextBusinessProfile);
      setWorkspaceError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load your QuotePilot workspace.';

      setProfile(null);
      setBusinessProfile(null);
      setWorkspaceError(message);

      if (throwOnError) {
        throw error;
      }
    }
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
        setProfile(null);
        setBusinessProfile(null);
        setWorkspaceError(null);
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
      await loadWorkspaceForSession(data.session);
      setIsLoading(false);

      const listener = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
        setSession(nextSession);
        setIsDemo(false);
        await AsyncStorage.removeItem(DEMO_SESSION_KEY);
        await loadWorkspaceForSession(nextSession);
      });
      unsubscribe = () => listener.data.subscription.unsubscribe();
    }

    initializeAuth();

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [loadWorkspaceForSession]);

  const refreshWorkspace = useCallback(async () => {
    await loadWorkspaceForSession(session);
  }, [loadWorkspaceForSession, session]);

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
      try {
        await loadWorkspaceForSession(data.session, true);
      } catch (workspaceLoadError) {
        const message =
          workspaceLoadError instanceof Error ? workspaceLoadError.message : 'Unable to load your QuotePilot workspace.';

        return { ok: false, message };
      }

      return { ok: true };
    },
    [loadWorkspaceForSession],
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
      try {
        await loadWorkspaceForSession(data.session, true);
      } catch (workspaceLoadError) {
        const message =
          workspaceLoadError instanceof Error ? workspaceLoadError.message : 'Unable to load your QuotePilot workspace.';

        return { ok: false, message };
      }

      if (!data.session) {
        return { ok: true, message: 'Check your email to confirm your account, then log in.' };
      }

      return { ok: true };
    },
    [loadWorkspaceForSession],
  );

  const startDemo = useCallback(async () => {
    await AsyncStorage.setItem(DEMO_SESSION_KEY, 'true');
    setSession(null);
    setProfile(null);
    setBusinessProfile(null);
    setWorkspaceError(null);
    setIsDemo(true);
  }, []);

  const completeOnboarding = useCallback(async () => {
    if (isDemo) {
      await AsyncStorage.setItem(DEMO_SESSION_KEY, 'true');
      setWorkspaceError(null);
    }
  }, [isDemo]);

  const saveBusinessProfile = useCallback(
    async (values: BusinessProfileUpsert): Promise<AuthResult> => {
      if (isDemo) {
        return { ok: true };
      }

      if (!session?.user) {
        return { ok: false, message: 'You need to be logged in to save a business profile.' };
      }

      try {
        const nextBusinessProfile = await persistBusinessProfile(session.user.id, values);

        setBusinessProfile(nextBusinessProfile);
        setWorkspaceError(null);
        return { ok: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to save your business profile.';

        setWorkspaceError(message);
        return { ok: false, message };
      }
    },
    [isDemo, session],
  );

  const signOut = useCallback(async () => {
    if (supabase && session) {
      await supabase.auth.signOut();
    }

    await AsyncStorage.removeItem(DEMO_SESSION_KEY);
    setSession(null);
    setProfile(null);
    setBusinessProfile(null);
    setWorkspaceError(null);
    setIsDemo(false);
  }, [session]);

  const hasCompletedOnboarding = isDemo || Boolean(businessProfile);

  const value = useMemo<AuthContextValue>(
    () => ({
      businessProfile,
      completeOnboarding,
      env: supabaseEnv,
      hasCompletedOnboarding,
      isAuthenticated: Boolean(session) || isDemo,
      isDemo,
      isLoading,
      profile,
      refreshWorkspace,
      saveBusinessProfile,
      session,
      signIn,
      signOut,
      signUp,
      startDemo,
      user: session?.user ?? null,
      workspaceError,
    }),
    [
      businessProfile,
      completeOnboarding,
      hasCompletedOnboarding,
      isDemo,
      isLoading,
      profile,
      refreshWorkspace,
      saveBusinessProfile,
      session,
      signIn,
      signOut,
      signUp,
      startDemo,
      workspaceError,
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
