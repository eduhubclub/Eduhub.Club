import { useEffect, useMemo, useRef, useState } from 'react';
import { BookUser, ClipboardCopy, Download, Plus, Trash2, Upload } from 'lucide-react';
import { useClasses } from '../../data/classes/ClassContext';
import {
  CLASS_DICTIONARIES_EVENT,
  addDictionaryWord,
  addDictionaryWords,
  ensureClassDictionary,
  ensureStudentDictionary,
  readClassDictionaries,
  removeDictionaryWord,
} from '../../data/dictionary/classDictionaries';
import {
  fetchDefinition,
  fetchPronunciation,
  formatPronunciationLine,
} from '../../data/dictionary/definitions';
import {
  dictionaryEntriesToCsv,
  parseDictionaryWords,
} from '../../data/dictionary/parseDictionaryWords';
import { normalizeLookup } from '../../data/dictionary/spellingBank';
import { WORD_LISTS } from '../games/wordle/wordLists';
import { AppPageShell } from '../../shared/AppPageShell';
import { EmptyState } from '../../shared/EmptyState';
import { APP_BOARD_CHROME, APP_GRID_CARD } from '../../shared/layout';
import { ModalPrimaryButton } from '../../shared/ModalPrimaryButton';
import { PageHeader } from '../../shared/PageHeader';
import { TYPE } from '../../shared/typography';

const DEFAULT_WORD_LIST_ID = WORD_LISTS[0]?.id || 'fry';
const BULK_WORD_LIMIT = 75;

/**
 * @param {Array<() => Promise<unknown>>} tasks
 * @param {number} concurrency
 */
async function runPool(tasks, concurrency = 4) {
  const results = new Array(tasks.length);
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const i = next;
      next += 1;
      results[i] = await tasks[i]();
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

/**
 * Class + student word banks — teacher curates now; student accounts can add later.
 */
export function StudentDictionariesView({ isDarkMode, theme }) {
  const { classes, selectedClass, selectClass } = useClasses();
  const classId = selectedClass?.id != null ? String(selectedClass.id) : null;
  const roster = selectedClass?.studentList || [];
  const csvInputRef = useRef(null);

  const activeClasses = useMemo(
    () => (classes || []).filter((c) => !c.isArchived),
    [classes],
  );

  const [dictionaries, setDictionaries] = useState([]);
  const [activeDictId, setActiveDictId] = useState(null);
  const [draft, setDraft] = useState('');
  const [note, setNote] = useState('');
  const [listId, setListId] = useState(DEFAULT_WORD_LIST_ID);
  const [listWord, setListWord] = useState('');
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!activeClasses.length) return;
    if (!selectedClass || selectedClass.isArchived) {
      selectClass(activeClasses[0].id);
    }
  }, [activeClasses, selectedClass, selectClass]);

  const reload = () => {
    if (!classId) {
      setDictionaries([]);
      setActiveDictId(null);
      return;
    }
    ensureClassDictionary(classId, selectedClass?.name || 'Class');
    for (const student of roster) {
      ensureStudentDictionary(classId, student);
    }
    const list = readClassDictionaries(classId);
    setDictionaries(list);
    setActiveDictId((prev) => {
      if (prev && list.some((d) => d.id === prev)) return prev;
      return list.find((d) => d.ownerType === 'class')?.id || list[0]?.id || null;
    });
  };

  useEffect(() => {
    reload();
    const onChange = () => reload();
    window.addEventListener(CLASS_DICTIONARIES_EVENT, onChange);
    return () => window.removeEventListener(CLASS_DICTIONARIES_EVENT, onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on class/roster change
  }, [classId, roster.length, selectedClass?.name]);

  const activeDict = dictionaries.find((d) => d.id === activeDictId) || null;

  const dictionaryOptions = useMemo(() => {
    const classDicts = dictionaries.filter((d) => d.ownerType === 'class');
    const studentDicts = dictionaries
      .filter((d) => d.ownerType === 'student')
      .slice()
      .sort((a, b) => {
        const nameA = roster.find((s) => String(s.id) === String(a.ownerId))?.name || a.name;
        const nameB = roster.find((s) => String(s.id) === String(b.ownerId))?.name || b.name;
        return String(nameA).localeCompare(String(nameB));
      });
    return [...classDicts, ...studentDicts];
  }, [dictionaries, roster]);

  const optionLabel = (dict) => {
    const count = dict.words?.length ?? 0;
    if (dict.ownerType === 'class') return `Whole class (${count})`;
    const student = roster.find((s) => String(s.id) === String(dict.ownerId));
    const name = student?.name || dict.name.replace(/\s*’s dictionary$/i, '') || 'Student';
    return `${name} (${count})`;
  };

  const existingWords = useMemo(() => {
    const set = new Set();
    for (const entry of activeDict?.words || []) {
      const next = normalizeLookup(entry.word);
      if (next) set.add(next);
    }
    return set;
  }, [activeDict]);

  const activeWordList = useMemo(
    () => WORD_LISTS.find((list) => list.id === listId) || WORD_LISTS[0] || null,
    [listId],
  );

  const listWordOptions = useMemo(() => {
    const words = (activeWordList?.words || [])
      .map((word) => normalizeLookup(word))
      .filter((word) => word.length >= 2 && !existingWords.has(word));
    return [...new Set(words)].sort((a, b) => a.localeCompare(b));
  }, [activeWordList, existingWords]);

  useEffect(() => {
    setListWord((prev) => (prev && listWordOptions.includes(prev) ? prev : ''));
  }, [listWordOptions]);

  const draftEntries = useMemo(() => parseDictionaryWords(draft), [draft]);

  const saveWord = async (rawWord) => {
    const word = normalizeLookup(rawWord);
    if (!classId || !activeDict || !word || saving) return;
    setSaving(true);
    setError('');
    setStatus('');
    setProgress('');
    try {
      const [def, pronunciation] = await Promise.all([
        fetchDefinition(word),
        fetchPronunciation(word),
      ]);
      addDictionaryWord(classId, activeDict.id, {
        word,
        definition: def?.definition || null,
        partOfSpeech: def?.partOfSpeech || null,
        pronunciation: pronunciation || def?.pronunciation || null,
        note,
        addedBy: 'teacher',
      });
      setDraft('');
      setNote('');
      setListWord('');
      setStatus(`Added “${word}”.`);
      reload();
    } catch {
      setError('Couldn’t save that word. Try again.');
    } finally {
      setSaving(false);
      setProgress('');
    }
  };

  const saveParsedEntries = async (parsed, { clearDraft = false } = {}) => {
    if (!classId || !activeDict || saving) return;
    const fresh = parsed.filter((entry) => entry.word && !existingWords.has(entry.word));
    if (!fresh.length) {
      setError(parsed.length ? 'Those words are already in this dictionary.' : 'No words found to add.');
      setStatus('');
      return;
    }
    const capped = fresh.slice(0, BULK_WORD_LIMIT);
    const skipped = fresh.length - capped.length;

    setSaving(true);
    setError('');
    setStatus('');
    setProgress(`Looking up 0 of ${capped.length}…`);
    try {
      let done = 0;
      const enriched = await runPool(
        capped.map((entry) => async () => {
          try {
            const [def, pronunciation] = await Promise.all([
              entry.definition ? Promise.resolve(null) : fetchDefinition(entry.word),
              fetchPronunciation(entry.word),
            ]);
            done += 1;
            setProgress(`Looking up ${done} of ${capped.length}…`);
            return {
              word: entry.word,
              definition: entry.definition || def?.definition || null,
              partOfSpeech: def?.partOfSpeech || null,
              pronunciation: pronunciation || def?.pronunciation || null,
              note: entry.note || note,
              addedBy: 'teacher',
            };
          } catch {
            done += 1;
            setProgress(`Looking up ${done} of ${capped.length}…`);
            return {
              word: entry.word,
              definition: entry.definition || null,
              partOfSpeech: null,
              pronunciation: null,
              note: entry.note || note,
              addedBy: 'teacher',
            };
          }
        }),
        4,
      );
      addDictionaryWords(classId, activeDict.id, enriched);
      if (clearDraft) setDraft('');
      setNote('');
      setListWord('');
      const extra = skipped > 0 ? ` (capped at ${BULK_WORD_LIMIT}; ${skipped} left for another pass)` : '';
      setStatus(`Added ${enriched.length} word${enriched.length === 1 ? '' : 's'}${extra}.`);
      reload();
    } catch {
      setError('Couldn’t import those words. Try again.');
    } finally {
      setSaving(false);
      setProgress('');
    }
  };

  const onCsvFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const parsed = parseDictionaryWords(text);
      saveParsedEntries(parsed);
    };
    reader.onerror = () => setError('Couldn’t read that CSV file.');
    reader.readAsText(file);
  };

  const copyDictionary = async () => {
    const words = activeDict?.words || [];
    if (!words.length) return;
    const text = dictionaryEntriesToCsv(words);
    try {
      await navigator.clipboard.writeText(text);
      setStatus('Copied dictionary CSV to clipboard.');
      setError('');
    } catch {
      setError('Couldn’t copy to clipboard.');
    }
  };

  const downloadCsv = () => {
    const words = activeDict?.words || [];
    if (!words.length) return;
    const csv = dictionaryEntriesToCsv(words);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    const safe = (activeDict?.name || 'dictionary').replace(/[^\w.-]+/g, '-').toLowerCase();
    a.href = url;
    a.download = `${safe}-${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus('Downloaded CSV.');
    setError('');
  };

  const copyEntry = async (entry) => {
    const spoken = formatPronunciationLine(entry.pronunciation);
    const lines = [
      entry.word,
      [entry.partOfSpeech, spoken].filter(Boolean).join(' '),
      entry.definition || '',
      entry.note || '',
    ].filter(Boolean);
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setStatus(`Copied “${entry.word}”.`);
      setError('');
    } catch {
      setError('Couldn’t copy to clipboard.');
    }
  };

  const inputClass = `edu-control w-full rounded-xl border-[1.5px] px-3 py-2.5 ${TYPE.bodyMd} outline-none ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;
  const secondaryBtn = `edu-control inline-flex items-center gap-1.5 rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;

  if (!activeClasses.length) {
    return (
      <AppPageShell variant="page">
        <PageHeader
          title="Student Dictionaries"
          description="Build a class word bank students can use as a digital reference."
          isDarkMode={isDarkMode}
          leading={
            <div
              className={`p-2.5 rounded-xl ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
            >
              <BookUser size={20} />
            </div>
          }
        />
        <EmptyState
          isDarkMode={isDarkMode}
          message="No classes yet. Add a class in Edu.Classes, or turn on demo data in Settings."
          illustration={<BookUser size={36} className="text-slate-400" />}
        />
      </AppPageShell>
    );
  }

  return (
    <AppPageShell variant="page">
      <PageHeader
        title="Student Dictionaries"
        description={`Words for ${selectedClass?.name || 'this class'}. Teachers add now; student accounts can add their own later.`}
        isDarkMode={isDarkMode}
        leading={
          <div
            className={`p-2.5 rounded-xl ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
          >
            <BookUser size={20} />
          </div>
        }
      />

      <div className="mb-4 max-w-2xl">
        <label
          className={`block ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
          htmlFor="student-dict-picker"
        >
          Dictionary
        </label>
        <select
          id="student-dict-picker"
          className={`edu-control mt-1.5 w-full max-w-md rounded-xl border-[1.5px] px-3 py-2.5 ${TYPE.bodyMd} outline-none ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
          value={activeDictId || ''}
          onChange={(e) => setActiveDictId(e.target.value || null)}
          disabled={!dictionaryOptions.length}
        >
          {!dictionaryOptions.length ? (
            <option value="">No dictionaries</option>
          ) : null}
          {dictionaryOptions.map((dict) => (
            <option key={dict.id} value={dict.id}>
              {optionLabel(dict)}
            </option>
          ))}
        </select>
      </div>

      <div
        className={`${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} p-5 sm:p-6 max-w-2xl`}
      >
        <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
          {activeDict?.ownerType === 'student' ? 'Student dictionary' : 'Class dictionary'}
        </p>
        <p className={`${TYPE.bodySm} mt-1 ${theme.colorOnSurfaceVariant}`}>
          {activeDict?.ownerType === 'student'
            ? 'Words this student can keep as a personal reference.'
            : 'Shared words for the whole class — also added to every student’s dictionary.'}
        </p>

        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (draftEntries.length > 1) {
              saveParsedEntries(draftEntries, { clearDraft: true });
            } else {
              saveWord(draft);
            }
          }}
        >
          <div className={`rounded-xl border-[1.5px] p-3 space-y-3 ${theme.colorOutline} ${theme.colorSurfaceVariant || theme.colorSurface}`}>
            <div>
              <p className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>Quick add from word list</p>
              <p className={`${TYPE.bodySm} mt-0.5 ${theme.colorOnSurfaceVariant}`}>
                Fry, Dolch, and UFLI high-frequency words. Already-added words are hidden.
              </p>
            </div>
            <div>
              <label
                className={`block ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                htmlFor="class-dict-word-list"
              >
                Word list
              </label>
              <select
                id="class-dict-word-list"
                className={`${inputClass} mt-1.5`}
                value={listId}
                onChange={(e) => setListId(e.target.value)}
              >
                {WORD_LISTS.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name} ({list.words.length})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className={`block ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                htmlFor="class-dict-list-word"
              >
                Word
              </label>
              <select
                id="class-dict-list-word"
                className={`${inputClass} mt-1.5`}
                value={listWord}
                onChange={(e) => setListWord(e.target.value)}
                disabled={!listWordOptions.length || saving}
              >
                <option value="">
                  {listWordOptions.length
                    ? `Choose a word (${listWordOptions.length} left)`
                    : 'All words from this list are already added'}
                </option>
                {listWordOptions.map((word) => (
                  <option key={word} value={word}>
                    {word}
                  </option>
                ))}
              </select>
            </div>
            <ModalPrimaryButton
              theme={theme}
              disabled={!listWord || saving}
              onClick={() => saveWord(listWord)}
            >
              <Plus size={16} className="inline mr-1" />
              {saving ? 'Saving…' : 'Add from list'}
            </ModalPrimaryButton>
          </div>

          <div>
            <label className={`block ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`} htmlFor="class-dict-word">
              Type or paste words
            </label>
            <textarea
              id="class-dict-word"
              className={`${inputClass} mt-1.5 min-h-[6.5rem] resize-y`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={'One word, or paste a list:\nthus\nhappy\npoem'}
              autoComplete="off"
              spellCheck={false}
              rows={4}
            />
            <p className={`${TYPE.bodySm} mt-1.5 ${theme.colorOnSurfaceVariant}`}>
              Separate with new lines or commas. CSV headers <span className="font-mono">word,note,definition</span> also work.
              {draftEntries.length > 1 ? ` · ${draftEntries.length} words ready` : null}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                onCsvFile(file);
              }}
            />
            <button
              type="button"
              className={secondaryBtn}
              disabled={saving}
              onClick={() => csvInputRef.current?.click()}
            >
              <Upload size={16} />
              Import CSV
            </button>
            <button
              type="button"
              className={secondaryBtn}
              disabled={saving || !activeDict?.words?.length}
              onClick={downloadCsv}
            >
              <Download size={16} />
              Export CSV
            </button>
            <button
              type="button"
              className={secondaryBtn}
              disabled={saving || !activeDict?.words?.length}
              onClick={copyDictionary}
            >
              <ClipboardCopy size={16} />
              Copy CSV
            </button>
          </div>

          <div>
            <label className={`block ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`} htmlFor="class-dict-note">
              Teacher note (optional)
            </label>
            <input
              id="class-dict-note"
              className={`${inputClass} mt-1.5`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Example sentence or reminder…"
            />
          </div>
          {progress ? (
            <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>{progress}</p>
          ) : null}
          {error ? (
            <p className={`${TYPE.bodySm} text-rose-600`}>{error}</p>
          ) : null}
          {status ? (
            <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>{status}</p>
          ) : null}
          <ModalPrimaryButton
            theme={theme}
            disabled={!draftEntries.length || saving}
            onClick={() => {
              if (draftEntries.length > 1) {
                saveParsedEntries(draftEntries, { clearDraft: true });
              } else {
                saveWord(draft);
              }
            }}
          >
            <Plus size={16} className="inline mr-1" />
            {saving
              ? 'Saving…'
              : draftEntries.length > 1
                ? `Add ${draftEntries.length} words`
                : 'Add to dictionary'}
          </ModalPrimaryButton>
        </form>
      </div>

      {!activeDict?.words?.length ? (
        <div className="mt-6 max-w-2xl">
          <EmptyState
            isDarkMode={isDarkMode}
            message="No words yet. Add the first word for this dictionary."
          />
        </div>
      ) : (
        <ul className="mt-6 max-w-2xl space-y-2" aria-label="Dictionary words">
          {activeDict.words.map((entry) => {
            const spoken = formatPronunciationLine(entry.pronunciation);
            return (
              <li
                key={entry.id}
                className={`flex items-start gap-3 ${APP_BOARD_CHROME} ${theme.colorSurface} ${theme.colorOutline} p-4`}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={`${TYPE.titleMd} normal-case tracking-normal ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {entry.word}
                  </p>
                  {entry.partOfSpeech || spoken ? (
                    <p className={`${TYPE.bodySm} mt-1 ${theme.colorOnSurfaceVariant}`}>
                      {entry.partOfSpeech ? (
                        <span className="italic">{entry.partOfSpeech}</span>
                      ) : null}
                      {entry.partOfSpeech && spoken ? ' ' : null}
                      {spoken}
                    </p>
                  ) : null}
                  {entry.definition ? (
                    <p
                      className={`${TYPE.bodyMd} mt-2 ${
                        isDarkMode ? 'text-slate-200' : 'text-slate-700'
                      }`}
                    >
                      {entry.definition}
                    </p>
                  ) : null}
                  {entry.note ? (
                    <p className={`${TYPE.bodySm} mt-2 italic ${theme.colorOnSurfaceVariant}`}>
                      {entry.note}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-start gap-1">
                  <button
                    type="button"
                    aria-label={`Copy ${entry.word}`}
                    onClick={() => copyEntry(entry)}
                    className={`edu-control rounded-lg p-2 ${theme.colorOnSurfaceVariant}`}
                  >
                    <ClipboardCopy size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${entry.word}`}
                    onClick={() => {
                      if (!classId || !activeDict) return;
                      removeDictionaryWord(classId, activeDict.id, entry.id);
                      reload();
                    }}
                    className={`edu-control rounded-lg p-2 ${theme.colorOnSurfaceVariant}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AppPageShell>
  );
}
