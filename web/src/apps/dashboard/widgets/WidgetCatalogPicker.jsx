import { useState } from 'react';
import { Check, ChevronDown, Lock, Plus } from 'lucide-react';
import {
  DASHBOARD_WIDGET_APPS,
  MAX_DASHBOARD_WIDGETS,
} from './registry';
import { TYPE } from '../../../shared/typography';

function initialOpenApps() {
  return Object.fromEntries(DASHBOARD_WIDGET_APPS.map((app) => [app.id, true]));
}

/**
 * Checkbox list of Dashboard teaching widgets, grouped by source app.
 */
export function WidgetCatalogPicker({
  theme,
  isDarkMode,
  pinnedIds = [],
  onPin,
  onUnpin,
  idPrefix = 'widget-opt',
}) {
  const pinnedCount = pinnedIds.length;
  const atLimit = pinnedCount >= MAX_DASHBOARD_WIDGETS;
  const pinnedSet = new Set(pinnedIds);
  const [openApps, setOpenApps] = useState(initialOpenApps);

  const toggleApp = (appId) => {
    setOpenApps((prev) => ({ ...prev, [appId]: !prev[appId] }));
  };

  return (
    <div className="space-y-6">
      <p
        className={`${TYPE.bodySm} ${
          isDarkMode ? 'text-slate-500' : 'text-slate-400'
        }`}
      >
        <span
          className={`font-bold ${
            isDarkMode ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          {pinnedCount}/{MAX_DASHBOARD_WIDGETS}
        </span>
        {' '}
        selected for the Dashboard sidebar
        {atLimit ? ' · limit reached' : ''}.
      </p>

      {DASHBOARD_WIDGET_APPS.map((app) => {
        const open = openApps[app.id] !== false;
        const appSelectedCount = app.widgets.filter((w) =>
          pinnedSet.has(w.id)
        ).length;

        return (
        <section key={app.id}>
          <button
            type="button"
            onClick={() => toggleApp(app.id)}
            aria-expanded={open}
            className={`mb-2 flex w-full items-center gap-2 rounded-lg py-0.5 text-left transition-colors ${
              isDarkMode
                ? 'hover:bg-slate-800/80'
                : 'hover:bg-slate-50'
            }`}
          >
            <h3 className={`min-w-0 flex-1 ${TYPE.labelMicro} text-slate-400`}>
              {app.name}
            </h3>
            {appSelectedCount > 0 ? (
              <span
                className={`shrink-0 text-[10px] font-bold tabular-nums ${
                  isDarkMode ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {appSelectedCount} selected
              </span>
            ) : null}
            <ChevronDown
              size={14}
              strokeWidth={2.5}
              className={`shrink-0 text-slate-400 transition-transform duration-200 ${
                open ? 'rotate-0' : '-rotate-90'
              }`}
              aria-hidden
            />
          </button>
          {open ? (
          <ul className="space-y-2">
            {app.widgets.map((widget) => {
              const Icon = widget.icon;
              const selected = pinnedSet.has(widget.id);
              const available = Boolean(widget.available && widget.Component);
              const canSelect = available && (selected || !atLimit);
              const checkboxId = `${idPrefix}-${widget.id}`;

              const toggle = () => {
                if (!available) return;
                if (selected) {
                  onUnpin?.(widget.id);
                  return;
                }
                if (!atLimit) onPin?.(widget.id);
              };

              return (
                <li key={widget.id}>
                  <label
                    htmlFor={available ? checkboxId : undefined}
                    className={`flex items-center gap-3 rounded-2xl border-[1.5px] px-3 py-3 transition-colors ${
                      available && canSelect
                        ? 'cursor-pointer'
                        : available
                          ? 'cursor-not-allowed'
                          : 'cursor-default'
                    } ${
                      selected
                        ? isDarkMode
                          ? `border-slate-600 ${theme.colorPrimaryContainer}`
                          : `border-slate-300 ${theme.colorPrimaryContainer}`
                        : available
                          ? isDarkMode
                            ? 'border-slate-600 bg-slate-900/60 hover:bg-slate-800/80'
                            : 'border-slate-300 bg-white hover:bg-slate-50'
                          : isDarkMode
                            ? 'border-slate-700 bg-slate-900/40 opacity-70'
                            : 'border-slate-200 bg-slate-50 opacity-80'
                    }`}
                    title={
                      available && !selected && atLimit
                        ? `You can select up to ${MAX_DASHBOARD_WIDGETS} widgets`
                        : undefined
                    }
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        available
                          ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                          : isDarkMode
                            ? 'bg-slate-800 text-slate-500'
                            : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {Icon ? (
                        <Icon size={18} strokeWidth={2} />
                      ) : (
                        <Plus size={18} strokeWidth={2} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={`truncate ${TYPE.titleSm} ${
                            isDarkMode ? 'text-slate-100' : 'text-slate-800'
                          }`}
                        >
                          {widget.name}
                        </p>
                        {!available && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${TYPE.labelMicro} ${
                              isDarkMode
                                ? 'bg-slate-800 text-slate-400'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            <Lock size={10} strokeWidth={2.5} />
                            Coming soon
                          </span>
                        )}
                      </div>
                      {widget.description ? (
                        <p
                          className={`mt-0.5 line-clamp-2 ${TYPE.bodySm} ${
                            isDarkMode ? 'text-slate-500' : 'text-slate-400'
                          }`}
                        >
                          {widget.description}
                        </p>
                      ) : null}
                    </div>
                    {available ? (
                      <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
                        <input
                          id={checkboxId}
                          type="checkbox"
                          checked={selected}
                          disabled={!canSelect}
                          onChange={toggle}
                          className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                          aria-label={
                            selected
                              ? `Deselect ${widget.name}`
                              : `Select ${widget.name}`
                          }
                        />
                        <span
                          className={`pointer-events-none flex h-5 w-5 items-center justify-center rounded border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-offset-1 ${
                            selected
                              ? `${theme.colorPrimaryVariant} border-transparent ${theme.colorOnPrimaryVariant}`
                              : isDarkMode
                                ? 'border-slate-600 bg-slate-900 peer-focus-visible:ring-slate-500'
                                : 'border-slate-300 bg-white peer-focus-visible:ring-slate-300'
                          } peer-disabled:opacity-40`}
                          aria-hidden
                        >
                          {selected ? (
                            <Check size={12} strokeWidth={3.5} className="text-white" />
                          ) : null}
                        </span>
                      </span>
                    ) : (
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center ${
                          isDarkMode ? 'text-slate-600' : 'text-slate-300'
                        }`}
                        aria-hidden
                      >
                        <Lock size={14} strokeWidth={2.25} />
                      </span>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>
          ) : null}
        </section>
        );
      })}
    </div>
  );
}
