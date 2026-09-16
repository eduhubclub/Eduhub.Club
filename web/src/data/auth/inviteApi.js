import { getSupabase } from './supabaseClient';

function client() {
  const supabase = getSupabase();
  if (!supabase) {
    const error = new Error('Sign-in is not connected yet.');
    error.code = 'not_configured';
    throw error;
  }
  return supabase;
}

export async function peekAccountInvite(token) {
  const supabase = client();
  const { data, error } = await supabase.rpc('peek_account_invite', {
    p_token: String(token || '').trim(),
  });
  if (error) throw new Error(error.message || 'That invite could not be checked.');
  return data || null;
}

export async function createAccountInvite(email, role) {
  const supabase = client();
  const { data, error } = await supabase.rpc('create_account_invite', {
    p_email: String(email || '').trim(),
    p_role: role,
  });
  if (error) {
    const message = error.message || '';
    if (/not allowed|Teachers can invite/i.test(message)) {
      throw new Error(message);
    }
    throw new Error(message || 'Could not create that invite.');
  }
  return data;
}

export async function loadMyInvites() {
  const supabase = client();
  const { data, error } = await supabase
    .from('account_invites')
    .select('id, email, role, created_at, expires_at, accepted_at')
    .order('created_at', { ascending: false })
    .limit(40);
  if (error) throw new Error(error.message || 'Could not load invites.');
  return data || [];
}
