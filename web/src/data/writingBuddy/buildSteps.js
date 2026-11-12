import { clampBodyCount, DEFAULT_BODY_COUNT } from './constants';
import { fillTopic, GENRE_PACKS } from './packs';
import {
  countSectionQuestions,
  normalizeSectionQuestions,
} from './sectionQuestions';

/**
 * @typedef {'prompt' | 'edit' | 'assemble' | 'finalEdit'} StepKind
 * @typedef {{
 *   id: string,
 *   kind: StepKind,
 *   prompt?: string,
 *   pieceKey?: string,
 *   sectionKey?: string,
 *   minWords?: number,
 *   nudgeEmpty?: string,
 *   nudgeShort?: string,
 * }} Step
 */

/**
 * @param {{
 *   genre: string,
 *   length: string,
 *   topic: string,
 *   bodyCount?: number,
 *   profileQuestions?: string[] | { intro?: string[], body?: string[], conclusion?: string[] },
 * }} session
 * @returns {Step[]}
 */
export function buildSteps(session) {
  const topic = String(session?.topic || '').trim();
  const genre = String(session?.genre || 'opinion');
  const length = String(session?.length || 'paragraph');
  const bodyCount = clampBodyCount(session?.bodyCount ?? DEFAULT_BODY_COUNT);

  if (hasProfileQuestions(session?.profileQuestions)) {
    return stepsFromProfileQuestions(session.profileQuestions, topic, length, bodyCount);
  }

  const pack = GENRE_PACKS[genre] || GENRE_PACKS.opinion;

  if (length === 'sentence') {
    return stepsFromPrompts(pack.sentence, topic, 'sentence');
  }

  if (length === 'paragraph') {
    return stepsFromPrompts(pack.paragraph, topic, 'paragraph');
  }

  // essay
  const essay = pack.essay;
  /** @type {Step[]} */
  const steps = [];

  appendSection(steps, essay.intro, topic, 'intro');
  for (let i = 1; i <= bodyCount; i += 1) {
    appendSection(steps, essay.body, topic, `body-${i}`, i);
  }
  appendSection(steps, essay.conclusion, topic, 'conclusion');

  steps.push({ id: 'assemble', kind: 'assemble' });
  steps.push({ id: 'final-edit', kind: 'finalEdit' });
  return steps;
}

function hasProfileQuestions(raw) {
  if (Array.isArray(raw)) return normalizeQuestions(raw).length > 0;
  return countSectionQuestions(raw) > 0;
}

function stepsFromProfileQuestions(raw, topic, length, bodyCount) {
  // Legacy flat list — one pass, same as before.
  if (Array.isArray(raw)) {
    return stepsFromCustom(normalizeQuestions(raw), topic);
  }

  const sections = normalizeSectionQuestions(raw);

  // Non-essay: ask every section once, in order.
  if (length !== 'essay') {
    const flat = [...sections.intro, ...sections.body, ...sections.conclusion];
    return stepsFromCustom(flat, topic);
  }

  /** @type {Step[]} */
  const steps = [];
  appendCustomPrompts(steps, sections.intro, topic, 'intro');
  for (let i = 1; i <= bodyCount; i += 1) {
    appendCustomPrompts(steps, sections.body, topic, `body-${i}`);
  }
  appendCustomPrompts(steps, sections.conclusion, topic, 'conclusion');
  steps.push({ id: 'assemble', kind: 'assemble' });
  steps.push({ id: 'final-edit', kind: 'finalEdit' });
  return steps;
}

/**
 * Join stored pieces in step order into a draft.
 * @param {Step[]} steps
 * @param {Record<string, string>} pieces
 */
export function assembleDraft(steps, pieces) {
  const keys = [];
  const seen = new Set();
  for (const step of steps || []) {
    if (step.kind !== 'prompt' || !step.pieceKey) continue;
    if (seen.has(step.pieceKey)) continue;
    seen.add(step.pieceKey);
    keys.push(step.pieceKey);
  }
  return keys
    .map((key) => String(pieces?.[key] || '').trim())
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Count whitespace-separated words.
 * @param {string} text
 */
export function wordCount(text) {
  const t = String(text || '').trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

/**
 * @param {Step} step
 * @param {string} text
 * @returns {'ok' | 'empty' | 'short'}
 */
export function validatePiece(step, text) {
  const count = wordCount(text);
  if (count === 0) return 'empty';
  const min = Number(step?.minWords) || 0;
  if (min > 0 && count < min) return 'short';
  return 'ok';
}

function normalizeQuestions(list) {
  if (!Array.isArray(list)) return [];
  return list.map((q) => String(q || '').trim()).filter(Boolean);
}

function stepsFromCustom(questions, topic) {
  /** @type {Step[]} */
  const steps = [];
  appendCustomPrompts(steps, questions, topic, 'custom');
  steps.push({ id: 'assemble', kind: 'assemble' });
  steps.push({ id: 'final-edit', kind: 'finalEdit' });
  return steps;
}

function appendCustomPrompts(steps, questions, topic, sectionKey) {
  const list = normalizeQuestions(questions);
  list.forEach((q, i) => {
    const pieceKey = `${sectionKey}-p${i + 1}`;
    steps.push({
      id: `prompt-${pieceKey}`,
      kind: 'prompt',
      prompt: fillTopic(q, topic),
      pieceKey,
      sectionKey,
      minWords: 3,
      nudgeEmpty: 'Write something before we keep going.',
      nudgeShort: 'Can you add a little more?',
    });
    steps.push({
      id: `edit-${pieceKey}`,
      kind: 'edit',
      pieceKey,
      prompt: 'Nice writing! Let’s check your words.',
    });
  });
}

function stepsFromPrompts(promptDefs, topic, sectionKey) {
  /** @type {Step[]} */
  const steps = [];
  appendSection(steps, promptDefs, topic, sectionKey);
  steps.push({ id: 'assemble', kind: 'assemble' });
  steps.push({ id: 'final-edit', kind: 'finalEdit' });
  return steps;
}

function appendSection(steps, promptDefs, topic, sectionKey, bodyIndex) {
  const list = Array.isArray(promptDefs) ? promptDefs : [];
  list.forEach((def, i) => {
    const pieceKey =
      bodyIndex != null
        ? `${sectionKey}-p${i + 1}`
        : `${sectionKey}-p${i + 1}`;
    steps.push({
      id: `prompt-${pieceKey}`,
      kind: 'prompt',
      prompt: fillTopic(def.prompt, topic),
      pieceKey,
      sectionKey,
      minWords: def.minWords,
      nudgeEmpty: def.nudgeEmpty,
      nudgeShort: def.nudgeShort,
    });
    steps.push({
      id: `edit-${pieceKey}`,
      kind: 'edit',
      pieceKey,
      prompt: 'Nice writing! Let’s check your words.',
    });
  });
}
