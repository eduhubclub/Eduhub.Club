import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Keyboard } from 'lucide-react';
import { useBarcodeCamera } from '../useBarcodeCamera';
import { BarcodeCameraPreview } from '../BarcodeCameraPreview';
import { PageHeader } from '../../../shared/PageHeader';
import { APP_GRID_CARD } from '../../../shared/layout';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { studentDisplayName } from '../../../data/students/displayName';
import { parseStudentBankQrPayload } from '../../../shared/bankQrPayload';
import { resolveStudentCardScan } from '../../../data/students/cardScan';
import { useBankAccess } from '../../../data/bank/BankAccessContext';
import { verifyBankPin } from '../../bank/bankAccountsStorage';
import { looksLikeIsbn, normalizeIsbn } from '../../../data/library/labelPayload';
import {
  activeLoanForCopy,
  clearInventory,
  copiesForTitle,
  findCopyByScan,
  findTitleByIsbn,
  getTitle,
  inventoryReport,
  listActiveLoans,
  readInventory,
  recordInventoryFound,
  recordInventoryLeftover,
  startInventory,
} from '../../../data/library/storage';
import {
  checkoutCopy,
  returnCopy,
  verifyStudentCredential,
} from '../../../data/library/loans';

/**
 * Always-focused scan field: copy labels, existing ISBNs, student QR.
 */
export function ScanView({
  theme,
  isDarkMode,
  classId,
  classLabel,
  roster,
  settings,
  refreshKey,
  onOpenLabels,
}) {
  const inputRef = useRef(null);
  const [mode, setMode] = useState('checkout'); // checkout | return | self | inventory
  const [raw, setRaw] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [pendingTitle, setPendingTitle] = useState(null);
  const [pendingCopy, setPendingCopy] = useState(null);
  const [studentId, setStudentId] = useState('');
  const [cardHold, setCardHold] = useState(null);
  const [pin, setPin] = useState('');
  const { requireCardPin } = useBankAccess();
  const [inventory, setInventory] = useState(() => readInventory());
  const handleScanRef = useRef(/** @type {(value: string) => Promise<void>} */ (async () => {}));
  const { videoRef, overlayRef, cameraOn, lockLabel, startCamera, stopCamera } = useBarcodeCamera({
    onScan: (value) => handleScanRef.current(value),
    keepScanning: mode === 'inventory',
    onError: (message) => setError(message),
  });
  const toolBtn = toolBtnClass(isDarkMode);
  const fieldClass = `edu-control w-full rounded-xl border-[1.5px] px-3 py-2.5 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;

  const focusInput = useCallback(() => {
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    focusInput();
  }, [focusInput, mode]);

  const clearTransient = () => {
    setError('');
    setNote('');
  };

  const openCamera = () => {
    clearTransient();
    startCamera();
  };

  const studentName = (id) =>
    studentDisplayName(roster.find((s) => String(s.id) === String(id))) || 'student';

  const confirmCardPin = () => {
    if (!cardHold?.studentId) return;
    const auth = verifyBankPin({
      classId,
      roster,
      studentId: cardHold.studentId,
      pin,
    });
    if (!auth.ok) {
      setError(auth.error);
      return;
    }
    const sid = String(cardHold.studentId);
    const name = cardHold.name || studentName(sid);
    setCardHold(null);
    setStudentId(sid);
    setPin('');
    setError('');
    if (pendingCopy && mode === 'checkout') {
      completeCheckout(pendingCopy, sid);
      return;
    }
    setNote(`Student: ${name}. Scan a book to check out.`);
  };

  const completeCheckout = (copy, sid = studentId) => {
    if (!copy) {
      setError('Scan a copy label (or ISBN) first.');
      return false;
    }
    if (!sid) {
      setPendingCopy(copy);
      setPendingTitle(getTitle(copy.titleId));
      setError('Pick a student.');
      return false;
    }
    if (mode === 'self' && settings.studentSelfCheckout) {
      const auth = verifyStudentCredential({ roster, studentId: sid, pin });
      if (!auth.ok) {
        setPendingCopy(copy);
        setPendingTitle(getTitle(copy.titleId));
        setError(auth.error);
        return false;
      }
    }
    const result = checkoutCopy({
      copyId: copy.id,
      studentId: sid,
      classId,
    });
    if (!result.ok) {
      setPendingCopy(copy);
      setPendingTitle(getTitle(copy.titleId));
      setError(result.error);
      return false;
    }
    const due = result.loan.dueAt
      ? new Date(result.loan.dueAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        })
      : '';
    setNote(
      `Checked out “${result.title?.title || 'book'}” to ${studentName(sid)}${
        due ? ` · due ${due}` : ''
      }.`,
    );
    setPendingCopy(null);
    setPendingTitle(null);
    setPin('');
    return true;
  };

  const completeReturn = (copy) => {
    const title = getTitle(copy.titleId);
    const loan = activeLoanForCopy(copy.id);
    if (studentId && loan && String(loan.studentId) !== String(studentId)) {
      setError(
        `That copy is out to ${studentName(loan.studentId)}, not ${studentName(studentId)}.`,
      );
      return false;
    }
    const result = returnCopy(copy.id);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setPendingCopy(null);
    setPendingTitle(null);
    setNote(
      `Checked in “${title?.title || 'book'}” (copy ${copy.copyNumber})${
        loan ? ` from ${studentName(loan.studentId)}` : ''
      }.`,
    );
    return true;
  };

  const queueCheckout = (copy, title) => {
    const book = title || getTitle(copy.titleId);
    if (mode === 'self' && settings.studentSelfCheckout) {
      setPendingCopy(copy);
      setPendingTitle(book);
      setNote(
        studentId
          ? `Ready to check out “${book?.title || 'book'}”. Enter PIN to confirm.`
          : `Ready to check out “${book?.title || 'book'}”. Pick a student and enter PIN.`,
      );
      focusInput();
      return;
    }
    if (studentId) {
      completeCheckout(copy);
      focusInput();
      return;
    }
    setPendingCopy(copy);
    setPendingTitle(book);
    setNote(`Found ${book?.title || 'book'} — copy ${copy.copyNumber}. Pick a student.`);
    if (mode !== 'checkout') setMode('checkout');
    focusInput();
  };

  const handleIsbn = async (isbnRaw) => {
    const isbn = normalizeIsbn(isbnRaw);
    const existing = findTitleByIsbn(isbn);
    if (!existing) {
      setError('That ISBN isn’t in the library yet. Add it in Manage Library.');
      focusInput();
      return;
    }
    const available = copiesForTitle(existing.id).filter((c) => c.status !== 'out');
    if (!available.length) {
      setError('All copies of that title are checked out.');
      focusInput();
      return;
    }
    if (available.length === 1) {
      queueCheckout(available[0], existing);
      return;
    }
    setPendingCopy(null);
    setPendingTitle(existing);
    setNote(`Pick which copy of “${existing.title}” to check out.`);
    focusInput();
  };

  const handleCopyScan = (copy) => {
    const title = getTitle(copy.titleId);
    if (mode === 'inventory') {
      const session = recordInventoryFound(copy.id);
      setInventory(session);
      setNote(`Found “${title?.title || 'book'}” · copy ${copy.copyNumber}.`);
      return;
    }
    if (copy.status === 'out' || mode === 'return') {
      completeReturn(copy);
      return;
    }
    queueCheckout(copy, title);
  };

  const handleScan = async (value) => {
    const text = String(value || '').trim();
    if (!text) return;
    clearTransient();
    setRaw('');

    const studentQr = parseStudentBankQrPayload(text);
    if (studentQr?.studentId) {
      const decision = resolveStudentCardScan({
        raw: text,
        requirePin: requireCardPin(classId),
      });
      if (!decision.ok && decision.reason === 'replaced') {
        setCardHold(null);
        setError(decision.error);
        focusInput();
        return;
      }
      if (!decision.ok && decision.reason === 'pin-required') {
        setCardHold(decision.student);
        setPin('');
        setNote(
          `${decision.student.name || studentName(decision.student.studentId)}. Enter PIN to continue in the bank.`,
        );
        focusInput();
        return;
      }
      const sid = String(studentQr.studentId);
      setCardHold(null);
      setStudentId(sid);
      const name = studentQr.name || studentName(sid);
      if (mode === 'self') {
        setNote(`Student identified: ${name}. Enter PIN to continue.`);
      } else if (mode === 'return') {
        setNote(`Student: ${name}. Check in their books below, or scan a copy label.`);
      } else if (pendingCopy && mode === 'checkout') {
        completeCheckout(pendingCopy, sid);
      } else {
        setNote(`Student: ${name}. Scan a book to check out.`);
      }
      focusInput();
      return;
    }

    const copy = findCopyByScan(text);
    if (copy) {
      handleCopyScan(copy);
      focusInput();
      return;
    }

    if (looksLikeIsbn(text)) {
      if (mode === 'inventory') {
        const title = findTitleByIsbn(text);
        const remaining = title
          ? copiesForTitle(title.id).filter(
              (c) => c.status !== 'out' && !(readInventory()?.foundIds || []).includes(c.id),
            )
          : [];
        if (remaining.length === 1) {
          handleCopyScan(remaining[0]);
          focusInput();
          return;
        }
        if (remaining.length > 1) {
          setPendingTitle(title);
          setNote(
            `ISBN matches “${title.title}” — scan the copy label so we know which copy.`,
          );
          focusInput();
          return;
        }
        const session = recordInventoryLeftover(text);
        setInventory(session);
        setNote(`Extra / unknown ISBN ${normalizeIsbn(text)} — logged as leftover.`);
        focusInput();
        return;
      }
      if (mode === 'return') {
        const title = findTitleByIsbn(text);
        const outCopies = title
          ? copiesForTitle(title.id).filter((c) => c.status === 'out')
          : [];
        const mine = studentId
          ? outCopies.filter((c) => {
              const loan = activeLoanForCopy(c.id);
              return loan && String(loan.studentId) === String(studentId);
            })
          : outCopies;
        if (mine.length === 1) {
          completeReturn(mine[0]);
          focusInput();
          return;
        }
        if (mine.length > 1) {
          setNote(
            `Several copies of “${title.title}” are out. Scan the copy label to check in the right one.`,
          );
          focusInput();
          return;
        }
        setError(
          title
            ? `No copy of “${title.title}” is checked out${studentId ? ' to this student' : ''}.`
            : 'That ISBN isn’t in the library yet. Add it in Manage Library.',
        );
        focusInput();
        return;
      }
      await handleIsbn(text);
      return;
    }

    if (mode === 'inventory') {
      const session = recordInventoryLeftover(text);
      setInventory(session);
      setNote(`Leftover code logged: ${text.slice(0, 40)}`);
      focusInput();
      return;
    }

    setError('Unrecognized code. Scan an ISBN, a Library copy label, or a ClassBank student QR.');
    focusInput();
  };

  handleScanRef.current = handleScan;

  const doCheckout = () => {
    clearTransient();
    if (completeCheckout(pendingCopy)) focusInput();
  };

  const onSubmit = (e) => {
    e.preventDefault();
    handleScan(raw);
  };

  const availableCopies = pendingTitle
    ? copiesForTitle(pendingTitle.id).filter((c) => c.status !== 'out')
    : [];

  const sortedRoster = useMemo(
    () =>
      [...(roster || [])].sort((a, b) =>
        studentDisplayName(a).localeCompare(studentDisplayName(b)),
      ),
    [roster],
  );

  const studentLoans = useMemo(() => {
    void refreshKey;
    if (!studentId) return [];
    return listActiveLoans().filter(
      (row) => String(row.loan.studentId) === String(studentId),
    );
  }, [studentId, refreshKey]);

  const showStudent = mode === 'checkout' || mode === 'return' || mode === 'self';

  return (
    <div className="space-y-4 max-w-2xl">
      <PageHeader
        title="Circulation"
        description={
          classLabel
            ? `${classLabel} · Check books in and out, or run year-end inventory`
            : 'Check books in and out, or run year-end inventory'
        }
        isDarkMode={isDarkMode}
      />

      <div className="flex flex-wrap gap-1.5">
        {[
          { id: 'checkout', label: 'Check out' },
          { id: 'return', label: 'Check in' },
          { id: 'inventory', label: 'Inventory' },
          ...(settings.studentSelfCheckout ? [{ id: 'self', label: 'Self-checkout' }] : []),
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            className={`edu-control rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
              mode === m.id
                ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                : `${theme.colorSurfaceVariant} ${theme.colorOnSurfaceVariant}`
            }`}
            onClick={() => {
              setMode(m.id);
              clearTransient();
              setPendingCopy(null);
              setPendingTitle(null);
              if (m.id === 'inventory' && !readInventory()) {
                setInventory(startInventory());
              }
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={onSubmit}
        className={`p-4 space-y-3 ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}
      >
        {showStudent ? (
          <label className="flex flex-col gap-1">
            <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>Student</span>
            <select
              className={fieldClass}
              value={studentId}
              onChange={(e) => {
                const next = e.target.value;
                setStudentId(next);
                if (next && pendingCopy && mode === 'checkout') {
                  clearTransient();
                  completeCheckout(pendingCopy, next);
                }
              }}
            >
              <option value="">Select a student…</option>
              {studentId &&
              !sortedRoster.some((s) => String(s.id) === String(studentId)) ? (
                <option value={studentId}>{studentName(studentId)}</option>
              ) : null}
              {sortedRoster.map((s) => (
                <option key={s.id} value={s.id}>
                  {studentDisplayName(s)}
                </option>
              ))}
            </select>
            {!sortedRoster.length ? (
              <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                Pick a class in Classes to load the roster.
              </span>
            ) : null}
          </label>
        ) : null}
        {cardHold ? (
          <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-1">
              <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
                PIN for {cardHold.name || studentName(cardHold.studentId)}
              </span>
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                className={fieldClass}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Student PIN"
              />
            </label>
            <button type="button" className={toolBtn} onClick={confirmCardPin}>
              Continue
            </button>
          </div>
        ) : null}
        {mode === 'self' ? (
          <label className="flex flex-col gap-1">
            <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>PIN</span>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              className={fieldClass}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Student PIN"
            />
          </label>
        ) : null}
        <label className="flex flex-col gap-1">
          <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
            Scan or type ISBN / copy label
          </span>
          <input
            ref={inputRef}
            className={fieldClass}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="ISBN, LIB-…, or paste QR payload"
            autoComplete="off"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className={toolBtn}>
            <Keyboard size={16} strokeWidth={2.5} />
            Submit
          </button>
          {cameraOn ? (
            <button type="button" className={toolBtn} onClick={stopCamera}>
              Stop camera
            </button>
          ) : (
            <button type="button" className={toolBtn} onClick={openCamera}>
              <Camera size={16} strokeWidth={2.5} />
              Camera
            </button>
          )}
          {onOpenLabels ? (
            <button type="button" className={toolBtn} onClick={onOpenLabels}>
              Print labels
            </button>
          ) : null}
        </div>
        <BarcodeCameraPreview
          videoRef={videoRef}
          overlayRef={overlayRef}
          cameraOn={cameraOn}
          lockLabel={lockLabel}
        />
      </form>

      {(mode === 'checkout' || mode === 'self') && pendingCopy ? (
        <div className={`p-4 space-y-3 ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}>
          <p className={`${TYPE.labelLg} ${theme.colorOnSurface}`}>
            Ready · copy {pendingCopy.copyNumber}
            {pendingTitle ? ` · ${pendingTitle.title}` : ''}
          </p>
          <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            {studentId
              ? `Checking out to ${studentName(studentId)}.`
              : 'Pick a student above, then check out.'}
          </p>
          <button type="button" className={toolBtn} onClick={doCheckout}>
            Check out
          </button>
        </div>
      ) : null}

      {mode === 'checkout' && pendingTitle && !pendingCopy && availableCopies.length > 1 ? (
        <div className={`p-4 space-y-2 ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}>
          <p className={`${TYPE.labelLg} ${theme.colorOnSurface}`}>Pick a copy</p>
          <ul className="flex flex-wrap gap-2">
            {availableCopies.map((c) => (
              <button
                key={c.id}
                type="button"
                className={toolBtn}
                onClick={() => {
                  if (studentId) {
                    clearTransient();
                    queueCheckout(c, pendingTitle);
                  } else {
                    setPendingCopy(c);
                    setNote(`Copy ${c.copyNumber} selected. Pick a student.`);
                  }
                }}
              >
                Copy {c.copyNumber}
                {c.shortCode ? ` · ${c.shortCode}` : ''}
              </button>
            ))}
          </ul>
        </div>
      ) : null}

      {note ? <p className={`${TYPE.bodyMd} ${theme.colorOnSurface}`}>{note}</p> : null}
      {error ? <p className={`${TYPE.bodyMd} text-rose-500`}>{error}</p> : null}

      {mode === 'return' && studentId ? (
        <div className={`p-4 space-y-3 ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}>
          <p className={`${TYPE.labelLg} ${theme.colorOnSurface}`}>
            Out to {studentName(studentId)}
          </p>
          {!studentLoans.length ? (
            <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
              Nothing checked out. Scan a copy label to check a book in.
            </p>
          ) : (
            <ul className="space-y-2">
              {studentLoans.map(({ loan, copy, title, overdue }) => {
                const dueLabel = loan.dueAt
                  ? new Date(loan.dueAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })
                  : '—';
                return (
                  <li
                    key={loan.id}
                    className="flex flex-wrap items-center justify-between gap-2"
                  >
                    <span className={`${TYPE.bodyMd} ${theme.colorOnSurface}`}>
                      {title?.title || 'Book'}
                      {copy ? ` · copy ${copy.copyNumber}` : ''}
                      {' · due '}
                      <span className={overdue ? 'text-rose-500 font-semibold' : ''}>
                        {dueLabel}
                        {overdue ? ' · overdue' : ''}
                      </span>
                    </span>
                    {copy ? (
                      <button
                        type="button"
                        className={toolBtn}
                        onClick={() => {
                          clearTransient();
                          completeReturn(copy);
                        }}
                      >
                        Check in
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      {mode === 'inventory' ? (
        <InventoryPanel
          theme={theme}
          toolBtn={toolBtn}
          session={inventory}
          onStart={() => {
            setInventory(startInventory());
            setNote('Inventory started. Scan each copy you have in the room.');
            focusInput();
          }}
          onClear={() => {
            clearInventory();
            setInventory(null);
            setNote('Inventory cleared.');
          }}
        />
      ) : null}
    </div>
  );
}

function InventoryPanel({ theme, toolBtn, session, onStart, onClear }) {
  const report = inventoryReport(session);
  const started = Boolean(session?.startedAt);

  return (
    <section className={`p-4 space-y-4 ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className={`${TYPE.labelLg} ${theme.colorOnSurface}`}>Year-end inventory</p>
          <p className={`${TYPE.bodySm} mt-1 ${theme.colorOnSurfaceVariant}`}>
            Scan books one by one. Missing = expected on the shelf, not scanned. Leftover =
            extra unknown codes. Still out = with students.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={toolBtn} onClick={onStart}>
            {started ? 'Restart' : 'Start'}
          </button>
          {started ? (
            <button type="button" className={toolBtn} onClick={onClear}>
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {!started ? (
        <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
          Start inventory, then scan every copy label you can find.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <InventoryList
            theme={theme}
            heading={`Found (${report.found.length})`}
            rows={report.found}
            empty="None scanned yet."
          />
          <InventoryList
            theme={theme}
            heading={`Missing (${report.missing.length})`}
            rows={report.missing}
            empty="Nothing missing."
          />
          <InventoryList
            theme={theme}
            heading={`Still out (${report.out.length})`}
            rows={report.out}
            empty="No books checked out."
          />
          <div>
            <p className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>
              Leftover ({report.leftover.length})
            </p>
            {!report.leftover.length ? (
              <p className={`${TYPE.bodySm} mt-1 ${theme.colorOnSurfaceVariant}`}>None.</p>
            ) : (
              <ul className={`${TYPE.bodySm} mt-1 space-y-1 ${theme.colorOnSurfaceVariant}`}>
                {report.leftover.map((code, i) => (
                  <li key={`${code}-${i}`} className="truncate font-mono">
                    {code}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function InventoryList({ theme, heading, rows, empty }) {
  return (
    <div>
      <p className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>{heading}</p>
      {!rows.length ? (
        <p className={`${TYPE.bodySm} mt-1 ${theme.colorOnSurfaceVariant}`}>{empty}</p>
      ) : (
        <ul className={`${TYPE.bodySm} mt-1 space-y-1 ${theme.colorOnSurfaceVariant}`}>
          {rows.map(({ copy, title }) => (
            <li key={copy.id} className="truncate">
              {title?.title || 'Book'} · copy {copy.copyNumber}
              {copy.shortCode ? ` · ${copy.shortCode}` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
