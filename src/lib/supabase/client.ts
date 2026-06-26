import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { supabaseEnv } from '@/lib/config/env';

export const supabase: SupabaseClient | null = supabaseEnv.isConfigured
  ? createClient(supabaseEnv.url, supabaseEnv.publishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: false,
        persistSession: true,
        storage: AsyncStorage,
      },
    })
  : null;
