import { createClient } from '@supabase/supabase-js';

let client;

export function isAuthConfigured() {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
  );
}

export function isCleverConfigured() {
  return Boolean(import.meta.env.VITE_CLEVER_CLIENT_ID);
}

/** The only module that constructs the Supabase client. */
export function getSupabase() {
  if (!isAuthConfigured()) return null;
  if (!client) {
    client = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    );
  }
  return client;
}

export async function invokeFunction(name, body, accessToken) {
  if (!isAuthConfigured()) {
    const error = new Error('Sign-in is not connected yet.');
    error.code = 'not_configured';
    throw error;
  }
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const headers = {
    'Content-Type': 'application/json',
    apikey: anon,
  };
  // Publishable keys are not JWTs. Authorization is only for a signed-in user.
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  let response;
  try {
    response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(body ?? {}),
      },
    );
  } catch {
    const error = new Error('Could not reach sign-in. Check the connection and try again.');
    error.code = 'network';
    throw error;
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'That did not work. Try again.');
    error.code = data.code || 'request_failed';
    error.status = response.status;
    throw error;
  }
  return data;
}
