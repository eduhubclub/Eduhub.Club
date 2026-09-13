import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Maximize, Minimize, Sun } from 'lucide-react';
import { useClasses } from '../../../data/classes/ClassContext';
import { AppPageShell } from '../../../shared/AppPageShell';
import { EmptyState } from '../../../shared/EmptyState';
import { toolBtnClass } from '../../../shared/toolBtn';
import { BOARD_GAP_PX, fitBoardLayout, placementStyle } from '../boardLayout';
import { toIsoDate } from '../../../data/calendar/calendarModel';
import { funDayOptionsOn } from '../../../data/calendar/funDays';
import {
  MORNING_MEETING_UPDATED_EVENT,
  ensureBoard,
  readBoard,
} from '../morningMeetingStorage';
import { WIDGET_COMPONENTS, getWidgetMeta } from '../widgets/registry';
import { BoardDragContext } from '../widgets/WidgetShell';

/**
 * Live morning board — teacher layout rects, uniform scale, vertically centered.
 */
export function BoardView({ isDarkMode, theme, onOpenApp }) {
  const { classes, selectedClass, selectClass } = useClasses();
  const classId = selectedClass?.id != null ? String(selectedClass.id) : null;
  const roster = selectedClass?.studentList || [];
  const activeClasses = (classes || []).filter((c) => !c.isArchived);

  const [pins, setPins] = useState([]);
  const [backgroundSrc, setBackgroundSrc] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layout, setLayout] = useState(null);
  const stageRef = useRef(null);

  useEffect(() => {
    if (!activeClasses.length) return;
    if (!selectedClass || selectedClass.isArchived) {
      selectClass(activeClasses[0].id);
    }
  }, [activeClasses, selectedClass, selectClass]);

  useEffect(() => {
    if (!classId) {
      setPins([]);
      setBackgroundSrc('');
      return undefined;
    }
    const board = ensureBoard(classId);
    setPins(board.pins);
    setBackgroundSrc(board.backgroundSrc || '');
    const onChange = () => {
      const next = readBoard(classId);
      setPins(next.pins);
      setBackgroundSrc(next.backgroundSrc || '');
    };
    window.addEventListener(MORNING_MEETING_UPDATED_EVENT, onChange);
    return () => window.removeEventListener(MORNING_MEETING_UPDATED_EVENT, onChange);
  }, [classId]);

  useEffect(() => {
    if (!isFullscreen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullscreen]);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const funDayCount = funDayOptionsOn(toIsoDate(new Date())).length;
      setLayout(
        fitBoardLayout({
          pins,
          width: rect.width,
          height: rect.height,
          gap: BOARD_GAP_PX,
          rosterCount: roster.length,
          funDayCount,
        }),
      );
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pins, isFullscreen, roster.length]);

  const toolBtn = toolBtnClass(isDarkMode);
  const hasBg = Boolean(backgroundSrc);
  const bgStyle = hasBg
    ? { backgroundImage: `url(${JSON.stringify(backgroundSrc)})` }
    : undefined;

  const placementById = new Map((layout?.placements || []).map((p) => [p.id, p]));

  const boardGrid = !pins.length ? (
    <div className="h-full min-h-0 flex items-center justify-center">
      <EmptyState
        isDarkMode={isDarkMode}
        message="No widgets pinned yet. Open Edit board to add cards."
      />
    </div>
  ) : (
    <div
      ref={stageRef}
      className={`relative h-full min-h-0 w-full ${
        layout?.overflows ? 'overflow-auto' : 'overflow-hidden'
      }`}
    >
      {layout ? (
        <div
          className="origin-top-left"
          style={{
            width: layout.boardW,
            height: layout.boardH,
            transform: `translate(${layout.offsetX}px, ${layout.offsetY}px) scale(${layout.scale})`,
            display: 'grid',
            gridTemplateColumns: `repeat(${layout.cols}, ${layout.cellW}px)`,
            gridTemplateRows: `repeat(${layout.rows}, ${layout.cellH}px)`,
            gap: layout.gap,
          }}
        >
          {pins.map((pin) => {
            const Component = WIDGET_COMPONENTS[pin.type];
            const meta = getWidgetMeta(pin.type);
            const place = placementById.get(pin.id);
            if (!Component || !place) return null;
            const label =
              pin.type === 'custom'
                ? String(pin.props?.title || meta?.label || pin.type)
                : meta?.label || pin.type;
            return (
              <div
                key={pin.id}
                className="min-h-0 min-w-0"
                style={placementStyle(place)}
                data-widget={pin.type}
                aria-label={label}
              >
                <BoardDragContext.Provider
                  value={{
                    pinId: pin.id,
                    label,
                    isDropTarget: false,
                  }}
                >
                  <Component
                    theme={theme}
                    isDarkMode={isDarkMode}
                    pin={pin}
                    classId={classId}
                    classLabel={selectedClass?.name}
                    roster={roster}
                    onOpenApp={onOpenApp}
                  />
                </BoardDragContext.Provider>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );

  const chrome = (
    <div className="relative h-full min-h-0 flex flex-col gap-2">
      <div className="relative z-10 flex justify-end shrink-0">
        <button
          type="button"
          className={toolBtn}
          onClick={() => setIsFullscreen((v) => !v)}
          title={isFullscreen ? 'Exit full screen' : 'Full screen'}
          aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}
        >
          {isFullscreen ? (
            <Minimize size={18} strokeWidth={2.5} />
          ) : (
            <Maximize size={18} strokeWidth={2.5} />
          )}
        </button>
      </div>
      <div className="relative z-10 min-h-0 flex-1 overflow-hidden">{boardGrid}</div>
    </div>
  );

  const mainEl =
    typeof document !== 'undefined' ? document.getElementById('main-content') : null;
  const shellBg =
    hasBg && !isFullscreen && mainEl
      ? createPortal(
          <div
            className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center"
            style={bgStyle}
            aria-hidden
            data-mm-board-bg
          />,
          mainEl,
        )
      : null;

  if (!activeClasses.length) {
    return (
      <AppPageShell variant="page">
        <EmptyState
          isDarkMode={isDarkMode}
          message="No classes yet. Add a class in Edu.Classes, or turn on demo data in Settings."
          illustration={<Sun size={36} className="text-slate-400" />}
        />
      </AppPageShell>
    );
  }

  if (isFullscreen && typeof document !== 'undefined') {
    return createPortal(
      <div
        className={`fixed inset-0 z-[240] flex flex-col overflow-hidden ${
          hasBg ? '' : isDarkMode ? 'bg-slate-950' : 'bg-slate-50'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Morning Meeting full screen"
      >
        {hasBg ? (
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center"
            style={bgStyle}
            aria-hidden
          />
        ) : null}
        <div className="relative z-10 flex min-h-0 flex-1 flex-col p-3 sm:p-5">
          <div className="mx-auto min-h-0 w-full max-w-7xl flex-1">{chrome}</div>
        </div>
      </div>,
      document.body,
    );
  }

  return (
    <>
      {shellBg}
      <AppPageShell variant="stage" className="relative z-[1] h-full min-h-0">
        {chrome}
      </AppPageShell>
    </>
  );
}
