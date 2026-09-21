import { Plus, RotateCcw, Settings2 } from 'lucide-react';
import { AppBoard } from '../../shared/AppBoard';
import { AppFab } from '../../shared/AppFab';
import { AppPageShell } from '../../shared/AppPageShell';
import { ButtonRow } from '../../shared/ButtonRow';
import { PageBackLink } from '../../shared/PageBackLink';
import { PageHeader } from '../../shared/PageHeader';
import { toolBtnClass } from '../../shared/toolBtn';
import { TYPE } from '../../shared/typography';

/**
 * Edu.Design — full page chrome in the real shell:
 * PageBackLink → PageHeader → ButtonRow → board card → circle FAB.
 *
 * PageHeader is for page-shaped screens only. Widget/stage tools omit it
 * (toolbar + board); app explanations live in Hub Apps → Description.
 */
export function AppLayoutPatternView({ isDarkMode, theme, isLeft }) {
  const muted = isDarkMode ? 'text-slate-500' : 'text-slate-400';
  const title = isDarkMode ? 'text-white' : 'text-slate-900';
  const body = isDarkMode ? 'text-slate-300' : 'text-slate-600';
  const toolBtn = toolBtnClass(isDarkMode);

  return (
    <AppPageShell variant="scroll">
      <PageBackLink
        label="Patterns"
        isDarkMode={isDarkMode}
        onClick={() => {}}
      />

      <PageHeader
        title="App Layout"
        description="Page-shaped stack: back link, header, toolbar, board, FAB. Stage tools skip the header."
        isDarkMode={isDarkMode}
      />

      <ButtonRow>
        <button type="button" className={`${toolBtn} disabled:opacity-50`} disabled>
          <RotateCcw size={16} strokeWidth={2.5} />
          Reset
        </button>
        <button type="button" className={toolBtn}>
          <Settings2 size={16} strokeWidth={2.5} />
          Settings
        </button>
      </ButtonRow>

      <AppBoard mode="scroll" pad="board" theme={theme}>
        <p className={`${TYPE.titleSm} ${title}`}>Board</p>
        <p className={`${TYPE.bodySm} font-mono mt-0.5 ${muted}`}>
          AppBoard · mode=scroll · pad=board
        </p>
        <p className={`${TYPE.bodyMd} mt-3 ${body}`}>
          Primary content lives on a scrolling board. Shell edge scroll clears the FAB (
          <code className={`font-mono ${TYPE.bodySm}`}>pb-24</code>).
        </p>
        <div className={`mt-6 space-y-3 ${TYPE.bodyMd} ${body}`}>
          <p>Sample rows so the stack reads like a real tool.</p>
          <div className="h-24 rounded-xl border border-dashed opacity-40" aria-hidden />
          <div className="h-24 rounded-xl border border-dashed opacity-40" aria-hidden />
        </div>
      </AppBoard>

      <AppFab isLeft={isLeft} theme={theme} aria-label="Primary action">
        <Plus size={24} strokeWidth={2.5} />
      </AppFab>
    </AppPageShell>
  );
}
