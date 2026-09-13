import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { isValidPin, normalizeJoinCode, parseLoginQr } from '../_shared/codes.js';
import { json, preflight } from '../_shared/http.js';
import { hashPin, sha256 } from '../_shared/pin.js';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;

function adminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

async function tooManyAttempts(admin, key) {
  const { data } = await admin
    .from('login_attempts')
    .select('failures, window_start')
    .eq('attempt_key', key)
    .maybeSingle();
  if (!data) return false;
  const age = Date.now() - new Date(data.window_start).getTime();
  return age < WINDOW_MS && data.failures >= MAX_FAILURES;
}

async function recordFailure(admin, key) {
  const { data } = await admin
    .from('login_attempts')
    .select('failures, window_start')
    .eq('attempt_key', key)
    .maybeSingle();
  const age = data ? Date.now() - new Date(data.window_start).getTime() : WINDOW_MS + 1;
  const failures = !data || age >= WINDOW_MS ? 1 : data.failures + 1;
  const windowStart = !data || age >= WINDOW_MS ? new Date().toISOString() : data.window_start;
  await admin.from('login_attempts').upsert({
    attempt_key: key,
    failures,
    window_start: windowStart,
  });
}

async function clearFailures(admin, key) {
  await admin.from('login_attempts').delete().eq('attempt_key', key);
}

async function issueSession(admin, email) {
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });
  if (error || !data?.properties?.hashed_token) {
    return json({ error: 'Could not start that sign-in. Try again.' }, 500);
  }
  return json({
    tokenHash: data.properties.hashed_token,
    verificationType: data.properties.verification_type || 'magiclink',
  });
}

Deno.serve(async (req) => {
  const early = preflight(req);
  if (early) return early;
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'That code or PIN is not right.' }, 400);
  }

  const admin = adminClient();
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';

  if (body.token || body.qr) {
    const token = parseLoginQr(body.qr || '') || String(body.token || '').trim();
    if (token.length < 16) return json({ error: 'That code did not work.' }, 400);
    const attemptKey = `qr:${forwarded}`;
    if (await tooManyAttempts(admin, attemptKey)) {
      return json({ error: 'Too many tries. Wait a few minutes and try again.' }, 429);
    }
    const tokenHash = await sha256(token);
    const { data: row } = await admin
      .from('login_tokens')
      .select('class_member_id, revoked_at')
      .eq('token_hash', tokenHash)
      .maybeSingle();
    if (!row || row.revoked_at) {
      await recordFailure(admin, attemptKey);
      return json({ error: 'That code did not work.' }, 401);
    }
    const { data: member } = await admin
      .from('class_members')
      .select('auth_email')
      .eq('id', row.class_member_id)
      .maybeSingle();
    if (!member?.auth_email) {
      await recordFailure(admin, attemptKey);
      return json({ error: 'That code did not work.' }, 401);
    }
    await clearFailures(admin, attemptKey);
    return issueSession(admin, member.auth_email);
  }

  const joinCode = normalizeJoinCode(body.joinCode);
  const pin = String(body.pin || '').trim();
  if (!joinCode || !isValidPin(pin)) {
    return json({ error: 'That code or PIN is not right.' }, 400);
  }
  const attemptKey = `code:${joinCode}:${forwarded}`;
  if (await tooManyAttempts(admin, attemptKey)) {
    return json({ error: 'Too many tries. Wait a few minutes and try again.' }, 429);
  }

  const { data: classroom } = await admin
    .from('classes')
    .select('id')
    .eq('join_code', joinCode)
    .maybeSingle();
  if (!classroom) {
    await recordFailure(admin, attemptKey);
    return json({ error: 'That code or PIN is not right.' }, 401);
  }

  const { data: members } = await admin
    .from('class_members')
    .select('auth_email, pin_hash, pin_salt')
    .eq('class_id', classroom.id);

  let matched = null;
  for (const member of members || []) {
    try {
      const hash = await hashPin(pin, member.pin_salt);
      if (hash === member.pin_hash) {
        matched = member;
        break;
      }
    } catch {
      /* skip a row with a bad salt */
    }
  }
  if (!matched) {
    await recordFailure(admin, attemptKey);
    return json({ error: 'That code or PIN is not right.' }, 401);
  }
  await clearFailures(admin, attemptKey);
  return issueSession(admin, matched.auth_email);
});
