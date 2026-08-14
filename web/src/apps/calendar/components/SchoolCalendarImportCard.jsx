import { useRef, useState } from 'react';
import { Check, FileUp, Loader2 } from 'lucide-react';
import { TYPE } from '../../../shared/typography';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import {
  applySchoolCalendarProposals,
  parseSchoolCalendarText,
} from '../../../data/calendar/parseSchoolCalendarPdf';

const KIND_LABEL = {
  firstDay: 'First Day',
  lastDay: 'Last Day',
  break: 'Break',
  closure: 'No school',
  halfDay: 'Half day',
  other: 'Other',
};

/**
 * Upload a district calendar PDF → review Important Dates → apply to class.
 */
export function SchoolCalendarImportCard({
  theme,
  isDarkMode,
  Card,
  classId,
  academic,
  closures,
  onApplied,
}) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [yearLabel, setYearLabel] = useState('');
  const [items, setItems] = useState([]);

  const onPick = async (file) => {
    if (!file) return;
    setError('');
    setBusy(true);
    setFileName(file.name);
    try {
      const { extractPdfTextFromFile } = await import(
        '../../../data/calendar/extractPdfText'
      );
      const text = await extractPdfTextFromFile(file);
      if (!String(text || '').trim()) {
        throw new Error(
          'Could not read text from that PDF. Try a text-based district calendar (not a scanned image).',
        );
      }
      const parsed = parseSchoolCalendarText(text);
      if (!parsed.items.length) {
        throw new Error(
          'No Important Dates found. The PDF may use a layout we do not recognize yet.',
        );
      }
      setYearLabel(parsed.schoolYearLabel);
      setItems(parsed.items);
    } catch (err) {
      setItems([]);
      setYearLabel('');
      setError(err?.message || 'Could not parse that calendar PDF.');
    } finally {
      setBusy(false);
    }
  };

  const toggle = (id) => {
    setItems((list) =>
      list.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item,
      ),
    );
  };

  const selectKind = (kind, selected) => {
    setItems((list) =>
      list.map((item) => (item.kind === kind ? { ...item, selected } : item)),
    );
  };

  const apply = () => {
    if (!classId || !items.some((i) => i.selected)) return;
    const next = applySchoolCalendarProposals(academic, closures, items);
    onApplied?.(next);
  };

  const selectedCount = items.filter((i) => i.selected).length;

  if (!Card) return null;

  return (
    <Card
      title="Import school calendar"
      description="Upload a district PDF. We look for Important Dates, then you confirm before applying."
      isDarkMode={isDarkMode}
    >
      <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
        {!classId ? (
          <p className={`${TYPE.bodySm} text-slate-500`}>
            Select a class to import a school calendar.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => onPick(e.target.files?.[0])}
              />
              <button
                type="button"
                className={`edu-control inline-flex items-center gap-2 rounded-xl border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
                disabled={busy}
                onClick={() => fileRef.current?.click()}
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
                {busy ? 'Reading PDF…' : 'Upload PDF'}
              </button>
              {fileName ? (
                <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant} truncate max-w-[16rem]`}>
                  {fileName}
                  {yearLabel ? ` · ${yearLabel}` : ''}
                </span>
              ) : null}
            </div>

            {error ? (
              <p className={`${TYPE.bodySm} text-rose-600`}>{error}</p>
            ) : null}

            {items.length > 0 ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {['firstDay', 'lastDay', 'break', 'closure', 'halfDay'].map(
                    (kind) => {
                      const count = items.filter((i) => i.kind === kind).length;
                      if (!count) return null;
                      const allOn = items
                        .filter((i) => i.kind === kind)
                        .every((i) => i.selected);
                      return (
                        <button
                          key={kind}
                          type="button"
                          className={`edu-control rounded-full border-[1.5px] px-3 py-1 ${TYPE.labelMicro} ${
                            allOn
                              ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                              : `${theme.colorOutline} ${theme.colorOnSurface}`
                          }`}
                          onClick={() => selectKind(kind, !allOn)}
                        >
                          {KIND_LABEL[kind]} ({count})
                        </button>
                      );
                    },
                  )}
                </div>

                <ul className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={item.selected}
                        className={`edu-control flex w-full items-start gap-2.5 rounded-xl border-[1.5px] px-3 py-2 text-left ${
                          item.selected
                            ? `${theme.colorPrimaryContainer} border-transparent`
                            : `${theme.colorOutline} ${theme.colorSurface}`
                        }`}
                        onClick={() => toggle(item.id)}
                      >
                        <span
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-[1.5px] ${
                            item.selected
                              ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                              : theme.colorOutline
                          }`}
                          aria-hidden
                        >
                          {item.selected ? <Check size={12} strokeWidth={3} /> : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block ${TYPE.labelMd} ${
                              item.selected
                                ? theme.colorOnPrimaryContainer
                                : theme.colorOnSurface
                            }`}
                          >
                            {item.label}
                          </span>
                          <span
                            className={`block ${TYPE.labelMicro} ${
                              item.selected
                                ? theme.colorOnPrimaryContainer
                                : theme.colorOnSurfaceVariant
                            }`}
                          >
                            {KIND_LABEL[item.kind] || item.kind}
                            {' · '}
                            {item.startDate}
                            {item.endDate && item.endDate !== item.startDate
                              ? ` → ${item.endDate}`
                              : ''}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                    {selectedCount} selected · First/Last Day, Breaks, and No-school
                    days apply to this class.
                  </p>
                  <ModalPrimaryButton
                    theme={theme}
                    disabled={!selectedCount}
                    onClick={apply}
                  >
                    Apply to {selectedCount} date{selectedCount === 1 ? '' : 's'}
                  </ModalPrimaryButton>
                </div>
              </div>
            ) : (
              <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                Tip: district calendars with an “Important Dates” list work best
                (e.g. Tahoma SD). Review everything before applying.
              </p>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
