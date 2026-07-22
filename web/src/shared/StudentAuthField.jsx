import {
  formatAuthCredentialDisplay,
  getDistrictAuthMethod,
  PICTURE_PASSWORD_OPTIONS,
} from '../data/students/districtAuth';
import { TYPE } from './typography';

/**
 * District-driven student credential field (picture / PIN / badge / password).
 * Value is still stored on `student.password` for compatibility.
 */
export function StudentAuthField({
  value,
  onChange,
  isDarkMode,
  disabled = false,
  className = '',
  compact = false,
}) {
  const method = getDistrictAuthMethod();
  const labelClass = `${TYPE.labelMicro} ${
    isDarkMode ? 'text-slate-500' : 'text-slate-400'
  }`;
  const inputClass = `w-full ${compact ? 'px-3 py-2' : 'px-3 py-2.5'} rounded-xl border text-sm outline-none ${
    disabled
      ? isDarkMode
        ? 'bg-slate-900/60 border-slate-700 text-slate-500 cursor-not-allowed'
        : 'bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed'
      : isDarkMode
        ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-500'
        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
  } ${className}`;

  if (method.inputType === 'picture') {
    return (
      <div>
        <span className={`${labelClass} inline-flex items-center gap-1.5`}>
          {method.fieldLabel}
          <span className={`font-semibold normal-case tracking-normal ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}>
            · district
          </span>
        </span>
        <div className="mt-1.5 grid grid-cols-4 gap-2">
          {PICTURE_PASSWORD_OPTIONS.map((opt) => {
            const selected = value === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                disabled={disabled}
                title={opt.label}
                aria-label={opt.label}
                aria-pressed={selected}
                onClick={() => onChange(opt.id)}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-xl border py-2 text-lg transition-colors ${
                  selected
                    ? isDarkMode
                      ? 'border-cyan-500 bg-cyan-500/15'
                      : 'border-cyan-500 bg-cyan-50'
                    : isDarkMode
                      ? 'border-slate-600 bg-slate-800 hover:bg-slate-700'
                      : 'border-slate-300 bg-white hover:bg-slate-50'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span>{opt.id}</span>
                <span className={`text-[9px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <label className="block">
      <span className={`${labelClass} inline-flex items-center gap-1.5`}>
        {method.fieldLabel}
        <span className={`font-semibold normal-case tracking-normal ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}>
          · district
        </span>
      </span>
      <input
        type={method.inputType === 'password' ? 'password' : 'text'}
        inputMode={method.inputType === 'pin' ? 'numeric' : undefined}
        pattern={method.inputType === 'pin' ? '[0-9]*' : undefined}
        maxLength={method.inputType === 'pin' ? 8 : undefined}
        value={value || ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={method.placeholder}
        className={`mt-1 ${inputClass}`}
        autoComplete="off"
      />
    </label>
  );
}

/** Read-only display of the credential for profile view mode. */
export function StudentAuthDisplay({ value, isDarkMode }) {
  const method = getDistrictAuthMethod();
  const shown = formatAuthCredentialDisplay(value, method.id) || '—';

  return (
    <div>
      <dt
        className={`${TYPE.labelMicro} ${
          isDarkMode ? 'text-slate-500' : 'text-slate-400'
        }`}
      >
        {method.fieldLabel}
        <span className={`ml-1.5 font-semibold normal-case tracking-normal ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}>
          · district
        </span>
      </dt>
      <dd className={`${TYPE.titleSm} mt-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
        {shown}
      </dd>
    </div>
  );
}
