import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { isValidPin, normalizeJoinCode } from '../_shared/codes.js';
import { json, preflight } from '../_shared/http.js';
import { hashPin, randomSalt, randomToken, sha256 } from '../_shared/pin.js';

const JOIN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function adminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function userClient(authHeader) {
  return createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_ANON_KEY'),
    {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

function makeJoinCode() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => JOIN_ALPHABET[byte % JOIN_ALPHABET.length]).join('');
}

async function requireTeacher(req, admin) {
  const authHeader = req.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return { error: json({ error: 'Sign in as a teacher first.' }, 401) };
  const caller = userClient(authHeader);
  const { data: userData, error } = await caller.auth.getUser();
  if (error || !userData?.user) return { error: json({ error: 'Sign in as a teacher first.' }, 401) };
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle();
  if (profile?.role !== 'teacher' && profile?.role !== 'admin' && profile?.role !== 'owner') {
    return { error: json({ error: 'Only a teacher or admin can set up classroom sign-in.' }, 403) };
  }
  return { userId: userData.user.id };
}

async function ensureClass(admin, teacherId, options = {}) {
  const wanted = normalizeJoinCode(options.joinCode);
  const className = String(options.name || '').trim().slice(0, 80) || 'My class';

  if (wanted) {
    const { data: byCode } = await admin
      .from('classes')
      .select('id, name, join_code, teacher_id')
      .eq('join_code', wanted)
      .maybeSingle();
    if (byCode) {
      if (byCode.teacher_id !== teacherId) return null;
      if (className !== 'My class' && byCode.name !== className) {
        await admin.from('classes').update({ name: className }).eq('id', byCode.id);
        return { ...byCode, name: className };
      }
      return byCode;
    }
    const { data, error } = await admin
      .from('classes')
      .insert({ teacher_id: teacherId, join_code: wanted, name: className })
      .select('id, name, join_code')
      .single();
    if (!error && data) return data;
    return null;
  }

  const { data: existing } = await admin
    .from('classes')
    .select('id, name, join_code')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (existing) return existing;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const joinCode = makeJoinCode();
    const { data, error } = await admin
      .from('classes')
      .insert({ teacher_id: teacherId, join_code: joinCode, name: className })
      .select('id, name, join_code')
      .single();
    if (!error && data) return data;
  }
  return null;
}

async function activeCard(admin, memberId) {
  const { data } = await admin
    .from('login_tokens')
    .select('token_plain, created_at')
    .eq('class_member_id', memberId)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data || null;
}

async function storeCardToken(admin, memberId, token, createdAt) {
  await admin
    .from('login_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('class_member_id', memberId)
    .is('revoked_at', null);
  const { error } = await admin.from('login_tokens').insert({
    class_member_id: memberId,
    token_hash: await sha256(token),
    token_plain: token,
    created_at: createdAt,
  });
  if (error) return { error };
  return { qrToken: token, updatedAt: createdAt };
}

function randomPin() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => String(byte % 10)).join('');
}

async function memberForCard(admin, classId, body) {
  const memberId = String(body.memberId || '');
  if (memberId) {
    const { data } = await admin
      .from('class_members')
      .select('id')
      .eq('id', memberId)
      .eq('class_id', classId)
      .maybeSingle();
    return data;
  }

  const rosterStudentId = String(body.rosterStudentId || '').trim();
  if (!rosterStudentId) return null;
  const { data: existing } = await admin
    .from('class_members')
    .select('id')
    .eq('class_id', classId)
    .eq('roster_student_id', rosterStudentId)
    .maybeSingle();
  if (existing) return existing;

  const displayName = String(body.displayName || 'Student').trim().slice(0, 80) || 'Student';
  const email = `s.${crypto.randomUUID().replaceAll('-', '')}@students.example.com`;
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: `${crypto.randomUUID()}${crypto.randomUUID()}`,
    email_confirm: true,
    user_metadata: { role: 'student', display_name: displayName },
  });
  if (createError || !created?.user) return null;
  const pinSalt = randomSalt();
  const pinHash = await hashPin(randomPin(), pinSalt);
  const { data: member, error: memberError } = await admin
    .from('class_members')
    .insert({
      class_id: classId,
      student_id: created.user.id,
      roster_student_id: rosterStudentId,
      display_name: displayName,
      auth_email: email,
      pin_hash: pinHash,
      pin_salt: pinSalt,
    })
    .select('id')
    .single();
  if (memberError || !member) return null;
  return member;
}

async function listMembers(admin, classId) {
  const { data: members } = await admin
    .from('class_members')
    .select('id, display_name, created_at')
    .eq('class_id', classId)
    .order('display_name');
  const ids = (members || []).map((member) => member.id);
  let tokenRows = [];
  if (ids.length) {
    const { data } = await admin
      .from('login_tokens')
      .select('class_member_id')
      .in('class_member_id', ids)
      .is('revoked_at', null);
    tokenRows = data || [];
  }
  const withQr = new Set(tokenRows.map((row) => row.class_member_id));
  return (members || []).map((member) => ({
    id: member.id,
    displayName: member.display_name,
    hasQr: withQr.has(member.id),
  }));
}

Deno.serve(async (req) => {
  const early = preflight(req);
  if (early) return early;
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  const admin = adminClient();
  const teacher = await requireTeacher(req, admin);
  if (teacher.error) return teacher.error;

  let body = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const classroom = await ensureClass(admin, teacher.userId, {
    joinCode: body.joinCode,
    name: body.name,
  });
  if (!classroom) return json({ error: 'Could not create a class code. Try again.' }, 500);

  if (body.action === 'addStudent') {
    const displayName = String(body.displayName || '').trim().slice(0, 80);
    const pin = String(body.pin || '').trim();
    if (!displayName || !isValidPin(pin)) {
      return json({ error: 'Add a name and a 4 to 6 digit PIN.' }, 400);
    }
    const email = `s.${crypto.randomUUID().replaceAll('-', '')}@students.example.com`;
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: `${crypto.randomUUID()}${crypto.randomUUID()}`,
      email_confirm: true,
      user_metadata: { role: 'student', display_name: displayName },
    });
    if (createError || !created?.user) {
      return json({ error: 'Could not add that student. Try again.' }, 500);
    }
    const pinSalt = randomSalt();
    const pinHash = await hashPin(pin, pinSalt);
    const { error: memberError } = await admin.from('class_members').insert({
      class_id: classroom.id,
      student_id: created.user.id,
      display_name: displayName,
      auth_email: email,
      pin_hash: pinHash,
      pin_salt: pinSalt,
    });
    if (memberError) {
      return json({ error: 'Could not add that student. Try again.' }, 500);
    }
  }

  if (body.action === 'ensureQr' || body.action === 'rotateQr' || body.action === 'mintQr') {
    const rotate = body.action === 'rotateQr' || body.action === 'mintQr';
    const member = await memberForCard(admin, classroom.id, body);
    if (!member) return json({ error: 'That student is not in this class.' }, 404);
    const existing = await activeCard(admin, member.id);
    if (!rotate && existing?.token_plain) {
      const serverAt = new Date(existing.created_at).getTime();
      const clientAt = Number(body.updatedAt) || 0;
      const clientToken = String(body.token || '').trim();
      if (clientAt > serverAt && clientToken.length >= 16 && clientToken !== existing.token_plain) {
        const stored = await storeCardToken(admin, member.id, clientToken, new Date(clientAt).toISOString());
        if (stored.error) return json({ error: 'Could not save that card. Try again.' }, 500);
        const members = await listMembers(admin, classroom.id);
        return json({
          class: { id: classroom.id, name: classroom.name, joinCode: classroom.join_code },
          members,
          qrToken: stored.qrToken,
          updatedAt: stored.updatedAt,
          memberId: member.id,
        });
      }
      const members = await listMembers(admin, classroom.id);
      return json({
        class: { id: classroom.id, name: classroom.name, joinCode: classroom.join_code },
        members,
        qrToken: existing.token_plain,
        updatedAt: existing.created_at,
        memberId: member.id,
      });
    }
    if (!rotate && existing && !existing.token_plain) {
      return json({
        needsNewCode: true,
        memberId: member.id,
        error: 'This card was saved without a reprintable code. New code makes one you can print again.',
      }, 409);
    }
    const token = String(body.token || '').trim().length >= 16 ? String(body.token).trim() : randomToken();
    const stored = await storeCardToken(
      admin,
      member.id,
      token,
      body.updatedAt ? new Date(Number(body.updatedAt)).toISOString() : new Date().toISOString(),
    );
    if (stored.error) return json({ error: 'Could not make a QR code. Try again.' }, 500);
    const members = await listMembers(admin, classroom.id);
    return json({
      class: { id: classroom.id, name: classroom.name, joinCode: classroom.join_code },
      members,
      qrToken: stored.qrToken,
      updatedAt: stored.updatedAt,
      memberId: member.id,
    });
  }

  const members = await listMembers(admin, classroom.id);
  return json({
    class: { id: classroom.id, name: classroom.name, joinCode: classroom.join_code },
    members,
  });
});
