import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { TYPE } from '../shared/typography';

export function fieldClass(theme) {
  return `edu-control w-full rounded-xl border-[1.5px] px-3 py-2.5 ${TYPE.bodyMd} outline-none ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;
}

export function primaryButtonClass(theme) {
  return `edu-control w-full rounded-xl px-4 py-2.5 ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary} disabled:opacity-60`;
}

export function AuthField({ id, label, theme, isDarkMode, end, className = '', type, ...props }) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';

  return (
    <div>
      <label
        className={`block ${TYPE.labelMicro} ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
        htmlFor={id}
      >
        {label}
      </label>
      <div className={`mt-1.5 ${end ? 'flex items-center gap-2' : ''}`}>
        <div className={`relative ${end ? 'min-w-0 flex-1' : ''}`}>
          <input
            id={id}
            type={isPassword && visible ? 'text' : type}
            className={`${fieldClass(theme)} ${isPassword ? 'pr-11' : ''} ${end ? 'min-w-0' : ''} ${className}`}
            {...props}
          />
          {isPassword ? (
            <button
              type="button"
              disabled={props.disabled}
              aria-label={visible ? 'Hide password' : 'Show password'}
              aria-pressed={visible}
              onClick={() => setVisible((open) => !open)}
              className={`edu-control absolute inset-y-1 right-1 flex w-9 items-center justify-center rounded-lg ${theme.colorOnSurfaceVariant}`}
            >
              {visible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
            </button>
          ) : null}
        </div>
        {end ? <div className="flex shrink-0">{end}</div> : null}
      </div>
    </div>
  );
}

export function AuthError({ message }) {
  if (!message) return null;
  return (
    <p className={`${TYPE.bodySm} text-rose-600`} role="alert">
      {message}
    </p>
  );
}
