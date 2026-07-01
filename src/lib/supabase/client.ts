import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient, type SupportedStorage } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { supabaseEnv } from '@/lib/config/env';

const serverStorage: SupportedStorage = {
  getItem: () => null,
  removeItem: () => undefined,
  setItem: () => undefined,
};

function getAuthStorage(): SupportedStorage {
  if (Platform.OS === 'web' && typeof window === 'undefined') {
    return serverStorage;
  }

  return AsyncStorage;
}

export const supabase: SupabaseClient | null = supabaseEnv.isConfigured
  ? createClient(supabaseEnv.url, supabaseEnv.publishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: false,
        persistSession: true,
        storage: getAuthStorage(),
      },
    })
  : null;
