import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase/client';

import type { BusinessProfile, BusinessProfileUpsert, Profile } from './business-profile.types';

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  return supabase;
}

export async function ensureProfile(user: User): Promise<Profile> {
  const client = requireSupabase();
  const email = user.email ?? '';

  const { data, error } = await client
    .from('profiles')
    .upsert(
      {
        email,
        id: user.id,
        user_id: user.id,
      },
      { onConflict: 'id' },
    )
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Profile;
}

export async function getBusinessProfile(userId: string): Promise<BusinessProfile | null> {
  const client = requireSupabase();

  const { data, error } = await client
    .from('business_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as BusinessProfile | null) ?? null;
}

export async function saveBusinessProfile(userId: string, values: BusinessProfileUpsert): Promise<BusinessProfile> {
  const client = requireSupabase();

  const { data, error } = await client
    .from('business_profiles')
    .upsert(
      {
        ...values,
        user_id: userId,
      },
      { onConflict: 'user_id' },
    )
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as BusinessProfile;
}
