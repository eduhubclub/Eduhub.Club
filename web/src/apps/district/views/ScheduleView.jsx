import { Plus, Trash2 } from 'lucide-react';
import { AppPageShell } from '../../../shared/AppPageShell';
import { AppBoard } from '../../../shared/AppBoard';
import { ContentCardGrid } from '../../../shared/ContentCardGrid';
import { EmptyState } from '../../../shared/EmptyState';
import { PageHeader } from '../../../shared/PageHeader';
import { TYPE } from '../../../shared/typography';
import { bestOnColor } from '../../../shared/colorContrast';
import {
  CONTENT_AREAS,
  formatMinutes,
  periodMinutes,
  schoolDayMinutes,
  teachingSummary,
  withBlockPatch,
  withBlockPeriods,
  withBlockRemoved,
  withDayTimes,
  withNewBlock,
  withNewPeriod,
  withPeriodPatch,
  withPeriodRemoved,
} from '../../../data/district/districtModel';
import { districtFieldClass, districtQuietButton, districtTimeClass } from '../fields';

function KindToggle({ kind, theme, onChange }) {
  const options = [
    { id: 'instruction', label: 'Teaches' },
    { id: 'nonInstruction', label: 'Not teaching' },
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const active = kind === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`edu-control h-9 rounded-full px-3 ${TYPE.labelMd} ${
              active
                ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                : `${theme.colorSurfaceVariant} ${theme.colorOnSurfaceVariant}`
            }`}
            aria-pressed={active}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function SummaryCards({ summary, theme }) {
  return (
    <ContentCardGrid columns="grid-cols-1 sm:grid-cols-3" className="mb-4">
      <AppBoard mode="grid" theme={theme}>
        <p className={`${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}>Teaching</p>
        <p className={`mt-1 ${TYPE.titleLg} tabular-nums ${theme.colorOnSurface}`} aria-live="polite">
          {formatMinutes(summary.teachingMin)}
        </p>
      </AppBoard>
      <AppBoard mode="grid" theme={theme}>
        <p className={`${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}>Not teaching</p>
        <p className={`mt-1 ${TYPE.titleLg} tabular-nums ${theme.colorOnSurface}`}>
          {formatMinutes(summary.nonTeachingMin)}
        </p>
      </AppBoard>
      <AppBoard mode="grid" theme={theme}>
        <p className={`${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}>Not on a block</p>
        <p className={`mt-1 ${TYPE.titleLg} tabular-nums ${theme.colorOnSurface}`}>
          {formatMinutes(summary.unassignedMin)}
        </p>
      </AppBoard>
    </ContentCardGrid>
  );
}

function SchoolDayTimes({ schedule, theme, canEdit, onChange }) {
  const dayLength = schoolDayMinutes(schedule);
  return (
    <AppBoard mode="static" theme={theme} className="mb-4">
      <h2 className={`mb-1 ${TYPE.titleMd} ${theme.colorOnSurface}`}>School day</h2>
      <p className={`mb-3 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
        When the building day starts and ends — periods should sit inside this window.
      </p>
      {canEdit ? (
        <div className="flex flex-wrap items-center gap-2">
          <label className={`inline-flex items-center gap-2 ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
            Start
            <input
              type="time"
              className={districtTimeClass(theme)}
              value={schedule.dayStart || ''}
              aria-label="School day start"
              onChange={(event) => onChange?.({ dayStart: event.target.value })}
            />
          </label>
          <label className={`inline-flex items-center gap-2 ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
            End
            <input
              type="time"
              className={districtTimeClass(theme)}
              value={schedule.dayEnd || ''}
              aria-label="School day end"
              onChange={(event) => onChange?.({ dayEnd: event.target.value })}
            />
          </label>
          <span className={`tabular-nums ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
            {formatMinutes(dayLength)}
          </span>
        </div>
      ) : (
        <p className={`${TYPE.bodyMd} tabular-nums ${theme.colorOnSurface}`}>
          {[schedule.dayStart, schedule.dayEnd].filter(Boolean).join('–') || 'No times set'}
          {dayLength ? ` · ${formatMinutes(dayLength)}` : ''}
        </p>
      )}
    </AppBoard>
  );
}

function ReadOnlyDay({ schedule, theme }) {
  return (
    <>
      <SchoolDayTimes schedule={schedule} theme={theme} canEdit={false} />
      <AppBoard mode="static" theme={theme} className="mb-4">
        <h2 className={`mb-3 ${TYPE.titleMd} ${theme.colorOnSurface}`}>Periods</h2>
        {schedule.periods.length === 0 ? (
          <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>No periods yet.</p>
        ) : (
          <ul className="flex flex-col">
            {schedule.periods.map((period) => (
              <li
                key={period.id}
                className={`flex flex-wrap items-baseline justify-between gap-2 border-b py-2.5 last:border-b-0 ${theme.colorOutline}`}
              >
                <span className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
                  {period.label || 'Untitled'}
                </span>
                <span className={`${TYPE.bodySm} tabular-nums ${theme.colorOnSurfaceVariant}`}>
                  {[period.startTime, period.endTime].filter(Boolean).join('–') || 'No times'}
                  {` · ${formatMinutes(periodMinutes(period))}`}
                  {period.kind === 'nonInstruction' ? ' · Not teaching' : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </AppBoard>
      <AppBoard mode="static" theme={theme}>
        <h2 className={`mb-3 ${TYPE.titleMd} ${theme.colorOnSurface}`}>Content blocks</h2>
        {schedule.blocks.length === 0 ? (
          <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>No content blocks yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {schedule.blocks.map((block) => {
              const minutes = block.periodIds.reduce((total, id) => {
                const period = schedule.periods.find((row) => row.id === id);
                return total + periodMinutes(period);
              }, 0);
              const area =
                CONTENT_AREAS.find((row) => row.id === block.contentArea)?.label || 'Other';
              const periodLabels = block.periodIds
                .map((id) => schedule.periods.find((row) => row.id === id)?.label)
                .filter(Boolean);
              return (
                <li
                  key={block.id}
                  className={`rounded-xl border-[1.5px] px-3 py-3 ${theme.colorOutline}`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: block.color }}
                      aria-hidden
                    />
                    <span className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
                      {block.label || 'Untitled'}
                    </span>
                    <span className={`ml-auto tabular-nums ${TYPE.labelMd} ${theme.colorOnSurface}`}>
                      {formatMinutes(minutes)}
                    </span>
                  </div>
                  <p className={`mt-1 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                    {area}
                    {periodLabels.length ? ` · ${periodLabels.join(', ')}` : ''}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </AppBoard>
    </>
  );
}

export function ScheduleView({
  school,
  schedule,
  onSchedule,
  access = 'edit',
  isDarkMode,
  theme,
}) {
  if (!school || !schedule) {
    return (
      <AppPageShell variant="page">
        <PageHeader
          title="Schedule"
          description="Bell periods and the content blocks that use them."
          isDarkMode={isDarkMode}
        />
        <EmptyState
          isDarkMode={isDarkMode}
          message={
            access === 'edit'
              ? 'Add a school first, then build its day.'
              : 'Pick a school to see its day.'
          }
        />
      </AppPageShell>
    );
  }

  const summary = teachingSummary(schedule);
  const instructionPeriods = schedule.periods.filter((period) => period.kind === 'instruction');
  const canEdit = access === 'edit' && Boolean(onSchedule);
  const patchPeriod = (periodId, patch) => onSchedule?.(withPeriodPatch(schedule, periodId, patch));

  const description =
    access === 'surface'
      ? 'A quick look at available teaching time at this school. Open your school for the full day.'
      : access === 'own'
        ? 'Your school’s day — periods and content blocks. District admin sets this schedule.'
        : 'Periods are the bell. Content blocks are the teaching time inside them — the minutes a pacing guide has to fit. Lunch, recess, and arrival stay out of that total.';

  return (
    <AppPageShell variant="scroll">
      <PageHeader title={school.name} description={description} isDarkMode={isDarkMode} />

      <SummaryCards summary={summary} theme={theme} />

      {summary.byArea.length > 0 ? (
        <p className={`mb-4 ${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
          {summary.byArea.map((area) => `${area.label} ${formatMinutes(area.minutes)}`).join(' · ')}
        </p>
      ) : null}

      {access === 'surface' ? (
        <AppBoard mode="static" theme={theme}>
          <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
            Other schools stay at this summary. Select your school for the full period list.
          </p>
        </AppBoard>
      ) : null}

      {access === 'own' ? <ReadOnlyDay schedule={schedule} theme={theme} /> : null}

      {canEdit ? (
        <>
          <SchoolDayTimes
            schedule={schedule}
            theme={theme}
            canEdit
            onChange={(patch) => onSchedule?.(withDayTimes(schedule, patch))}
          />
          <AppBoard mode="static" theme={theme} className="mb-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>Periods</h2>
              <button
                type="button"
                className={districtQuietButton(theme)}
                onClick={() => onSchedule?.(withNewPeriod(schedule))}
              >
                <Plus size={14} />
                Add period
              </button>
            </div>
            {schedule.periods.length === 0 ? (
              <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
                Add the slices of the day, then mark which ones are teaching time.
              </p>
            ) : (
              <ul className="flex flex-col">
                {schedule.periods.map((period) => (
                  <li
                    key={period.id}
                    className={`flex flex-col gap-2 border-b py-3 last:border-b-0 sm:flex-row sm:items-center ${theme.colorOutline}`}
                  >
                    <input
                      className={`sm:flex-1 ${districtFieldClass(theme)}`}
                      value={period.label}
                      placeholder="Period name"
                      aria-label="Period name"
                      onChange={(event) => patchPeriod(period.id, { label: event.target.value })}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="time"
                        className={districtTimeClass(theme)}
                        value={period.startTime}
                        aria-label={`${period.label || 'Period'} start`}
                        onChange={(event) =>
                          patchPeriod(period.id, { startTime: event.target.value })
                        }
                      />
                      <input
                        type="time"
                        className={districtTimeClass(theme)}
                        value={period.endTime}
                        aria-label={`${period.label || 'Period'} end`}
                        onChange={(event) =>
                          patchPeriod(period.id, { endTime: event.target.value })
                        }
                      />
                      <span
                        className={`min-w-[4.5rem] tabular-nums ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                      >
                        {formatMinutes(periodMinutes(period))}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                      <KindToggle
                        kind={period.kind}
                        theme={theme}
                        onChange={(kind) => patchPeriod(period.id, { kind })}
                      />
                      <button
                        type="button"
                        className={districtQuietButton(theme)}
                        aria-label={`Remove ${period.label || 'period'}`}
                        onClick={() => onSchedule?.(withPeriodRemoved(schedule, period.id))}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </AppBoard>

          <AppBoard mode="static" theme={theme}>
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>Content blocks</h2>
              <button
                type="button"
                className={districtQuietButton(theme)}
                onClick={() => onSchedule?.(withNewBlock(schedule))}
              >
                <Plus size={14} />
                Add block
              </button>
            </div>
            <p className={`mb-3 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              A teaching period belongs to one block. Minutes roll up by content area.
            </p>
            {schedule.blocks.length === 0 ? (
              <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
                Add a content block, then attach the periods it uses.
              </p>
            ) : (
              <ul className="flex flex-col gap-4">
                {schedule.blocks.map((block) => {
                  const minutes = block.periodIds.reduce((total, id) => {
                    const period = schedule.periods.find((row) => row.id === id);
                    return total + periodMinutes(period);
                  }, 0);
                  return (
                    <li
                      key={block.id}
                      className={`rounded-xl border-[1.5px] p-3 ${theme.colorOutline}`}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: block.color }}
                          aria-hidden
                        />
                        <input
                          className={`sm:flex-1 ${districtFieldClass(theme)}`}
                          value={block.label}
                          placeholder="Block name"
                          aria-label="Block name"
                          onChange={(event) =>
                            onSchedule?.(
                              withBlockPatch(schedule, block.id, { label: event.target.value }),
                            )
                          }
                        />
                        <select
                          className={`sm:w-48 ${districtFieldClass(theme)}`}
                          value={block.contentArea}
                          aria-label="Content area"
                          onChange={(event) =>
                            onSchedule?.(
                              withBlockPatch(schedule, block.id, {
                                contentArea: event.target.value,
                              }),
                            )
                          }
                        >
                          {CONTENT_AREAS.map((area) => (
                            <option key={area.id} value={area.id}>
                              {area.label}
                            </option>
                          ))}
                        </select>
                        <span className={`tabular-nums ${TYPE.labelMd} ${theme.colorOnSurface}`}>
                          {formatMinutes(minutes)}
                        </span>
                        <button
                          type="button"
                          className={districtQuietButton(theme)}
                          aria-label={`Remove ${block.label || 'content block'}`}
                          onClick={() => onSchedule?.(withBlockRemoved(schedule, block.id))}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {instructionPeriods.length === 0 ? (
                        <p className={`mt-2 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                          Add a teaching period before linking it here.
                        </p>
                      ) : (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {instructionPeriods.map((period) => {
                            const selected = block.periodIds.includes(period.id);
                            const on = bestOnColor(block.color);
                            return (
                              <button
                                key={period.id}
                                type="button"
                                className={`edu-control rounded-full border-[1.5px] px-3 py-1.5 ${TYPE.labelMd} ${theme.colorOutline} ${
                                  selected ? '' : `${theme.colorSurface} ${theme.colorOnSurface}`
                                }`}
                                style={
                                  selected
                                    ? {
                                        backgroundColor: block.color,
                                        color: on.hex,
                                        borderColor: block.color,
                                      }
                                    : undefined
                                }
                                aria-pressed={selected}
                                onClick={() => {
                                  const nextIds = selected
                                    ? block.periodIds.filter((id) => id !== period.id)
                                    : [...block.periodIds, period.id];
                                  onSchedule?.(withBlockPeriods(schedule, block.id, nextIds));
                                }}
                              >
                                {period.label || 'Untitled'}
                                {periodMinutes(period)
                                  ? ` · ${formatMinutes(periodMinutes(period))}`
                                  : ''}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {summary.unassignedPeriods.length > 0 ? (
              <p className={`mt-3 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                Not on a block yet:{' '}
                {summary.unassignedPeriods
                  .map(
                    (period) =>
                      `${period.label || 'Untitled'} (${formatMinutes(periodMinutes(period))})`,
                  )
                  .join(', ')}
              </p>
            ) : null}
          </AppBoard>
        </>
      ) : null}
    </AppPageShell>
  );
}
