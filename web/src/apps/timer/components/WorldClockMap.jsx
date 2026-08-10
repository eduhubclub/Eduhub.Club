import { useEffect, useRef, useState } from 'react';
import { latLngToMapPercent, withCityCoords } from '../constants';
import { WORLD_MAP_LAND_PATH } from './worldMapLandPath';
import { APP_BOARD_CHROME } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';

function formatPinTime(date, tz) {
  try {
    return date.toLocaleTimeString('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function labelPlacement(left, top) {
  const labelBelow = top < 16;
  const nearLeft = left < 14;
  const nearRight = left > 86;
  let labelXClass = 'left-1/2 -translate-x-1/2';
  if (nearRight) labelXClass = 'right-0 translate-x-0';
  else if (nearLeft) labelXClass = 'left-0 translate-x-0';
  return { labelBelow, labelXClass };
}

/**
 * Equirectangular world map with live time pins for each active world clock.
 * Pins render under a separate popout layer so markers never cover cards.
 */
export function WorldClockMap({ clocks, isDarkMode, theme }) {
  const [now, setNow] = useState(() => new Date());
  const [openIndexes, setOpenIndexes] = useState(() => new Set());
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const hoverClearRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(
    () => () => {
      if (hoverClearRef.current) clearTimeout(hoverClearRef.current);
    },
    [],
  );

  const pins = clocks
    .map((clock, index) => ({ ...withCityCoords(clock), index }))
    .filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lng));

  const oceanClass = isDarkMode ? 'fill-slate-950' : 'fill-sky-100';
  const landClass = isDarkMode ? 'fill-slate-700' : 'fill-slate-300';
  const gridClass = isDarkMode ? 'stroke-slate-800' : 'stroke-sky-200/80';

  const cancelHoverClear = () => {
    if (hoverClearRef.current) {
      clearTimeout(hoverClearRef.current);
      hoverClearRef.current = null;
    }
  };

  const setHover = (index) => {
    cancelHoverClear();
    setHoveredIndex(index);
  };

  const scheduleHoverClear = (index) => {
    cancelHoverClear();
    hoverClearRef.current = setTimeout(() => {
      setHoveredIndex((prev) => (prev === index ? null : prev));
      hoverClearRef.current = null;
    }, 100);
  };

  const toggleOpen = (index) => {
    setOpenIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div
      className={`relative w-full overflow-hidden ${APP_BOARD_CHROME} ${theme.colorSurface} ${theme.colorOutline}`}
    >
      <div className="relative w-full aspect-[2/1] min-h-[280px] max-h-[min(70vh,560px)]">
        <svg
          viewBox="0 0 1000 500"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <rect width="1000" height="500" className={oceanClass} />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <line
              key={`v-${i}`}
              x1={(i / 6) * 1000}
              y1="0"
              x2={(i / 6) * 1000}
              y2="500"
              className={gridClass}
              strokeWidth="1"
            />
          ))}
          {[0, 1, 2, 3].map((i) => (
            <line
              key={`h-${i}`}
              x1="0"
              y1={(i / 3) * 500}
              x2="1000"
              y2={(i / 3) * 500}
              className={gridClass}
              strokeWidth="1"
            />
          ))}
          <path d={WORLD_MAP_LAND_PATH} className={landClass} />
        </svg>

        {/* Pin layer — always below popouts */}
        <div className="absolute inset-0 z-[1]">
          {pins.map((city) => {
            const { left, top } = latLngToMapPercent(city.lat, city.lng);
            const isOpen = openIndexes.has(city.index);
            const time = formatPinTime(now, city.tz);
            const showLabel = isOpen || hoveredIndex === city.index;

            return (
              <div
                key={`pin-${city.name}-${city.index}`}
                className="absolute"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                onMouseEnter={() => setHover(city.index)}
                onMouseLeave={() => scheduleHoverClear(city.index)}
              >
                <button
                  type="button"
                  onClick={() => toggleOpen(city.index)}
                  className={`edu-control h-4 w-4 rounded-full border-2 border-white shadow transition-transform hover:scale-125 ${theme.colorPrimary} ${
                    isOpen ? `ring-2 ring-offset-1 ${theme.ring}` : ''
                  }`}
                  aria-label={`${city.name}, ${time}`}
                  aria-expanded={showLabel}
                  title={`${city.name} — ${time}`}
                />
              </div>
            );
          })}
        </div>

        {/* Popout layer — always above every pin */}
        <div className="pointer-events-none absolute inset-0 z-[2]">
          {pins.map((city) => {
            const isOpen = openIndexes.has(city.index);
            const isHovered = hoveredIndex === city.index;
            if (!isOpen && !isHovered) return null;

            const { left, top } = latLngToMapPercent(city.lat, city.lng);
            const time = formatPinTime(now, city.tz);
            const { labelBelow, labelXClass } = labelPlacement(left, top);
            const zIndex = isHovered ? 30 : 10;

            return (
              <div
                key={`pop-${city.name}-${city.index}`}
                className="pointer-events-none absolute"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex,
                }}
              >
                <div className="relative h-4 w-4">
                  <div
                    className={`pointer-events-auto absolute w-max whitespace-nowrap rounded-xl border px-2.5 py-1 text-center shadow-md ${labelXClass} ${
                      labelBelow ? 'top-full mt-2' : 'bottom-full mb-2'
                    } ${theme.colorSurface} ${theme.colorOutline} ${
                      isOpen ? `ring-2 ${theme.ring}` : ''
                    }`}
                    onMouseEnter={() => setHover(city.index)}
                    onMouseLeave={() => scheduleHoverClear(city.index)}
                  >
                    <p
                      className={`leading-tight ${TYPE.labelMicro} ${theme.colorOnSurface}`}
                    >
                      {city.name}
                    </p>
                    <p
                      className={`font-mono leading-tight tabular-nums ${TYPE.bodySm} ${theme.colorOnSurface}`}
                    >
                      {time}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {pins.length === 0 && clocks.length > 0 ? (
        <p
          className={`absolute inset-x-0 bottom-3 text-center ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
        >
          Added cities need map coordinates to appear as pins.
        </p>
      ) : null}
    </div>
  );
}
