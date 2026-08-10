import {
  Bell,
  Check,
  ChevronRight,
  Download,
  Plus,
  Settings2,
  Users,
} from 'lucide-react';
import { APP_GRID_CARD } from '../../shared/layout';
import { toolBtnClass } from '../../shared/toolBtn';
import { TYPE } from '../../shared/typography';
import { formatContrastRatio, wcagTextLabel } from '../../shared/colorContrast';

/**
 * Preview cards for Color Test — Edu.Hub chrome + Coolors-style layout examples.
 *
 * PARKED: not imported by ColorTestView while we rebuild formatting bit by bit.
 * Ask before deleting — reinstate pieces as needed.
 */

function CardShell({ children, className = '', style }) {
  return (
    <div
      className={`mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm last:mb-0 ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

function EduButtonsCard({ theme, isDarkMode }) {
  const { hex } = theme;
  const toolBtn = toolBtnClass(isDarkMode);
  return (
    <CardShell className="p-4">
      <p className={`mb-3 ${TYPE.labelMd} text-slate-500`}>Edu.Hub · Buttons</p>
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          className="edu-control rounded-xl px-5 py-2.5 shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: hex[400], color: hex.on400 }}
        >
          Primary
        </button>
        <button
          type="button"
          className="edu-control rounded-xl px-5 py-2.5 shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: hex[600], color: hex.on600 }}
        >
          Variant
        </button>
        <button type="button" className={toolBtn}>
          <Settings2 size={16} strokeWidth={2.5} />
          Tool
        </button>
        <button
          type="button"
          className="flex h-12 w-12 items-center justify-center rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
          style={{ backgroundColor: hex[400], color: hex.on400 }}
          aria-label="FAB"
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
        <span className={`${TYPE.labelMd} underline`} style={{ color: hex.link }}>
          Theme link
        </span>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {['Default', 'Hover', 'Active', 'Disabled'].map((state) => (
          <div key={state} className="space-y-1.5">
            <button
              type="button"
              disabled={state === 'Disabled'}
              className={`edu-control w-full rounded-lg py-2 text-xs font-semibold ${
                state === 'Disabled' ? 'opacity-50' : ''
              } ${state === 'Hover' ? 'opacity-90' : ''} ${
                state === 'Active' ? 'scale-95' : ''
              }`}
              style={{
                backgroundColor: state === 'Active' ? hex[700] : hex[400],
                color: state === 'Active' ? hex.on700 : hex.on400,
              }}
            >
              Primary
            </button>
            <span>{state}</span>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

function EduBoardCard({ theme }) {
  const { hex } = theme;
  return (
    <div
      className={`${APP_GRID_CARD} mb-4 break-inside-avoid border-slate-300 bg-white p-5`}
      style={{ borderColor: undefined }}
    >
      <div className="mb-3 flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${hex[400]}22`, color: hex[700] }}
        >
          <Users size={18} strokeWidth={2.5} />
        </div>
        <div>
          <p className={`${TYPE.titleSm} text-slate-900`}>Class roster</p>
          <p className={`${TYPE.bodySm} text-slate-500`}>APP_GRID_CARD preview</p>
        </div>
      </div>
      <div
        className="rounded-xl border border-slate-200 px-3 py-2.5"
        style={{ backgroundColor: `${hex[400]}12` }}
      >
        <p className="text-sm font-semibold" style={{ color: hex[700] }}>
          Selected row
        </p>
        <p className="text-xs text-slate-500">Primary container · on-container</p>
      </div>
      <button
        type="button"
        className="edu-control mt-3 w-full rounded-xl py-2.5 text-sm font-semibold"
        style={{ backgroundColor: hex[600], color: hex.on600 }}
      >
        Open board
      </button>
    </div>
  );
}

function EduModalChrome({ theme }) {
  const { hex } = theme;
  return (
    <CardShell>
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: hex[400], color: hex.on400 }}
      >
        <h3 className={`${TYPE.titleMd} truncate`}>Modal header</h3>
        <span className="text-xs font-semibold opacity-80">Esc</span>
      </div>
      <div className="space-y-3 p-4">
        <p className={`${TYPE.bodyMd} text-slate-600`}>
          Soft primary header with accessible on-color — same pattern as shared Modal.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="edu-control rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600"
          >
            Cancel
          </button>
          <button
            type="button"
            className="edu-control rounded-xl px-4 py-2 text-sm font-semibold shadow-sm"
            style={{ backgroundColor: hex[600], color: hex.on600 }}
          >
            Save
          </button>
        </div>
      </div>
    </CardShell>
  );
}

function EduSegmentCard({ theme, isDarkMode }) {
  const { hex } = theme;
  const options = ['Timer', 'Stopwatch', 'Clock'];
  return (
    <CardShell className="p-4">
      <p className={`mb-3 ${TYPE.labelMd} text-slate-500`}>Edu.Hub · SegmentControl</p>
      <div
        className={`inline-flex rounded-xl border p-1 shadow-sm ${
          isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-slate-200 bg-slate-100'
        }`}
      >
        {options.map((opt, i) => (
          <button
            key={opt}
            type="button"
            className={`edu-control rounded-lg px-3 py-2 text-sm font-semibold ${
              i === 0 ? 'bg-white text-slate-900 shadow' : 'text-slate-500'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Accent chip uses{' '}
        <span className="font-mono font-semibold" style={{ color: hex[600] }}>
          {hex[600]}
        </span>
      </p>
    </CardShell>
  );
}

/** Coolors-inspired hero — keep structure, restyle with Edu.Hub type. */
function CoolorsHeroCard({ theme }) {
  const { hex } = theme;
  return (
    <CardShell className="p-5">
      <p className="font-serif text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Increase your revenue by 3x
      </p>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">
        Our platform helps you close more deals and scale faster than ever.
      </p>
      <button
        type="button"
        className="edu-control mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm"
        style={{ backgroundColor: hex[600], color: hex.on600 }}
      >
        Start growing
      </button>
    </CardShell>
  );
}

function CoolorsCategories({ theme }) {
  const { hex } = theme;
  const cats = [
    'Grocery Stores',
    'Cafe and Restaurants',
    'Utilities',
    'Sport',
    'Taxi',
    'Pharmacies',
  ];
  return (
    <CardShell className="p-4">
      <p className={`mb-3 ${TYPE.labelMd} text-slate-500`}>Categories</p>
      <div className="flex flex-wrap gap-2">
        {cats.map((c, i) => (
          <button
            key={c}
            type="button"
            className={`edu-control rounded-full px-3 py-1.5 text-xs font-semibold ${
              i === 1 ? '' : 'border border-slate-200 bg-white text-slate-600'
            }`}
            style={
              i === 1
                ? { backgroundColor: hex[600], color: hex.on600 }
                : undefined
            }
          >
            {c}
          </button>
        ))}
      </div>
    </CardShell>
  );
}

function CoolorsStats({ theme }) {
  const { hex } = theme;
  const rows = [
    { label: 'Home Renovation', total: '$10.000', a: '$8.250', b: '$1.750' },
    { label: 'Education & Courses', total: '$40.000', a: '$19.500', b: '$20.500' },
    { label: 'Health & Wellness', total: '$5.500', a: '$3.000', b: '$2.500' },
  ];
  return (
    <CardShell className="p-4">
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="font-medium text-slate-700">{row.label}</span>
              <span className="font-semibold text-slate-900">{row.total}</span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full" style={{ width: '65%', backgroundColor: hex[500] }} />
              <div className="h-full" style={{ width: '35%', backgroundColor: hex[200] || hex[100] }} />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-slate-400">
              <span>{row.a}</span>
              <span>{row.b}</span>
            </div>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

function CoolorsPricing({ theme }) {
  const { hex } = theme;
  const plans = [
    { name: 'Individual', price: '$0', note: 'Perfect for freelancers or hobbyists starting out.' },
    {
      name: 'Team',
      price: '$99',
      note: 'Ideal for growing teams that need collaboration tools.',
      featured: true,
    },
    {
      name: 'Enterprise',
      price: '$199',
      note: 'Designed for large organizations with custom needs.',
    },
  ];
  return (
    <CardShell className="p-4">
      <p className={`mb-3 ${TYPE.labelMd} text-slate-500`}>Pricing plans</p>
      <div className="grid grid-cols-1 gap-2">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`rounded-xl border p-3 ${
              p.featured ? 'border-transparent shadow-md' : 'border-slate-200'
            }`}
            style={p.featured ? { backgroundColor: hex[600], color: hex.on600 } : undefined}
          >
            <p className={`text-xs font-semibold uppercase tracking-wide ${p.featured ? 'opacity-80' : 'text-slate-500'}`}>
              {p.name}
            </p>
            <p className="mt-1 font-serif text-2xl font-bold">
              {p.price}
              <span className={`text-sm font-medium ${p.featured ? 'opacity-80' : 'text-slate-500'}`}>
                /mo
              </span>
            </p>
            <p className={`mt-2 text-xs leading-relaxed ${p.featured ? 'opacity-90' : 'text-slate-500'}`}>
              {p.note}
            </p>
            <button
              type="button"
              className={`edu-control mt-3 w-full rounded-lg py-2 text-xs font-semibold ${
                p.featured ? 'bg-white/20' : 'border border-slate-200 text-slate-700'
              }`}
            >
              {p.name === 'Enterprise' ? 'Contact us' : 'Get started'}
            </button>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

function CoolorsSchedule({ theme }) {
  const { hex } = theme;
  const items = [
    { t: '9:15 AM', title: 'Weekly Team Sync', body: 'Quick check-in to align priorities.' },
    { t: '4:00 PM', title: 'Client Pitch Rehearsal', body: 'Refine messaging with the team.' },
    { t: '7:30 PM', title: 'Product Design Review', body: 'UI/UX proposals and feedback.' },
  ];
  return (
    <CardShell className="p-4">
      <p className={`mb-3 ${TYPE.labelMd} text-slate-500`}>Schedule</p>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={item.t} className="flex gap-3">
            <div
              className="mt-1 h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: i === 0 ? hex[600] : hex[300] || hex[400] }}
            />
            <div>
              <p className="text-xs font-semibold" style={{ color: hex[700] }}>
                {item.t}
              </p>
              <p className="text-sm font-semibold text-slate-800">{item.title}</p>
              <p className="text-xs text-slate-500">{item.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </CardShell>
  );
}

function CoolorsMetrics({ theme }) {
  const { hex } = theme;
  const metrics = [
    { label: 'Total Subscribers', value: '71,842', delta: '+12%', up: true },
    { label: 'Avg. Open Rate', value: '58.16%', delta: '+2.02%', up: true },
    { label: 'Avg. Click Rate', value: '24.57%', delta: '−4.05%', up: false },
  ];
  return (
    <CardShell className="p-4">
      <div className="space-y-3">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-end justify-between gap-2">
            <div>
              <p className="text-xs text-slate-500">{m.label}</p>
              <p className="font-serif text-xl font-bold text-slate-900">{m.value}</p>
            </div>
            <span
              className="rounded-md px-2 py-0.5 text-[10px] font-bold"
              style={{
                backgroundColor: m.up ? `${hex[400]}22` : '#fee2e2',
                color: m.up ? hex[700] : '#b91c1c',
              }}
            >
              {m.delta}
            </span>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

function CoolorsSettingsList({ theme }) {
  const { hex } = theme;
  const rows = [
    {
      icon: Users,
      title: 'Manage team access',
      body: 'Control who can view, edit, and approve content.',
    },
    {
      icon: Bell,
      title: 'Notifications settings',
      body: 'Customize when and how you receive alerts.',
    },
    {
      icon: Download,
      title: 'Download reports',
      body: 'Export activity summaries in multiple formats.',
    },
  ];
  return (
    <CardShell className="overflow-hidden">
      {rows.map((row, i) => {
        const Icon = row.icon;
        return (
          <button
            key={row.title}
            type="button"
            className={`edu-control flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 ${
              i > 0 ? 'border-t border-slate-100' : ''
            }`}
          >
            <div
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${hex[400]}18`, color: hex[700] }}
            >
              <Icon size={16} strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800">{row.title}</p>
              <p className="text-xs text-slate-500">{row.body}</p>
            </div>
            <ChevronRight size={16} className="mt-1 shrink-0 text-slate-300" />
          </button>
        );
      })}
    </CardShell>
  );
}

function ContrastStrip({ scale }) {
  const keyLevels = ['400', '500', '600', '700'];
  return (
    <CardShell className="p-4">
      <p className={`mb-3 ${TYPE.labelMd} text-slate-500`}>Contrast check · white / slate-900</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {keyLevels.map((level) => {
          const swatch = scale.find((s) => s.level === level);
          if (!swatch) return null;
          return (
            <div key={level} className="overflow-hidden rounded-xl border border-slate-200">
              <div
                className="px-3 py-4 text-center text-sm font-semibold"
                style={{ backgroundColor: swatch.hex, color: swatch.onHex }}
              >
                {level}
              </div>
              <div className="flex items-center justify-between bg-slate-50 px-2 py-1.5 text-[10px] text-slate-600">
                <span className="font-mono">{formatContrastRatio(swatch.contrast)}</span>
                <span className="inline-flex items-center gap-0.5 font-bold uppercase">
                  {swatch.passesAA ? <Check size={10} /> : null}
                  {wcagTextLabel(swatch.contrast)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </CardShell>
  );
}

/**
 * @param {{ theme: object, scale: object[], isDarkMode: boolean }} props
 */
export function ColorTestExamples({ theme, scale, isDarkMode }) {
  return (
    <div className="columns-1 gap-4 sm:columns-2 xl:columns-3 [column-fill:_balance]">
      <EduButtonsCard theme={theme} isDarkMode={isDarkMode} />
      <EduBoardCard theme={theme} />
      <EduModalChrome theme={theme} />
      <EduSegmentCard theme={theme} isDarkMode={isDarkMode} />
      <CoolorsHeroCard theme={theme} />
      <CoolorsCategories theme={theme} />
      <CoolorsStats theme={theme} />
      <CoolorsPricing theme={theme} />
      <CoolorsSchedule theme={theme} />
      <CoolorsMetrics theme={theme} />
      <CoolorsSettingsList theme={theme} />
      <ContrastStrip scale={scale} />
    </div>
  );
}
