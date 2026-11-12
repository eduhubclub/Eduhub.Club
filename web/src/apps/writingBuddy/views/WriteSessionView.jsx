import { useEffect, useState } from 'react';
import {
  BUDDY_PORTRAITS,
  CUSTOM_PORTRAIT_ID,
  DEFAULT_BODY_COUNT,
  GENRES,
  LENGTHS,
  MAX_BODY_COUNT,
  MIN_BODY_COUNT,
  PRESET_BODY_COUNTS,
  clampBodyCount,
  portraitById,
} from '../../../data/writingBuddy/constants';
import {
  assembleDraft,
  buildSteps,
  validatePiece,
} from '../../../data/writingBuddy/buildSteps';
import {
  readAllowCustomBuddyPhotos,
  WRITING_BUDDY_SETTINGS_EVENT,
} from '../../../data/writingBuddy/settings';
import {
  assignedTemplateIdForClass,
  getProfile,
  getTemplate,
  listAssignableTemplates,
  readProfiles,
  upsertDraft,
} from '../../../data/writingBuddy/storage';
import { countSectionQuestions } from '../../../data/writingBuddy/sectionQuestions';
import { AppBoard } from '../../../shared/AppBoard';
import { SegmentControl } from '../../../shared/SegmentControl';
import { TYPE } from '../../../shared/typography';
import { BuddyPortrait } from '../components/BuddyPortrait';
import { BuddyPhotoActions } from '../components/BuddyPhotoActions';
import { EssayShapeViz } from '../components/EssayShapeViz';
import { SpeechBubble } from '../components/SpeechBubble';
import {
  WriteChrome,
  WriteNavRow,
  WriteProgressBar,
} from '../components/WriteChrome';
import {
  HookTypeCards,
  hookPlaceholder,
  isHookPrompt,
} from '../components/HookTypeCards';
import { EditGate } from '../components/EditGate';

const ONBOARD_STEPS = ['buddy', 'topic', 'genre', 'length', 'bodyCount'];

const ONBOARD_STEP_LABELS = {
  buddy: 'Buddy',
  topic: 'Topic',
  genre: 'Type',
  length: 'Length',
  bodyCount: 'Paragraphs',
};

/**
 * Student writing session: onboarding → step runner → assemble / save.
 */
export function WriteSessionView({
  theme,
  isDarkMode = false,
  classId,
  studentId,
  studentLabel,
  isStudentFrame = false,
}) {
  const [phase, setPhase] = useState('onboard'); // onboard | run | done
  const profiles = readProfiles();
  const templates = listAssignableTemplates();
  const [onboardIndex, setOnboardIndex] = useState(0);
  const [portraitId, setPortraitId] = useState(BUDDY_PORTRAITS[0].id);
  const [portraitImage, setPortraitImage] = useState('');
  const [buddyName, setBuddyName] = useState('Sunny');
  const [profileId, setProfileId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [topic, setTopic] = useState('');
  const [genre, setGenre] = useState('');
  const [length, setLength] = useState('essay');
  const [bodyCount, setBodyCount] = useState(DEFAULT_BODY_COUNT);
  const [steps, setSteps] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [pieces, setPieces] = useState({});
  const [draftId, setDraftId] = useState('');
  const [nudge, setNudge] = useState('');
  const [draftText, setDraftText] = useState('');
  const [hookTypeId, setHookTypeId] = useState('');

  const activeTemplate = templateId ? getTemplate(templateId) : null;
  const hasTemplateQs = countSectionQuestions(activeTemplate?.questions) > 0;
  const classAssignedTemplateId = assignedTemplateIdForClass(classId);
  const visibleOnboard = ONBOARD_STEPS.filter((k) => {
    if (k === 'genre') return !hasTemplateQs;
    if (k === 'length') return !hasTemplateQs;
    if (k === 'bodyCount') return !hasTemplateQs && length === 'essay';
    return true;
  });
  const visibleIndex = Math.min(
    onboardIndex,
    Math.max(0, visibleOnboard.length - 1),
  );
  const currentOnboard = visibleOnboard[visibleIndex] || 'buddy';

  useEffect(() => {
    const p = portraitById(portraitId);
    if (!profileId && !portraitImage) setBuddyName(p.label);
  }, [portraitId, portraitImage, profileId]);

  useEffect(() => {
    setHookTypeId('');
  }, [stepIndex]);

  useEffect(() => {
    const assigned = assignedTemplateIdForClass(classId);
    if (assigned && getTemplate(assigned)) {
      applyTemplate(assigned);
      return;
    }
    setTemplateId('');
  }, [classId]);

  function applyProfile(id) {
    setProfileId(id);
    const profile = getProfile(id);
    if (!profile) return;
    setPortraitId(profile.portraitId);
    setPortraitImage(profile.portraitImage || '');
    setBuddyName(profile.name);
  }

  function applyTemplate(id) {
    const template = getTemplate(id);
    if (!template) {
      setTemplateId('');
      return;
    }
    setTemplateId(template.id);
    if (template.genre) setGenre(template.genre);
    if (template.length) setLength(template.length);
    if (template.bodyCount) setBodyCount(template.bodyCount);
  }

  function clearTemplate() {
    setTemplateId('');
  }

  function startRun() {
    if (!topic.trim()) return;
    const template = templateId ? getTemplate(templateId) : null;
    const hasCustomQs = countSectionQuestions(template?.questions) > 0;
    if (!hasCustomQs && !genre) return;
    const runLength = template?.length || length;
    const runBody = template?.bodyCount || bodyCount;
    const runGenre = template?.genre || genre || 'opinion';
    const nextSteps = buildSteps({
      genre: runGenre,
      length: runLength,
      topic,
      bodyCount: runBody,
      profileQuestions: hasCustomQs ? template.questions : undefined,
    });
    setSteps(nextSteps);
    setStepIndex(0);
    setPieces({});
    setDraftText('');
    setNudge('');
    setPhase('run');

    if (classId && studentId) {
      const saved = upsertDraft({
        id: draftId || undefined,
        classId,
        studentId,
        topic,
        genre: runGenre,
        length: runLength,
        bodyCount: runBody,
        profileId: profileId || null,
        templateId: templateId || null,
        buddyName,
        portraitId,
        portraitImage: portraitImage || null,
        pieces: {},
        draftText: '',
        stepIndex: 0,
        status: 'in_progress',
      });
      if (saved) setDraftId(saved.id);
    }
  }

  function persist(nextPieces, nextIndex, status, text) {
    if (!classId || !studentId) return;
    const saved = upsertDraft({
      id: draftId || undefined,
      classId,
      studentId,
      topic,
      genre,
      length,
      bodyCount,
      profileId: profileId || null,
      templateId: templateId || null,
      buddyName,
      portraitId,
      portraitImage: portraitImage || null,
      pieces: nextPieces,
      draftText: text ?? draftText,
      stepIndex: nextIndex,
      status: status || 'in_progress',
    });
    if (saved && !draftId) setDraftId(saved.id);
  }

  const step = steps[stepIndex] || null;
  const promptCount = steps.filter((s) => s.kind === 'prompt').length;
  const promptDone = steps
    .slice(0, stepIndex + 1)
    .filter((s) => s.kind === 'prompt').length;

  function currentPieceText() {
    if (!step?.pieceKey) return draftText;
    return pieces[step.pieceKey] || '';
  }

  function setCurrentPieceText(value) {
    if (step?.kind === 'finalEdit' || step?.kind === 'assemble') {
      setDraftText(value);
      return;
    }
    if (!step?.pieceKey) return;
    setPieces((prev) => ({ ...prev, [step.pieceKey]: value }));
  }

  function goNext() {
    const nextIndex = stepIndex + 1;
    if (nextIndex >= steps.length) {
      const text = draftText || assembleDraft(steps, pieces);
      setDraftText(text);
      setPhase('done');
      persist(pieces, stepIndex, 'done', text);
      return;
    }
    const next = steps[nextIndex];
    if (next?.kind === 'assemble') {
      const text = assembleDraft(steps, pieces);
      setDraftText(text);
    }
    setStepIndex(nextIndex);
    setNudge('');
    persist(pieces, nextIndex, 'in_progress', draftText);
  }

  function onPromptContinue() {
    const text = currentPieceText();
    const result = validatePiece(step, text);
    if (result === 'empty') {
      setNudge(step.nudgeEmpty || 'Write something first.');
      return;
    }
    if (result === 'short' && nudge !== 'short-ok') {
      setNudge(step.nudgeShort || 'Can you add a little more?');
      return;
    }
    setNudge('');
    goNext();
  }

  function resetSession() {
    setPhase('onboard');
    setOnboardIndex(0);
    setSteps([]);
    setStepIndex(0);
    setPieces({});
    setDraftText('');
    setDraftId('');
    setNudge('');
    setTopic('');
    setGenre('');
    const assigned = assignedTemplateIdForClass(classId);
    if (assigned && getTemplate(assigned)) applyTemplate(assigned);
    else setTemplateId('');
  }

  if (phase === 'done') {
    return (
      <DoneView
        theme={theme}
        buddyName={buddyName}
        portraitId={portraitId}
        portraitImage={portraitImage}
        draftText={draftText}
        studentLabel={studentLabel}
        onAgain={resetSession}
      />
    );
  }

  if (phase === 'onboard') {
    return (
      <OnboardView
        theme={theme}
        current={currentOnboard}
        steps={visibleOnboard}
        index={visibleIndex}
        total={visibleOnboard.length}
        portraitId={portraitId}
        setPortraitId={setPortraitId}
        portraitImage={portraitImage}
        setPortraitImage={setPortraitImage}
        buddyName={buddyName}
        setBuddyName={setBuddyName}
        profiles={profiles}
        profileId={profileId}
        applyProfile={applyProfile}
        clearProfile={() => {
          setProfileId('');
          setPortraitImage('');
        }}
        templates={templates}
        templateId={templateId}
        applyTemplate={applyTemplate}
        clearTemplate={clearTemplate}
        classAssignedTemplateId={classAssignedTemplateId}
        topic={topic}
        setTopic={setTopic}
        genre={genre}
        setGenre={setGenre}
        length={length}
        setLength={setLength}
        bodyCount={bodyCount}
        setBodyCount={setBodyCount}
        studentLabel={studentLabel}
        isStudentFrame={isStudentFrame}
        isDarkMode={isDarkMode}
        onSelectStep={(key) => {
          const fullIdx = ONBOARD_STEPS.indexOf(key);
          if (fullIdx >= 0) setOnboardIndex(fullIdx);
        }}
        onBack={() => {
          if (visibleIndex <= 0) return;
          const prevKey = visibleOnboard[visibleIndex - 1];
          const fullIdx = ONBOARD_STEPS.indexOf(prevKey);
          setOnboardIndex(fullIdx >= 0 ? fullIdx : onboardIndex - 1);
        }}
        onNext={() => {
          if (currentOnboard === 'topic' && !topic.trim()) return;
          if (currentOnboard === 'genre' && !genre) return;
          if (currentOnboard === 'length' && !length) return;
          if (visibleIndex >= visibleOnboard.length - 1) {
            startRun();
            return;
          }
          const nextKey = visibleOnboard[visibleIndex + 1];
          const fullIdx = ONBOARD_STEPS.indexOf(nextKey);
          setOnboardIndex(fullIdx >= 0 ? fullIdx : onboardIndex + 1);
        }}
      />
    );
  }

  // run phase
  if (!step) return null;

  if (step.kind === 'edit' || step.kind === 'finalEdit') {
    const isFinal = step.kind === 'finalEdit';
    const text = isFinal
      ? draftText || assembleDraft(steps, pieces)
      : pieces[step.pieceKey] || '';
    return (
      <EditGate
        theme={theme}
        buddyName={buddyName}
        portraitId={portraitId}
        portraitImage={portraitImage}
        prompt={
          isFinal
            ? 'Last check! Let’s look at your words and make sure it all makes sense.'
            : 'Nice writing! Let’s check your words.'
        }
        text={text}
        onChangeText={(value) => {
          if (isFinal) setDraftText(value);
          else setPieces((prev) => ({ ...prev, [step.pieceKey]: value }));
        }}
        onBack={() => setStepIndex((i) => Math.max(0, i - 1))}
        onContinue={() => {
          if (isFinal) {
            const textNow = draftText || assembleDraft(steps, pieces);
            setDraftText(textNow);
            setPhase('done');
            persist(pieces, stepIndex, 'done', textNow);
            return;
          }
          goNext();
        }}
        continueLabel={isFinal ? 'Finish' : 'Continue'}
      />
    );
  }

  if (step.kind === 'assemble') {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3 md:flex-row md:gap-4">
        <BuddyColumn
          theme={theme}
          portraitId={portraitId}
          portraitImage={portraitImage}
          buddyName={buddyName}
          bubble="Nice work — here’s your draft so far. Read it, then we’ll do one last check."
        />
        <AppBoard mode="scroll" pad="board" theme={theme} className="min-h-0 flex-1">
          <p className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>Your draft</p>
          <pre
            className={`mt-3 whitespace-pre-wrap rounded-xl border-[1.5px] p-4 ${TYPE.bodyMd} ${theme.colorSurfaceVariant || theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
          >
            {draftText || '(empty)'}
          </pre>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className={`edu-control rounded-xl border-[1.5px] px-4 py-2 ${TYPE.labelLg} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            >
              Back
            </button>
            <button
              type="button"
              className={`edu-control rounded-xl px-4 py-2 ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
              onClick={goNext}
            >
              Final check
            </button>
          </div>
        </AppBoard>
      </div>
    );
  }

  // prompt write step — mobile-first: chrome row, open write surface, bottom progress
  const showKeepGoing =
    nudge &&
    nudge !== 'short-ok' &&
    validatePiece(step, currentPieceText()) === 'short';
  const promptText = nudge && nudge !== 'short-ok' ? nudge : step.prompt;
  const showHookCards = isHookPrompt(step.prompt) && !nudge;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <WriteChrome
        theme={theme}
        portraitId={portraitId}
        portraitImage={portraitImage}
        buddyName={buddyName}
        pose="writing"
        bubble={promptText}
        actions={
          <>
            {showHookCards ? (
              <HookTypeCards
                theme={theme}
                value={hookTypeId}
                topic={topic}
                onChange={(opt) => {
                  setHookTypeId(opt.id);
                  const sample = opt.example(
                    String(topic || '').trim() || 'this topic',
                  );
                  // Offer a starter only when the box is still empty.
                  if (sample && !String(currentPieceText() || '').trim()) {
                    setCurrentPieceText(sample);
                  }
                }}
              />
            ) : null}
            {showKeepGoing ? (
              <button
                type="button"
                className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelLg} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
                onClick={() => {
                  setNudge('short-ok');
                  goNext();
                }}
              >
                Keep going
              </button>
            ) : null}
          </>
        }
      />

      <WriteNavRow
        theme={theme}
        onBack={() => setStepIndex((i) => Math.max(0, i - 1))}
        backDisabled={stepIndex <= 0}
        onNext={onPromptContinue}
      >
        <textarea
          className={`min-h-0 w-full flex-1 resize-none bg-transparent px-1 py-2 outline-none ${TYPE.titleLg} leading-relaxed ${theme.colorOnSurface} placeholder:opacity-40`}
          value={currentPieceText()}
          spellCheck
          autoFocus
          aria-label="Write your answer"
          placeholder={
            showHookCards
              ? hookPlaceholder(hookTypeId, topic)
              : 'Start writing…'
          }
          onChange={(e) => {
            setCurrentPieceText(e.target.value);
            if (nudge) setNudge('');
          }}
        />
      </WriteNavRow>

      <WriteProgressBar
        theme={theme}
        current={Math.min(promptDone, promptCount)}
        total={promptCount}
      />
    </div>
  );
}

/** First name for buddy greetings; strips “Teacher · …” preview labels. */
function firstNameFromLabel(label) {
  const raw = String(label || '').trim();
  if (!raw) return '';
  const withoutRole = raw.includes('·') ? raw.split('·').pop().trim() : raw;
  return withoutRole.split(/\s+/).filter(Boolean)[0] || '';
}

function BuddyColumn({
  theme,
  portraitId,
  portraitImage = '',
  buddyName,
  bubble,
  pose = 'idle',
}) {
  return (
    <div className="flex w-full shrink-0 flex-row items-center gap-3 md:w-48 md:flex-col xl:w-56">
      <BuddyPortrait
        theme={theme}
        portraitId={portraitId}
        imageUrl={portraitImage}
        name={buddyName}
        size="lg"
        pose={pose}
        className="shrink-0"
      />
      <SpeechBubble theme={theme} className="min-w-0 flex-1 md:w-full">
        {bubble}
      </SpeechBubble>
    </div>
  );
}

function OnboardView({
  theme,
  current,
  steps = ONBOARD_STEPS,
  index,
  total,
  portraitId,
  setPortraitId,
  portraitImage,
  setPortraitImage,
  buddyName,
  setBuddyName,
  profiles,
  profileId,
  applyProfile,
  clearProfile,
  templates = [],
  templateId = '',
  applyTemplate,
  clearTemplate,
  classAssignedTemplateId = '',
  topic,
  setTopic,
  genre,
  setGenre,
  length,
  setLength,
  bodyCount,
  setBodyCount,
  studentLabel = '',
  isStudentFrame = false,
  isDarkMode = false,
  onSelectStep,
  onBack,
  onNext,
}) {
  const [allowCustomPhotos, setAllowCustomPhotos] = useState(
    readAllowCustomBuddyPhotos,
  );
  const isCustom = Boolean(portraitImage) && !profileId && allowCustomPhotos;
  const isPreset = !profileId && !portraitImage;
  const greetName = firstNameFromLabel(studentLabel);
  const hi = greetName ? `Hi, ${greetName}!` : 'Hi!';

  useEffect(() => {
    const onChange = (e) => {
      if (typeof e?.detail?.allowCustomBuddyPhotos === 'boolean') {
        setAllowCustomPhotos(e.detail.allowCustomBuddyPhotos);
      } else {
        setAllowCustomPhotos(readAllowCustomBuddyPhotos());
      }
    };
    window.addEventListener(WRITING_BUDDY_SETTINGS_EVENT, onChange);
    return () => window.removeEventListener(WRITING_BUDDY_SETTINGS_EVENT, onChange);
  }, []);

  // If teacher turns uploads off mid-session, fall back to a preset.
  useEffect(() => {
    if (allowCustomPhotos || !portraitImage || profileId) return;
    const first = BUDDY_PORTRAITS[0];
    setPortraitImage('');
    setPortraitId(first.id);
    setBuddyName(first.label);
  }, [
    allowCustomPhotos,
    portraitImage,
    profileId,
    setPortraitImage,
    setPortraitId,
    setBuddyName,
  ]);

  const bubble =
    current === 'buddy'
      ? allowCustomPhotos
        ? `${hi} I’m your writing buddy. Pick a preset, or add your own picture.`
        : `${hi} I’m your writing buddy. Pick me, then we’ll write piece by piece.`
      : current === 'topic'
        ? 'What are you writing about today?'
        : current === 'genre'
          ? 'What kind of writing is this?'
          : current === 'length'
            ? 'How long does it need to be?'
            : 'How many body paragraphs for your essay?';

  function applyCustomImage(dataUrl) {
    clearProfile();
    setPortraitId(CUSTOM_PORTRAIT_ID);
    setPortraitImage(dataUrl);
    const presetLabels = new Set(BUDDY_PORTRAITS.map((p) => p.label));
    if (!buddyName.trim() || presetLabels.has(buddyName)) {
      setBuddyName('My Buddy');
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 md:flex-row md:gap-4">
      <BuddyColumn
        theme={theme}
        portraitId={portraitId}
        portraitImage={allowCustomPhotos ? portraitImage : ''}
        buddyName={buddyName}
        bubble={bubble}
      />
      <AppBoard mode="scroll" pad="board" theme={theme} className="min-h-0 flex-1">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
              Get started · {index + 1} / {total}
            </p>
          </div>
          <SegmentControl
            theme={theme}
            isDarkMode={isDarkMode}
            fullWidth
            value={current}
            onChange={(id) => onSelectStep?.(id)}
            options={steps.map((id) => ({
              id,
              label: ONBOARD_STEP_LABELS[id] || id,
            }))}
          />
        </div>

        {current === 'buddy' ? (
          <div className="mt-4 space-y-4">
            <p className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>Choose a buddy</p>
            <div className="flex flex-wrap items-end gap-3">
              {BUDDY_PORTRAITS.map((p) => {
                const on = isPreset && portraitId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={on}
                    className={`edu-control rounded-2xl border-[1.5px] p-2.5 ${
                      on
                        ? `${theme.colorPrimary} ${theme.colorOutline}`
                        : `${theme.colorSurface} ${theme.colorOutline}`
                    }`}
                    onClick={() => {
                      clearProfile();
                      setPortraitImage('');
                      setPortraitId(p.id);
                      setBuddyName(p.label);
                    }}
                  >
                    <BuddyPortrait theme={theme} portraitId={p.id} name={p.label} size="sm" />
                  </button>
                );
              })}
              {allowCustomPhotos ? (
                <BuddyPhotoActions
                  theme={theme}
                  isDarkMode={isDarkMode}
                  active={isCustom}
                  imageUrl={portraitImage}
                  name={buddyName}
                  onApplyImage={applyCustomImage}
                  onActivateExisting={() => {
                    clearProfile();
                    setPortraitId(CUSTOM_PORTRAIT_ID);
                  }}
                />
              ) : null}
            </div>

            {isCustom ? (
              <label className={`block max-w-xs space-y-1.5 ${TYPE.labelMd} ${theme.colorOnSurface}`}>
                Name your buddy
                <input
                  className={`edu-control w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
                  value={buddyName}
                  onChange={(e) => setBuddyName(e.target.value)}
                  placeholder="My Buddy"
                />
              </label>
            ) : (
              <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                {profileId
                  ? 'This buddy keeps the name your teacher gave them.'
                  : allowCustomPhotos
                    ? 'Preset buddies keep their names. Add a photo to make one you can name.'
                    : 'Preset buddies keep their names.'}
              </p>
            )}

            {profiles.length ? (
              <div>
                <p className={`${TYPE.labelMd} mt-1 ${theme.colorOnSurface}`}>
                  {isStudentFrame
                    ? 'Or pick a buddy your teacher made'
                    : 'Or use a teacher Buddy'}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {profiles.map((p) => {
                    const on = profileId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        aria-pressed={on}
                        className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${
                          on
                            ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                            : `${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`
                        }`}
                        onClick={() => applyProfile(p.id)}
                      >
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {templates.length ? (
              <div>
                <p className={`${TYPE.labelMd} mt-3 ${theme.colorOnSurface}`}>
                  Writing template
                </p>
                <p className={`${TYPE.bodySm} mt-0.5 ${theme.colorOnSurfaceVariant}`}>
                  {classAssignedTemplateId
                    ? 'Your teacher assigned a template for this class. You can still pick any buddy.'
                    : 'Optional — use a template, or write with the built-in genre steps.'}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {!classAssignedTemplateId ? (
                    <button
                      type="button"
                      aria-pressed={!templateId}
                      className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${
                        !templateId
                          ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                          : `${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`
                      }`}
                      onClick={() => clearTemplate?.()}
                    >
                      Free write
                    </button>
                  ) : null}
                  {templates.map((t) => {
                    const on = templateId === t.id;
                    const locked =
                      Boolean(classAssignedTemplateId) &&
                      t.id !== classAssignedTemplateId &&
                      isStudentFrame;
                    if (locked) return null;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        aria-pressed={on}
                        disabled={
                          Boolean(classAssignedTemplateId) &&
                          isStudentFrame &&
                          t.id !== classAssignedTemplateId
                        }
                        className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${
                          on
                            ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                            : `${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`
                        }`}
                        onClick={() => applyTemplate?.(t.id)}
                      >
                        {t.name}
                        {t.curriculumName ? ` · ${t.curriculumName}` : ''}
                        {t.id === classAssignedTemplateId ? ' · Assigned' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {current === 'topic' ? (
          <label className={`mt-4 block ${TYPE.labelMd} ${theme.colorOnSurface}`}>
            Topic
            <input
              className={`mt-2 w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
              value={topic}
              placeholder="e.g. why recess should be longer"
              onChange={(e) => setTopic(e.target.value)}
            />
          </label>
        ) : null}

        {current === 'genre' ? (
          <ChoiceGrid
            theme={theme}
            options={GENRES}
            value={genre}
            onChange={setGenre}
          />
        ) : null}

        {current === 'length' ? (
          <ChoiceGrid
            theme={theme}
            options={LENGTHS}
            value={length}
            onChange={setLength}
          />
        ) : null}

        {current === 'bodyCount' ? (
          <BodyCountPicker
            theme={theme}
            bodyCount={bodyCount}
            setBodyCount={setBodyCount}
          />
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={index <= 0}
            className={`edu-control rounded-xl border-[1.5px] px-4 py-2 ${TYPE.labelLg} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline} disabled:opacity-40`}
            onClick={onBack}
          >
            Back
          </button>
          <button
            type="button"
            disabled={
              (current === 'topic' && !topic.trim()) ||
              (current === 'genre' && !genre) ||
              (current === 'length' && !length)
            }
            className={`edu-control rounded-xl px-4 py-2 ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary} disabled:opacity-40`}
            onClick={onNext}
          >
            {index >= total - 1 ? 'Start writing' : 'Next'}
          </button>
        </div>
      </AppBoard>
    </div>
  );
}

function BodyCountPicker({ theme, bodyCount, setBodyCount }) {
  const isCustom = !PRESET_BODY_COUNTS.includes(bodyCount);
  const cardClass = (on) =>
    `edu-control flex min-w-[9.5rem] max-w-[12rem] flex-1 flex-col gap-2 rounded-2xl border-[1.5px] p-3 text-left ${
      on
        ? `${theme.colorPrimary} ${theme.colorOutline}`
        : `${theme.colorSurface} ${theme.colorOutline}`
    }`;

  return (
    <div className="mt-4 space-y-3">
      <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
        Intro and conclusion are included. Pick how many body paragraphs sit in the middle.
      </p>
      <div className="flex flex-wrap gap-3">
        {PRESET_BODY_COUNTS.map((n) => {
          const on = bodyCount === n;
          return (
            <button
              key={n}
              type="button"
              aria-pressed={on}
              className={cardClass(on)}
              onClick={() => setBodyCount(clampBodyCount(n))}
            >
              <EssayShapeViz bodyCount={n} />
              <span
                className={`${TYPE.labelLg} ${
                  on ? theme.colorOnPrimary : theme.colorOnSurface
                }`}
              >
                {n} body {n === 1 ? 'paragraph' : 'paragraphs'}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={isCustom}
          className={cardClass(isCustom)}
          onClick={() => {
            if (!isCustom) setBodyCount(clampBodyCount(4));
          }}
        >
          <EssayShapeViz bodyCount={isCustom ? bodyCount : 4} />
          <span
            className={`${TYPE.labelLg} ${
              isCustom ? theme.colorOnPrimary : theme.colorOnSurface
            }`}
          >
            Custom
          </span>
        </button>
      </div>
      {isCustom ? (
        <label
          className={`flex max-w-xs flex-wrap items-center gap-2 ${TYPE.labelMd} ${theme.colorOnSurface}`}
        >
          Body paragraphs
          <input
            type="number"
            min={MIN_BODY_COUNT}
            max={MAX_BODY_COUNT}
            className={`edu-control w-20 rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
            value={bodyCount}
            onChange={(e) => setBodyCount(clampBodyCount(e.target.value))}
          />
          <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            ({MIN_BODY_COUNT}–{MAX_BODY_COUNT})
          </span>
        </label>
      ) : null}
    </div>
  );
}

function ChoiceGrid({ theme, options, value, onChange }) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      {options.map((opt) => {
        const on = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={on}
            className={`edu-control rounded-2xl border-[1.5px] p-4 text-left ${
              on
                ? `${theme.colorPrimary} ${theme.colorOnPrimary} ${theme.colorOutline}`
                : `${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`
            }`}
            onClick={() => onChange(opt.id)}
          >
            <p className={TYPE.titleSm}>{opt.label}</p>
            <p
              className={`${TYPE.bodySm} mt-1.5 ${
                on ? 'opacity-90' : theme.colorOnSurfaceVariant
              }`}
            >
              {opt.blurb}
            </p>
          </button>
        );
      })}
    </div>
  );
}

function DoneView({
  theme,
  buddyName,
  portraitId,
  portraitImage = '',
  draftText,
  studentLabel,
  onAgain,
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 md:flex-row md:gap-4">
      <BuddyColumn
        theme={theme}
        portraitId={portraitId}
        portraitImage={portraitImage}
        buddyName={buddyName}
        bubble="You did it! Your writing is ready."
      />
      <AppBoard mode="scroll" pad="board" theme={theme} className="min-h-0 flex-1">
        <p className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
          {studentLabel ? `${studentLabel}’s draft` : 'Finished draft'}
        </p>
        <pre
          className={`mt-3 whitespace-pre-wrap rounded-xl border-[1.5px] p-4 ${TYPE.bodyMd} ${theme.colorSurfaceVariant || theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
        >
          {draftText || '(empty)'}
        </pre>
        <button
          type="button"
          className={`edu-control mt-4 rounded-xl px-4 py-2 ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
          onClick={onAgain}
        >
          Write something new
        </button>
      </AppBoard>
    </div>
  );
}
