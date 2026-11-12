/** Live outline for the Create Assessments secondary sidebar. */

export const ASSESSMENT_EDITOR_PANEL_ID = 'create';
export const ASSESSMENT_EDITOR_PANEL_SOURCE = 'assessment-draft';
export const ASSESSMENT_EDITOR_EVENT = 'eduHub.tests.editorOutline';
export const DETAILS_PAGE_ID = 'details';

const listeners = new Set();

let state = {
  open: false,
  title: '',
  page: DETAILS_PAGE_ID,
  items: [],
  /** When true, the editor should offer Choice / Number / Writing. */
  requestAdd: false,
};

export function getAssessmentEditorPanel() {
  return state;
}

function emit() {
  for (const fn of listeners) fn(state);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ASSESSMENT_EDITOR_EVENT));
  }
}

/**
 * @param {Partial<typeof state>} partial
 */
export function setAssessmentEditorPanel(partial) {
  state = { ...state, ...partial };
  emit();
}

export function subscribeAssessmentEditorPanel(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function buildAssessmentPanelContent(outline = state) {
  const rows = [
    {
      id: DETAILS_PAGE_ID,
      label: 'Title & scoring',
      desc: 'Start',
    },
  ];
  (outline.items || []).forEach((item, index) => {
    const kind =
      item.type === 'number' ? 'Number' : item.type === 'short_write' ? 'Writing' : 'Choice';
    const prompt = String(item.prompt || '').trim();
    rows.push({
      id: item.id,
      label: prompt
        ? prompt.length > 40
          ? `${prompt.slice(0, 40)}…`
          : prompt
        : `New ${kind.toLowerCase()} question`,
      desc: `Q${index + 1} · ${kind}`,
    });
  });
  return rows;
}
