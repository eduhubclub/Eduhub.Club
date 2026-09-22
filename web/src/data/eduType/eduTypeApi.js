import { getSupabase } from '../auth/supabaseClient';
import { readAccuracyMode, resolveAccuracy } from './settings';

const LOCAL_PROGRESS_KEY = 'eduHub.eduType.progress';
const LOCAL_TEXTS_KEY = 'eduHub.eduType.texts';
const LOCAL_DAY_KEY = 'eduHub.eduType.dayAssignments';
const LOCAL_SESSIONS_KEY = 'eduHub.eduType.sessions';

function clientOrNull() {
  try {
    return getSupabase();
  } catch {
    return null;
  }
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

function localProgressKey(studentId, contentKind, contentId) {
  return `${studentId || 'local'}::${contentKind}::${contentId}`;
}

function computeWpm(correctKeystrokes, activeMs) {
  if (!activeMs || activeMs <= 0 || !correctKeystrokes) return 0;
  const minutes = activeMs / 60000;
  return Math.round(((correctKeystrokes / 5) / minutes) * 100) / 100;
}

function computeAccuracy(correctKeystrokes, errorKeystrokes) {
  return resolveAccuracy('keystroke', { correctKeystrokes, errorKeystrokes });
}

export function formatActiveTime(ms) {
  const totalSec = Math.max(0, Math.round((ms || 0) / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m <= 0) return `${s}s`;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

export { computeWpm, computeAccuracy };

/**
 * Load resume cursor + cumulative metrics for one piece of content.
 */
export async function loadProgress({ studentId, contentKind, contentId }) {
  const supabase = clientOrNull();
  if (supabase && studentId && studentId !== 'demo') {
    try {
      const { data, error } = await supabase
        .from('edu_type_progress')
        .select(
          'page_index, char_index, active_ms, correct_keystrokes, error_keystrokes, completed_at, updated_at, class_id',
        )
        .eq('student_id', studentId)
        .eq('content_kind', contentKind)
        .eq('content_id', contentId)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        return {
          pageIndex: data.page_index || 0,
          charIndex: data.char_index || 0,
          activeMs: Number(data.active_ms) || 0,
          correctKeystrokes: data.correct_keystrokes || 0,
          errorKeystrokes: data.error_keystrokes || 0,
          completedAt: data.completed_at || null,
          classId: data.class_id || null,
          source: 'cloud',
        };
      }
    } catch {
      /* fall through to local */
    }
  }

  const all = readJson(LOCAL_PROGRESS_KEY, {});
  const row = all[localProgressKey(studentId, contentKind, contentId)];
  if (!row) {
    return {
      pageIndex: 0,
      charIndex: 0,
      activeMs: 0,
      correctKeystrokes: 0,
      errorKeystrokes: 0,
      completedAt: null,
      classId: null,
      source: 'local',
    };
  }
  return { ...row, source: 'local' };
}

/**
 * Upsert progress. Debounce at the call site.
 */
export async function saveProgress({
  studentId,
  contentKind,
  contentId,
  classId = null,
  pageIndex = 0,
  charIndex = 0,
  activeMs = 0,
  correctKeystrokes = 0,
  errorKeystrokes = 0,
  completedAt = null,
}) {
  const payload = {
    pageIndex,
    charIndex,
    activeMs,
    correctKeystrokes,
    errorKeystrokes,
    completedAt,
    classId,
    updatedAt: new Date().toISOString(),
  };

  const all = readJson(LOCAL_PROGRESS_KEY, {});
  all[localProgressKey(studentId, contentKind, contentId)] = payload;
  writeJson(LOCAL_PROGRESS_KEY, all);

  const supabase = clientOrNull();
  if (!supabase || !studentId || studentId === 'demo') {
    return { ...payload, source: 'local' };
  }

  try {
    const { error } = await supabase.from('edu_type_progress').upsert(
      {
        student_id: studentId,
        content_kind: contentKind,
        content_id: contentId,
        class_id: classId,
        page_index: pageIndex,
        char_index: charIndex,
        active_ms: Math.round(activeMs),
        correct_keystrokes: correctKeystrokes,
        error_keystrokes: errorKeystrokes,
        completed_at: completedAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,content_kind,content_id' },
    );
    if (error) throw error;
    return { ...payload, source: 'cloud' };
  } catch {
    return { ...payload, source: 'local' };
  }
}

export async function clearProgress({ studentId, contentKind, contentId }) {
  const all = readJson(LOCAL_PROGRESS_KEY, {});
  delete all[localProgressKey(studentId, contentKind, contentId)];
  writeJson(LOCAL_PROGRESS_KEY, all);

  const supabase = clientOrNull();
  if (!supabase || !studentId || studentId === 'demo') return;

  try {
    await supabase
      .from('edu_type_progress')
      .delete()
      .eq('student_id', studentId)
      .eq('content_kind', contentKind)
      .eq('content_id', contentId);
  } catch {
    /* ignore */
  }
}

/**
 * Create or update an analytics session row. Pass sessionId to update.
 */
export async function flushSession({
  sessionId = null,
  studentId,
  classId = null,
  contentKind,
  contentId,
  startedAt,
  endedAt = null,
  activeMs = 0,
  correctKeystrokes = 0,
  errorKeystrokes = 0,
  letterCorrect = 0,
  letterWrong = 0,
}) {
  const wpm = computeWpm(correctKeystrokes, activeMs);
  const accuracy = resolveAccuracy(readAccuracyMode(), {
    correctKeystrokes,
    errorKeystrokes,
    letterCorrect,
    letterWrong,
  });
  const row = {
    id: sessionId || crypto.randomUUID(),
    studentId,
    classId,
    contentKind,
    contentId,
    startedAt: startedAt || new Date().toISOString(),
    endedAt,
    activeMs,
    correctKeystrokes,
    errorKeystrokes,
    wpm,
    accuracy,
  };

  const local = readJson(LOCAL_SESSIONS_KEY, []);
  const idx = local.findIndex((s) => s.id === row.id);
  if (idx >= 0) local[idx] = row;
  else local.unshift(row);
  writeJson(LOCAL_SESSIONS_KEY, local.slice(0, 200));

  const supabase = clientOrNull();
  if (!supabase || !studentId || studentId === 'demo') {
    return { ...row, source: 'local' };
  }

  try {
    const { data, error } = await supabase
      .from('edu_type_sessions')
      .upsert(
        {
          id: row.id,
          student_id: studentId,
          class_id: classId,
          content_kind: contentKind,
          content_id: contentId,
          started_at: row.startedAt,
          ended_at: endedAt,
          active_ms: Math.round(activeMs),
          correct_keystrokes: correctKeystrokes,
          error_keystrokes: errorKeystrokes,
          wpm,
          accuracy,
        },
        { onConflict: 'id' },
      )
      .select('id')
      .maybeSingle();
    if (error) throw error;
    return { ...row, id: data?.id || row.id, source: 'cloud' };
  } catch {
    return { ...row, source: 'local' };
  }
}

export async function listClassSessions(classId, { limit = 40 } = {}) {
  const supabase = clientOrNull();
  if (supabase && classId) {
    try {
      const { data, error } = await supabase
        .from('edu_type_sessions')
        .select(
          'id, student_id, content_kind, content_id, started_at, ended_at, active_ms, correct_keystrokes, error_keystrokes, wpm, accuracy',
        )
        .eq('class_id', classId)
        .order('started_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []).map((row) => ({
        id: row.id,
        studentId: row.student_id,
        contentKind: row.content_kind,
        contentId: row.content_id,
        startedAt: row.started_at,
        endedAt: row.ended_at,
        activeMs: Number(row.active_ms) || 0,
        correctKeystrokes: row.correct_keystrokes || 0,
        errorKeystrokes: row.error_keystrokes || 0,
        wpm: Number(row.wpm) || 0,
        accuracy: Number(row.accuracy) || 0,
        source: 'cloud',
      }));
    } catch {
      /* fall through */
    }
  }

  return readJson(LOCAL_SESSIONS_KEY, [])
    .filter((s) => !classId || s.classId === classId)
    .slice(0, limit)
    .map((s) => ({ ...s, source: 'local' }));
}

export async function listTeacherTexts(classId) {
  const supabase = clientOrNull();
  if (supabase && classId) {
    try {
      const { data, error } = await supabase
        .from('edu_type_texts')
        .select('id, class_id, teacher_id, title, body, created_at')
        .eq('class_id', classId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((row) => ({
        id: row.id,
        classId: row.class_id,
        teacherId: row.teacher_id,
        title: row.title,
        body: row.body,
        createdAt: row.created_at,
        source: 'cloud',
      }));
    } catch {
      /* fall through */
    }
  }

  return readJson(LOCAL_TEXTS_KEY, [])
    .filter((t) => !classId || t.classId === classId)
    .map((t) => ({ ...t, source: 'local' }));
}

export async function createTeacherText({ classId, teacherId, title, body }) {
  const trimmedTitle = String(title || '').trim();
  const trimmedBody = String(body || '').trim();
  if (!trimmedTitle || !trimmedBody) {
    throw new Error('Add a title and some text to practice.');
  }

  const localRow = {
    id: crypto.randomUUID(),
    classId,
    teacherId: teacherId || 'local',
    title: trimmedTitle,
    body: trimmedBody,
    createdAt: new Date().toISOString(),
  };

  const supabase = clientOrNull();
  if (supabase && classId && teacherId && teacherId !== 'demo') {
    try {
      const { data, error } = await supabase
        .from('edu_type_texts')
        .insert({
          class_id: classId,
          teacher_id: teacherId,
          title: trimmedTitle,
          body: trimmedBody,
        })
        .select('id, class_id, teacher_id, title, body, created_at')
        .single();
      if (error) throw error;
      return {
        id: data.id,
        classId: data.class_id,
        teacherId: data.teacher_id,
        title: data.title,
        body: data.body,
        createdAt: data.created_at,
        source: 'cloud',
      };
    } catch {
      /* fall through to local */
    }
  }

  const all = readJson(LOCAL_TEXTS_KEY, []);
  all.unshift(localRow);
  writeJson(LOCAL_TEXTS_KEY, all);
  return { ...localRow, source: 'local' };
}

export async function deleteTeacherText(textId) {
  const all = readJson(LOCAL_TEXTS_KEY, []).filter((t) => t.id !== textId);
  writeJson(LOCAL_TEXTS_KEY, all);

  const supabase = clientOrNull();
  if (!supabase) return;
  try {
    await supabase.from('edu_type_texts').delete().eq('id', textId);
  } catch {
    /* ignore */
  }
}

function todayDateKey(timeZone) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || undefined,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export async function assignTextForToday({ classId, textId, timeZone }) {
  const assignDate = todayDateKey(timeZone);
  const local = readJson(LOCAL_DAY_KEY, {});
  local[`${classId}::${assignDate}`] = { classId, textId, assignDate };
  writeJson(LOCAL_DAY_KEY, local);

  const supabase = clientOrNull();
  if (supabase && classId) {
    try {
      const { error } = await supabase.from('edu_type_day_assignments').upsert(
        {
          class_id: classId,
          assign_date: assignDate,
          text_id: textId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'class_id,assign_date' },
      );
      if (error) throw error;
      return { classId, textId, assignDate, source: 'cloud' };
    } catch {
      /* fall through */
    }
  }
  return { classId, textId, assignDate, source: 'local' };
}

export async function loadTodayAssignment({ classId, timeZone }) {
  const assignDate = todayDateKey(timeZone);

  const supabase = clientOrNull();
  if (supabase && classId) {
    try {
      const { data, error } = await supabase
        .from('edu_type_day_assignments')
        .select('text_id, assign_date, edu_type_texts ( id, title, body, class_id )')
        .eq('class_id', classId)
        .eq('assign_date', assignDate)
        .maybeSingle();
      if (error) throw error;
      if (data?.edu_type_texts) {
        return {
          assignDate,
          classId,
          text: {
            id: data.edu_type_texts.id,
            title: data.edu_type_texts.title,
            body: data.edu_type_texts.body,
            classId: data.edu_type_texts.class_id,
          },
          source: 'cloud',
        };
      }
    } catch {
      /* fall through */
    }
  }

  const day = readJson(LOCAL_DAY_KEY, {})[`${classId}::${assignDate}`];
  if (!day) return null;
  const text = readJson(LOCAL_TEXTS_KEY, []).find((t) => t.id === day.textId);
  if (!text) return null;
  return {
    assignDate,
    classId,
    text: { id: text.id, title: text.title, body: text.body, classId: text.classId },
    source: 'local',
  };
}

/**
 * Student: find first class membership + today's assignment.
 */
export async function loadStudentTodayAssignment(timeZone) {
  const supabase = clientOrNull();
  if (!supabase) {
    const localDays = readJson(LOCAL_DAY_KEY, {});
    const keys = Object.keys(localDays);
    if (!keys.length) return null;
    const latest = localDays[keys[keys.length - 1]];
    return loadTodayAssignment({ classId: latest.classId, timeZone });
  }

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    const userId = userData.user?.id;
    if (!userId) return null;

    const { data: memberships, error } = await supabase
      .from('class_members')
      .select('class_id')
      .eq('student_id', userId)
      .order('created_at')
      .limit(1);
    if (error) throw error;
    const classId = memberships?.[0]?.class_id;
    if (!classId) return null;
    return loadTodayAssignment({ classId, timeZone });
  } catch {
    return null;
  }
}

export async function loadStudentClassId() {
  const supabase = clientOrNull();
  if (!supabase) return null;
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    const userId = userData.user?.id;
    if (!userId) return null;
    const { data, error } = await supabase
      .from('class_members')
      .select('class_id')
      .eq('student_id', userId)
      .order('created_at')
      .limit(1);
    if (error) throw error;
    return data?.[0]?.class_id || null;
  } catch {
    return null;
  }
}
