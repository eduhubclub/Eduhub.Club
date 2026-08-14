import { useEffect, useState } from 'react';
import { BookA } from 'lucide-react';
import { APP_GRID_CARD } from '../../shared/layout';
import { TYPE } from '../../shared/typography';
import {
  DICTIONARY_AGE_EVENT,
  DICTIONARY_FLAGS_EVENT,
  readDictionaryAge,
} from '../../data/dictionary/ageFilter';
import {
  formatWordOfTheDayDate,
  loadWordOfTheDay,
} from '../../data/dictionary/wordOfTheDay';

function formatPhonetic(text) {
  const t = String(text || '').trim();
  if (!t) return null;
  if (t.startsWith('[') || t.startsWith('(') || t.startsWith('/')) return t;
  return `[ ${t} ]`;
}

/**
 * Square Word of the Day card — picture, word, part of speech, pronunciation, definition.
 * Built as a widget-ready tile for Dictionary now and Dashboard later.
 */
export function WordOfTheDayCard({ theme, isDarkMode, onSelectWord, className = '' }) {
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ageId, setAgeId] = useState(readDictionaryAge);

  useEffect(() => {
    const onAge = (e) => {
      setAgeId(e?.detail?.id || readDictionaryAge());
    };
    window.addEventListener(DICTIONARY_AGE_EVENT, onAge);
    return () => window.removeEventListener(DICTIONARY_AGE_EVENT, onAge);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadWordOfTheDay({ ageId }).then((next) => {
      if (cancelled) return;
      setEntry(next);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [ageId]);

  const phonetic = formatPhonetic(entry?.pronunciation);
  const word = entry?.word || '';
  const pos = entry?.definition?.partOfSpeech;
  const definition = entry?.definition?.definition;
  const image = entry?.image;
  const hasImage = Boolean(image?.thumb);

  const select = () => {
    if (word && onSelectWord) onSelectWord(word);
  };

  const wordClass = `mt-2 text-left ${TYPE.displaySm} normal-case tracking-tight font-light ${
    isDarkMode ? 'text-white' : 'text-slate-900'
  }`;

  return (
    <article
      className={`w-full aspect-square flex flex-col overflow-hidden ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} ${className || 'max-w-[22rem]'}`}
    >
      {hasImage ? (
        <div
          className={`relative h-[42%] shrink-0 overflow-hidden ${theme.colorSurfaceVariant}`}
        >
          <img
            src={image.thumb}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      ) : null}

      <div
        className={`flex-1 min-h-0 flex flex-col ${
          hasImage ? 'px-4 pt-3 pb-3' : 'p-5'
        }`}
      >
        <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>Word of the Day</p>
        <p className={`${TYPE.bodySm} mt-0.5 ${theme.colorOnSurfaceVariant}`}>
          {entry?.date ? formatWordOfTheDayDate(entry.date) : '\u00a0'}
        </p>

        {loading ? (
          <p className={`${TYPE.bodyMd} mt-3 ${theme.colorOnSurfaceVariant}`}>
            Finding today’s word…
          </p>
        ) : entry ? (
          <>
            {onSelectWord ? (
              <button type="button" onClick={select} className={`edu-control ${wordClass}`}>
                {word}
              </button>
            ) : (
              <p className={wordClass}>{word}</p>
            )}
            {pos || phonetic ? (
              <p className={`${TYPE.bodySm} mt-1 ${theme.colorOnSurfaceVariant}`}>
                {pos ? <span className="italic">{pos}</span> : null}
                {pos && phonetic ? ' ' : null}
                {phonetic}
              </p>
            ) : null}
            {definition ? (
              <p
                className={`${TYPE.bodyMd} mt-2 ${hasImage ? 'line-clamp-3' : 'line-clamp-8'} ${
                  isDarkMode ? 'text-slate-200' : 'text-slate-700'
                }`}
              >
                {definition}
              </p>
            ) : null}
          </>
        ) : (
          <p className={`${TYPE.bodyMd} mt-3 ${theme.colorOnSurfaceVariant}`}>
            Today’s word isn’t available right now.
          </p>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 ${TYPE.labelMd} ${theme.colorOnSurface}`}
          >
            <BookA size={14} strokeWidth={2.25} />
            Edu.Dictionary
          </span>
          {image?.license ? (
            <span className={`${TYPE.bodySm} truncate ${theme.colorOnSurfaceVariant}`}>
              {image.license}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
