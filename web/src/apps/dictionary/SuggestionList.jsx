import { useEffect, useState } from 'react';
import { APP_BOARD_CHROME } from '../../shared/layout';
import { TYPE } from '../../shared/typography';
import { fetchWordImage } from '../../data/dictionary/images';

/**
 * Visual spelling matches — picture + word so kids can pick by what they see.
 */
export function SuggestionList({
  words,
  selected,
  onPick,
  theme,
  isDarkMode,
}) {
  const [thumbs, setThumbs] = useState({});

  const wordKey = (words || []).join(',');

  useEffect(() => {
    let cancelled = false;
    const list = wordKey ? wordKey.split(',') : [];
    const next = {};
    Promise.all(
      list.map(async (word) => {
        const pic = await fetchWordImage(word).catch(() => null);
        return [word, pic];
      }),
    ).then((rows) => {
      if (cancelled) return;
      for (const [word, pic] of rows) next[word] = pic;
      setThumbs(next);
    });
    return () => {
      cancelled = true;
    };
  }, [wordKey]);

  return (
    <ul className="mt-3 max-w-2xl space-y-2" aria-label="Suggested words">
      {words.map((word) => {
        const active = word === selected;
        const pic = thumbs[word];
        return (
          <li key={word}>
            <button
              type="button"
              onClick={() => onPick(word)}
              className={`edu-control w-full flex items-center gap-3 overflow-hidden text-left ${APP_BOARD_CHROME} transition-colors ${
                active
                  ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                  : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`
              }`}
            >
              <div
                className={`w-20 h-20 shrink-0 ${
                  active
                    ? 'bg-black/10'
                    : theme.colorSurfaceVariant
                }`}
              >
                {pic?.thumb ? (
                  <img
                    src={pic.thumb}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span
                    className={`flex w-full h-full items-center justify-center ${TYPE.titleMd} ${
                      active ? theme.colorOnPrimary : theme.colorOnSurfaceVariant
                    }`}
                  >
                    {word.charAt(0)}
                  </span>
                )}
              </div>
              <span
                className={`${TYPE.titleMd} pr-4 normal-case tracking-normal ${
                  active ? '' : isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                {word}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
