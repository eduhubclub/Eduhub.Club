/**
 * Curriculum-aligned writing templates (built-in).
 * Stable ids so class assignments survive reloads without copying first.
 *
 * Arts & Letters essay anatomy follows the teacher “Anatomy of an Essay”
 * breakdown (hook → thesis → two points; each proof paragraph =
 * topic → evidence → elaboration ×2; conclusion = restate + thanks).
 */

/** @typedef {{ intro: string[], body: string[], conclusion: string[] }} SectionQs */

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   blurb: string,
 *   questions: SectionQs,
 *   genre: string | null,
 *   length: string,
 *   bodyCount: number,
 * }} CurriculumTemplateDef
 *
 * @typedef {{
 *   id: string,
 *   name: string,
 *   blurb: string,
 *   templates: CurriculumTemplateDef[],
 * }} CurriculumPack
 */

/** @type {CurriculumPack[]} */
export const CURRICULUM_PACKS = [
  {
    id: 'arts-letters',
    name: 'Arts & Letters',
    blurb:
      'Grade 3–style essay anatomy used with Arts & Letters modules (hook, thesis, two proof paragraphs, conclusion).',
    templates: [
      {
        id: 'curriculum:arts-letters:painted-essay',
        name: 'Anatomy of an Essay',
        blurb:
          'Matches the classroom anatomy chart: introduction (hook, thesis, point preview), two proof paragraphs (topic → evidence → elaboration), and a wrap-up conclusion.',
        genre: 'informative',
        length: 'essay',
        bodyCount: 2,
        questions: {
          intro: [
            'Write a hook that grabs the reader about {topic}.',
            'Write your thesis — resay the prompt in your own words about {topic}.',
            'Preview your two points. What will proof paragraph 1 and proof paragraph 2 be about?',
          ],
          body: [
            'Write a topic sentence that tells what this proof paragraph is about.',
            'Evidence #1: share a fact or detail from the text that supports your point.',
            'Elaboration #1: add on — explain, define, compare, or say more about that evidence.',
            'Evidence #2: share another fact or detail from the text.',
            'Elaboration #2: add on to that second piece of evidence.',
          ],
          conclusion: [
            'Restate your thesis so the reader remembers your big idea about {topic}.',
            'Retell your two points — what were both proof paragraphs about?',
            'End with a hope, wish, or thank-you that wraps up kindly.',
          ],
        },
      },
      {
        id: 'curriculum:arts-letters:painted-essay-opinion',
        name: 'Anatomy of an Essay · Opinion',
        blurb:
          'Same sentence jobs as the anatomy chart, with opinion wording for a claim and reasons.',
        genre: 'opinion',
        length: 'essay',
        bodyCount: 2,
        questions: {
          intro: [
            'Write a hook that grabs the reader about your opinion on {topic}.',
            'Write your thesis — resay the prompt as your claim about {topic}.',
            'Preview your two reasons. What will proof paragraph 1 and proof paragraph 2 be about?',
          ],
          body: [
            'Write a topic sentence for this reason.',
            'Evidence #1: share a fact, example, or detail that supports this reason.',
            'Elaboration #1: add on — explain why that evidence helps your claim.',
            'Evidence #2: share another fact, example, or detail.',
            'Elaboration #2: add on to that second piece of evidence.',
          ],
          conclusion: [
            'Restate your claim (thesis) in a fresh way.',
            'Retell your two reasons — what were both proof paragraphs about?',
            'End with a hope, wish, or thank-you that wraps up kindly.',
          ],
        },
      },
    ],
  },
];

function asTemplate(def, pack) {
  return {
    id: def.id,
    name: def.name,
    blurb: def.blurb || '',
    questions: {
      intro: [...(def.questions?.intro || [])],
      body: [...(def.questions?.body || [])],
      conclusion: [...(def.questions?.conclusion || [])],
    },
    genre: def.genre || null,
    length: def.length || 'essay',
    bodyCount: def.bodyCount ?? 2,
    curriculumId: pack.id,
    curriculumName: pack.name,
    builtIn: true,
    updatedAt: 0,
  };
}

/** Flat list of built-in curriculum templates. */
export function listCurriculumTemplates() {
  const out = [];
  for (const pack of CURRICULUM_PACKS) {
    for (const def of pack.templates) {
      out.push(asTemplate(def, pack));
    }
  }
  return out;
}

export function getCurriculumTemplate(id) {
  const tid = String(id || '');
  if (!tid.startsWith('curriculum:')) return null;
  return listCurriculumTemplates().find((t) => t.id === tid) || null;
}

export function getCurriculumPack(id) {
  return CURRICULUM_PACKS.find((p) => p.id === String(id)) || null;
}
