/** Essay sections teachers can target with Buddy profile questions. */
export const QUESTION_SECTIONS = [
  {
    id: 'intro',
    label: 'Introduction',
    hint: 'Asked once at the start of the essay.',
  },
  {
    id: 'body',
    label: 'Body paragraphs',
    hint: 'Asked again for each body paragraph.',
  },
  {
    id: 'conclusion',
    label: 'Conclusion',
    hint: 'Asked once at the end of the essay.',
  },
];

export function blankSectionQuestions() {
  return {
    intro: [''],
    body: [''],
    conclusion: [''],
  };
}

function cleanList(list) {
  if (!Array.isArray(list)) return [];
  return list.map((q) => String(q || '').trim()).filter(Boolean);
}

/**
 * Normalize stored questions into `{ intro, body, conclusion }`.
 * Legacy flat arrays become Introduction questions.
 */
export function normalizeSectionQuestions(raw) {
  if (Array.isArray(raw)) {
    return {
      intro: cleanList(raw),
      body: [],
      conclusion: [],
    };
  }
  if (!raw || typeof raw !== 'object') {
    return { intro: [], body: [], conclusion: [] };
  }
  return {
    intro: cleanList(raw.intro),
    body: cleanList(raw.body),
    conclusion: cleanList(raw.conclusion),
  };
}

/** Form-friendly copy (keeps empty rows for editing). */
export function sectionQuestionsForForm(raw) {
  const n = normalizeSectionQuestions(raw);
  return {
    intro: n.intro.length ? [...n.intro] : [''],
    body: n.body.length ? [...n.body] : [''],
    conclusion: n.conclusion.length ? [...n.conclusion] : [''],
  };
}

export function countSectionQuestions(raw) {
  const n = normalizeSectionQuestions(raw);
  return n.intro.length + n.body.length + n.conclusion.length;
}

export function previewSectionQuestions(raw, limit = 3) {
  const n = normalizeSectionQuestions(raw);
  const flat = [
    ...n.intro.map((q) => ({ section: 'Introduction', q })),
    ...n.body.map((q) => ({ section: 'Body', q })),
    ...n.conclusion.map((q) => ({ section: 'Conclusion', q })),
  ];
  return {
    total: flat.length,
    items: flat.slice(0, limit),
    more: Math.max(0, flat.length - limit),
  };
}
