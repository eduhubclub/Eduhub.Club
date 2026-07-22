import { useEffect, useMemo, useState } from 'react';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { TYPE } from '../../../shared/typography';
import {
  COLUMN_META,
  GRAPHEME_ROWS,
  allGraphemeKeys,
  createDefaultSelectedKeys,
  graphemeKey,
  keysForRow,
} from '../blendingBoardData';

function tileChrome(kind, isDarkMode, selected) {
  if (!selected) {
    const outline = {
      consonant: isDarkMode
        ? 'bg-transparent text-sky-300/80 border-sky-700'
        : 'bg-white text-sky-700/70 border-sky-300',
      coda: isDarkMode
        ? 'bg-transparent text-emerald-300/80 border-emerald-700'
        : 'bg-white text-emerald-700/70 border-emerald-300',
      vowel: isDarkMode
        ? 'bg-transparent text-amber-300/80 border-amber-700'
        : 'bg-white text-amber-800/70 border-amber-300',
      suffix: isDarkMode
        ? 'bg-transparent text-rose-300/80 border-rose-700'
        : 'bg-white text-rose-700/70 border-rose-300',
    }[kind];
    return outline;
  }

  return {
    consonant: isDarkMode
      ? 'bg-sky-900/55 text-sky-50 border-sky-700'
      : 'bg-sky-100 text-sky-950 border-sky-200',
    coda: isDarkMode
      ? 'bg-emerald-900/50 text-emerald-50 border-emerald-700'
      : 'bg-emerald-100 text-emerald-950 border-emerald-200',
    vowel: isDarkMode
      ? 'bg-amber-900/45 text-amber-50 border-amber-700'
      : 'bg-amber-100 text-amber-950 border-amber-200',
    suffix: isDarkMode
      ? 'bg-rose-900/45 text-rose-50 border-rose-700'
      : 'bg-rose-100 text-rose-950 border-rose-200',
  }[kind];
}

function MiniTile({ label, kind, selected, isDarkMode, onClick }) {
  const wide = label.length > 2;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`${label}${selected ? ', selected' : ', not selected'}`}
      className={`edu-control inline-flex items-center justify-center rounded-lg border-[1.5px] font-bold leading-none transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
        wide ? 'min-w-[2.5rem] h-8 px-1.5 text-xs' : 'min-w-[1.75rem] h-8 px-1 text-sm'
      } ${tileChrome(kind, isDarkMode, selected)}`}
    >
      {label}
    </button>
  );
}

function RowAllNone({
  isDarkMode,
  theme,
  allSelected,
  noneSelected,
  onAll,
  onNone,
}) {
  const chip = (active, label, onClick) => (
    <button
      type="button"
      onClick={onClick}
      className={`edu-control h-7 px-2.5 rounded-lg ${TYPE.labelMd} transition-colors ${
        active
          ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
          : isDarkMode
            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-1 shrink-0 w-14">
      {chip(allSelected, 'All', onAll)}
      {chip(noneSelected, 'None', onNone)}
    </div>
  );
}

/**
 * UFLI-style letter combination picker — toggle graphemes per column/row.
 */
export function LetterCombinationModal({
  isOpen,
  onClose,
  theme,
  isDarkMode,
  selectedKeys,
  onApply,
}) {
  const [draft, setDraft] = useState(() => new Set(selectedKeys));

  useEffect(() => {
    if (isOpen) setDraft(new Set(selectedKeys));
  }, [isOpen, selectedKeys]);

  const selectedCount = draft.size;
  const catalogSize = useMemo(() => allGraphemeKeys().length, []);

  const toggle = (columnId, grapheme) => {
    const key = graphemeKey(columnId, grapheme);
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const setRowKeys = (row, enabled) => {
    const keys = keysForRow(row);
    setDraft((prev) => {
      const next = new Set(prev);
      for (const key of keys) {
        if (enabled) next.add(key);
        else next.delete(key);
      }
      return next;
    });
  };

  const selectAll = () => setDraft(new Set(allGraphemeKeys()));
  const selectNone = () => setDraft(new Set());
  const selectDefault = () => setDraft(createDefaultSelectedKeys());

  const handleApply = () => {
    onApply(new Set(draft));
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Select letter combinations"
      theme={theme}
      isDarkMode={isDarkMode}
      onClose={onClose}
      maxWidth="max-w-5xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-2.5 rounded-xl ${TYPE.labelLg} transition-colors ${
              isDarkMode
                ? 'text-slate-300 hover:bg-slate-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Cancel
          </button>
          <ModalPrimaryButton
            theme={theme}
            onClick={handleApply}
            disabled={selectedCount === 0}
          >
            Apply
          </ModalPrimaryButton>
        </>
      }
    >
      <div className="px-5 sm:px-6 py-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p
            className={`${TYPE.titleMd} tabular-nums ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            {selectedCount} selected
            <span
              className={`ml-2 ${TYPE.bodySm} font-normal ${
                isDarkMode ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              of {catalogSize}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={selectDefault}
              className={`edu-control h-8 px-3 rounded-lg ${TYPE.labelMd} ${
                isDarkMode
                  ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              Basic set
            </button>
            <button
              type="button"
              onClick={selectAll}
              className={`edu-control h-8 px-3 rounded-lg ${TYPE.labelMd} ${
                isDarkMode
                  ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              Select all
            </button>
            <button
              type="button"
              onClick={selectNone}
              className={`edu-control h-8 px-3 rounded-lg ${TYPE.labelMd} ${
                isDarkMode
                  ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              Clear all
            </button>
          </div>
        </div>

        <div
          className={`hidden md:grid grid-cols-4 gap-2 pl-[4.25rem] ${TYPE.labelMicro} ${
            isDarkMode ? 'text-slate-500' : 'text-slate-400'
          }`}
        >
          {COLUMN_META.map((col) => (
            <span key={col.id} className="text-center">
              {col.label}
            </span>
          ))}
        </div>

        <div className="space-y-4">
          {GRAPHEME_ROWS.map((row) => {
            const rowKeys = keysForRow(row);
            const selectedInRow = rowKeys.filter((k) => draft.has(k)).length;
            const allSelected =
              rowKeys.length > 0 && selectedInRow === rowKeys.length;
            const noneSelected = selectedInRow === 0;

            return (
              <div
                key={row.id}
                className={`flex gap-3 items-start pb-4 border-b last:border-b-0 last:pb-0 ${
                  isDarkMode ? 'border-slate-700' : 'border-slate-200'
                }`}
              >
                <RowAllNone
                  isDarkMode={isDarkMode}
                  theme={theme}
                  allSelected={allSelected}
                  noneSelected={noneSelected}
                  onAll={() => setRowKeys(row, true)}
                  onNone={() => setRowKeys(row, false)}
                />

                <div className="flex-1 min-w-0">
                  <p
                    className={`${TYPE.labelMicro} mb-2 ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    {row.label}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {COLUMN_META.map((col) => (
                      <div
                        key={`${row.id}-${col.id}`}
                        className="flex flex-col gap-1 min-h-[2rem]"
                      >
                        <span
                          className={`md:hidden ${TYPE.labelMicro} ${
                            isDarkMode ? 'text-slate-500' : 'text-slate-400'
                          }`}
                        >
                          {col.label}
                        </span>
                        <div className="flex flex-wrap gap-1 content-start">
                        {row[col.id].length === 0 ? (
                          <span
                            className={`${TYPE.bodySm} ${
                              isDarkMode ? 'text-slate-600' : 'text-slate-300'
                            }`}
                          >
                            —
                          </span>
                        ) : (
                          row[col.id].map((g) => (
                            <MiniTile
                              key={`${row.id}-${col.id}-${g}`}
                              label={g}
                              kind={col.kind}
                              selected={draft.has(graphemeKey(col.id, g))}
                              isDarkMode={isDarkMode}
                              onClick={() => toggle(col.id, g)}
                            />
                          ))
                        )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
