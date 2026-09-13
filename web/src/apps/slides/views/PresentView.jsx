import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Maximize, Minimize, StickyNote, X } from 'lucide-react';
import { EmptyState } from '../../../shared/EmptyState';
import { PageHeader } from '../../../shared/PageHeader';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { SLIDES_CHANNEL } from '../../../data/slides/types';
import { getActiveDeck } from '../../../data/slides/storage';
import {
  broadcastNotes,
  endSession,
  readSession,
  setSessionSlide,
  startSession,
} from '../../../data/slides/session';
import { SlideCanvas } from '../SlideCanvas';
import { SlidesJoinQr } from '../SlidesJoinQr';

const FULLSCREEN_Z = 'z-[240]';

/**
 * Classroom Present — fullscreen audience view, optional notes window.
 */
export function PresentView({
  theme,
  isDarkMode,
  settings,
  classId,
  classLabel,
  roster,
  refreshKey,
  onOpenEdit,
  onOpenFollow,
}) {
  const deck = getActiveDeck();
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [session, setSession] = useState(() => readSession());
  const toolBtn = toolBtnClass(isDarkMode);
  void refreshKey;

  const slide = deck?.slides[index] || null;
  const count = deck?.slides.length || 0;

  const go = useCallback((next) => {
    const current = getActiveDeck();
    if (!current) return;
    const total = current.slides.length;
    const clamped = Math.max(0, Math.min(total - 1, next));
    setIndex(clamped);
    setSessionSlide(clamped);
    const s = current.slides[clamped];
    broadcastNotes({
      notes: s?.notes || '',
      meta: `${current.name} · ${clamped + 1} / ${total}`,
      slideIndex: clamped,
      slideCount: total,
    });
  }, []);

  useEffect(() => {
    const current = getActiveDeck();
    if (!current) return undefined;
    const live = startSession({ deckId: current.id, classId: classId || '' });
    setSession(live);
    const start = Math.min(live.slideIndex || 0, Math.max(0, current.slides.length - 1));
    go(start);
    return undefined;
  }, [deck?.id, classId, go]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        go(index + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        go(index - 1);
      } else if (e.key === 'Escape') {
        setFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, index]);

  if (!deck || !slide) {
    return (
      <>
        <PageHeader title="Present" description="Open a deck first." isDarkMode={isDarkMode} />
        <EmptyState isDarkMode={isDarkMode} message="No deck to present. Create one on Decks." />
        <button type="button" className={`${toolBtn} mt-4`} onClick={onOpenEdit}>
          Edit
        </button>
      </>
    );
  }

  const stage = (
    <div
      className={
        fullscreen
          ? `fixed inset-0 ${FULLSCREEN_Z} flex flex-col bg-black`
          : 'relative flex min-h-0 flex-1 flex-col'
      }
    >
      <div
        className="relative min-h-0 flex-1 cursor-pointer"
        onClick={() => go(index + 1)}
        role="presentation"
      >
        <SlideCanvas
          slide={slide}
          theme={theme}
          aspect={settings.aspect}
          presentMode
        />
        {settings.showJoinQr && session ? (
          <div
            className="absolute bottom-3 right-3 rounded-2xl bg-white/95 p-2 shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <SlidesJoinQr
              sessionId={session.id}
              joinCode={session.joinCode}
              size={fullscreen ? 112 : 88}
            />
          </div>
        ) : null}
      </div>
      <div
        className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 ${
          fullscreen ? 'bg-black text-white' : ''
        }`}
      >
        <p className={`${TYPE.labelMd} ${fullscreen ? 'text-white' : theme.colorOnSurface}`}>
          {deck.name} · {index + 1} / {count}
          {classLabel ? ` · ${classLabel}` : ''}
        </p>
        <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
          <button type="button" className={toolBtn} onClick={() => go(index - 1)}>
            Back
          </button>
          <button type="button" className={toolBtn} onClick={() => go(index + 1)}>
            Next
          </button>
          {settings.speakerNotes ? (
            <button
              type="button"
              className={toolBtn}
              onClick={() => openNotesWindow(slide.notes, `${deck.name} · ${index + 1} / ${count}`)}
            >
              <StickyNote size={14} />
              Notes
            </button>
          ) : null}
          <button type="button" className={toolBtn} onClick={onOpenFollow}>
            Student view
          </button>
          <button
            type="button"
            className={toolBtn}
            onClick={() => setFullscreen((v) => !v)}
            aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}
          >
            {fullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
            {fullscreen ? 'Exit' : 'Full screen'}
          </button>
          <button
            type="button"
            className={toolBtn}
            onClick={() => {
              endSession();
              setFullscreen(false);
            }}
          >
            <X size={14} />
            End
          </button>
        </div>
      </div>
    </div>
  );

  if (fullscreen && typeof document !== 'undefined') {
    return (
      <>
        <div className="h-full min-h-0" aria-hidden />
        {createPortal(stage, document.body)}
      </>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="Present"
        description={
          roster?.length
            ? `${roster.length} student${roster.length === 1 ? '' : 's'} in this class can follow.`
            : 'Arrow keys, space, or click to advance. Join code is on the board.'
        }
        isDarkMode={isDarkMode}
      />
      {stage}
    </div>
  );
}

function openNotesWindow(notes, meta) {
  const win = window.open('', 'edu-slides-notes', 'popup=yes,width=440,height=720');
  if (!win) return;
  const safeNotes = String(notes || '(No notes on this slide)').replace(/</g, '&lt;');
  const safeMeta = String(meta || '').replace(/</g, '&lt;');
  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Speaker notes</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 0; padding: 24px;
      background: #0f172a; color: #f8fafc; }
    .meta { font-size: 13px; color: #94a3b8; margin-bottom: 12px; }
    .notes { font-size: 22px; line-height: 1.4; white-space: pre-wrap; }
  </style>
</head>
<body>
  <p class="meta" id="meta">${safeMeta}</p>
  <div class="notes" id="notes">${safeNotes}</div>
  <script>
    const ch = new BroadcastChannel(${JSON.stringify(SLIDES_CHANNEL)});
    ch.onmessage = (e) => {
      const d = e.data || {};
      if (d.type !== 'notes') return;
      document.getElementById('meta').textContent = d.meta || '';
      document.getElementById('notes').textContent = d.notes || '(No notes on this slide)';
    };
  </script>
</body>
</html>`);
  win.document.close();
}
