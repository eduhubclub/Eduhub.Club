import { useEffect, useState } from 'react';
import { TYPE } from '../../../shared/typography';

/**
 * Physical-key highlight map: KeyboardEvent.code → display id.
 */
const CODE_TO_ID = {
  Backquote: '`',
  Digit1: '1',
  Digit2: '2',
  Digit3: '3',
  Digit4: '4',
  Digit5: '5',
  Digit6: '6',
  Digit7: '7',
  Digit8: '8',
  Digit9: '9',
  Digit0: '0',
  Minus: '-',
  Equal: '=',
  KeyQ: 'q',
  KeyW: 'w',
  KeyE: 'e',
  KeyR: 'r',
  KeyT: 't',
  KeyY: 'y',
  KeyU: 'u',
  KeyI: 'i',
  KeyO: 'o',
  KeyP: 'p',
  BracketLeft: '[',
  BracketRight: ']',
  KeyA: 'a',
  KeyS: 's',
  KeyD: 'd',
  KeyF: 'f',
  KeyG: 'g',
  KeyH: 'h',
  KeyJ: 'j',
  KeyK: 'k',
  KeyL: 'l',
  Semicolon: ';',
  Quote: "'",
  KeyZ: 'z',
  KeyX: 'x',
  KeyC: 'c',
  KeyV: 'v',
  KeyB: 'b',
  KeyN: 'n',
  KeyM: 'm',
  Comma: ',',
  Period: '.',
  Slash: '/',
  Space: 'space',
  Enter: 'enter',
  Backspace: 'back',
  ShiftLeft: 'shift',
  ShiftRight: 'shift',
};

const ROWS = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
  ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'back'],
  ['space', 'enter'],
];

const LABELS = {
  space: 'Space',
  enter: 'Enter',
  back: '⌫',
  shift: 'Shift',
};

function keyWidthClass(id) {
  if (id === 'space') return 'min-w-[8rem] flex-[2.5]';
  if (id === 'enter' || id === 'shift' || id === 'back') return 'min-w-[3rem] flex-[1.2]';
  return 'min-w-[1.5rem] flex-1';
}

/**
 * Decorative QWERTY that lights up when the real keyboard is pressed.
 * Does not capture focus or type — TypingPassage stays the input target.
 */
export function TypingKeyboard({ theme, visible = true }) {
  const [lit, setLit] = useState(() => new Set());

  useEffect(() => {
    if (!visible) {
      setLit(new Set());
      return undefined;
    }

    function light(code, on) {
      const id = CODE_TO_ID[code];
      if (!id) return;
      setLit((prev) => {
        const next = new Set(prev);
        if (on) next.add(id);
        else next.delete(id);
        return next;
      });
    }

    function onDown(e) {
      light(e.code, true);
    }
    function onUp(e) {
      light(e.code, false);
    }
    function clear() {
      setLit(new Set());
    }

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', clear);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', clear);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`shrink-0 select-none rounded-xl border-[1.5px] p-2 sm:p-3 ${theme.colorSurfaceVariant} ${theme.colorOutline}`}
      aria-hidden="true"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-1">
        {ROWS.map((row) => (
          <div key={row.join('-')} className="flex justify-center gap-1">
            {row.map((id) => {
              const on = lit.has(id);
              return (
                <div
                  key={id}
                  className={`${keyWidthClass(id)} flex h-8 sm:h-9 items-center justify-center rounded-md border-[1.5px] ${TYPE.labelSm} transition-colors duration-75 ${
                    on
                      ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                      : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`
                  }`}
                >
                  {LABELS[id] || id.toUpperCase()}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
