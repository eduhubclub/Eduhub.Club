import { useRef, useState } from 'react';
import { Eraser, Paintbrush, Save } from 'lucide-react';
import { ANNOTATE_PALETTE } from '../../../shared/theme';
import { AppBoard } from '../../../shared/AppBoard';
import { ButtonRow, ButtonRowLabel } from '../../../shared/ButtonRow';
import { ContentCardGrid } from '../../../shared/ContentCardGrid';
import { StageToolLayout } from '../../../shared/StageToolLayout';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { ROCK_OPTIONS } from './rockOptions';
import { RockStage } from './RockStage';

const DEFAULT_EYES = [
  { x: 38, y: 42 },
  { x: 58, y: 42 },
];

/**
 * Wizard: pick rock → name → eyes + draw → save.
 */
export function PetRockSetup({
  theme,
  isDarkMode,
  initialPet = null,
  onSave,
  onCancel,
}) {
  const [step, setStep] = useState(initialPet ? 2 : 0);
  const [rockId, setRockId] = useState(initialPet?.rockId || ROCK_OPTIONS[0].id);
  const [name, setName] = useState(initialPet?.name || '');
  const [eyes, setEyes] = useState(
    initialPet?.eyes?.length >= 2 ? initialPet.eyes : DEFAULT_EYES,
  );
  const [strokes, setStrokes] = useState(initialPet?.strokes || []);
  const [drawTool, setDrawTool] = useState(null);
  const [drawColor, setDrawColor] = useState(ANNOTATE_PALETTE[0] || '#0f172a');
  const [error, setError] = useState('');
  const annotateRef = useRef(null);
  const toolBtn = toolBtnClass(isDarkMode);

  function captureStrokes() {
    const next = annotateRef.current?.getStrokes?.();
    if (next) setStrokes(next);
    return next || strokes;
  }

  function finish() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Give your rock a name.');
      setStep(1);
      return;
    }
    setError('');
    onSave?.({
      rockId,
      name: trimmed,
      eyes,
      strokes: captureStrokes(),
    });
  }

  if (step === 0) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div>
          <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>Pick your rock</h2>
          <p className={`${TYPE.bodySm} mt-1 ${theme.colorOnSurfaceVariant}`}>
            Choose a pen pal. You can decorate it next.
          </p>
        </div>
        <ContentCardGrid className="min-h-0 flex-1 overflow-auto">
          {ROCK_OPTIONS.map((rock) => {
            const selected = rock.id === rockId;
            return (
              <button
                key={rock.id}
                type="button"
                onClick={() => setRockId(rock.id)}
                className={`edu-control text-left ${theme.colorSurface} ${theme.colorOutline} rounded-2xl border-[1.5px] p-3 transition-colors ${
                  selected ? `${theme.colorPrimary} ${theme.colorOnPrimary}` : ''
                }`}
              >
                <div className="aspect-square overflow-hidden rounded-xl bg-black">
                  <img
                    src={rock.src}
                    alt=""
                    className="h-full w-full object-contain"
                    draggable={false}
                  />
                </div>
                <p className={`${TYPE.titleSm} mt-2`}>{rock.label}</p>
                <p
                  className={`${TYPE.bodySm} mt-1 ${
                    selected ? 'opacity-90' : theme.colorOnSurfaceVariant
                  }`}
                >
                  {rock.blurb}
                </p>
              </button>
            );
          })}
        </ContentCardGrid>
        <ButtonRow>
          <button type="button" className={toolBtn} onClick={() => setStep(1)}>
            <ButtonRowLabel>Next</ButtonRowLabel>
          </button>
        </ButtonRow>
      </div>
    );
  }

  if (step === 1) {
    return (
      <AppBoard mode="scroll" pad="board" theme={theme} className="h-full">
        <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>Name your rock</h2>
        <p className={`${TYPE.bodySm} mt-1 ${theme.colorOnSurfaceVariant}`}>
          Letters you write will start with “Dear {name.trim() || '…'},”
        </p>
        <label className={`mt-4 block ${TYPE.labelMd} ${theme.colorOnSurface}`}>
          Rock name
          <input
            type="text"
            value={name}
            maxLength={32}
            onChange={(e) => setName(e.target.value)}
            className={`edu-control mt-1 w-full max-w-md rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
            placeholder="Rocky"
            autoFocus
          />
        </label>
        {error ? (
          <p className={`${TYPE.bodySm} mt-2 text-red-600`} role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {!initialPet ? (
            <button type="button" className={toolBtn} onClick={() => setStep(0)}>
              Back
            </button>
          ) : null}
          <button
            type="button"
            className={`edu-control rounded-xl px-3 py-2 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
            onClick={() => {
              if (!name.trim()) {
                setError('Give your rock a name.');
                return;
              }
              setError('');
              setStep(2);
            }}
          >
            Next
          </button>
        </div>
      </AppBoard>
    );
  }

  return (
    <StageToolLayout
      theme={theme}
      toolbar={
        <>
          <button
            type="button"
            className={toolBtn}
            onClick={() => {
              captureStrokes();
              setStep(1);
            }}
          >
            <ButtonRowLabel>Name</ButtonRowLabel>
          </button>
          <button
            type="button"
            className={`${toolBtn} ${drawTool === null ? theme.text : ''}`}
            aria-pressed={drawTool === null}
            onClick={() => setDrawTool(null)}
          >
            <ButtonRowLabel>Move eyes</ButtonRowLabel>
          </button>
          <button
            type="button"
            className={`${toolBtn} ${drawTool === 'pen' ? theme.text : ''}`}
            aria-pressed={drawTool === 'pen'}
            onClick={() => setDrawTool('pen')}
          >
            <Paintbrush size={16} aria-hidden />
            <ButtonRowLabel>Draw</ButtonRowLabel>
          </button>
          <button
            type="button"
            className={`${toolBtn} ${drawTool === 'eraser' ? theme.text : ''}`}
            aria-pressed={drawTool === 'eraser'}
            onClick={() => setDrawTool('eraser')}
          >
            <Eraser size={16} aria-hidden />
            <ButtonRowLabel>Erase</ButtonRowLabel>
          </button>
          {drawTool === 'pen'
            ? ANNOTATE_PALETTE.slice(0, 8).map((hex) => (
                <button
                  key={hex}
                  type="button"
                  aria-label={`Color ${hex}`}
                  aria-pressed={drawColor === hex}
                  className={`edu-control h-9 w-9 rounded-full border-[1.5px] ${theme.colorOutline} ${
                    drawColor === hex ? `ring-2 ${theme.ring || 'ring-emerald-500'} ring-offset-1` : ''
                  }`}
                  style={{ backgroundColor: hex }}
                  onClick={() => setDrawColor(hex)}
                />
              ))
            : null}
          <button
            type="button"
            className={toolBtn}
            onClick={() => annotateRef.current?.clearAll?.()}
          >
            <ButtonRowLabel>Clear ink</ButtonRowLabel>
          </button>
          {onCancel ? (
            <button type="button" className={toolBtn} onClick={onCancel}>
              <ButtonRowLabel>Cancel</ButtonRowLabel>
            </button>
          ) : null}
          <button
            type="button"
            className={`edu-control inline-flex h-9 items-center gap-1.5 rounded-xl px-3 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
            onClick={finish}
          >
            <Save size={16} aria-hidden />
            <ButtonRowLabel>Save rock</ButtonRowLabel>
          </button>
        </>
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-2">
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          Drag the googly eyes, then draw on {name.trim() || 'your rock'}.
        </p>
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <RockStage
            rockId={rockId}
            eyes={eyes}
            strokes={strokes}
            seedKey={`setup-${rockId}-${initialPet?.updatedAt || 'new'}`}
            drawTool={drawTool}
            drawColor={drawColor}
            eyesEditable={drawTool === null}
            onEyesChange={setEyes}
            annotateRef={annotateRef}
            className="max-h-full w-auto max-w-full"
          />
        </div>
      </div>
    </StageToolLayout>
  );
}
