import { MessageSquareText } from 'lucide-react';
import { TYPE } from '../../../shared/typography';
import { WidgetShell } from './WidgetShell';

/**
 * @param {string} text
 * @returns {string[]}
 */
export function messageListItems(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-•*]\s*/, '').trim())
    .filter(Boolean);
}

/**
 * Teacher morning message / instructions (paragraph or list), optional image.
 */
export function MessageWidget({ theme, pin }) {
  const text = String(pin?.props?.text || '').trim();
  const imageSrc = String(pin?.props?.imageSrc || '').trim();
  const asList = pin?.props?.format === 'list';
  const items = asList ? messageListItems(text) : [];

  const body = !text ? (
    imageSrc ? null : (
      <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
        No morning message yet. Add one in Edit board.
      </p>
    )
  ) : asList ? (
    items.length ? (
      <ul className={`space-y-1.5 list-disc pl-5 ${TYPE.titleMd} ${theme.colorOnSurface}`}>
        {items.map((item, i) => (
          <li key={`${i}-${item}`} className="leading-snug">
            {item}
          </li>
        ))}
      </ul>
    ) : (
      <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
        Add one item per line in Edit board.
      </p>
    )
  ) : (
    <p className={`${TYPE.titleMd} whitespace-pre-wrap ${theme.colorOnSurface}`}>{text}</p>
  );

  return (
    <WidgetShell theme={theme} title="Instructions" icon={MessageSquareText} pin={pin}>
      <div className="flex h-full min-h-0 flex-col gap-2 min-w-0">
        {imageSrc ? (
          <div className="min-h-0 flex-1 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
            <img
              src={imageSrc}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}
        {body ? <div className="shrink-0">{body}</div> : null}
      </div>
    </WidgetShell>
  );
}
