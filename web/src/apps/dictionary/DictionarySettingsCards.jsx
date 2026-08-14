import { useEffect, useState } from 'react';
import { TYPE } from '../../shared/typography';
import {
  DICTIONARY_AGE_EVENT,
  DICTIONARY_AGE_LEVELS,
  readDictionaryAge,
  writeDictionaryAge,
} from '../../data/dictionary/ageFilter';

/**
 * Dictionary age band for the shell Settings page.
 */
export function DictionarySettingsCards({ theme, isDarkMode, Card }) {
  const [ageId, setAgeId] = useState(readDictionaryAge);

  useEffect(() => {
    const onChange = (e) => {
      if (e?.detail?.id) setAgeId(e.detail.id);
      else setAgeId(readDictionaryAge());
    };
    window.addEventListener(DICTIONARY_AGE_EVENT, onChange);
    return () => window.removeEventListener(DICTIONARY_AGE_EVENT, onChange);
  }, []);

  return (
    <Card
      title="Age filter"
      description="Hide words that are not a fit for your class. Kindergarten and early grades should stay on K–2 or 3–5."
      isDarkMode={isDarkMode}
    >
      <div className="px-5 sm:px-6 py-5 sm:py-6">
        <div className="flex flex-wrap gap-2">
          {DICTIONARY_AGE_LEVELS.map((level) => {
            const active = ageId === level.id;
            return (
              <button
                key={level.id}
                type="button"
                onClick={() => setAgeId(writeDictionaryAge(level.id))}
                className={`edu-control min-w-[3.5rem] h-11 px-3 rounded-xl ${TYPE.labelLg} border-[1.5px] transition-all ${
                  active
                    ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                    : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`
                }`}
              >
                {level.label}
              </button>
            );
          })}
        </div>
        <p
          className={`${TYPE.bodySm} mt-3 ${
            isDarkMode ? 'text-slate-500' : 'text-slate-400'
          }`}
        >
          {DICTIONARY_AGE_LEVELS.find((level) => level.id === ageId)?.description}
        </p>
      </div>
    </Card>
  );
}
