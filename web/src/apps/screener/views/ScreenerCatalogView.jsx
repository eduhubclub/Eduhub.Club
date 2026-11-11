import { SpellCheck } from 'lucide-react';
import { AppBoard } from '../../../shared/AppBoard';
import { AppPageShell } from '../../../shared/AppPageShell';
import { ContentCardGrid } from '../../../shared/ContentCardGrid';
import { PageHeader } from '../../../shared/PageHeader';
import { TYPE } from '../../../shared/typography';
import { SCREENERS } from '../catalog';

export function ScreenerCatalogView({ theme, isDarkMode, onOpen }) {
  return (
    <AppPageShell variant="scroll">
      <PageHeader
        title="Screeners"
        description="Classroom screeners in one place. Start LETRS Spelling now — more screeners can live on this board."
        isDarkMode={isDarkMode}
      />
      <ContentCardGrid>
        {SCREENERS.map((item) => {
          const Icon = item.icon || SpellCheck;
          return (
            <AppBoard key={item.id} mode="grid" theme={theme} className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <h2 className={TYPE.titleMd}>{item.name}</h2>
                <Icon size={22} className={theme.text} aria-hidden="true" />
              </div>
              <p
                className={`mt-1 inline-flex self-start rounded-full px-2.5 py-1 ${TYPE.labelSm} ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
              >
                {item.audience}
              </p>
              <p className={`mt-3 flex-1 ${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
                {item.summary}
              </p>
              <button
                type="button"
                onClick={() => onOpen(item.id)}
                className={`edu-control mt-4 self-start rounded-xl px-4 py-2.5 ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
              >
                Start
              </button>
            </AppBoard>
          );
        })}
      </ContentCardGrid>
    </AppPageShell>
  );
}
