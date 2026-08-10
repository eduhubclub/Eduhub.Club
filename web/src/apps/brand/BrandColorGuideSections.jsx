import { BRAND_COLOR_PALETTES, BRAND_NEUTRAL_PALETTES } from './brandColorPalettes';
import {
  APP_TONE_WHITE_TEXT_ISSUES,
  BRAND_PRIMARY_ACCESS_REPORTS,
  formatContrastRatio,
  WCAG_REFERENCE_ROWS,
} from './brandColorAccessibility';

function AccessBadge({ passes, label }) {
  const tone = passes
    ? 'bg-emerald-100 text-emerald-800'
    : 'bg-amber-100 text-amber-900';
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone}`}
    >
      {label}
    </span>
  );
}

function PairingRow({ role, fill, on, ratio, label, passes }) {
  const onDark = on === '#ffffff';
  return (
    <div className="flex items-stretch gap-3 text-sm">
      <div className="w-28 shrink-0 pt-2 text-xs font-medium text-stone-500">{role}</div>
      <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-slate-200">
        <div
          className={`flex items-center justify-between px-3 py-2.5 ${onDark ? 'text-white' : 'text-stone-900'}`}
          style={{ backgroundColor: fill, color: on }}
        >
          <span className="text-xs font-semibold">Sample label</span>
          <span className="font-mono text-[10px] uppercase opacity-90">{on}</span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-stone-600">
          <span>{formatContrastRatio(ratio)}</span>
          <AccessBadge passes={passes} label={label} />
        </div>
      </div>
    </div>
  );
}

function PaletteColumn({ palette, captionBand, showAppWarning }) {
  const appFailsWhite =
    showAppWarning && APP_TONE_WHITE_TEXT_ISSUES.includes(palette.name);
  return (
    <div className="overflow-hidden rounded-2xl shadow-sm">
      {palette.swatches.map((swatch, index) => {
        const isLead = index === 0;
        const textClass = swatch.onDark ? 'text-white' : 'text-stone-900';
        const label = isLead
          ? swatch.level === palette.name
            ? palette.name
            : `${palette.name} ${swatch.level}`
          : swatch.level;
        const isApp = swatch.level === palette.appTone;
        return (
          <div
            key={swatch.level}
            className={`flex items-center justify-between px-3 py-2.5 ${textClass}`}
            style={{ backgroundColor: swatch.hex }}
          >
            <span className="text-xs font-semibold tracking-wide">
              {label}
              {isApp ? (
                <span className="ml-2 text-[10px] font-bold uppercase tracking-wider opacity-80">
                  App
                </span>
              ) : null}
              {isApp && appFailsWhite ? (
                <span
                  className="ml-1.5 text-[10px] font-bold uppercase tracking-wider opacity-90"
                  title="White text on this step fails WCAG AA — use dark on-color or a darker step for labels"
                >
                  · no white text
                </span>
              ) : null}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-tight opacity-90">
              {swatch.hex}
            </span>
          </div>
        );
      })}
      {palette.appFillHex ? (
        <div
          className={`flex items-center justify-between border-t px-3 py-2 text-[11px] ${captionBand}`}
        >
          <span className="font-semibold uppercase tracking-wider">App fill</span>
          <span className="font-mono uppercase">{palette.appFillHex}</span>
        </div>
      ) : null}
    </div>
  );
}

function PrimaryAccessCard({ report, cardChrome }) {
  return (
    <div className={`overflow-hidden rounded-2xl ${cardChrome}`}>
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="font-serif text-lg font-bold">{report.name}</h3>
        <p className="mt-0.5 text-xs text-stone-500">
          Theme pairings — primary for soft chrome, variant for emphasis, link on white surfaces
        </p>
      </div>
      <div className="space-y-3 p-4">
        <PairingRow
          role="Primary"
          fill={report.primary.fill}
          on={report.primary.on}
          ratio={report.primary.ratio}
          label={report.primary.label}
          passes={report.primary.passes}
        />
        <PairingRow
          role="Variant"
          fill={report.variant.fill}
          on={report.variant.on}
          ratio={report.variant.ratio}
          label={report.variant.label}
          passes={report.variant.passes}
        />
        <PairingRow
          role={`Link · ${report.link.level}`}
          fill="#ffffff"
          on={report.link.fill}
          ratio={report.link.ratio}
          label={report.link.label}
          passes={report.link.passes}
        />
      </div>
    </div>
  );
}

/**
 * AppGuide color contrast + leveled palettes (moved from HubBrand Color).
 */
export function BrandColorGuideSections({ isDarkMode }) {
  const muted = isDarkMode ? 'text-slate-400' : 'text-slate-600';
  const captionBand = isDarkMode
    ? 'border-slate-700 bg-slate-900/80 text-slate-400'
    : 'border-slate-200 bg-slate-100 text-slate-600';
  const cardChrome = isDarkMode
    ? 'border border-slate-700 bg-slate-900/50'
    : 'border border-slate-200 bg-white';
  const tableHead = isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600';
  const tableRow = isDarkMode ? 'border-slate-700' : 'border-slate-200';
  const callout = isDarkMode
    ? 'border-amber-800/60 bg-amber-950/40 text-amber-100'
    : 'border-amber-200 bg-amber-50 text-amber-950';

  return (
    <>
      <p className={`max-w-3xl text-sm leading-relaxed ${muted}`}>
        Following{' '}
        <a
          href="https://codelabs.developers.google.com/color-contrast-accessibility?hl=en#0"
          className="underline decoration-slate-400 underline-offset-2 hover:decoration-slate-600"
          target="_blank"
          rel="noreferrer"
        >
          Google&apos;s accessible color guidance
        </a>
        , we pair hues by <strong className="font-semibold">luminance</strong> (how light or dark a
        tone reads), not hue alone. Similar luminance blends together; different luminance stays
        legible — including for color-vision differences.
      </p>

      <div className={`mt-5 overflow-hidden rounded-2xl border ${cardChrome}`}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className={tableHead}>
              <th className="px-4 py-2.5 font-semibold">Use</th>
              <th className="px-4 py-2.5 font-semibold">WCAG AA</th>
              <th className="px-4 py-2.5 font-semibold">WCAG AAA</th>
              <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Notes</th>
            </tr>
          </thead>
          <tbody>
            {WCAG_REFERENCE_ROWS.map((row) => (
              <tr key={row.category} className={`border-t ${tableRow}`}>
                <td className="px-4 py-2.5 font-medium">{row.category}</td>
                <td className="px-4 py-2.5 font-mono text-xs">{row.aa}</td>
                <td className="px-4 py-2.5 font-mono text-xs">{row.aaa}</td>
                <td className={`hidden px-4 py-2.5 text-xs sm:table-cell ${muted}`}>{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={`mt-5 rounded-2xl border px-4 py-4 text-sm leading-relaxed ${callout}`}>
        <p className="font-semibold">How Edu.Hub applies this</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>
            <strong className="font-semibold">400-level App swatches</strong> are brand accents —
            borders, muted fills, logos. Pair with{' '}
            <strong className="font-semibold">slate-900</strong> labels, not white.
          </li>
          <li>
            <strong className="font-semibold">600–700 variants</strong> carry buttons, modal headers,
            and pressed states with <strong className="font-semibold">white</strong> text where
            contrast passes AA.
          </li>
          <li>
            <strong className="font-semibold">Links on white surfaces</strong> step down to 600–800
            in each family so body-size text meets 4.5:1.
          </li>
          <li>
            Avoid low-opacity type on tinted backgrounds — it reads as a lighter tone and fails
            contrast quickly.
          </li>
        </ul>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {BRAND_PRIMARY_ACCESS_REPORTS.map((report) => (
          <PrimaryAccessCard key={report.name} report={report} cardChrome={cardChrome} />
        ))}
      </div>

      <div className="mt-10">
        <h3 className={`text-base font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
          Primary palettes
        </h3>
        <p className={`mt-1 max-w-2xl text-sm leading-relaxed ${muted}`}>
          Nine primaries in a leveled scale — 50 through 900, plus accent tones. Steps marked App
          are the soft brand accent; pairings above show safe on-colors.
        </p>
        <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BRAND_COLOR_PALETTES.map((palette) => (
            <PaletteColumn
              key={palette.name}
              palette={palette}
              captionBand={captionBand}
              showAppWarning
            />
          ))}
        </div>
      </div>

      <div className="mt-10">
        <h3 className={`text-base font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
          Neutrals
        </h3>
        <p className={`mt-1 max-w-2xl text-sm leading-relaxed ${muted}`}>
          Slate is our gray — surfaces, outlines, and board chrome. White and black anchor light and
          dark fills. Slate 900 on white and white on slate 600+ both pass AA for normal text.
        </p>
        <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BRAND_NEUTRAL_PALETTES.map((palette) => (
            <PaletteColumn
              key={palette.name}
              palette={palette}
              captionBand={captionBand}
            />
          ))}
        </div>
      </div>
    </>
  );
}
