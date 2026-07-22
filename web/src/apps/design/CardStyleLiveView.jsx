import {
  APP_BOARD_PAD,
  APP_EMPTY_SLOT,
  APP_GRID_CARD,
  APP_MAX_WIDTH,
  APP_NESTED_CARD,
  APP_PAGE_BOTTOM,
  APP_SCROLL_BOARD,
} from '../../shared/layout';
import { TYPE } from '../../shared/typography';

/**
 * Edu.Design — Card Styles live pages.
 * Maps Material 3 card guidelines to Edu.Hub tokens (outlined default; no elevation).
 * @see https://m3.material.io/components/cards/guidelines
 * @see https://m3.material.io/components/cards/accessibility
 */
export function CardStyleLiveView({ cardStyle, isDarkMode, theme }) {
  const muted = theme.colorOnSurfaceVariant;
  const title = theme.colorOnSurface;
  const body = isDarkMode ? 'text-slate-300' : 'text-slate-600';
  const surface = `${theme.colorSurface} ${theme.colorOutline}`;
  const surfaceVariant = `${theme.colorSurfaceVariant} ${theme.colorOutlineVariant}`;

  if (cardStyle === 'Outlined') {
    return (
      <div className={`relative ${APP_MAX_WIDTH} ${APP_PAGE_BOTTOM}`}>
        <p className={`${TYPE.bodySm} mb-4 max-w-2xl ${muted}`}>
          M3 <span className={TYPE.titleSm}>outlined</span> — Edu.Hub default. Visual boundary
          via <code className="font-mono">border-[1.5px]</code> +{' '}
          <code className="font-mono">colorOutline</code>. No shadow.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={`${APP_GRID_CARD} p-4 sm:p-5 ${surface}`}
              role="group"
              aria-labelledby={`outlined-card-title-${n}`}
            >
              <p id={`outlined-card-title-${n}`} className={`${TYPE.titleSm} ${title}`}>
                Outlined card {n}
              </p>
              <p className={`${TYPE.bodySm} font-mono mt-0.5 ${muted}`}>
                APP_GRID_CARD · colorSurface · colorOutline
              </p>
              <p className={`${TYPE.bodySm} mt-2 ${body}`}>
                One subject per card — headline, supporting line, then body.
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (cardStyle === 'Filled') {
    return (
      <div className={`relative ${APP_MAX_WIDTH} ${APP_PAGE_BOTTOM}`}>
        <p className={`${TYPE.bodySm} mb-4 max-w-2xl ${muted}`}>
          M3 <span className={TYPE.titleSm}>filled</span> — softer separation with{' '}
          <code className="font-mono">colorSurfaceVariant</code>. Use inside a host board, or when
          outline emphasis is too strong. Still no elevation.
        </p>
        <div className={`${APP_SCROLL_BOARD} ${APP_BOARD_PAD} ${surface}`}>
          <p className={`${TYPE.titleSm} ${title}`}>Host board</p>
          <p className={`${TYPE.bodySm} font-mono mt-0.5 ${muted}`}>
            colorSurface · colorOutline
          </p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2].map((n) => (
              <div
                key={n}
                className={`${APP_GRID_CARD} p-4 ${surfaceVariant}`}
                role="group"
                aria-labelledby={`filled-card-title-${n}`}
              >
                <p id={`filled-card-title-${n}`} className={`${TYPE.titleSm} ${title}`}>
                  Filled card {n}
                </p>
                <p className={`${TYPE.bodySm} font-mono mt-0.5 ${muted}`}>
                  colorSurfaceVariant · colorOutlineVariant
                </p>
                <p className={`${TYPE.bodySm} mt-2 ${body}`}>
                  Same legibility as outlined — choose by emphasis, not by meaning.
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (cardStyle === 'Nested fill') {
    return (
      <div className={`relative ${APP_MAX_WIDTH} ${APP_PAGE_BOTTOM}`}>
        <div className={`${APP_SCROLL_BOARD} ${APP_BOARD_PAD} space-y-3 ${surface}`}>
          <p className={`${TYPE.titleSm} ${title}`}>Board</p>
          <p className={`${TYPE.bodySm} font-mono mt-0.5 ${muted}`}>Host surface</p>
          <div className={`${APP_NESTED_CARD} p-4 ${surfaceVariant}`}>
            <p className={`${TYPE.titleSm} ${theme.text}`}>Nested card</p>
            <p className={`${TYPE.bodySm} font-mono mt-1 ${muted}`}>{APP_NESTED_CARD}</p>
            <p className={`${TYPE.bodySm} mt-2 ${body}`}>
              Soft fill + rounded-xl — never invent a third radius.
            </p>
          </div>
          <div className={`${APP_NESTED_CARD} p-4 ${surfaceVariant}`}>
            <p className={`${TYPE.titleSm} ${theme.text}`}>Another nested panel</p>
            <p className={`${TYPE.bodySm} mt-2 ${body}`}>
              Options, slots, and secondary panels inside a board.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (cardStyle === 'Empty slot') {
    return (
      <div className={`relative ${APP_MAX_WIDTH} ${APP_PAGE_BOTTOM}`}>
        <div className={`${APP_SCROLL_BOARD} ${APP_BOARD_PAD} ${surface}`}>
          <p className={`${TYPE.titleSm} mb-4 ${title}`}>Board</p>
          <div
            className={`${APP_EMPTY_SLOT} p-6 min-h-[10rem] flex flex-col items-center justify-center gap-1.5 ${theme.colorOutline} ${muted}`}
            role="status"
          >
            <p className={TYPE.labelMicro}>Empty slot</p>
            <p className={`${TYPE.bodySm} text-center max-w-[14rem]`}>
              Short prompt for the next action
            </p>
            <p className={`${TYPE.bodySm} font-mono mt-3`}>{APP_EMPTY_SLOT}</p>
          </div>
        </div>
      </div>
    );
  }

  if (cardStyle === 'Content hierarchy') {
    return (
      <div className={`relative ${APP_MAX_WIDTH} ${APP_PAGE_BOTTOM}`}>
        <p className={`${TYPE.bodySm} mb-4 max-w-2xl ${muted}`}>
          M3 anatomy: container → headline → subhead → supporting text → actions. Keep one
          title; don’t stack competing headlines.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            className={`${APP_GRID_CARD} p-4 sm:p-5 ${surface}`}
            role="group"
            aria-labelledby="hierarchy-title-1"
          >
            <p id="hierarchy-title-1" className={`${TYPE.titleSm} ${title}`}>
              Headline
            </p>
            <p className={`${TYPE.bodySm} mt-0.5 ${muted}`}>Subhead / supporting meta</p>
            <p className={`${TYPE.bodyMd} mt-3 ${body}`}>
              Supporting text stays short. Put dense stats elsewhere.
            </p>
          </div>
          <div
            className={`${APP_GRID_CARD} p-4 sm:p-5 ${surface}`}
            role="group"
            aria-labelledby="hierarchy-title-2"
          >
            <p id="hierarchy-title-2" className={`${TYPE.titleSm} ${title}`}>
              Another card
            </p>
            <p className={`${TYPE.labelMicro} mt-1 ${muted}`}>1 PAGE · META</p>
            <p className={`${TYPE.bodySm} mt-3 ${body}`}>
              Metadata under the title when it is short and scannable.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (cardStyle === 'With actions') {
    return (
      <div className={`relative ${APP_MAX_WIDTH} ${APP_PAGE_BOTTOM}`}>
        <p className={`${TYPE.bodySm} mb-4 max-w-2xl ${muted}`}>
          Prefer explicit controls inside the card (
          <code className="font-mono">edu-control</code>) over making the whole card a mystery
          hit target. Actions need visible labels or{' '}
          <code className="font-mono">aria-label</code>.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            className={`${APP_GRID_CARD} p-4 flex flex-col gap-3 ${surface}`}
            role="group"
            aria-labelledby="actions-card-title"
          >
            <div className="min-w-0">
              <p id="actions-card-title" className={`${TYPE.titleSm} truncate ${title}`}>
                Interactive card
              </p>
              <p className={`${TYPE.labelMicro} mt-1 ${muted}`}>Open · Delete</p>
            </div>
            <div className="flex items-center gap-2 mt-auto">
              <button
                type="button"
                className={`edu-control flex-1 px-3 py-2 rounded-xl ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
              >
                Open
              </button>
              <button
                type="button"
                className={`edu-control px-3 py-2 rounded-xl ${TYPE.labelLg} ${muted} ${theme.hoverBg}`}
                aria-label="Delete card"
                title="Delete"
              >
                Delete
              </button>
            </div>
          </div>
          <div className={`${APP_GRID_CARD} p-4 sm:p-5 flex flex-col ${surface}`}>
            <p className={`${TYPE.titleSm} ${title}`}>Board with actions</p>
            <p className={`${TYPE.bodySm} font-mono mt-0.5 ${muted}`}>Footer row</p>
            <p className={`${TYPE.bodySm} mt-2 flex-1 ${body}`}>
              Primary actions use theme primary; secondary stay muted with edu-control.
            </p>
            <div className="mt-4 pt-4 flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center h-8 px-3 rounded-lg ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
              >
                Primary
              </span>
              <span
                className={`inline-flex items-center h-8 px-3 rounded-lg ${TYPE.labelMd} border ${theme.colorOutline} ${body}`}
              >
                Secondary
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Accessibility
  const rules = [
    {
      title: 'One subject',
      detail: 'Each card is about a single subject — don’t mix unrelated jobs.',
    },
    {
      title: 'Text contrast',
      detail:
        'Use colorOnSurface / colorOnSurfaceVariant on surfaces; colorOnPrimary on primary fills. Don’t put muted text on primary headers.',
    },
    {
      title: 'Don’t rely on color alone',
      detail:
        'Selected / active states need more than a tint — label, icon, or border weight.',
    },
    {
      title: 'Name interactive cards',
      detail:
        'role="group" + aria-labelledby (or a visible heading). Icon-only buttons need aria-label.',
    },
    {
      title: 'Keyboard & focus',
      detail:
        'Actions are real buttons with edu-control. Keep focus visible; don’t remove outlines.',
    },
    {
      title: 'Media',
      detail: 'Images and decorative icons need alt text or aria-hidden as appropriate.',
    },
    {
      title: 'Drag & rearrange',
      detail:
        'If cards are draggable, expose equivalent actions for assistive tech (not drag-only).',
    },
  ];

  return (
    <div className={`relative ${APP_MAX_WIDTH} ${APP_PAGE_BOTTOM}`}>
      <div className={`${APP_SCROLL_BOARD} ${APP_BOARD_PAD} ${surface}`}>
        <p className={`${TYPE.titleMd} ${title}`}>Card accessibility</p>
        <p className={`${TYPE.bodySm} font-mono mt-0.5 ${muted}`}>
          m3.material.io/components/cards/accessibility
        </p>
        <p className={`${TYPE.bodyMd} mt-3 max-w-2xl ${body}`}>
          Card contents follow their own a11y rules. Edu.Hub keeps outlined chrome for
          separation without elevation, and uses Material role tokens so text stays readable
          in light and dark mode.
        </p>

        <ul className="mt-6 space-y-3">
          {rules.map((rule) => (
            <li
              key={rule.title}
              className={`${APP_NESTED_CARD} p-4 ${surfaceVariant}`}
            >
              <p className={`${TYPE.titleSm} ${title}`}>{rule.title}</p>
              <p className={`${TYPE.bodySm} mt-1 ${body}`}>{rule.detail}</p>
            </li>
          ))}
        </ul>

        <div
          className={`mt-6 ${APP_GRID_CARD} p-4 ${surface}`}
          role="group"
          aria-labelledby="a11y-demo-title"
        >
          <p id="a11y-demo-title" className={`${TYPE.titleSm} ${title}`}>
            Example labeled group
          </p>
          <p className={`${TYPE.bodySm} mt-1 ${muted}`}>
            This card uses <code className="font-mono">role=&quot;group&quot;</code> and{' '}
            <code className="font-mono">aria-labelledby</code> pointing at the headline.
          </p>
          <button
            type="button"
            className={`edu-control mt-4 px-3 py-2 rounded-xl ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
          >
            Primary action
          </button>
        </div>
      </div>
    </div>
  );
}
