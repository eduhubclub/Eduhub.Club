import { Delete } from 'lucide-react';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0'];

/**
 * Append keypad input to a digit string.
 * @param {string} value
 * @param {string} key - digit, '00', or 'del'
 * @param {{ maxLength?: number, stripLeadingZeros?: boolean }} [opts]
 */
export function applyKeypadKey(value, key, opts = {}) {
  const maxLength = opts.maxLength ?? 8;
  const stripLeadingZeros = opts.stripLeadingZeros ?? false;
  const current = String(value || '');
  if (key === 'del') return current.slice(0, -1);
  if (!/^\d+$/.test(key)) return current;
  let next = `${current}${key}`;
  if (stripLeadingZeros) next = next.replace(/^0+(?=\d)/, '');
  return next.slice(0, maxLength);
}

/**
 * On-screen numeric keypad for Jobs salary fields.
 */
export function JobsKeypad({ theme, isDarkMode, onKey }) {
  const keyClass = `edu-control p-3 rounded-xl text-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-sm border-[1.5px] ${
    isDarkMode
      ? `${theme.colorSurfaceVariant} ${theme.colorOnSurface} ${theme.colorOutline}`
      : `${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutlineVariant}`
  }`;

  return (
    <div className="grid grid-cols-3 gap-2" role="group" aria-label="Keypad">
      {KEYS.map((num) => (
        <button
          key={num}
          type="button"
          onClick={() => onKey(num)}
          className={keyClass}
        >
          {num}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onKey('del')}
        className={`edu-control p-3 flex items-center justify-center rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-sm border-[1.5px] ${
          isDarkMode
            ? `${theme.colorErrorContainer} ${theme.colorOnErrorContainer} ${theme.colorOutline}`
            : 'bg-rose-50 text-rose-500 border-rose-200'
        }`}
        aria-label="Delete"
      >
        <Delete size={24} />
      </button>
    </div>
  );
}
