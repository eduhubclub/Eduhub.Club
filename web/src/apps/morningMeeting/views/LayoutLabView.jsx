import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FlaskConical, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { AppPageShell } from '../../../shared/AppPageShell';
import { TYPE } from '../../../shared/typography';
import { toolBtnClass } from '../../../shared/toolBtn';
import { WIDGET_CATALOG, getWidgetMeta } from '../widgets/registry';
import {
  LAB_CAPACITY_CELL_PX,
  LAB_CELL_PX,
  LAB_GAP_PX,
  LAB_LAYOUT_RULES,
  LAB_REFERENCE_STAGE,
  labAbsoluteMaxPins,
  labAcceptsPins,
  labCanAddPin,
  labCapacityBySize,
  labFitBoard,
  labPlacementStyle,
  labRepackPins,
} from '../lab/boardLayoutLab';
import { EmptyCard } from '../lab/EmptyCard';
import { LabArrange } from '../lab/LabArrange';
import { createLabDemoPins } from '../lab/labDemoPins';

const SIZES = [
  { id: 's', label: 'S' },
  { id: 'm', label: 'M' },
  { id: 'l', label: 'L' },
  { id: 'banner', label: 'Banner' },
];

const ORIENTATIONS = [
  { id: 'horizontal', label: 'H', title: 'Horizontal' },
  { id: 'vertical', label: 'V', title: 'Vertical' },
];

/**
 * Isolated Layout Lab — empty shells + fixed-cell grid + card capacity.
 * Does not touch live Board / Edit board storage or layout.
 */
export function LayoutLabView({ isDarkMode, theme }) {
  const [pins, setPins] = useState(() => createLabDemoPins());
  const [layout, setLayout] = useState(null);
  const [mode, setMode] = useState(/** @type {'preview' | 'arrange'} */ ('preview'));
  const stageRef = useRef(null);
  const toolBtn = toolBtnClass(isDarkMode);

  // Card limits use the desktop panel target — not the shrunk on-page preview.
  const panelW = LAB_REFERENCE_STAGE.width;
  const panelH = LAB_REFERENCE_STAGE.height;

  useLayoutEffect(() => {
    if (mode !== 'preview') return undefined;
    const el = stageRef.current;
    if (!el) return undefined;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      setLayout(
        labFitBoard({
          pins,
          width: rect.width,
          height: rect.height,
          cellPx: LAB_CELL_PX,
          gap: LAB_GAP_PX,
        }),
      );
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pins, mode]);

  const placementById = useMemo(
    () => new Map((layout?.placements || []).map((p) => [p.id, p])),
    [layout],
  );

  const sizeCaps = useMemo(
    () => labCapacityBySize(panelW, panelH),
    [panelW, panelH],
  );
  const absoluteMax = useMemo(
    () => labAbsoluteMaxPins(panelW, panelH),
    [panelW, panelH],
  );
  const capacity = labAcceptsPins(pins, panelW, panelH);
  const atMaxCount = pins.length >= absoluteMax;

  const resetPins = () => setPins(createLabDemoPins());

  const setPinSize = (pinId, size) => {
    setPins((prev) => {
      const withSize = prev.map((p) =>
        p.id === pinId ? { ...p, size, layoutCustomized: false } : p,
      );
      // Always apply — re-pack so the new seed can place; capacity is advisory.
      return labRepackPins(withSize, { respectCustomized: true });
    });
  };

  const setPinOrientation = (pinId, orientation) => {
    setPins((prev) => {
      const withOrientation = prev.map((p) =>
        p.id === pinId ? { ...p, orientation, layoutCustomized: false } : p,
      );
      return labRepackPins(withOrientation, { respectCustomized: true });
    });
  };

  const onLayoutChange = (pinId, rect) => {
    setPins((prev) => {
      const next = prev.map((p) =>
        p.id === pinId ? { ...p, layout: rect, layoutCustomized: true } : p,
      );
      return labAcceptsPins(next, panelW, panelH).ok ? next : prev;
    });
  };

  const removePin = (pinId) => {
    setPins((prev) => prev.filter((p) => p.id !== pinId));
  };

  const addFromCatalog = (item) => {
    const result = labCanAddPin(
      pins,
      { type: item.type, size: item.defaultSize },
      panelW,
      panelH,
      { requireFit: false },
    );
    if (!result.ok || !result.pin) return;
    setPins((prev) => [...prev, result.pin]);
  };

  return (
    <AppPageShell variant="page" className="flex flex-col gap-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FlaskConical size={20} className={theme.colorOnSurface} />
            <h1 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>Layout lab</h1>
          </div>
          <p className={`${TYPE.bodySm} mt-1 ${theme.colorOnSurfaceVariant}`}>
            Panel-first: no scroll, grid fills the 16:9 stage. Card limits are dynamic
            by size at {LAB_CAPACITY_CELL_PX}px. Board and Edit board are unchanged.
          </p>
          <ol
            className={`mt-2 list-decimal pl-5 space-y-0.5 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
          >
            {LAB_LAYOUT_RULES.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ol>
          <p className={`mt-2 ${TYPE.labelLg} ${theme.colorOnSurface}`}>
            Cards {pins.length} / {absoluteMax} max
            {!capacity.ok
              ? capacity.reason === 'max'
                ? ' · at limit'
                : ' · too tall/wide for panel — remove a card'
              : null}
          </p>
          <p className={`mt-1 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            Panel capacity ({panelW}×{panelH}): S ×{sizeCaps.s} · M ×{sizeCaps.m} · L ×
            {sizeCaps.l} · Banner ×{sizeCaps.banner}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            className={`${toolBtn} ${mode === 'preview' ? 'ring-2 ring-offset-1' : ''}`}
            onClick={() => setMode('preview')}
          >
            Preview
          </button>
          <button
            type="button"
            className={`${toolBtn} ${mode === 'arrange' ? 'ring-2 ring-offset-1' : ''}`}
            onClick={() => setMode('arrange')}
          >
            Arrange
          </button>
          <button type="button" className={toolBtn} onClick={resetPins} title="Reset demo pins">
            <RotateCcw size={16} strokeWidth={2.5} />
            Reset
          </button>
        </div>
      </header>

      {mode === 'preview' ? (
        <div
          ref={stageRef}
          className={`relative aspect-video w-full shrink-0 overflow-hidden rounded-2xl border-[1.5px] ${theme.colorOutline} ${
            isDarkMode ? 'bg-slate-950' : 'bg-slate-50'
          }`}
          aria-label="Layout lab preview"
        >
          {layout ? (
            <div
              className="origin-top-left"
              style={{
                width: layout.boardW,
                height: layout.boardH,
                transform: `translate(${layout.offsetX}px, ${layout.offsetY}px)`,
                display: 'grid',
                gridTemplateColumns: `repeat(${layout.cols}, ${layout.cellW}px)`,
                gridTemplateRows: `repeat(${layout.rows}, ${layout.cellH}px)`,
                gap: layout.gap,
              }}
            >
              {pins.map((pin) => {
                const meta = getWidgetMeta(pin.type);
                const place = placementById.get(pin.id);
                if (!place) return null;
                const title =
                  pin.type === 'custom'
                    ? String(pin.props?.title || meta?.label || pin.type)
                    : meta?.label || pin.type;
                return (
                  <div
                    key={pin.id}
                    className="min-h-0 min-w-0"
                    style={labPlacementStyle(place)}
                  >
                    <EmptyCard
                      theme={theme}
                      title={title}
                      icon={meta?.Icon}
                      sizeLabel={pin.size}
                    />
                  </div>
                );
              })}
            </div>
          ) : null}
          {layout?.overCapacity ? (
            <p
              className={`pointer-events-none absolute bottom-2 right-2 rounded-lg px-2 py-1 ${TYPE.labelSm} ${theme.colorSurface} ${theme.colorOnSurfaceVariant} ${theme.colorOutline} border-[1.5px]`}
            >
              Cells {Math.round(layout.cellW)}×{Math.round(layout.cellH)}px · over
              capacity — remove a card
            </p>
          ) : null}
        </div>
      ) : (
        <div className="relative aspect-video w-full shrink-0 overflow-hidden">
          <div className="absolute inset-0">
            <LabArrange
              pins={pins}
              theme={theme}
              isDarkMode={isDarkMode}
              onLayoutChange={onLayoutChange}
              stageWidth={panelW}
              stageHeight={panelH}
            />
          </div>
        </div>
      )}

      <section className="flex flex-col gap-3">
        <h2 className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>Add a card</h2>
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          Adds allow up to {absoluteMax} cards on the {panelW}×{panelH} panel. Preview
          flags over capacity if the pack is too dense at {LAB_CAPACITY_CELL_PX}px.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {WIDGET_CATALOG.map((item) => {
            const Icon = item.Icon;
            const already =
              !item.allowMultiple && pins.some((p) => p.type === item.type);
            const check = labCanAddPin(
              pins,
              { type: item.type, size: item.defaultSize },
              panelW,
              panelH,
              { requireFit: false },
            );
            const disabled = already || !check.ok;
            const reason = already
              ? 'Already on board'
              : check.reason === 'max'
                ? `Max ${absoluteMax} cards on panel`
                : check.reason === 'fit'
                  ? 'Would not fit panel'
                  : null;
            return (
              <button
                key={item.type}
                type="button"
                disabled={disabled}
                onClick={() => addFromCatalog(item)}
                className={`edu-control flex items-start gap-3 text-left rounded-xl border-[1.5px] p-3 ${
                  disabled
                    ? `opacity-50 cursor-not-allowed ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurfaceVariant}`
                    : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`
                }`}
              >
                <span
                  className={`p-2 rounded-lg shrink-0 ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}
                >
                  <Icon size={18} />
                </span>
                <span className="min-w-0">
                  <span className={`block ${TYPE.labelLg}`}>
                    {disabled ? null : <Plus size={14} className="inline mr-1" />}
                    {item.label}
                  </span>
                  <span className={`block ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                    {reason || item.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>Demo card sizes</h2>
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          Size chips re-pack the board. If the pack is too big for the panel, Preview
          flags over capacity — remove a card.
          {atMaxCount ? ` At the ${absoluteMax}-card ceiling for this stage.` : null}
        </p>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {pins.map((pin) => {
            const meta = getWidgetMeta(pin.type);
            const title =
              pin.type === 'custom'
                ? String(pin.props?.title || meta?.label || pin.type)
                : meta?.label || pin.type;
            return (
              <li
                key={pin.id}
                className={`flex flex-col gap-2 rounded-xl border-[1.5px] p-3 ${theme.colorSurface} ${theme.colorOutline}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`${TYPE.labelLg} ${theme.colorOnSurface}`}>{title}</span>
                  <button
                    type="button"
                    className={`edu-control rounded-lg p-1.5 ${theme.colorOnSurfaceVariant}`}
                    title={`Remove ${title}`}
                    aria-label={`Remove ${title}`}
                    onClick={() => removePin(pin.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SIZES.map((s) => {
                    const active = pin.size === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        className={`edu-control rounded-lg px-2.5 py-1 text-xs font-semibold ${
                          active
                            ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                            : `${theme.colorSurfaceVariant} ${theme.colorOnSurfaceVariant}`
                        }`}
                        onClick={() => setPinSize(pin.id, s.id)}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                  <span
                    className={`mx-0.5 self-center h-4 w-px ${theme.colorOutline}`}
                    aria-hidden
                  />
                  {ORIENTATIONS.map((o) => {
                    const active = (pin.orientation || 'horizontal') === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        title={o.title}
                        aria-label={o.title}
                        className={`edu-control rounded-lg px-2.5 py-1 text-xs font-semibold ${
                          active
                            ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                            : `${theme.colorSurfaceVariant} ${theme.colorOnSurfaceVariant}`
                        }`}
                        onClick={() => setPinOrientation(pin.id, o.id)}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </AppPageShell>
  );
}
