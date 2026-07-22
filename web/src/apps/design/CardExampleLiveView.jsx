import { MoreHorizontal, Save, Timer, Trash2, Users } from 'lucide-react';
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
 * Edu.Design — live product-shaped card examples (not layout tokens).
 * Card Types = chrome; Card Styles = fills; Examples = composed patterns in use.
 */
export function CardExampleLiveView({ example, isDarkMode, theme }) {
  const surface = `${theme.colorSurface} ${theme.colorOutline}`;
  const surfaceVariant = `${theme.colorSurfaceVariant} ${theme.colorOutlineVariant}`;
  const muted = theme.colorOnSurfaceVariant;
  const title = theme.colorOnSurface;
  const body = isDarkMode ? 'text-slate-300' : 'text-slate-600';

  if (example === 'Cards With Headers') {
    const samples = [
      {
        title: 'Primary header',
        note: 'colorPrimary · colorOnPrimary',
        headerClass: `${theme.colorPrimary} ${theme.colorOnPrimary}`,
        body: 'Solid primary band with on-primary text — strongest header emphasis.',
      },
      {
        title: 'Primary container',
        note: 'colorPrimaryContainer · colorOnPrimaryContainer',
        headerClass: `${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`,
        body: 'Softer primary tint — Groups default. Bleed with -mx / -mt, then pad the body below.',
      },
      {
        title: 'Quiet header',
        note: 'colorSurfaceVariant · soft band',
        headerClass: `${surfaceVariant} ${title}`,
        body: 'Use when the card needs a titled band without primary emphasis.',
      },
      {
        title: 'Header + action',
        note: 'Title left · control right',
        headerClass: `${theme.colorPrimary} ${theme.colorOnPrimary}`,
        body: 'Keep one short title. Put overflow actions in the header, not a second headline.',
        action: true,
      },
      {
        title: 'White header',
        note: 'colorSurface · border-b',
        headerClass: `${theme.colorSurface} ${title}`,
        body: 'Same fill as the body — use a divider so the header still reads as a band.',
        divider: true,
      },
    ];

    return (
      <div className={`relative ${APP_MAX_WIDTH} ${APP_PAGE_BOTTOM}`}>
        <p className={`${TYPE.bodySm} mb-4 ${muted}`}>
          Grid cards with a flush header band — Groups pattern. Header is{' '}
          <code className="font-mono">shrink-0</code>; body sits below. White headers need a
          border because the fill matches the card.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {samples.map((card) => (
            <div
              key={card.title}
              className={`${APP_GRID_CARD} ${surface} p-5 min-h-[150px] flex flex-col`}
            >
              <div
                className={`flex items-center justify-between gap-2 -mx-5 -mt-5 mb-4 px-5 py-3 rounded-t-2xl ${
                  card.divider ? `border-b ${theme.colorOutline}` : ''
                } ${card.headerClass}`}
              >
                <h3 className={TYPE.titleMd}>{card.title}</h3>
                {card.action ? (
                  <button
                    type="button"
                    className={`edu-control p-1.5 rounded-lg opacity-90 hover:opacity-100 hover:bg-white/15 ${theme.colorOnPrimary}`}
                    title="More"
                    aria-label="More"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                ) : null}
              </div>
              <p className={`${TYPE.bodySm} font-mono ${muted}`}>{card.note}</p>
              <p className={`${TYPE.bodySm} mt-2 flex-1 ${body}`}>{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (example === 'Library card') {
    const boards = [
      { name: 'Hello World', pages: 1, date: '7/20/2026' },
      { name: 'Period 3 warm-up', pages: 3, date: '7/18/2026' },
      { name: 'Staff meeting notes', pages: 2, date: '7/12/2026' },
    ];

    return (
      <div className={`relative ${APP_MAX_WIDTH} ${APP_PAGE_BOTTOM}`}>
        <p className={`${TYPE.bodySm} mb-4 ${muted}`}>
          Saved Whiteboards–style library card — title, meta, Open / Delete.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <div
              key={board.name}
              className={`${APP_GRID_CARD} ${surface} p-4 flex flex-col gap-3`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <span
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${surfaceVariant} ${theme.text}`}
                >
                  <Save size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`${TYPE.titleSm} truncate ${title}`}>{board.name}</p>
                  <p className={`${TYPE.labelMicro} mt-1 ${muted}`}>
                    {board.pages} page{board.pages === 1 ? '' : 's'} · {board.date}
                  </p>
                </div>
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
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (example === 'Tool grid card') {
    return (
      <div className={`relative ${APP_MAX_WIDTH} ${APP_PAGE_BOTTOM}`}>
        <p className={`${TYPE.bodySm} mb-4 ${muted}`}>
          Timer / tool grid card — content-sized, primary action, quiet meta.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {['Focus block', 'Transition', 'Cleanup'].map((label, i) => (
            <div
              key={label}
              className={`${APP_GRID_CARD} ${surface} p-5 flex flex-col gap-4`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
                >
                  <Timer size={18} />
                </span>
                <div className="min-w-0">
                  <p className={`${TYPE.titleSm} ${title}`}>{label}</p>
                  <p className={`${TYPE.bodySm} font-mono ${muted}`}>
                    {i === 0 ? '05:00' : i === 1 ? '01:30' : '00:45'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={`edu-control w-full px-3 py-2.5 rounded-xl ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
              >
                Start
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (example === 'Group card') {
    const groups = [
      { title: 'Group A', names: ['Maya Chen', 'Jordan Lee', 'Sam Rivera'] },
      { title: 'Group B', names: ['Alex Kim', 'Taylor Brooks'] },
      { title: 'Group C', names: [] },
    ];

    return (
      <div className={`relative ${APP_MAX_WIDTH} ${APP_PAGE_BOTTOM}`}>
        <p className={`${TYPE.bodySm} mb-4 ${muted}`}>
          Groups-style card — primary-container header band + student list.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <div
              key={group.title}
              className={`${APP_GRID_CARD} ${surface} p-5 min-h-[150px] flex flex-col`}
            >
              <div
                className={`flex items-center justify-between -mx-5 -mt-5 mb-4 px-5 py-3 rounded-t-2xl ${theme.colorPrimaryContainer}`}
              >
                <h3 className={`${TYPE.titleMd} ${theme.colorOnPrimaryContainer}`}>
                  {group.title}
                </h3>
                <Users size={16} className={theme.colorOnPrimaryContainer} />
              </div>
              <div className="space-y-1 flex-1">
                {group.names.map((name) => (
                  <div
                    key={name}
                    className={`flex items-center gap-2.5 p-1.5 -mx-1.5 rounded-lg ${TYPE.bodyMd} ${body}`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${TYPE.labelMd} ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
                    >
                      {name.charAt(0)}
                    </span>
                    {name}
                  </div>
                ))}
                {group.names.length === 0 ? (
                  <div
                    className={`h-full flex items-center justify-center italic py-4 ${TYPE.bodySm} ${muted}`}
                  >
                    Drop student here
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (example === 'Choice card') {
    return (
      <div className={`relative ${APP_MAX_WIDTH} ${APP_PAGE_BOTTOM}`}>
        <div className={`${APP_SCROLL_BOARD} ${APP_BOARD_PAD} ${surface}`}>
          <p className={`${TYPE.titleSm} ${title}`}>Choice cards</p>
          <p className={`${TYPE.bodySm} font-mono mt-0.5 ${muted}`}>
            Nested panels inside a board — pick one
          </p>
          <div className="mt-4 space-y-3">
            {[
              {
                label: 'Download this page',
                desc: 'Save the current canvas as a PNG.',
                active: false,
              },
              {
                label: 'Save to Saved Whiteboards',
                desc: 'Keep every page of this whiteboard in Edu.Hub.',
                active: true,
              },
            ].map((choice) => (
              <button
                key={choice.label}
                type="button"
                className={`edu-control w-full flex items-start gap-3 p-4 text-left transition-colors ${APP_NESTED_CARD} ${
                  choice.active
                    ? `${theme.colorPrimaryContainer} ${theme.colorOutline} ${theme.colorOnSurface}`
                    : `${surfaceVariant} ${muted} ${theme.hoverBg}`
                }`}
              >
                <span
                  className={`mt-0.5 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    choice.active
                      ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                      : surfaceVariant
                  }`}
                >
                  <Save size={18} />
                </span>
                <span className="min-w-0">
                  <span className={`block ${TYPE.titleSm} ${title}`}>{choice.label}</span>
                  <span className={`block mt-0.5 ${TYPE.bodySm} ${muted}`}>
                    {choice.desc}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty waiting
  return (
    <div className={`relative ${APP_MAX_WIDTH} ${APP_PAGE_BOTTOM}`}>
      <div className={`${APP_SCROLL_BOARD} ${APP_BOARD_PAD} ${surface}`}>
        <p className={`${TYPE.titleSm} mb-4 ${title}`}>Board</p>
        <div
          className={`${APP_EMPTY_SLOT} p-6 min-h-[12rem] flex flex-col items-center justify-center gap-1.5 ${theme.colorOutline} ${muted}`}
        >
          <p className={TYPE.labelMicro}>Empty slot</p>
          <p className={`${TYPE.bodySm} text-center max-w-[16rem]`}>
            Pin a widget or use the FAB to add the next card
          </p>
        </div>
      </div>
    </div>
  );
}
