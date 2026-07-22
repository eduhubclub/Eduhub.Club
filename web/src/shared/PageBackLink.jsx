import { ArrowLeft } from 'lucide-react';
import { TYPE, typeRoleLabel } from './typography';

/**
 * Breadcrumb / back control that sits above PageHeader on detail views.
 * Type: TYPE.labelSm (M3 Label Small).
 * `fontsDebug` — Live View Fonts mode: mark for TYPE probe hover.
 */
export function PageBackLink({ label, onClick, isDarkMode, fontsDebug = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 ${TYPE.labelSm} mb-3 transition-colors print:hidden ${
        fontsDebug ? 'edu-type-probe' : ''
      } ${
        isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
      }`}
      {...(fontsDebug
        ? { 'data-edu-type': 'labelSm', 'data-edu-type-label': typeRoleLabel('labelSm') }
        : {})}
    >
      <ArrowLeft size={14} strokeWidth={2} aria-hidden />
      {label}
    </button>
  );
}
