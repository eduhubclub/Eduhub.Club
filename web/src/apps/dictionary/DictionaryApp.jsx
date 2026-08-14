import { useEffect, useRef, useState } from 'react';
import { BookA, HandHelping, Search, Sparkles } from 'lucide-react';
import { AppPageShell } from '../../shared/AppPageShell';
import { PageHeader } from '../../shared/PageHeader';
import { APP_GRID_CARD } from '../../shared/layout';
import { TYPE } from '../../shared/typography';
import {
  DICTIONARY_AGE_EVENT,
  DICTIONARY_AGE_LEVELS,
  isBlockedDefinition,
  isBlockedWord,
  readDictionaryAge,
} from '../../data/dictionary/ageFilter';
import { fetchDefinition } from '../../data/dictionary/definitions';
import { fetchWordImage } from '../../data/dictionary/images';
import { normalizeLookup, recordSpelling } from '../../data/dictionary/spellingBank';
import { fetchSuggestions, quickSuggestions } from '../../data/dictionary/suggest';
import { TeacherHelpModal } from './TeacherHelpModal';
import { WordOfTheDayCard } from './WordOfTheDayCard';

/**
 * Edu.Dictionary — search, spelling help, definition + PD picture.
 */
export function DictionaryApp({ activeTab, isDarkMode, theme, onSetActiveTab }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggesting, setSuggesting] = useState(false);
  const [selected, setSelected] = useState('');
  const [definition, setDefinition] = useState(null);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [missing, setMissing] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [kidAttempt, setKidAttempt] = useState('');
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [learnedNote, setLearnedNote] = useState('');
  const [ageId, setAgeId] = useState(readDictionaryAge);
  const lookupId = useRef(0);
  const ageLabel = DICTIONARY_AGE_LEVELS.find((level) => level.id === ageId)?.label || 'K–2';

  useEffect(() => {
    const onAge = (e) => {
      setAgeId(e?.detail?.id || readDictionaryAge());
    };
    window.addEventListener(DICTIONARY_AGE_EVENT, onAge);
    return () => window.removeEventListener(DICTIONARY_AGE_EVENT, onAge);
  }, []);

  useEffect(() => {
    const q = normalizeLookup(query);
    if (q.length < 2) {
      setSuggestions([]);
      setSuggesting(false);
      return undefined;
    }
    let cancelled = false;
    setSuggestions(quickSuggestions(q));
    setSuggesting(true);
    const t = window.setTimeout(() => {
      fetchSuggestions(q).then((next) => {
        if (cancelled) return;
        setSuggestions(next);
        setSuggesting(false);
      });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [query, ageId]);

  const lookup = (raw, attempt = query) => {
    const word = normalizeLookup(raw);
    if (!word) return;
    const age = readDictionaryAge();
    setSelected(word);
    setQuery(word);
    setSuggestions([]);
    setMissing(false);
    setDefinition(null);
    setImage(null);
    if (isBlockedWord(word, age)) {
      setBlocked(true);
      setLoading(false);
      return;
    }
    recordSpelling(attempt, word);
    setBlocked(false);
    setLoading(true);
    const id = (lookupId.current += 1);
    Promise.all([fetchDefinition(word), fetchWordImage(word)]).then(([def, pic]) => {
      if (id !== lookupId.current) return;
      if (isBlockedDefinition(def?.definition, age) || isBlockedDefinition(def?.example, age)) {
        setBlocked(true);
        setDefinition(null);
        setImage(null);
        setMissing(false);
        setLoading(false);
        return;
      }
      setDefinition(def);
      setImage(pic);
      setMissing(!def);
      setLoading(false);
    });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const q = normalizeLookup(query);
    if (!q) return;
    if (isBlockedWord(q)) {
      lookup(q, kidAttempt || query);
      return;
    }
    const exact = suggestions.find((s) => s === q);
    lookup(exact || suggestions[0] || q, kidAttempt || query);
  };

  const onTeach = (attempt, word) => {
    lookup(word, attempt);
    const from = normalizeLookup(attempt);
    const to = normalizeLookup(word);
    if (from && to && from !== to && !isBlockedWord(to)) {
      setLearnedNote(`Saved “${from}” as ${to} for this class.`);
    } else {
      setLearnedNote('');
    }
  };

  const helpAttempt = normalizeLookup(kidAttempt || query);
  const showTeacherHelp = helpAttempt.length >= 2;

  const inputClass = `edu-control w-full rounded-2xl border-[1.5px] py-4 pl-12 pr-4 ${TYPE.titleMd} outline-none ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;
  const isWordOfTheDay = activeTab === 'Word of the Day';

  if (isWordOfTheDay) {
    return (
      <AppPageShell variant="page">
        <PageHeader
          title="Word of the Day"
          description={`A new classroom word each day, with a picture when we can find one. Age filter: ${ageLabel} (Settings).`}
          isDarkMode={isDarkMode}
          leading={
            <div
              className={`p-2.5 rounded-xl ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
            >
              <Sparkles size={20} />
            </div>
          }
        />
        <WordOfTheDayCard
          theme={theme}
          isDarkMode={isDarkMode}
          className="max-w-[28rem]"
          onSelectWord={(word) => {
            lookup(word, word);
            onSetActiveTab?.('Lookup');
          }}
        />
      </AppPageShell>
    );
  }

  return (
    <AppPageShell variant="page">
      <PageHeader
        title="Dictionary"
        description={`Type a word — even if the spelling is off. We’ll guess from how it sounds. Age filter: ${ageLabel} (Settings).`}
        isDarkMode={isDarkMode}
        leading={
          <div
            className={`p-2.5 rounded-xl ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
          >
            <BookA size={20} />
          </div>
        }
      />

      <form onSubmit={onSubmit} className="max-w-2xl">
        <label htmlFor="dictionary-search" className="sr-only">
          Look up a word
        </label>
        <div className="relative">
          <Search
            size={20}
            className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none ${theme.colorOnSurfaceVariant}`}
          />
          <input
            id="dictionary-search"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setKidAttempt(e.target.value);
              setLearnedNote('');
            }}
            placeholder="Type a word…"
            className={inputClass}
          />
        </div>
      </form>

      {suggestions.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2 max-w-2xl">
          {suggestions.map((word) => {
            const active = word === selected;
            return (
              <button
                key={word}
                type="button"
                onClick={() => lookup(word, kidAttempt || query)}
                className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelLg} transition-colors ${
                  active
                    ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                    : isDarkMode
                      ? 'bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700'
                      : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface} hover:bg-slate-50`
                }`}
              >
                {word}
              </button>
            );
          })}
        </div>
      ) : suggesting ? (
        <p className={`${TYPE.bodySm} mt-3 ${theme.colorOnSurfaceVariant}`}>
          Looking for spellings…
        </p>
      ) : null}

      {showTeacherHelp ? (
        <div className="mt-3 max-w-2xl">
          <button
            type="button"
            onClick={() => setTeacherOpen(true)}
            className={`edu-control inline-flex items-center gap-2 rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelLg} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
          >
            <HandHelping size={18} strokeWidth={2.25} />
            Ask a teacher
          </button>
          <p className={`${TYPE.bodySm} mt-1.5 ${theme.colorOnSurfaceVariant}`}>
            A teacher can type the real word. Next time, this spelling will find it.
          </p>
        </div>
      ) : null}

      {learnedNote ? (
        <p className={`${TYPE.bodySm} mt-3 max-w-2xl ${theme.colorOnSurfaceVariant}`}>
          {learnedNote}
        </p>
      ) : null}

      {selected ? (
        <div
          className={`mt-6 max-w-2xl ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} overflow-hidden`}
        >
          <div className="flex flex-col sm:flex-row">
            {image?.thumb && !blocked ? (
              <div
                className={`sm:w-56 shrink-0 ${
                  isDarkMode ? 'bg-slate-800' : 'bg-slate-50'
                }`}
              >
                <img
                  src={image.thumb}
                  alt=""
                  className="w-full h-48 sm:h-full object-cover"
                />
              </div>
            ) : null}
            <div className="min-w-0 flex-1 p-5">
              {blocked ? (
                <p
                  className={`${TYPE.bodyMd} ${
                    isDarkMode ? 'text-slate-200' : 'text-slate-700'
                  }`}
                >
                  This word isn’t available for the {ageLabel} age filter. A teacher can
                  change that in Settings.
                </p>
              ) : (
                <>
                  <p
                    className={`${TYPE.displaySm} normal-case tracking-normal ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {selected}
                  </p>
                  {definition?.partOfSpeech ? (
                    <p className={`${TYPE.labelMicro} mt-2 ${theme.colorOnSurfaceVariant}`}>
                      {definition.partOfSpeech}
                    </p>
                  ) : null}
                  {loading ? (
                    <p className={`${TYPE.bodyMd} mt-3 ${theme.colorOnSurfaceVariant}`}>
                      Looking up this word…
                    </p>
                  ) : definition ? (
                    <>
                      <p
                        className={`${TYPE.bodyMd} mt-3 ${
                          isDarkMode ? 'text-slate-200' : 'text-slate-700'
                        }`}
                      >
                        {definition.definition}
                      </p>
                      {definition.example ? (
                        <p
                          className={`${TYPE.bodySm} mt-2 italic ${theme.colorOnSurfaceVariant}`}
                        >
                          “{definition.example}”
                        </p>
                      ) : null}
                    </>
                  ) : missing ? (
                    <p className={`${TYPE.bodyMd} mt-3 ${theme.colorOnSurfaceVariant}`}>
                      No definition found — try another spelling.
                    </p>
                  ) : null}
                  {image?.thumb && !blocked ? (
                    <p className={`${TYPE.bodySm} mt-4 ${theme.colorOnSurfaceVariant}`}>
                      {image.title}
                      {' · '}
                      {image.license}
                      {image.sourceUrl ? (
                        <>
                          {' · '}
                          <a
                            href={image.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="underline underline-offset-2"
                          >
                            Source
                          </a>
                        </>
                      ) : null}
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <TeacherHelpModal
        isOpen={teacherOpen}
        onClose={() => setTeacherOpen(false)}
        theme={theme}
        isDarkMode={isDarkMode}
        kidSpelling={helpAttempt}
        onTeach={onTeach}
      />
    </AppPageShell>
  );
}
