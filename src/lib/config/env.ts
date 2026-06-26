const SUPABASE_URL_KEY = 'EXPO_PUBLIC_SUPABASE_URL';
const SUPABASE_KEY_KEY = 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY';

type SupabaseEnv =
  | {
      isConfigured: true;
      publishableKey: string;
      url: string;
    }
  | {
      isConfigured: false;
      message: string;
      missing: string[];
    };

function readEnvValue(key: string) {
  return process.env[key]?.trim() ?? '';
}

function isValidUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function validateSupabaseEnv(): SupabaseEnv {
  const url = readEnvValue(SUPABASE_URL_KEY);
  const publishableKey = readEnvValue(SUPABASE_KEY_KEY);
  const missing = [
    !url ? SUPABASE_URL_KEY : null,
    !publishableKey ? SUPABASE_KEY_KEY : null,
    url && !isValidUrl(url) ? `${SUPABASE_URL_KEY} must be a valid URL` : null,
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    return {
      isConfigured: false,
      message: `Add ${SUPABASE_URL_KEY} and ${SUPABASE_KEY_KEY} to your environment to use email login and signup.`,
      missing,
    };
  }

  return {
    isConfigured: true,
    publishableKey,
    url,
  };
}

export const supabaseEnv = validateSupabaseEnv();
