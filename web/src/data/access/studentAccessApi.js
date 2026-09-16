import { getSupabase } from '../auth/supabaseClient';
import { STUDENT_APP_IDS } from './studentApps';

export const HEARTBEAT_SECONDS = 30;

export function accessErrorMessage(error) {
  const message = error?.message || '';
  if (/parts/i.test(message) && /does not exist|schema cache|Could not find the function|p_parts/i.test(message)) {
    return 'Game and desk switches need the student app parts SQL in Supabase, then reload.';
  }
  if (/ensure_demo_class|demo_class_access|save_demo_app_policy/i.test(message)) {
    return 'The demo class is not in the database yet. Run the demo class SQL in Supabase, then reload.';
  }
  if (
    error?.code === '42P01' ||
    error?.code === 'PGRST202' ||
    error?.code === 'PGRST205' ||
    /does not exist|schema cache|student_app_board|class_app_policies|ensure_demo_class|demo_class_access/i.test(message)
  ) {
    return 'Student app rules are not in the database yet. Run the student app access SQL in Supabase, then reload.';
  }
  if (/not signed in/i.test(message)) return 'Sign in again to load class rules.';
  return message || 'Could not load student app rules.';
}

let partsColumnReady = true;

function policyRow(policy) {
  const row = {
    app_id: policy.appId,
    enabled: Boolean(policy.enabled),
    weekdays: policy.weekdays,
    window_start: policy.windowStart || null,
    window_end: policy.windowEnd || null,
    daily_minutes: policy.dailyMinutes ?? null,
    updated_at: new Date().toISOString(),
  };
  if (partsColumnReady) row.parts = policy.parts || {};
  return row;
}

function client() {
  const supabase = getSupabase();
  if (!supabase) {
    const error = new Error('Sign-in is not connected yet.');
    error.code = 'not_configured';
    throw error;
  }
  return supabase;
}

export async function loadTeacherClasses() {
  const supabase = client();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const userId = userData.user?.id;
  if (!userId) {
    const error = new Error('Sign in again to load class rules.');
    throw error;
  }
  const { data, error } = await supabase
    .from('classes')
    .select('id, name')
    .eq('teacher_id', userId)
    .order('created_at');
  if (error) throw error;
  return data || [];
}

export async function loadClassAccess(classId) {
  const supabase = client();
  const policiesSelect =
    'app_id, enabled, weekdays, window_start, window_end, daily_minutes, parts';
  const [settings, policies, members, overrides] = await Promise.all([
    supabase.from('class_access_settings').select('timezone').eq('class_id', classId).maybeSingle(),
    supabase.from('class_app_policies').select(policiesSelect).eq('class_id', classId),
    supabase
      .from('class_members')
      .select('id, student_id, display_name')
      .eq('class_id', classId)
      .order('display_name'),
    supabase
      .from('student_app_overrides')
      .select('student_id, app_id, blocked, daily_minutes')
      .eq('class_id', classId),
  ]);
  let policyRows = policies.data;
  let policyError = policies.error;
  if (policyError && /parts/i.test(policyError.message || '')) {
    partsColumnReady = false;
    const again = await supabase
      .from('class_app_policies')
      .select('app_id, enabled, weekdays, window_start, window_end, daily_minutes')
      .eq('class_id', classId);
    policyRows = again.data;
    policyError = again.error;
  }
  const error = settings.error || policyError || members.error || overrides.error;
  if (error) throw error;
  return {
    timezone: settings.data?.timezone || '',
    policies: policyRows || [],
    members: members.data || [],
    overrides: overrides.data || [],
  };
}

export async function saveClassTimeZone(classId, timezone) {
  const supabase = client();
  const { error } = await supabase.from('class_access_settings').upsert({
    class_id: classId,
    timezone,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function saveAppPolicy(classId, policy) {
  const supabase = client();
  const { error } = await supabase.from('class_app_policies').upsert({
    class_id: classId,
    ...policyRow(policy),
  });
  if (error && /parts/i.test(error.message || '')) {
    partsColumnReady = false;
    const again = await supabase.from('class_app_policies').upsert({
      class_id: classId,
      ...policyRow(policy),
    });
    if (again.error) throw again.error;
    if (policy.parts && Object.keys(policy.parts).length) {
      throw error;
    }
    return;
  }
  if (error) throw error;
}

export async function saveStudentOverride(classId, override) {
  const supabase = client();
  const inherit = !override.blocked && override.dailyMinutes == null;
  if (inherit) {
    const { error } = await supabase
      .from('student_app_overrides')
      .delete()
      .eq('class_id', classId)
      .eq('student_id', override.studentId)
      .eq('app_id', override.appId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from('student_app_overrides').upsert({
    class_id: classId,
    student_id: override.studentId,
    app_id: override.appId,
    blocked: Boolean(override.blocked),
    daily_minutes: override.dailyMinutes ?? null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function loadStudentBoard() {
  const supabase = client();
  const { data, error } = await supabase.rpc('student_app_board', {
    app_ids: STUDENT_APP_IDS,
  });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function touchStudentApp(appId, addSeconds = 0) {
  const supabase = client();
  const { data, error } = await supabase.rpc('touch_student_app', {
    target_app: appId,
    add_seconds: addSeconds,
  });
  if (error) throw error;
  return data;
}

export async function loadDemoClassAccess() {
  const supabase = client();
  const { data, error } = await supabase.rpc('demo_class_access');
  if (error) throw error;
  return data;
}

export async function ensureDemoClass() {
  const supabase = client();
  const { data, error } = await supabase.rpc('ensure_demo_class');
  if (error) throw error;
  return data;
}

export async function saveDemoAppPolicy(policy, timezone) {
  const supabase = client();
  const args = {
    p_app_id: policy.appId,
    p_enabled: Boolean(policy.enabled),
    p_weekdays: policy.weekdays,
    p_window_start: policy.windowStart || null,
    p_window_end: policy.windowEnd || null,
    p_daily_minutes: policy.dailyMinutes ?? null,
    p_timezone: timezone || null,
    p_parts: policy.parts || {},
  };
  const { error } = await supabase.rpc('save_demo_app_policy', args);
  if (error && /p_parts|schema cache|Could not find the function/i.test(error.message || '')) {
    const { p_parts: dropped, ...withoutParts } = args;
    const again = await supabase.rpc('save_demo_app_policy', withoutParts);
    if (again.error) throw again.error;
    if (dropped && Object.keys(dropped).length) throw error;
    return;
  }
  if (error) throw error;
}

export async function saveDemoStudentOverride(override) {
  const supabase = client();
  const { error } = await supabase.rpc('save_demo_student_override', {
    p_student_id: override.studentId,
    p_app_id: override.appId,
    p_blocked: Boolean(override.blocked),
    p_daily_minutes: override.dailyMinutes ?? null,
  });
  if (error) throw error;
}

export async function saveDemoTimezone(timezone) {
  const supabase = client();
  const { error } = await supabase.rpc('save_demo_timezone', {
    p_timezone: timezone,
  });
  if (error) throw error;
}
