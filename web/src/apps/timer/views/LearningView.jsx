import { Library } from 'lucide-react';
import { APP_EMPTY_SLOT } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';

/** Placeholder for future interactive teaching clock. */
export function LearningView({ isDarkMode, theme }) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-20 ${APP_EMPTY_SLOT} mt-6 ${
        isDarkMode
          ? `${theme.colorOutline} ${theme.colorOnSurfaceVariant}`
          : `${theme.colorOutlineVariant} ${theme.colorOnSurfaceVariant}`
      }`}
    >
      <Library size={48} className="mx-auto mb-4 opacity-50" />
      <h3 className={`${TYPE.titleLg} mb-2 ${theme.colorOnSurface}`}>Learning Clock</h3>
      <p className={`${TYPE.bodyMd} max-w-md`}>
        The interactive teaching clock will go here.
      </p>
    </div>
  );
}
