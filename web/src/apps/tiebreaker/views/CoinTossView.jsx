import { useEffect, useRef, useState } from 'react';
import { Coins, RotateCcw, Settings2, User } from 'lucide-react';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { StageToolLayout } from '../../../shared/StageToolLayout';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { useAnnounce } from '../../../shared/LiveAnnouncer';

const TOSS_MS = 1150;
const HISTORY_MAX = 100;
const HISTORY_COLS = 10;

/**
 * Animated heads / tails coin toss.
 */
export function CoinTossView({ isDarkMode, theme }) {
  const announce = useAnnounce();
  const [coinResult, setCoinResult] = useState('Heads');
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipRotation, setFlipRotation] = useState(0);
  const [history, setHistory] = useState([]); // 'Heads' | 'Tails', oldest → newest
  const [showHistory, setShowHistory] = useState(false);
  const [tempShowHistory, setTempShowHistory] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const tossTimerRef = useRef(null);

  useEffect(
    () => () => {
      if (tossTimerRef.current) window.clearTimeout(tossTimerRef.current);
    },
    [],
  );

  const handleCoinToss = () => {
    if (isFlipping) return;
    setIsFlipping(true);

    // Several full spins so the flip reads as a toss, then land on result.
    const extraRotations = (Math.floor(Math.random() * 4) + 7) * 360;
    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
    const resultAngle = result === 'Heads' ? 0 : 180;
    const newRotation =
      flipRotation + extraRotations + resultAngle - (flipRotation % 360);
    setFlipRotation(newRotation);

    if (tossTimerRef.current) window.clearTimeout(tossTimerRef.current);
    tossTimerRef.current = window.setTimeout(() => {
      tossTimerRef.current = null;
      setCoinResult(result);
      setIsFlipping(false);
      setHistory((prev) => [...prev, result].slice(-HISTORY_MAX));
      announce(`Coin landed on ${result}`);
    }, TOSS_MS);
  };

  const openSettings = () => {
    setTempShowHistory(showHistory);
    setIsSettingsOpen(true);
  };

  const saveSettings = () => {
    setShowHistory(tempShowHistory);
    setIsSettingsOpen(false);
  };

  const handleResetHistory = () => {
    if (isFlipping) return;
    setHistory([]);
  };

  const toolBtn = toolBtnClass(isDarkMode);

  const historySlots = Array.from({ length: HISTORY_MAX }, (_, i) => history[i] ?? null);
  const headsCount = history.filter((r) => r === 'Heads').length;
  const tailsCount = history.filter((r) => r === 'Tails').length;
  const hasHistory = history.length > 0;

  const toolbar = (
    <>
      {hasHistory ? (
        <button
          type="button"
          onClick={handleResetHistory}
          disabled={isFlipping}
          className={`${toolBtn} disabled:opacity-50`}
        >
          <RotateCcw size={16} strokeWidth={2.5} />
          Reset
        </button>
      ) : null}
      <button type="button" onClick={openSettings} className={toolBtn}>
        <Settings2 size={16} strokeWidth={2.5} />
        Settings
      </button>
    </>
  );

  return (
    <>
      <StageToolLayout
        toolbar={toolbar}
        boardSize="md"
        pad="none"
        theme={theme}
      >
            <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
            {/* Main toss area */}
            <div className="flex-1 min-w-0 min-h-0 flex flex-col items-center justify-end gap-4 sm:gap-6 pt-12 sm:pt-16 pb-8 sm:pb-10 px-4">
              <div
                className="relative w-[min(9.5rem,40%,22vh)] aspect-square shrink-0"
                style={{ perspective: '900px' }}
                aria-label={isFlipping ? 'Flipping' : coinResult}
              >
                {/* Soft floor shadow — fades while the coin is in the air */}
                <div
                  className={`absolute left-1/2 bottom-0 -translate-x-1/2 h-3 w-3/5 rounded-full bg-slate-900/20 blur-md transition-all duration-300 ${
                    isFlipping
                      ? 'opacity-20 scale-75 translate-y-1'
                      : 'opacity-50 scale-100'
                  }`}
                  aria-hidden
                />

                {/* Flight path (up / peak / land) */}
                <div
                  className={`relative w-full h-full ${isFlipping ? 'animate-coin-toss' : ''}`}
                >
                  {/* Spin axis */}
                  <div
                    className="w-full h-full relative"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: `rotateX(${flipRotation}deg)`,
                      transition: isFlipping
                        ? `transform ${TOSS_MS}ms cubic-bezier(0.15, 0.75, 0.2, 1)`
                        : 'none',
                    }}
                  >
                    <div
                      className={`absolute inset-0 rounded-full flex flex-col items-center justify-center shadow-lg ${theme.colorPrimary}`}
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <User size={48} className={theme.colorOnPrimary} />
                      <span
                        className={`mt-2 ${TYPE.labelMicro} ${theme.colorOnPrimary}`}
                      >
                        Heads
                      </span>
                    </div>
                    <div
                      className={`absolute inset-0 rounded-full flex flex-col items-center justify-center shadow-lg ${theme.colorPrimaryVariant}`}
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateX(180deg)',
                      }}
                    >
                      <Coins size={48} className={theme.colorOnPrimaryVariant} />
                      <span
                        className={`mt-2 ${TYPE.labelMicro} ${theme.colorOnPrimaryVariant}`}
                      >
                        Tails
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCoinToss}
                disabled={isFlipping}
                className={`edu-control px-5 py-2.5 ${TYPE.labelLg} rounded-xl shadow-sm inline-flex items-center justify-center transition-all active:scale-95 shrink-0 disabled:opacity-50 ${theme.colorPrimary} ${theme.colorOnPrimary}`}
              >
                Toss Coin
              </button>
            </div>

            {/* Past tosses — 10×10 grid scaled to fit (no scroll) */}
            {showHistory ? (
              <aside
                className={`w-[min(16rem,42%)] shrink-0 border-l p-2.5 sm:p-3 flex flex-col min-h-0 overflow-hidden ${
                  isDarkMode ? 'border-slate-700' : 'border-slate-200'
                }`}
                aria-label="Last 100 coin tosses"
              >
                <p
                  className={`${TYPE.labelMicro} mb-1.5 shrink-0 ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Last {HISTORY_MAX}
                </p>
                <div
                  className={`flex items-center justify-between gap-2 mb-2 ${TYPE.labelMd} tabular-nums shrink-0 ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5 min-w-0">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${theme.colorPrimary}`}
                      aria-hidden
                    />
                    <span className="truncate">Heads {headsCount}</span>
                  </span>
                  <span
                    className={`shrink-0 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}
                    aria-hidden
                  >
                    ·
                  </span>
                  <span className="inline-flex items-center gap-1.5 min-w-0 justify-end">
                    <span className="truncate">Tails {tailsCount}</span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${theme.colorPrimaryVariant}`}
                      aria-hidden
                    />
                  </span>
                </div>
                <div
                  className="flex-1 min-h-0 grid gap-1"
                  style={{
                    gridTemplateColumns: `repeat(${HISTORY_COLS}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${HISTORY_COLS}, minmax(0, 1fr))`,
                  }}
                >
                  {historySlots.map((result, i) => {
                    const shell =
                      'flex items-center justify-center min-h-0 min-w-0 w-full h-full [container-type:size]';
                    const circleSize = '[width:min(100%,100cqh)] aspect-square shrink-0 rounded-full';
                    if (!result) {
                      return (
                        <div key={`slot-${i}`} className={shell} aria-hidden>
                          <div
                            className={`${circleSize} ${
                              isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                            }`}
                          />
                        </div>
                      );
                    }

                    const isHeads = result === 'Heads';
                    return (
                      <div key={`slot-${i}`} className={shell}>
                        <div
                          title={result}
                          aria-label={`Toss ${i + 1}: ${result}`}
                          className={`${circleSize} flex items-center justify-center ${
                            isHeads
                              ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                              : `${theme.colorPrimaryVariant} ${theme.colorOnPrimaryVariant}`
                          }`}
                        >
                          {isHeads ? (
                            <User size={8} strokeWidth={2.5} aria-hidden />
                          ) : (
                            <span className="text-[8px] font-black leading-none" aria-hidden>
                              T
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </aside>
            ) : null}
            </div>
      </StageToolLayout>

      <Modal
        isOpen={isSettingsOpen}
        title="Settings"
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setIsSettingsOpen(false)}
        maxWidth="max-w-sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className={`px-4 py-2 rounded-xl ${TYPE.labelLg} ${
                isDarkMode
                  ? 'text-slate-300 hover:bg-slate-800'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Cancel
            </button>
            <ModalPrimaryButton theme={theme} onClick={saveSettings}>
              Apply Changes
            </ModalPrimaryButton>
          </>
        }
      >
        <div className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p
                className={`${TYPE.titleSm} ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                Show toss history
              </p>
              <p
                className={`${TYPE.bodySm} mt-1 ${
                  isDarkMode ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                Display the last 100 tosses on the right
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={tempShowHistory}
              aria-label="Show toss history"
              onClick={() => setTempShowHistory(!tempShowHistory)}
              className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
                tempShowHistory
                  ? theme.colorPrimary
                  : isDarkMode
                    ? 'bg-slate-700'
                    : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  tempShowHistory ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
