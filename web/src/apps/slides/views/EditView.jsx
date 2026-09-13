import { useEffect, useMemo, useState } from 'react';
import {
  Circle,
  Clock,
  Copy,
  ImagePlus,
  Minus,
  Sparkles,
  Square,
  Trash2,
  Type,
} from 'lucide-react';
import { PageHeader } from '../../../shared/PageHeader';
import { EmptyState } from '../../../shared/EmptyState';
import { APP_GRID_CARD } from '../../../shared/layout';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { bestOnColor } from '../../../shared/colorContrast';
import { PIN_FONTS } from '../../morningMeeting/pinTextStyle';
import { ImageField, readFileAsDataUrl } from '../../morningMeeting/ImageField';
import {
  addObject,
  addSlide,
  deleteObject,
  deleteSlide,
  duplicateSlide,
  getActiveDeck,
  updateDeck,
  updateObject,
  updateSlide,
} from '../../../data/slides/storage';
import { SlideCanvas } from '../SlideCanvas';

const SHAPE_FILLS = ['#fb7185', '#38bdf8', '#34d399', '#fbbf24', '#a78bfa', '#0f172a'];
const TEXT_COLORS = ['#0f172a', '#ffffff', '#be123c', '#1d4ed8', '#047857'];

/**
 * Filmstrip + 16:9 freeform editor.
 */
export function EditView({
  theme,
  isDarkMode,
  settings,
  refreshKey,
  onOpenDecks,
  onOpenPresent,
}) {
  const deck = getActiveDeck();
  const [slideId, setSlideId] = useState(deck?.slides[0]?.id || '');
  const [selectedId, setSelectedId] = useState('');
  const [imageDraft, setImageDraft] = useState('');
  const toolBtn = toolBtnClass(isDarkMode);

  useEffect(() => {
    const next = getActiveDeck();
    if (!next) return;
    if (!next.slides.some((s) => s.id === slideId)) {
      setSlideId(next.slides[0]?.id || '');
      setSelectedId('');
    }
  }, [refreshKey, slideId]);

  const slide = useMemo(
    () => deck?.slides.find((s) => s.id === slideId) || deck?.slides[0] || null,
    [deck, slideId],
  );
  const selected = slide?.objects.find((o) => o.id === selectedId) || null;

  if (!deck || !slide) {
    return (
      <>
        <PageHeader title="Edit" description="Open a deck to edit slides." isDarkMode={isDarkMode} />
        <EmptyState
          isDarkMode={isDarkMode}
          message="No deck selected. Create one on Decks, or import a file."
        />
        <button type="button" className={`${toolBtn} mt-4`} onClick={onOpenDecks}>
          Go to Decks
        </button>
      </>
    );
  }

  const patchObject = (id, patch) => {
    updateObject(deck.id, slide.id, id, patch);
  };

  const add = (input) => {
    const obj = addObject(deck.id, slide.id, input);
    if (obj) setSelectedId(obj.id);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title={deck.name}
        description="Drag objects on the 16:9 canvas. Double-click text to edit."
        isDarkMode={isDarkMode}
        actions={
          <div className="flex flex-wrap gap-2">
            <input
              className={`edu-control max-w-[12rem] rounded-xl border-[1.5px] px-3 py-1.5 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
              value={deck.name}
              onChange={(e) => updateDeck(deck.id, { name: e.target.value })}
              aria-label="Deck name"
            />
            <button type="button" className={toolBtn} onClick={onOpenPresent}>
              Present
            </button>
          </div>
        }
      />

      <div className="flex min-h-0 flex-1 gap-3">
        <div
          className={`flex w-28 shrink-0 flex-col gap-2 overflow-y-auto p-2 ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}
        >
          {deck.slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`edu-control overflow-hidden rounded-xl border-[1.5px] ${
                s.id === slide.id
                  ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                  : `${theme.colorOutline}`
              }`}
              onClick={() => {
                setSlideId(s.id);
                setSelectedId('');
              }}
            >
              <span className={`block px-1 py-0.5 text-center ${TYPE.labelMicro}`}>{i + 1}</span>
              <SlideCanvas slide={s} theme={theme} aspect={settings.aspect} />
            </button>
          ))}
          <button
            type="button"
            className={`${toolBtn} w-full`}
            onClick={() => {
              const next = addSlide(deck.id, slide.id);
              if (next) setSlideId(next.id);
            }}
          >
            + Slide
          </button>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            <PaletteBtn theme={theme} icon={Type} label="Text" onClick={() => add({ kind: 'text', x: 12, y: 20, w: 70, h: 16, text: 'New text' })} />
            <PaletteBtn theme={theme} icon={ImagePlus} label="Image" onClick={() => add({ kind: 'image', x: 20, y: 20, w: 40, h: 40, src: '' })} />
            <PaletteBtn theme={theme} icon={Square} label="Rectangle" onClick={() => add({ kind: 'shape', shape: 'rect', x: 30, y: 30, w: 28, h: 20 })} />
            <PaletteBtn theme={theme} icon={Circle} label="Ellipse" onClick={() => add({ kind: 'shape', shape: 'ellipse', x: 32, y: 28, w: 24, h: 24 })} />
            <PaletteBtn theme={theme} icon={Minus} label="Line" onClick={() => add({ kind: 'shape', shape: 'line', x: 15, y: 48, w: 70, h: 6 })} />
            <PaletteBtn theme={theme} icon={Clock} label="Timer" onClick={() => add({ kind: 'embed', embedType: 'timer', x: 60, y: 8, w: 32, h: 28, durationSec: 60 })} />
            <PaletteBtn theme={theme} icon={Sparkles} label="Of the Day" onClick={() => add({ kind: 'embed', embedType: 'ofTheDay', x: 8, y: 55, w: 40, h: 36 })} />
            <button
              type="button"
              className={toolBtn}
              onClick={() => {
                const copy = duplicateSlide(deck.id, slide.id);
                if (copy) setSlideId(copy.id);
              }}
            >
              <Copy size={14} />
              Duplicate slide
            </button>
            <button
              type="button"
              className={toolBtn}
              onClick={() => {
                const result = deleteSlide(deck.id, slide.id);
                if (result.ok) setSelectedId('');
              }}
            >
              <Trash2 size={14} />
              Delete slide
            </button>
          </div>

          <div className={`${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} overflow-hidden`}>
            <SlideCanvas
              slide={slide}
              theme={theme}
              aspect={settings.aspect}
              interactive
              selectedId={selectedId}
              onSelect={setSelectedId}
              onChangeObject={patchObject}
              onDoubleClick={(obj) => {
                if (obj.kind !== 'text') return;
                const next = window.prompt('Text', obj.text);
                if (next != null) patchObject(obj.id, { text: next });
              }}
            />
          </div>

          <Inspector
            theme={theme}
            isDarkMode={isDarkMode}
            slide={slide}
            selected={selected}
            imageDraft={imageDraft}
            setImageDraft={setImageDraft}
            onPatchSlide={(patch) => updateSlide(deck.id, slide.id, patch)}
            onPatchObject={(patch) => selected && patchObject(selected.id, patch)}
            onDeleteObject={() => {
              if (!selected) return;
              deleteObject(deck.id, slide.id, selected.id);
              setSelectedId('');
            }}
          />
        </div>
      </div>
    </div>
  );
}

function PaletteBtn({ theme, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      className={`edu-control inline-flex items-center gap-1.5 rounded-xl border-[1.5px] px-3 py-1.5 ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
      onClick={onClick}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

function Inspector({
  theme,
  isDarkMode,
  slide,
  selected,
  imageDraft,
  setImageDraft,
  onPatchSlide,
  onPatchObject,
  onDeleteObject,
}) {
  const field = `edu-control rounded-xl border-[1.5px] px-3 py-1.5 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;

  return (
    <div className={`space-y-3 p-3 ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline}`}>
      <label className="block">
        <span className={`${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}>Speaker notes</span>
        <textarea
          className={`${field} mt-1 min-h-[4rem] w-full`}
          value={slide.notes}
          onChange={(e) => onPatchSlide({ notes: e.target.value })}
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}>Slide fill</span>
        {['#ffffff', '#0f172a', '#fff7ed', '#ecfeff'].map((hex) => {
          const on = bestOnColor(hex);
          return (
            <button
              key={hex}
              type="button"
              className="edu-control h-8 w-8 rounded-lg border-[1.5px]"
              style={{ backgroundColor: hex, color: on.hex, borderColor: hex }}
              aria-label={`Background ${hex}`}
              onClick={() => onPatchSlide({ background: { ...slide.background, color: hex } })}
            />
          );
        })}
        <label className={`${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}>
          Image
          <input
            type="file"
            accept="image/*"
            className="ml-2"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const src = await readFileAsDataUrl(file);
              onPatchSlide({ background: { ...slide.background, imageUrl: src } });
            }}
          />
        </label>
      </div>

      {selected ? (
        <div className="space-y-2 border-t-[1.5px] pt-3" style={{ borderColor: 'inherit' }}>
          <div className="flex items-center justify-between gap-2">
            <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
              {selected.kind === 'text'
                ? 'Text'
                : selected.kind === 'image'
                  ? 'Image'
                  : selected.kind === 'embed'
                    ? 'Embed'
                    : 'Shape'}
            </p>
            <button type="button" className={toolBtnClass(isDarkMode)} onClick={onDeleteObject}>
              Delete object
            </button>
          </div>
          {selected.kind === 'text' ? (
            <>
              <input
                className={`${field} w-full`}
                value={selected.text}
                onChange={(e) => onPatchObject({ text: e.target.value })}
              />
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min={12}
                  max={160}
                  className={`${field} w-20`}
                  value={selected.fontSize}
                  onChange={(e) => onPatchObject({ fontSize: Number(e.target.value) })}
                />
                <select
                  className={field}
                  value={selected.fontId}
                  onChange={(e) => onPatchObject({ fontId: e.target.value })}
                >
                  {PIN_FONTS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
                {TEXT_COLORS.map((hex) => {
                  const on = bestOnColor(hex);
                  return (
                    <button
                      key={hex}
                      type="button"
                      className="edu-control h-8 min-w-8 rounded-lg px-1"
                      style={{ backgroundColor: hex, color: on.hex }}
                      onClick={() => onPatchObject({ color: hex })}
                    />
                  );
                })}
              </div>
            </>
          ) : null}
          {selected.kind === 'image' ? (
            <ImageField
              theme={theme}
              isDarkMode={isDarkMode}
              value={selected.src || imageDraft}
              onChange={(src) => {
                setImageDraft(src);
                onPatchObject({ src });
              }}
            />
          ) : null}
          {selected.kind === 'shape' ? (
            <div className="flex flex-wrap gap-2">
              {SHAPE_FILLS.map((hex) => {
                const on = bestOnColor(hex);
                return (
                  <button
                    key={hex}
                    type="button"
                    className="edu-control h-8 w-8 rounded-lg"
                    style={{ backgroundColor: hex, color: on.hex }}
                    aria-label={hex}
                    onClick={() => onPatchObject({ fill: hex })}
                  />
                );
              })}
            </div>
          ) : null}
          {selected.kind === 'embed' && selected.embedType === 'timer' ? (
            <label className={`${TYPE.bodySm} ${theme.colorOnSurface}`}>
              Seconds
              <input
                type="number"
                min={5}
                max={3600}
                className={`${field} ml-2 w-24`}
                value={selected.durationSec}
                onChange={(e) => onPatchObject({ durationSec: Number(e.target.value) })}
              />
            </label>
          ) : null}
        </div>
      ) : (
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>Select an object to edit it.</p>
      )}
    </div>
  );
}
