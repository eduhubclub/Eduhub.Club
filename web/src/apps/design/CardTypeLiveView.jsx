import { useState } from 'react';
import {
  APP_BOARD_BODY_SCROLL,
  APP_BOARD_MAX_WIDTH,
  APP_BOARD_MAX_WIDTH_MD,
  APP_BOARD_MAX_WIDTH_SM,
  APP_BOARD_PAD,
  APP_EMPTY_SLOT,
  APP_GRID_CARD,
  APP_MULTI_BOARD,
  APP_MULTI_BOARD_FULL,
  APP_NESTED_CARD,
  APP_MAX_WIDTH,
  APP_PAGE_BOTTOM,
  APP_SCROLL_BOARD,
  APP_SCROLL_BOTTOM,
  APP_STAGE_PAD,
  APP_STAGE_SHELL,
  APP_STATIC_BOARD,
  APP_STATIC_BOARD_MD,
  APP_STATIC_BOARD_SM,
} from '../../shared/layout';
import { TYPE } from '../../shared/typography';

const GRID_DEMO_CARDS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

const INTERNAL_SCROLL_TABLE_ROWS = [
  { role: 'Title Small', token: 'TYPE.titleSm', sample: 'Almost before we knew it' },
  { role: 'Body Medium', token: 'TYPE.bodyMd', sample: 'Supporting sentence under a title.' },
  { role: 'Label Large', token: 'TYPE.labelLg', sample: 'Primary action' },
  { role: 'Label Micro', token: 'TYPE.labelMicro', sample: 'SECTION LABEL' },
  { role: 'Body Small', token: 'TYPE.bodySm', sample: 'Captions and helper copy.' },
  { role: 'Title Medium', token: 'TYPE.titleMd', sample: 'Board heading' },
  { role: 'Title Large', token: 'TYPE.titleLg', sample: 'Page heading' },
  { role: 'Label Medium', token: 'TYPE.labelMd', sample: 'Chip label' },
];

/** Mix of full-viewport and content-sized boards in one vertical stack. */
const MULTI_BOARD_DEMO = [
  {
    label: 'A',
    size: 'full',
    blurb: 'Full content-viewport height — same footprint as a static board.',
  },
  {
    label: 'B',
    size: 'compact',
    blurb: 'Smaller board — height follows this short copy.',
  },
  {
    label: 'C',
    size: 'medium',
    blurb:
      'Medium board — still content-sized, with a bit more room for supporting detail under the title.',
  },
  {
    label: 'D',
    size: 'full',
    blurb: 'Another full static board. Mix sizes freely in the same scroll stack.',
  },
];

/** Live grid demo — slider sets minimum cards per row. */
function GridCardLiveDemo({ isDarkMode, theme }) {
  const [minPerRow, setMinPerRow] = useState(3);
  const muted = isDarkMode ? 'text-slate-500' : 'text-slate-400';
  const title = isDarkMode ? 'text-white' : 'text-slate-900';
  const body = isDarkMode ? 'text-slate-300' : 'text-slate-600';
  const surface = `${theme.colorSurface} ${theme.colorOutline}`;
  const track = isDarkMode ? 'bg-slate-700' : 'bg-slate-200';

  return (
    <div className={`relative ${APP_MAX_WIDTH} ${APP_SCROLL_BOTTOM}`}>
      <div
        className={`mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 ${
          isDarkMode ? 'text-slate-300' : 'text-slate-700'
        }`}
      >
        <label htmlFor="grid-min-per-row" className={`${TYPE.titleSm} shrink-0`}>
          Min cards / row
        </label>
        <input
          id="grid-min-per-row"
          type="range"
          min={1}
          max={6}
          step={1}
          value={minPerRow}
          onChange={(e) => setMinPerRow(Number(e.target.value))}
          className={`flex-1 min-w-[10rem] max-w-xs h-1.5 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0
            [&::-webkit-slider-thumb]:bg-current
            [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-current
            ${theme.text} ${track}`}
          aria-valuemin={1}
          aria-valuemax={6}
          aria-valuenow={minPerRow}
          aria-label="Minimum cards per row"
        />
        <span className={`${TYPE.titleSm} font-mono tabular-nums w-6 ${theme.text}`}>
          {minPerRow}
        </span>
      </div>

      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${minPerRow}, minmax(0, 1fr))` }}
      >
        {GRID_DEMO_CARDS.map((label) => (
          <div key={label} className={`${APP_GRID_CARD} p-4 sm:p-5 ${surface}`}>
            <p className={`${TYPE.titleSm} ${title}`}>Grid card {label}</p>
            <p className={`${TYPE.bodySm} font-mono mt-0.5 ${muted}`}>APP_GRID_CARD</p>
            <p className={`${TYPE.bodySm} mt-2 ${body}`}>
              Fits content · {minPerRow} / row
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Edu.Design — one live page per card type.
 * These views sit in the real AppShell — no nested “guide shell” chrome.
 * The card itself is the demo.
 */
export function CardTypeLiveView({ cardType, isDarkMode, theme }) {
  const muted = isDarkMode ? 'text-slate-500' : 'text-slate-400';
  const title = isDarkMode ? 'text-white' : 'text-slate-900';
  const body = isDarkMode ? 'text-slate-300' : 'text-slate-600';
  const nestedFill = isDarkMode
    ? 'bg-slate-800/60 border-slate-600'
    : 'bg-slate-50 border-slate-200';
  const emptyFill = isDarkMode
    ? 'border-slate-600 text-slate-500'
    : 'border-slate-300 text-slate-400';
  const surface = `${theme.colorSurface} ${theme.colorOutline}`;

  if (cardType === 'Static board') {
    return (
      <div className={APP_STAGE_SHELL}>
        <div className={`${APP_STATIC_BOARD} ${APP_BOARD_PAD} ${surface}`}>
          <p className={`${TYPE.titleSm} ${title}`}>Static board</p>
          <p className={`${TYPE.bodySm} font-mono mt-0.5 ${muted}`}>
            APP_STATIC_BOARD · {APP_BOARD_MAX_WIDTH} · {APP_BOARD_PAD}
          </p>
          <p className={`${TYPE.bodyMd} mt-3 ${body}`}>
            Fills the available content height and width (up to max-w-7xl). Default inner
            pad is APP_BOARD_PAD; dense stage tools use APP_STAGE_PAD (
            <code className="font-mono">{APP_STAGE_PAD}</code>).
          </p>
          <div className="mt-auto pt-4 flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center h-8 px-3 rounded-lg ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
            >
              Primary
            </span>
            <span
              className={`inline-flex items-center h-8 px-3 rounded-lg ${TYPE.labelMd} border ${
                isDarkMode ? 'border-slate-600 text-slate-300' : 'border-slate-300 text-slate-600'
              }`}
            >
              Secondary
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (cardType === 'Static medium') {
    return (
      <div className={APP_STAGE_SHELL}>
        <div className={`${APP_STATIC_BOARD_MD} ${APP_BOARD_PAD} ${surface}`}>
          <p className={`${TYPE.titleSm} ${title}`}>Static medium</p>
          <p className={`${TYPE.bodySm} font-mono mt-0.5 ${muted}`}>
            APP_STATIC_BOARD_MD · {APP_BOARD_MAX_WIDTH_MD} · {APP_BOARD_PAD}
          </p>
          <p className={`${TYPE.bodyMd} mt-3 ${body}`}>
            Same height lock and chrome as a full static board, centered at a fixed medium
            width. Use for stage widgets that look stretched at full shell width.
          </p>
          <div className="mt-auto pt-4 flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center h-8 px-3 rounded-lg ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
            >
              Primary
            </span>
            <span
              className={`inline-flex items-center h-8 px-3 rounded-lg ${TYPE.labelMd} border ${
                isDarkMode ? 'border-slate-600 text-slate-300' : 'border-slate-300 text-slate-600'
              }`}
            >
              Secondary
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (cardType === 'Static small') {
    return (
      <div className={APP_STAGE_SHELL}>
        <div className={`${APP_STATIC_BOARD_SM} ${APP_BOARD_PAD} ${surface}`}>
          <p className={`${TYPE.titleSm} ${title}`}>Static small</p>
          <p className={`${TYPE.bodySm} font-mono mt-0.5 ${muted}`}>
            APP_STATIC_BOARD_SM · {APP_BOARD_MAX_WIDTH_SM} · {APP_BOARD_PAD}
          </p>
          <p className={`${TYPE.bodyMd} mt-3 ${body}`}>
            Compact centered stage board — single-focus tools that need less horizontal room.
          </p>
          <div className="mt-auto pt-4 flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center h-8 px-3 rounded-lg ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
            >
              Primary
            </span>
            <span
              className={`inline-flex items-center h-8 px-3 rounded-lg ${TYPE.labelMd} border ${
                isDarkMode ? 'border-slate-600 text-slate-300' : 'border-slate-300 text-slate-600'
              }`}
            >
              Secondary
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (cardType === 'Scrolling board') {
    return (
      <div className={`relative ${APP_MAX_WIDTH} ${APP_PAGE_BOTTOM}`}>
        <div className={`${APP_SCROLL_BOARD} ${APP_BOARD_PAD} ${surface}`}>
          <p className={`${TYPE.titleSm} ${title}`}>Scrolling board</p>
          <p className={`${TYPE.bodySm} font-mono mt-0.5 ${muted}`}>
            APP_SCROLL_BOARD · {APP_BOARD_MAX_WIDTH} · {APP_BOARD_PAD}
          </p>
          <p className={`${TYPE.bodyMd} mt-3 ${body}`}>
            Same chrome as a static board. Height follows content.
          </p>
          <div className={`mt-8 space-y-4 ${TYPE.bodyMd} ${body}`}>
            <p>Content continues below so the board grows past the viewport.</p>
            <div className="h-36 rounded-xl border border-dashed opacity-40" aria-hidden />
            <div className="h-36 rounded-xl border border-dashed opacity-40" aria-hidden />
            <div className="h-36 rounded-xl border border-dashed opacity-40" aria-hidden />
          </div>
        </div>
      </div>
    );
  }

  if (cardType === 'Internal scroll') {
    const th = `${TYPE.labelMicro} text-left px-3 py-2 whitespace-nowrap ${muted}`;
    const td = `${TYPE.bodySm} px-3 py-2.5 whitespace-nowrap ${body}`;

    return (
      <div className={APP_STAGE_SHELL}>
        <div className={`${APP_STATIC_BOARD} ${surface}`}>
          <div
            className={`shrink-0 px-5 sm:px-6 py-4 border-b ${theme.colorOutline}`}
          >
            <p className={`${TYPE.titleSm} ${title}`}>Internal scroll</p>
            <p className={`${TYPE.bodySm} font-mono mt-0.5 ${muted}`}>
              APP_STATIC_BOARD · APP_BOARD_BODY_SCROLL
            </p>
            <p className={`${TYPE.bodySm} mt-2 max-w-2xl ${body}`}>
              Board stays viewport-locked. Body scrolls under this header — vertically for
              long content, horizontally for wide tables.
            </p>
          </div>

          <div className={`${APP_BOARD_BODY_SCROLL} ${APP_BOARD_PAD}`}>
            <p className={`${TYPE.titleSm} mb-3 ${title}`}>Wide type table</p>
            <div className={`rounded-xl border ${theme.colorOutline}`}>
              <table className="w-full min-w-[42rem] border-collapse text-left">
                <thead className={`border-b ${theme.colorOutline}`}>
                  <tr>
                    <th className={th}>Role</th>
                    <th className={th}>Token</th>
                    <th className={th}>Sample</th>
                    <th className={th}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {INTERNAL_SCROLL_TABLE_ROWS.map((row) => (
                    <tr
                      key={row.role}
                      className={`border-b last:border-b-0 ${theme.colorOutline}`}
                    >
                      <td className={`${td} ${title}`}>{row.role}</td>
                      <td className={`${td} font-mono ${muted}`}>{row.token}</td>
                      <td className={td}>{row.sample}</td>
                      <td className={`${td} ${muted}`}>
                        Scroll stays inside the board — not the shell edge.
                      </td>
                    </tr>
                  ))}
                  {INTERNAL_SCROLL_TABLE_ROWS.map((row) => (
                    <tr
                      key={`${row.role}-dup`}
                      className={`border-b last:border-b-0 ${theme.colorOutline}`}
                    >
                      <td className={`${td} ${title}`}>{row.role}</td>
                      <td className={`${td} font-mono ${muted}`}>{row.token}</td>
                      <td className={td}>{row.sample}</td>
                      <td className={`${td} ${muted}`}>
                        Extra rows so vertical scroll is obvious.
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={`mt-6 space-y-3 ${TYPE.bodyMd} ${body}`}>
              <p>Use when chrome (title, tabs, filters) must stay put while content moves.</p>
              <div className="h-28 rounded-xl border border-dashed opacity-40" aria-hidden />
              <div className="h-28 rounded-xl border border-dashed opacity-40" aria-hidden />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cardType === 'Multi board scroll') {
    return (
      <div className={`relative ${APP_MAX_WIDTH} ${APP_SCROLL_BOTTOM} flex flex-col gap-4`}>
        {MULTI_BOARD_DEMO.map((board) => {
          const isFull = board.size === 'full';
          const sizeNote = isFull
            ? 'APP_MULTI_BOARD + APP_MULTI_BOARD_FULL'
            : 'APP_MULTI_BOARD · content height';

          return (
            <div
              key={board.label}
              className={`${APP_MULTI_BOARD} ${isFull ? APP_MULTI_BOARD_FULL : ''} ${APP_BOARD_PAD} ${surface}`}
            >
              <p className={`${TYPE.titleSm} ${title}`}>Board {board.label}</p>
              <p className={`${TYPE.bodySm} font-mono mt-0.5 ${muted}`}>{sizeNote}</p>
              <p className={`${TYPE.bodyMd} mt-3 max-w-xl ${body}`}>{board.blurb}</p>
              {board.size === 'medium' ? (
                <div className="mt-4 h-20 rounded-xl border border-dashed opacity-40" aria-hidden />
              ) : null}
              <div className={`${isFull ? 'mt-auto' : 'mt-4'} pt-4 flex flex-wrap gap-2`}>
                <span
                  className={`inline-flex items-center h-8 px-3 rounded-lg ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
                >
                  Primary
                </span>
                <span
                  className={`inline-flex items-center h-8 px-3 rounded-lg ${TYPE.labelMd} border ${
                    isDarkMode ? 'border-slate-600 text-slate-300' : 'border-slate-300 text-slate-600'
                  }`}
                >
                  Secondary
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (cardType === 'Grid card') {
    return <GridCardLiveDemo isDarkMode={isDarkMode} theme={theme} />;
  }

  if (cardType === 'Nested card') {
    return (
      <div className={`relative ${APP_MAX_WIDTH} ${APP_PAGE_BOTTOM}`}>
        <div className={`${APP_SCROLL_BOARD} ${APP_BOARD_PAD} space-y-3 ${surface}`}>
          <p className={`${TYPE.titleSm} ${title}`}>Board</p>
          <p className={`${TYPE.bodySm} font-mono mt-0.5 ${muted}`}>Host surface</p>
          <div className={`${APP_NESTED_CARD} p-4 ${nestedFill}`}>
            <p className={`${TYPE.titleSm} ${theme.text}`}>Nested card</p>
            <p className={`${TYPE.bodySm} font-mono mt-1 ${muted}`}>{APP_NESTED_CARD}</p>
            <p className={`${TYPE.bodySm} mt-2 ${body}`}>Compact label + one supporting caption.</p>
          </div>
          <div className={`${APP_NESTED_CARD} p-4 ${nestedFill}`}>
            <p className={`${TYPE.titleSm} ${theme.text}`}>Another nested panel</p>
            <p className={`${TYPE.bodySm} mt-2 ${body}`}>
              Same radius and soft fill — never invent a third.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${APP_MAX_WIDTH} ${APP_PAGE_BOTTOM}`}>
      <div className={`${APP_SCROLL_BOARD} ${APP_BOARD_PAD} ${surface}`}>
        <p className={`${TYPE.titleSm} mb-4 ${title}`}>Board</p>
        <div
          className={`${APP_EMPTY_SLOT} p-6 min-h-[10rem] flex flex-col items-center justify-center gap-1.5 ${emptyFill}`}
        >
          <p className={TYPE.labelMicro}>Empty slot</p>
          <p className={`${TYPE.bodySm} text-center max-w-[14rem] ${muted}`}>
            Short prompt for the next action
          </p>
          <p className={`${TYPE.bodySm} font-mono mt-3 ${muted}`}>{APP_EMPTY_SLOT}</p>
        </div>
      </div>
    </div>
  );
}
