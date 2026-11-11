import { useEffect, useMemo, useRef, useState } from 'react';
import { Info, Play, RotateCcw } from 'lucide-react';
import { studentDisplayName } from '../../../data/students/displayName';
import {
  helloUrl,
  clipUrl,
  readRecordedVoice,
  RECORDED_VOICES,
  speakDictation,
  writeRecordedVoice,
} from '../../../data/screener/letrsAudio';
import { levelLabel, wordsFor } from '../../../data/screener/letrsBank';
import { scoreLetrs } from '../../../data/screener/letrsScore';
import {
  newScreenerResultId,
  saveScreenerResult,
} from '../../../data/screener/screenerStorage';
import { AppBoard } from '../../../shared/AppBoard';
import { AppPageShell } from '../../../shared/AppPageShell';
import { TYPE } from '../../../shared/typography';
import { LetrsReport } from './LetrsReport';

const METHODS = [
  {
    id: 'individual',
    title: 'By Myself',
    detail: 'The student uses this device, hears the recorded word, and types the spelling.',
  },
  {
    id: 'teacher-reads',
    title: 'Teacher Reads',
    detail: 'The teacher reads each word and sentence. The student types on this device.',
  },
  {
    id: 'teacher-types',
    title: 'Teacher Types',
    detail: 'The test was given on paper. The teacher types what the student wrote.',
  },
];

function primaryBtn(theme, extra = '') {
  return `edu-control rounded-xl px-4 py-2.5 ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary} disabled:opacity-40 ${extra}`;
}

function ghostBtn(theme, extra = '') {
  return `edu-control rounded-xl border-[1.5px] px-4 py-2.5 ${TYPE.labelLg} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline} ${extra}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function stepsFor({ isStudentFrame, lockedStudentId, method }) {
  if (isStudentFrame && lockedStudentId) return ['voice', 'subtest'];
  if (isStudentFrame) return ['student', 'voice', 'subtest'];
  const steps = ['method', 'student'];
  if (method === 'individual') steps.push('voice');
  steps.push('subtest');
  return steps;
}

/**
 * LETRS spelling session: setup wizard, dictation, then a student
 * finish screen or a teacher feature report.
 */
export function LetrsSession({
  theme,
  isDarkMode,
  roster,
  classId,
  classGrade,
  isStudentFrame,
  lockedStudentId,
  lockedName,
  onExit,
}) {
  const [phase, setPhase] = useState('wizard');
  const [step, setStep] = useState(() =>
    isStudentFrame ? (lockedStudentId ? 'voice' : 'student') : 'method',
  );
  const [method, setMethod] = useState(isStudentFrame ? 'individual' : '');
  const [showMethodInfo, setShowMethodInfo] = useState(false);
  const [studentId, setStudentId] = useState(lockedStudentId || '');
  const [manual, setManual] = useState(Boolean(isStudentFrame && !lockedStudentId));
  const [manualName, setManualName] = useState(
    isStudentFrame && !lockedStudentId ? lockedName || '' : '',
  );
  const [teacherName, setTeacherName] = useState('');
  const [voiceId, setVoiceId] = useState(readRecordedVoice);
  const [level, setLevel] = useState('basic');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [draft, setDraft] = useState('');
  const [played, setPlayed] = useState(false);
  const [audioNote, setAudioNote] = useState('');
  const [playing, setPlaying] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(null);
  const audioRef = useRef(null);
  const cancelSpeechRef = useRef(null);
  const inputRef = useRef(null);

  const steps = useMemo(
    () => stepsFor({ isStudentFrame, lockedStudentId, method }),
    [isStudentFrame, lockedStudentId, method],
  );

  const words = wordsFor(level);
  const current = words[index];
  const teacherMode = method === 'teacher-reads' || method === 'teacher-types';
  const student = roster.find((item) => String(item.id) === String(studentId));
  const studentName = manual || !student
    ? manualName.trim()
    : studentDisplayName(student);
  const grade = student?.grade_level || classGrade || '';

  useEffect(() => {
    if (!steps.includes(step)) setStep(steps[0]);
  }, [steps, step]);

  useEffect(() => {
    if (lockedStudentId) {
      setStudentId(lockedStudentId);
      setManual(false);
    }
  }, [lockedStudentId]);

  function stopAudio() {
    audioRef.current?.pause();
    audioRef.current = null;
    cancelSpeechRef.current?.();
    cancelSpeechRef.current = null;
    setPlaying(false);
  }

  useEffect(() => () => {
    audioRef.current?.pause();
    cancelSpeechRef.current?.();
  }, []);

  useEffect(() => {
    if (phase === 'test') inputRef.current?.focus();
  }, [phase, index]);

  function playClip(url, onFail) {
    stopAudio();
    const audio = new Audio(url);
    audioRef.current = audio;
    setPlaying(true);
    let failed = false;
    const fail = () => {
      if (failed) return;
      failed = true;
      setPlaying(false);
      onFail?.();
    };
    audio.onended = () => {
      if (!failed) setPlaying(false);
    };
    audio.onerror = fail;
    audio.play().catch(fail);
  }

  function playHello(id) {
    const next = writeRecordedVoice(id);
    setVoiceId(next);
    setAudioNote('');
    playClip(helloUrl(next), () => {
      setAudioNote('That voice preview did not load. You can still use it for the test.');
    });
  }

  function playWord() {
    if (!current || playing) return;
    setPlayed(true);
    setAudioNote('');
    playClip(clipUrl(level, index, current.word, voiceId), () => {
      cancelSpeechRef.current = speakDictation(current.word, current.sentence, (status) => {
        setPlaying(false);
        if (status) {
          setAudioNote('Audio did not load. Say the word and sentence aloud.');
        }
      });
      setPlaying(true);
    });
  }

  function begin(nextLevel) {
    stopAudio();
    setLevel(nextLevel);
    setIndex(0);
    setAnswers([]);
    setDraft('');
    setPlayed(false);
    setAudioNote('');
    setSaveError('');
    setSaved(null);
    setPhase('test');
  }

  function commitAndGo(nextIndex) {
    const nextAnswers = answers.slice();
    nextAnswers[index] = draft;
    setAnswers(nextAnswers);
    setIndex(nextIndex);
    setDraft(nextAnswers[nextIndex] || '');
    setPlayed(false);
    setAudioNote('');
    stopAudio();
    return nextAnswers;
  }

  function finish(finalAnswers) {
    const record = {
      id: newScreenerResultId(),
      screenerId: 'letrs',
      classId: classId || '',
      studentId: manual ? '' : String(studentId || ''),
      studentName: studentName || 'Student',
      teacherName: teacherName.trim(),
      grade,
      level,
      method,
      voiceId,
      answers: finalAnswers,
      createdAt: new Date().toISOString(),
    };
    try {
      saveScreenerResult(record);
      setSaved(record);
      setSaveError('');
    } catch {
      setSaved(record);
      setSaveError('This result could not be saved on this device.');
    }
    setPhase('done');
  }

  function goNext() {
    if (!draft.trim()) return;
    if (index >= words.length - 1) {
      const nextAnswers = answers.slice();
      nextAnswers[index] = draft;
      stopAudio();
      finish(nextAnswers);
      return;
    }
    commitAndGo(index + 1);
  }

  function goBackWord() {
    if (index === 0) {
      stopAudio();
      setPhase('wizard');
      setStep('subtest');
      return;
    }
    commitAndGo(index - 1);
  }

  const stepIndex = Math.max(0, steps.indexOf(step));
  const canContinue =
    (step === 'method' && method) ||
    (step === 'student' && studentName) ||
    step === 'voice';

  const scored = saved ? scoreLetrs(saved.answers, saved.level) : null;

  return (
    <AppPageShell variant="scroll">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
        <button
          type="button"
          onClick={() => {
            stopAudio();
            onExit();
          }}
          className={`edu-control self-start rounded-xl px-3 py-2 ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
        >
          All screeners
        </button>

        {phase === 'wizard' ? (
          <AppBoard mode="scroll" theme={theme}>
            <div className="mx-auto flex w-full max-w-xl flex-col">
              <div className="flex items-start justify-between gap-3">
                <h2 id="screener-step-title" className={TYPE.titleLg}>
                  {step === 'method' && 'How are you taking the test?'}
                  {step === 'student' && 'Select student'}
                  {step === 'voice' && 'Voice'}
                  {step === 'subtest' && 'Which subtest?'}
                </h2>
                {step === 'method' ? (
                  <button
                    type="button"
                    aria-expanded={showMethodInfo}
                    onClick={() => setShowMethodInfo((open) => !open)}
                    className={`edu-control inline-flex items-center gap-1 rounded-xl px-2 py-2 ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                  >
                    <Info size={18} aria-hidden="true" />
                    About
                  </button>
                ) : null}
              </div>

              {step === 'method' && showMethodInfo ? (
                <ul className="mt-3 space-y-2">
                  {METHODS.map((item) => (
                    <li key={item.id} className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                      <span className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>{item.title}. </span>
                      {item.detail}
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="py-6">
                {step === 'method' ? (
                  <div className="grid gap-3" role="radiogroup" aria-labelledby="screener-step-title">
                    {METHODS.map((item) => {
                      const on = method === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => setMethod(item.id)}
                          className={`edu-control rounded-2xl border-[1.5px] px-4 py-4 text-left ${TYPE.titleSm} ${
                            on
                              ? `${theme.colorPrimary} ${theme.colorOnPrimary} ${theme.colorOutline}`
                              : `${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`
                          }`}
                        >
                          {item.title}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {step === 'student' ? (
                  <StudentStep
                    theme={theme}
                    roster={roster}
                    studentId={studentId}
                    manual={manual}
                    manualName={manualName}
                    teacherName={teacherName}
                    showTeacher={!isStudentFrame}
                    onPick={(id) => {
                      setStudentId(id);
                      setManual(false);
                    }}
                    onManual={() => {
                      setManual(true);
                      setStudentId('');
                    }}
                    onRoster={() => setManual(false)}
                    onManualName={setManualName}
                    onTeacherName={setTeacherName}
                  />
                ) : null}

                {step === 'voice' ? (
                  <div>
                    <p className={`mb-4 text-center ${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
                      Tap a circle to hear Hello.
                    </p>
                    <div className="mx-auto grid max-w-md grid-cols-2 justify-items-center gap-6">
                      {RECORDED_VOICES.map((voice) => {
                        const on = voiceId === voice.id;
                        return (
                          <button
                            key={voice.id}
                            type="button"
                            onClick={() => playHello(voice.id)}
                            className="edu-control flex flex-col items-center gap-2"
                          >
                            <span
                              className={`flex h-20 w-20 items-center justify-center rounded-full border-[1.5px] ${TYPE.displaySm} ${
                                on
                                  ? `${theme.colorPrimary} ${theme.colorOnPrimary} ${theme.colorOutline}`
                                  : `${theme.colorSurfaceVariant} ${theme.colorOnSurface} ${theme.colorOutline}`
                              }`}
                            >
                              {voice.n}
                            </span>
                            <span className={`${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}>
                              {voice.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {audioNote ? (
                      <p className={`mt-4 text-center ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                        {audioNote}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {step === 'subtest' ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button type="button" className={primaryBtn(theme)} onClick={() => begin('basic')}>
                      Basic (K–2)
                    </button>
                    <button type="button" className={ghostBtn(theme)} onClick={() => begin('advanced')}>
                      Advanced (3–5)
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="mt-2 flex items-center justify-between gap-3">
                {stepIndex > 0 ? (
                  <button
                    type="button"
                    className={ghostBtn(theme)}
                    onClick={() => setStep(steps[stepIndex - 1])}
                  >
                    Back
                  </button>
                ) : (
                  <span />
                )}
                {step !== 'subtest' ? (
                  <button
                    type="button"
                    className={primaryBtn(theme)}
                    disabled={!canContinue}
                    onClick={() => setStep(steps[stepIndex + 1])}
                  >
                    Continue
                  </button>
                ) : (
                  <span />
                )}
              </div>
              <div className="mt-4 flex justify-center gap-2" aria-hidden="true">
                {steps.map((id, dot) => (
                  <span
                    key={id}
                    className={`h-2.5 w-2.5 rounded-full ${
                      dot === stepIndex ? theme.colorPrimary : theme.colorSurfaceVariant
                    }`}
                  />
                ))}
              </div>
            </div>
          </AppBoard>
        ) : null}

        {phase === 'test' && current ? (
          <AppBoard mode="scroll" theme={theme}>
            <div className="mx-auto flex w-full max-w-xl flex-col items-center py-4">
              <div
                className={`mb-2 h-2 w-full overflow-hidden rounded-full ${theme.colorSurfaceVariant}`}
                aria-hidden="true"
              >
                <div
                  className={`h-full ${theme.colorPrimary}`}
                  style={{ width: `${(index / words.length) * 100}%` }}
                />
              </div>
              <p className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
                Word {index + 1} of {words.length}
                <span className="sr-only">, {levelLabel(level)}</span>
              </p>

              {teacherMode ? (
                <div
                  className={`mt-4 w-full rounded-2xl border-[1.5px] px-4 py-3 text-center ${theme.colorSurfaceVariant} ${theme.colorOutline}`}
                >
                  <p className={`${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}>Target word</p>
                  <p className={`mt-1 ${TYPE.displaySm} ${theme.colorOnSurface}`}>{current.word}</p>
                  <p className={`mt-2 ${TYPE.bodyMd} ${theme.colorOnSurface}`}>
                    {current.sentence}
                  </p>
                  <p className={`mt-2 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                    {method === 'teacher-types'
                      ? 'Type the spelling the student wrote.'
                      : 'Read the word, then the sentence. The student types below.'}
                  </p>
                </div>
              ) : null}

              {method !== 'teacher-types' ? (
                <button
                  type="button"
                  onClick={playWord}
                  disabled={playing}
                  className={`edu-control mt-6 flex h-24 w-24 items-center justify-center rounded-full border-[1.5px] disabled:opacity-60 ${theme.colorPrimary} ${theme.colorOnPrimary} ${theme.colorOutline}`}
                  aria-label={played ? 'Replay word' : 'Play word'}
                >
                  {played ? <RotateCcw size={36} /> : <Play size={36} className="ml-1" />}
                </button>
              ) : null}
              {audioNote ? (
                <p className={`mt-3 text-center ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`} role="status">
                  {audioNote}
                </p>
              ) : null}

              <label
                htmlFor="letrs-spelling"
                className={`mt-6 ${TYPE.labelLg} ${theme.colorOnSurface}`}
              >
                {teacherMode ? 'Student spelling' : 'Type the word'}
              </label>
              <input
                id="letrs-spelling"
                ref={inputRef}
                value={draft}
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    goNext();
                  }
                }}
                className={`edu-control mt-2 w-full rounded-2xl border-[1.5px] px-4 py-3 text-center ${TYPE.displaySm} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
              />

              <div className="mt-6 flex w-full justify-between gap-3">
                <button type="button" className={ghostBtn(theme)} onClick={goBackWord}>
                  Back
                </button>
                <button
                  type="button"
                  className={primaryBtn(theme)}
                  disabled={!draft.trim()}
                  onClick={goNext}
                >
                  {index === words.length - 1 ? 'Finish' : 'Next word'}
                </button>
              </div>
            </div>
          </AppBoard>
        ) : null}

        {phase === 'done' && saved && scored ? (
          teacherMode ? (
            <AppBoard mode="scroll" theme={theme}>
              <LetrsReport
                scored={scored}
                isDarkMode={isDarkMode}
                theme={theme}
                meta={{
                  studentName: saved.studentName,
                  teacherName: saved.teacherName,
                  grade: saved.grade,
                  dateLabel: formatDate(saved.createdAt),
                }}
                actions={
                  <>
                    <button type="button" className={primaryBtn(theme)} onClick={() => window.print()}>
                      Print
                    </button>
                    <button
                      type="button"
                      className={ghostBtn(theme)}
                      onClick={() => {
                        setPhase('wizard');
                        setStep(steps[0]);
                      }}
                    >
                      Start new assessment
                    </button>
                  </>
                }
              />
              {saveError ? (
                <p className={`mt-3 ${TYPE.bodySm} ${theme.colorOnErrorContainer}`} role="status">
                  {saveError}
                </p>
              ) : null}
            </AppBoard>
          ) : (
            <AppBoard mode="scroll" theme={theme}>
              <div className="mx-auto flex min-h-[24rem] max-w-lg flex-col items-center justify-center text-center">
                <h2 className={TYPE.titleLg}>
                  Nice work{saved.studentName ? `, ${saved.studentName}` : ''}!
                </h2>
                <p className={`mt-4 ${TYPE.displayMd} ${theme.text}`}>
                  {scored.wordsCorrect}/{scored.wordsTotal}
                </p>
                <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>words correct</p>
                <p className={`mt-4 ${TYPE.labelMd} tracking-wide ${theme.colorOnSurfaceVariant}`}>
                  You finished the {levelLabel(saved.level)} screener
                </p>
                {saveError ? (
                  <p className={`mt-3 ${TYPE.bodySm}`} role="status">
                    {saveError}
                  </p>
                ) : (
                  <p className={`mt-3 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                    Your teacher has your results.
                  </p>
                )}
                <button
                  type="button"
                  className={`${primaryBtn(theme)} mt-6`}
                  onClick={() => {
                    if (isStudentFrame) onExit();
                    else {
                      setPhase('wizard');
                      setStep(steps[0]);
                    }
                  }}
                >
                  Done
                </button>
              </div>
            </AppBoard>
          )
        ) : null}
      </div>
    </AppPageShell>
  );
}

function StudentStep({
  theme,
  roster,
  studentId,
  manual,
  manualName,
  teacherName,
  showTeacher,
  onPick,
  onManual,
  onRoster,
  onManualName,
  onTeacherName,
}) {
  const sorted = [...roster].sort((a, b) =>
    studentDisplayName(a).localeCompare(studentDisplayName(b)),
  );

  return (
    <div>
      {sorted.length > 0 && !manual ? (
        <>
          <div
            className="grid grid-cols-2 gap-2 sm:grid-cols-4"
            role="radiogroup"
            aria-label="Select a student"
          >
            {sorted.map((item) => {
              const on = String(item.id) === String(studentId);
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => onPick(item.id)}
                  className={`edu-control rounded-xl border-[1.5px] px-2 py-3 ${TYPE.labelMd} ${
                    on
                      ? `${theme.colorPrimary} ${theme.colorOnPrimary} ${theme.colorOutline}`
                      : `${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`
                  }`}
                >
                  {studentDisplayName(item)}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={onManual}
            className={`edu-control mt-3 ${TYPE.labelMd} underline ${theme.colorOnSurfaceVariant}`}
          >
            I don&apos;t see my name
          </button>
        </>
      ) : (
        <>
          <label htmlFor="screener-manual-name" className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>
            Student name
          </label>
          <input
            id="screener-manual-name"
            value={manualName}
            onChange={(event) => onManualName(event.target.value)}
            placeholder="First and last name"
            className={`edu-control mt-2 w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
          />
          {sorted.length > 0 ? (
            <button
              type="button"
              onClick={onRoster}
              className={`edu-control mt-3 ${TYPE.labelMd} underline ${theme.colorOnSurfaceVariant}`}
            >
              Choose from the class
            </button>
          ) : (
            <p className={`mt-2 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              This class has no students yet. Type a name to continue.
            </p>
          )}
        </>
      )}
      {showTeacher ? (
        <div className="mt-4">
          <label htmlFor="screener-teacher" className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>
            Teacher <span className={theme.colorOnSurfaceVariant}>(on the report)</span>
          </label>
          <input
            id="screener-teacher"
            value={teacherName}
            onChange={(event) => onTeacherName(event.target.value)}
            className={`edu-control mt-2 w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
          />
        </div>
      ) : null}
    </div>
  );
}
