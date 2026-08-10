import { useEffect, useMemo, useRef, useState } from 'react';
import { Award, ChevronLeft, Layers, Users } from 'lucide-react';
import { PageHeader } from '../../../shared/PageHeader';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { APP_GRID_CARD, APP_NESTED_CARD } from '../../../shared/layout';
import { StudentAvatar } from '../../../shared/StudentAvatar';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { useGroupsWorkshop } from '../../../data/groups/GroupsContext';
import {
  defaultGroupNames,
  resolveGroupName,
} from '../../groups/groupUtils';
import { useBehavior } from '../BehaviorContext';
import { studentShortName } from '../../../data/students/displayName';

const CARD_SIZE_MIN = 88;
const CARD_SIZE_MAX = 140;
const CARD_SIZE_DEFAULT = 140;
const CARD_SIZE_STORAGE_KEY = 'eduHub.behavior.cardSize';

function CardSizeControl({ cardSize, onChange, theme, isDarkMode }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const toolBtn = toolBtnClass(isDarkMode);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        className={`${toolBtn} ${open ? theme.text : ''}`}
      >
        Card size
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Adjust card size"
          className={`absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border-[1.5px] p-3 shadow-lg ${theme.colorSurface} ${theme.colorOutline}`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`h-3.5 w-2.5 shrink-0 rounded-[2px] border ${
                isDarkMode
                  ? 'border-slate-500 bg-slate-800'
                  : 'border-slate-400 bg-slate-100'
              }`}
              aria-hidden
              title="Smaller"
            />
            <input
              id="behavior-card-size"
              type="range"
              min={CARD_SIZE_MIN}
              max={CARD_SIZE_MAX}
              step={4}
              value={cardSize}
              onChange={(e) => onChange(Number(e.target.value))}
              className={`h-1.5 flex-1 cursor-pointer appearance-none rounded-full ${theme.text}
                [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5
                [&::-webkit-slider-thumb]:-mt-[4px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0
                [&::-webkit-slider-thumb]:bg-current
                [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:border-0
                [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:bg-current
                ${
                  isDarkMode
                    ? 'bg-slate-600 [&::-moz-range-track]:bg-slate-600 [&::-webkit-slider-runnable-track]:bg-slate-600'
                    : 'bg-slate-200 [&::-moz-range-track]:bg-slate-200 [&::-webkit-slider-runnable-track]:bg-slate-200'
                }`}
              aria-valuemin={CARD_SIZE_MIN}
              aria-valuemax={CARD_SIZE_MAX}
              aria-valuenow={cardSize}
              aria-label="Card size"
            />
            <span
              className={`h-6 w-4 shrink-0 rounded-[3px] border ${
                isDarkMode
                  ? 'border-slate-500 bg-slate-800'
                  : 'border-slate-400 bg-slate-100'
              }`}
              aria-hidden
              title="Larger"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * ClassDojo-style award board — student tiles + behavior picker.
 */
export function AwardView({ roster, isDarkMode, theme, classLabel, classId }) {
  const { getPoints, award, showNeedsWork, catalog } = useBehavior();
  const { savedGroupings } = useGroupsWorkshop();
  const [modal, setModal] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [gridSelectedIds, setGridSelectedIds] = useState([]);
  const [cardSize, setCardSize] = useState(() => {
    try {
      const n = Number(localStorage.getItem(CARD_SIZE_STORAGE_KEY));
      if (Number.isFinite(n)) {
        return Math.min(CARD_SIZE_MAX, Math.max(CARD_SIZE_MIN, n));
      }
    } catch {
      /* ignore */
    }
    return CARD_SIZE_DEFAULT;
  });
  const toolBtn = toolBtnClass(isDarkMode);

  const classSavedGroupings = useMemo(
    () =>
      savedGroupings.filter(
        (saved) =>
          !saved.isArchived &&
          (!classId || saved.classId === classId) &&
          Array.isArray(saved.groups) &&
          saved.groups.length > 0,
      ),
    [savedGroupings, classId],
  );

  const rosterIds = useMemo(
    () => new Set((roster || []).map((s) => String(s.id))),
    [roster],
  );

  const selectedGrouping = useMemo(() => {
    if (!modal?.groupingId) return null;
    return classSavedGroupings.find((g) => g.id === modal.groupingId) || null;
  }, [classSavedGroupings, modal?.groupingId]);

  useEffect(() => {
    try {
      localStorage.setItem(CARD_SIZE_STORAGE_KEY, String(cardSize));
    } catch {
      /* ignore */
    }
  }, [cardSize]);

  const gridGap = cardSize >= 140 ? 'gap-3' : 'gap-2';
  // Scale from slider size (not bare cqw) so small cards never collapse to 0.
  const avatarPx = Math.round(cardSize * 0.52);
  const namePx = Math.max(10, Math.min(18, Math.round(cardSize * 0.12)));
  const padPx = Math.max(8, Math.round(cardSize * 0.06));
  const nameGapPx = Math.max(4, Math.round(cardSize * 0.04));
  const badgePx = Math.max(18, Math.round(cardSize * 0.24));
  const badgeFontPx = Math.max(10, Math.round(cardSize * 0.1125));
  const pointsBadgePos = {
    top: Math.max(4, Math.round(cardSize * 0.04)),
    right: Math.max(4, Math.round(cardSize * 0.04)),
  };
  const pointsBadgeShape = (pts) => {
    const digits = String(Math.abs(Number(pts) || 0)).length;
    if (digits >= 3) {
      return {
        height: badgePx,
        minWidth: badgePx,
        paddingLeft: Math.round(badgePx * 0.28),
        paddingRight: Math.round(badgePx * 0.28),
      };
    }
    return { height: badgePx, width: badgePx };
  };

  const classTotal = useMemo(
    () => (roster || []).reduce((sum, s) => sum + (getPoints(s.id) || 0), 0),
    [roster, getPoints],
  );
  const classBadgeTone =
    classTotal === 0
      ? isDarkMode
        ? 'bg-slate-700 text-slate-200'
        : 'bg-slate-200 text-slate-700'
      : classTotal > 0
        ? 'bg-emerald-500 text-white'
        : 'bg-rose-500 text-white';

  const openForStudents = (studentIds, mode = 'single') => {
    setModal({
      selectedIds: studentIds.map(String),
      tab: 'positive',
      mode,
      behaviorId: null,
      groupingId: null,
      groupIndex: null,
      groupLabel: null,
      groupStep: mode === 'group' ? 'grouping' : null,
    });
  };

  const toggleSelectMode = () => {
    setSelectMode((prev) => {
      if (prev) setGridSelectedIds([]);
      return !prev;
    });
  };

  const toggleGridStudent = (studentId) => {
    const id = String(studentId);
    setGridSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const awardGridSelection = () => {
    if (!gridSelectedIds.length) return;
    openForStudents(gridSelectedIds, 'multiple');
  };

  const pickGrouping = (grouping) => {
    setModal((prev) =>
      prev
        ? {
            ...prev,
            groupingId: grouping.id,
            groupIndex: null,
            groupLabel: null,
            selectedIds: [],
            behaviorId: null,
            groupStep: 'groups',
          }
        : prev,
    );
  };

  const pickGroup = (grouping, index) => {
    const members = Array.isArray(grouping.groups?.[index])
      ? grouping.groups[index]
      : [];
    const ids = members
      .map((s) => String(s?.id))
      .filter((id) => id && rosterIds.has(id));
    const names =
      grouping.groupNames?.length === grouping.groups.length
        ? grouping.groupNames
        : defaultGroupNames(grouping.groups.length);
    setModal((prev) =>
      prev
        ? {
            ...prev,
            groupingId: grouping.id,
            groupIndex: index,
            groupLabel: resolveGroupName(names, index),
            selectedIds: ids,
            behaviorId: null,
            groupStep: 'behavior',
          }
        : prev,
    );
  };

  const goBackGroupStep = () => {
    setModal((prev) => {
      if (!prev || prev.mode !== 'group') return prev;
      if (prev.groupStep === 'behavior') {
        return {
          ...prev,
          groupStep: 'groups',
          groupIndex: null,
          groupLabel: null,
          selectedIds: [],
          behaviorId: null,
        };
      }
      if (prev.groupStep === 'groups') {
        return {
          ...prev,
          groupStep: 'grouping',
          groupingId: null,
          groupIndex: null,
          groupLabel: null,
          selectedIds: [],
          behaviorId: null,
        };
      }
      return prev;
    });
  };

  const selectedBehavior = modal
    ? [
        ...catalog.positive,
        ...(showNeedsWork ? catalog.needsWork : []),
      ].find((b) => b.id === modal.behaviorId)
    : null;

  const confirm = () => {
    if (!modal || !selectedBehavior) return;
    award({ studentIds: modal.selectedIds, behavior: selectedBehavior });
    setModal(null);
    if (modal.mode === 'multiple') {
      setSelectMode(false);
      setGridSelectedIds([]);
    }
  };

  const groupStep = modal?.mode === 'group' ? modal.groupStep || 'grouping' : null;
  const showBehaviorPicker =
    modal &&
    (modal.mode !== 'group' || groupStep === 'behavior') &&
    (modal.mode !== 'group' || modal.selectedIds?.length > 0);

  const modalTitle =
    modal?.mode === 'whole'
      ? 'Award whole class'
      : modal?.mode === 'multiple'
        ? 'Award selected'
        : modal?.mode === 'group'
          ? groupStep === 'behavior' && modal.groupLabel
            ? `Award ${modal.groupLabel}`
            : groupStep === 'groups' && selectedGrouping
              ? selectedGrouping.name
              : 'Award group'
          : 'Award student';

  const groupLiveMembers = (members) =>
    (members || []).filter((s) => rosterIds.has(String(s?.id)));

  const renderBehaviorGrid = (items, { isNeeds, visible }) => (
    <div
      className={`col-start-1 row-start-1 grid grid-cols-3 gap-2 sm:grid-cols-4 ${
        visible ? '' : 'invisible pointer-events-none'
      }`}
      aria-hidden={!visible}
    >
      {items.map((b) => {
        const on = visible && modal?.behaviorId === b.id;
        return (
          <button
            key={b.id}
            type="button"
            tabIndex={visible ? 0 : -1}
            onClick={() =>
              setModal((prev) =>
                prev ? { ...prev, behaviorId: b.id } : prev,
              )
            }
            aria-pressed={on}
            className={`edu-control @container relative flex aspect-square flex-col text-left transition ${APP_GRID_CARD} ${
              on
                ? `${theme.colorPrimaryContainer} ${theme.colorOutline} ring-2 ring-inset ${theme.ring}`
                : `${theme.colorSurface} ${theme.colorOutline} ${
                    isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                  }`
            }`}
          >
            <span
              className={`absolute top-1.5 right-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full ${TYPE.labelSm} font-bold tabular-nums ${
                isNeeds || b.points < 0
                  ? 'bg-rose-500 text-white'
                  : 'bg-emerald-500 text-white'
              }`}
            >
              {b.points > 0 ? `+${b.points}` : b.points}
            </span>
            <div className="flex min-h-0 flex-1 flex-col items-center justify-end gap-[3cqw] px-[8cqw] pb-[8cqw] pt-[18cqw]">
              <span
                className="block max-h-[44cqw] max-w-full shrink leading-none"
                style={{ fontSize: 'clamp(1.25rem, 40cqw, 3.75rem)' }}
                aria-hidden
              >
                {b.icon}
              </span>
              <p
                className={`w-full text-center font-semibold leading-snug ${theme.colorOnSurface}`}
                style={{ fontSize: 'clamp(0.625rem, 13cqw, 0.875rem)' }}
              >
                {b.name}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );

  const behaviorPicker = showBehaviorPicker ? (
    <>
      {showNeedsWork ? (
        <div className="flex justify-center gap-2">
          {['positive', 'needsWork'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() =>
                setModal((prev) =>
                  prev ? { ...prev, tab, behaviorId: null } : prev,
                )
              }
              className={`edu-control rounded-xl px-4 py-2 ${TYPE.titleSm} ${
                modal?.tab === tab
                  ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                  : `${theme.colorSurfaceVariant} ${theme.colorOnSurfaceVariant}`
              }`}
            >
              {tab === 'positive' ? 'Positive' : 'Needs work'}
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid">
        {renderBehaviorGrid(catalog.positive, {
          isNeeds: false,
          visible: !showNeedsWork || modal?.tab !== 'needsWork',
        })}
        {showNeedsWork
          ? renderBehaviorGrid(catalog.needsWork, {
              isNeeds: true,
              visible: modal?.tab === 'needsWork',
            })
          : null}
      </div>
    </>
  ) : null;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Award"
        description={classLabel || undefined}
        isDarkMode={isDarkMode}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={selectMode}
          className={`${toolBtn} ${selectMode ? theme.text : ''}`}
          onClick={toggleSelectMode}
        >
          <Users size={16} className="mr-1.5 inline" />
          Select Multiple
        </button>
        <button
          type="button"
          className={toolBtn}
          onClick={() => openForStudents([], 'group')}
        >
          <Layers size={16} className="mr-1.5 inline" />
          Award group
        </button>

        {selectMode ? (
          <>
            <button
              type="button"
              className={toolBtn}
              disabled={!gridSelectedIds.length}
              onClick={awardGridSelection}
            >
              <Award size={16} className="mr-1.5 inline" />
              Award
            </button>
            <button
              type="button"
              className={toolBtn}
              onClick={() => {
                setSelectMode(false);
                setGridSelectedIds([]);
              }}
            >
              Cancel
            </button>
          </>
        ) : null}

        <div className="ml-auto">
          <CardSizeControl
            cardSize={cardSize}
            onChange={setCardSize}
            theme={theme}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>

      <div
        className={`grid ${gridGap}`}
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(${cardSize}px, 1fr))`,
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (selectMode) return;
            openForStudents(roster.map((s) => s.id), 'whole');
          }}
          aria-label="Award whole class"
          disabled={selectMode}
          style={{ padding: padPx }}
          className={`edu-control relative flex aspect-square flex-col items-center justify-end ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} transition hover:-translate-y-0.5 disabled:opacity-40 disabled:pointer-events-none`}
        >
          <span
            className={`absolute z-10 flex items-center justify-center rounded-full font-bold tabular-nums ${classBadgeTone}`}
            style={{
              ...pointsBadgePos,
              ...pointsBadgeShape(classTotal),
              fontSize: badgeFontPx,
            }}
          >
            {classTotal}
          </span>
          <span
            className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
            aria-hidden
          >
            <span
              className={`flex items-center justify-center rounded-full ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
              style={{ width: avatarPx, height: avatarPx }}
            >
              <Award
                size={Math.max(14, Math.round(avatarPx * 0.5))}
                strokeWidth={2.25}
              />
            </span>
          </span>
          <p
            className={`relative z-[1] mt-auto w-full truncate text-center font-semibold leading-snug ${theme.colorOnSurface}`}
            style={{ marginTop: nameGapPx, fontSize: namePx }}
          >
            Whole class
          </p>
        </button>
        {roster.map((student) => {
          const pts = getPoints(student.id);
          const id = String(student.id);
          const isSelected = gridSelectedIds.includes(id);
          const badgeTone =
            pts === 0
              ? isDarkMode
                ? 'bg-slate-700 text-slate-200'
                : 'bg-slate-200 text-slate-700'
              : pts > 0
                ? 'bg-emerald-500 text-white'
                : 'bg-rose-500 text-white';
          return (
            <button
              key={student.id}
              type="button"
              aria-pressed={selectMode ? isSelected : undefined}
              onClick={() => {
                if (selectMode) toggleGridStudent(id);
                else openForStudents([student.id], 'single');
              }}
              style={{ padding: padPx }}
              className={`edu-control relative flex aspect-square flex-col items-center justify-end ${APP_GRID_CARD} transition hover:-translate-y-0.5 ${
                selectMode && isSelected
                  ? `${theme.colorPrimaryContainer} ${theme.border} ring-2 ${theme.ring}`
                  : `${theme.colorSurface} ${theme.colorOutline}`
              }`}
            >
              <span
                className={`absolute z-10 flex items-center justify-center rounded-full font-bold tabular-nums ${badgeTone}`}
                style={{
                  ...pointsBadgePos,
                  ...pointsBadgeShape(pts),
                  fontSize: badgeFontPx,
                }}
              >
                {pts}
              </span>
              <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
                <div
                  className="shrink-0"
                  style={{
                    width: avatarPx,
                    height: avatarPx,
                    fontSize: avatarPx,
                  }}
                >
                  <StudentAvatar student={student} theme={theme} size="fluid" />
                </div>
              </div>
              <p
                className={`relative z-[1] mt-auto w-full truncate text-center font-semibold leading-snug ${theme.colorOnSurface}`}
                style={{ marginTop: nameGapPx, fontSize: namePx }}
              >
                {studentShortName(student)}
              </p>
            </button>
          );
        })}
      </div>

      <Modal
        isOpen={Boolean(modal)}
        title={modalTitle}
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setModal(null)}
        maxWidth="max-w-xl"
        headerStart={
          modal?.mode === 'group' && groupStep !== 'grouping' ? (
            <button
              type="button"
              onClick={goBackGroupStep}
              className={`edu-control -ml-1 rounded-lg p-1.5 ${theme.colorOnPrimary} opacity-80 hover:bg-white/20 hover:opacity-100`}
              aria-label="Back"
            >
              <ChevronLeft size={20} strokeWidth={2.25} />
            </button>
          ) : null
        }
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className={`edu-control rounded-xl px-4 py-2 ${TYPE.labelLg} ${theme.colorOnSurfaceVariant}`}
              onClick={() => setModal(null)}
            >
              Cancel
            </button>
            {modal?.mode !== 'group' || groupStep === 'behavior' ? (
              <ModalPrimaryButton
                theme={theme}
                disabled={!selectedBehavior || !modal?.selectedIds?.length}
                onClick={confirm}
              >
                Award
              </ModalPrimaryButton>
            ) : null}
          </div>
        }
      >
        <div className="space-y-4 p-6">
          {modal?.mode === 'group' && groupStep === 'grouping' ? (
            <div className="space-y-2">
              {classSavedGroupings.length === 0 ? (
                <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                  No saved groups for this class yet. Save a grouping in Edu.Groups
                  first.
                </p>
              ) : (
                classSavedGroupings.map((saved) => {
                  const count = saved.groups?.length || 0;
                  return (
                    <button
                      key={saved.id}
                      type="button"
                      onClick={() => pickGrouping(saved)}
                      className={`edu-control flex w-full items-center justify-between gap-2 rounded-xl border-[1.5px] px-3 py-2.5 text-left ${APP_NESTED_CARD} ${theme.colorSurface} ${theme.colorOutline} transition hover:-translate-y-0.5`}
                    >
                      <span
                        className={`min-w-0 truncate ${TYPE.titleSm} ${theme.colorOnSurface}`}
                      >
                        {saved.name}
                      </span>
                      <span
                        className={`shrink-0 ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                      >
                        {count} group{count === 1 ? '' : 's'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          ) : null}

          {modal?.mode === 'group' && groupStep === 'groups' && selectedGrouping ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {selectedGrouping.groups.map((members, index) => {
                const names =
                  selectedGrouping.groupNames?.length ===
                  selectedGrouping.groups.length
                    ? selectedGrouping.groupNames
                    : defaultGroupNames(selectedGrouping.groups.length);
                const label = resolveGroupName(names, index);
                const live = groupLiveMembers(members);
                return (
                  <button
                    key={`${selectedGrouping.id}-${index}`}
                    type="button"
                    onClick={() => pickGroup(selectedGrouping, index)}
                    className={`edu-control rounded-xl border-[1.5px] px-3 py-3 text-left ${theme.colorSurface} ${theme.colorOutline} transition hover:-translate-y-0.5`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
                        {label}
                      </p>
                      <p
                        className={`shrink-0 ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                      >
                        {live.length}
                      </p>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {live.length === 0 ? (
                        <span
                          className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
                        >
                          No students on roster
                        </span>
                      ) : (
                        live.map((student) => {
                          const rosterStudent =
                            (roster || []).find(
                              (s) => String(s.id) === String(student.id),
                            ) || student;
                          return (
                            <span
                              key={String(student.id)}
                              className={`inline-flex items-center gap-1.5 rounded-lg border-[1.5px] px-1.5 py-1 ${TYPE.labelMd} ${APP_NESTED_CARD} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
                            >
                              <StudentAvatar
                                student={rosterStudent}
                                theme={theme}
                                size="xs"
                              />
                              <span className="max-w-[5.5rem] truncate">
                                {studentShortName(rosterStudent)}
                              </span>
                            </span>
                          );
                        })
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}

          {behaviorPicker}
        </div>
      </Modal>
    </div>
  );
}
