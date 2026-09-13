import { useEffect, useRef, useState } from 'react';
import { HandHelping, Search, Sparkles, X } from 'lucide-react';
import { AppPageShell } from '../../shared/AppPageShell';
import { ButtonRow, ButtonRowLabel } from '../../shared/ButtonRow';
import { PageHeader } from '../../shared/PageHeader';
import { APP_GRID_CARD } from '../../shared/layout';
import { toolBtnClass } from '../../shared/toolBtn';
import { TYPE } from '../../shared/typography';
import {
  DICTIONARY_AGE_EVENT,
  DICTIONARY_AGE_LEVELS,
  filterDefinitionForAge,
  isBlockedWord,
  readDictionaryAge,
} from '../../data/dictionary/ageFilter';
import { fetchDefinition, fetchPronunciation, formatPronunciationLine } from '../../data/dictionary/definitions';
import { fetchWordImage } from '../../data/dictionary/images';
import { normalizeLookup, recordSpelling } from '../../data/dictionary/spellingBank';
import { fetchSuggestions, quickSuggestions } from '../../data/dictionary/suggest';
import { SuggestionList } from './SuggestionList';
import { StudentDictionariesView } from './StudentDictionariesView';
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
  const [pronunciation, setPronunciation] = useState(null);
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
    setPronunciation(null);
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
    Promise.all([
      fetchDefinition(word),
      fetchWordImage(word),
      fetchPronunciation(word),
    ]).then(([def, pic, sound]) => {
      if (id !== lookupId.current) return;
      const safe = filterDefinitionForAge(def, age);
      if (def && !safe) {
        setBlocked(true);
        setDefinition(null);
        setPronunciation(null);
        setImage(null);
        setMissing(false);
        setLoading(false);
        return;
      }
      setDefinition(safe);
      setPronunciation(sound || safe?.pronunciation || null);
      setImage(pic);
      setMissing(!safe);
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
  const spoken = formatPronunciationLine(pronunciation);

  const clearSearch = () => {
    setQuery('');
    setKidAttempt('');
    setSuggestions([]);
    setSuggesting(false);
    setSelected('');
    setDefinition(null);
    setImage(null);
    setMissing(false);
    setBlocked(false);
    setPronunciation(null);
    setLearnedNote('');
    setLoading(false);
    lookupId.current += 1;
  };

  const inputClass = `edu-control w-full rounded-2xl border-[1.5px] py-4 pl-12 ${
    query ? 'pr-12' : 'pr-4'
  } ${TYPE.titleMd} outline-none ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;
  const isWordOfTheDay = activeTab === 'Word of the Day';
  const isStudentDictionaries = activeTab === 'Student Dictionaries';

  if (isStudentDictionaries) {
    return <StudentDictionariesView isDarkMode={isDarkMode} theme={theme} />;
  }

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
      <ButtonRow>
        <button
          type="button"
          onClick={() => setTeacherOpen(true)}
          disabled={!showTeacherHelp}
          title="Ask a teacher"
          aria-label="Ask a teacher"
          className={`${toolBtnClass(isDarkMode)} disabled:opacity-50 disabled:pointer-events-none`}
        >
          <HandHelping size={16} strokeWidth={2.5} />
          <ButtonRowLabel>Ask a teacher</ButtonRowLabel>
        </button>
      </ButtonRow>

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
          {query ? (
            <button
              type="button"
              onClick={clearSearch}
              title="Clear"
              aria-label="Clear search"
              className={`edu-control absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center ${theme.colorOnSurfaceVariant}`}
            >
              <X size={18} strokeWidth={2.25} />
            </button>
          ) : null}
        </div>
      </form>

      {suggestions.length > 0 ? (
        <SuggestionList
          words={suggestions}
          selected={selected}
          onPick={(word) => lookup(word, kidAttempt || query)}
          theme={theme}
          isDarkMode={isDarkMode}
        />
      ) : suggesting ? (
        <p className={`${TYPE.bodySm} mt-3 ${theme.colorOnSurfaceVariant}`}>
          Looking for spellings…
        </p>
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
                  {definition?.partOfSpeech || spoken ? (
                    <p className={`${TYPE.bodySm} mt-2 ${theme.colorOnSurfaceVariant}`}>
                      {spoken ? (
                        <>
                          {spoken}
                          {definition?.senses?.length > 1
                            ? ` · ${definition.senses.length} meanings`
                            : null}
                        </>
                      ) : definition?.senses?.length > 1 ? (
                        `${definition.senses.length} meanings`
                      ) : definition?.partOfSpeech ? (
                        <span className="italic">{definition.partOfSpeech}</span>
                      ) : null}
                    </p>
                  ) : null}
                  {loading ? (
                    <p className={`${TYPE.bodyMd} mt-3 ${theme.colorOnSurfaceVariant}`}>
                      Looking up this word…
                    </p>
                  ) : definition ? (
                    <ol className="mt-3 space-y-3 list-none">
                      {(definition.senses?.length
                        ? definition.senses
                        : [
                            {
                              partOfSpeech: definition.partOfSpeech,
                              definition: definition.definition,
                              example: definition.example,
                            },
                          ]
                      ).map((sense, index) => (
                        <li key={`${sense.partOfSpeech}-${index}`}>
                          <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                            <span className="tabular-nums font-semibold">{index + 1}.</span>
                            {sense.partOfSpeech ? (
                              <span className="italic ml-1.5">{sense.partOfSpeech}</span>
                            ) : null}
                          </p>
                          <p
                            className={`${TYPE.bodyMd} mt-1 ${
                              isDarkMode ? 'text-slate-200' : 'text-slate-700'
                            }`}
                          >
                            {sense.definition}
                          </p>
                          {sense.example ? (
                            <p
                              className={`${TYPE.bodySm} mt-1 italic ${theme.colorOnSurfaceVariant}`}
                            >
                              “{sense.example}”
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ol>
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
