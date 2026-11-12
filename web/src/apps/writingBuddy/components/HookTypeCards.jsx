import { TYPE } from '../../../shared/typography';

/** Hook styles kids can pick when the buddy asks for a hook. */
export const HOOK_TYPES = [
  {
    id: 'onomatopoeia',
    label: 'Onomatopoeia',
    blurb: 'Start with a sound word.',
    example: (topic) => `Splash! Have you ever wondered about ${topic}?`,
  },
  {
    id: 'question',
    label: 'Question',
    blurb: 'Ask the reader something.',
    example: (topic) => `Can you imagine learning about ${topic}?`,
  },
  {
    id: 'fun-fact',
    label: 'Fun fact',
    blurb: 'Share a surprising fact.',
    example: (topic) => `Did you know something amazing about ${topic}?`,
  },
  {
    id: 'other',
    label: 'Something else',
    blurb: 'Write your own hook.',
    example: () => '',
  },
];

export function isHookPrompt(prompt) {
  return /\bhook\b/i.test(String(prompt || ''));
}

/**
 * Small choice cards for hook type — sits to the right of buddy + bubble.
 */
export function HookTypeCards({ theme, value = '', onChange, topic = '' }) {
  return (
    <div
      className="ml-auto grid min-w-0 max-w-md flex-1 grid-cols-2 gap-2 sm:max-w-lg"
      role="group"
      aria-label="Choose a hook type"
    >
      {HOOK_TYPES.map((opt) => {
        const on = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={on}
            className={`edu-control flex min-h-[4.25rem] flex-col items-start gap-0.5 rounded-2xl border-[1.5px] p-2.5 text-left ${
              on
                ? `${theme.colorPrimary} ${theme.colorOnPrimary} ${theme.colorOutline}`
                : `${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`
            }`}
            onClick={() => onChange?.(opt)}
          >
            <span className={TYPE.labelLg}>{opt.label}</span>
            <span
              className={`${TYPE.bodySm} ${
                on ? 'opacity-90' : theme.colorOnSurfaceVariant
              }`}
            >
              {opt.blurb}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function hookPlaceholder(hookTypeId, topic) {
  const opt = HOOK_TYPES.find((h) => h.id === hookTypeId);
  if (!opt) return 'Start writing…';
  const sample = opt.example(String(topic || 'this topic').trim() || 'this topic');
  if (opt.id === 'other') return 'Write your own hook…';
  return sample || 'Start writing…';
}
