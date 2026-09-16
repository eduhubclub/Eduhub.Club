import { getSupabase } from './supabaseClient';

function notConnected() {
  const error = new Error('Sign-in is not connected yet.');
  error.code = 'not_configured';
  return error;
}

function client() {
  const supabase = getSupabase();
  if (!supabase) throw notConnected();
  return supabase;
}

/** True when the user enrolled MFA but this session is still only password/OAuth. */
export async function sessionNeedsMfaChallenge() {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) return false;
  return data?.nextLevel === 'aal2' && data?.currentLevel !== 'aal2';
}

export async function listVerifiedTotpFactors() {
  const supabase = client();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw new Error(error.message || 'Could not load authenticator settings.');
  return data?.totp || [];
}

export async function startTotpEnroll() {
  const supabase = client();
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'Authenticator app',
    issuer: 'Edu.Hub',
  });
  if (error) throw new Error(error.message || 'Could not start authenticator setup.');
  return {
    factorId: data.id,
    qr: data.totp?.qr_code || '',
    secret: data.totp?.secret || '',
    uri: data.totp?.uri || '',
  };
}

export async function confirmTotpEnroll(factorId, code) {
  const supabase = client();
  const cleaned = String(code || '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(cleaned)) throw new Error('Enter the 6-digit code from your authenticator app.');
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId,
  });
  if (challengeError) throw new Error(challengeError.message || 'Could not check that code.');
  const { error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code: cleaned,
  });
  if (error) throw new Error(error.message || 'That code is not right. Try again.');
}

export async function cancelTotpEnroll(factorId) {
  if (!factorId) return;
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.mfa.unenroll({ factorId });
}

export async function unenrollTotpFactor(factorId) {
  const supabase = client();
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw new Error(error.message || 'Could not turn off the authenticator.');
}

export async function verifyTotpChallenge(code) {
  const supabase = client();
  const cleaned = String(code || '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(cleaned)) throw new Error('Enter the 6-digit code from your authenticator app.');
  const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
  if (listError) throw new Error(listError.message || 'Could not check authenticator factors.');
  const factor = factors?.totp?.[0];
  if (!factor) throw new Error('No authenticator is set up on this account.');
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId: factor.id,
  });
  if (challengeError) throw new Error(challengeError.message || 'Could not check that code.');
  const { error } = await supabase.auth.mfa.verify({
    factorId: factor.id,
    challengeId: challenge.id,
    code: cleaned,
  });
  if (error) throw new Error(error.message || 'That code is not right. Try again.');
}
