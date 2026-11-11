import { useMemo } from 'react';
import {
  paceLagDays,
  toIsoDate,
} from '../../../data/pacing/pacingModel';
import { flattenSlots } from '../../../data/pacing/pacingModel';
import { APP_GRID_CARD, APP_STATIC_BOARD } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';

/**
 * Teacher vs district pace comparison stub + trend flag.
 */
export function InsightsView({ theme, store }) {
  const today = toIsoDate(new Date());
  const lag = useMemo(
    () => paceLagDays(store, today, store.blockOutDates),
    [store, today],
  );
  const trendFlag = lag >= 5;

  const rows = useMemo(() => {
    return (store.pacings || []).map((pacing) => {
      const slots = flattenSlots(pacing);
      const districtDone = (store.districtPlacements || []).filter(
        (p) => p.pacingId === pacing.id && p.date < today,
      ).length;
      const teacherDone = (store.teacherPlacements || []).filter(
        (p) => p.pacingId === pacing.id && p.status === 'done',
      ).length;
      const expectedOpen = (store.districtPlacements || []).find(
        (p) => p.pacingId === pacing.id && p.date >= today,
      );
      const teacherOpen = (store.teacherPlacements || [])
        .filter((p) => p.pacingId === pacing.id && p.status !== 'done')
        .sort((a, b) => a.date.localeCompare(b.date))[0];
      return {
        id: pacing.id,
        title: pacing.title,
        total: slots.length,
        districtDone,
        teacherDone,
        expectedDate: expectedOpen?.date || '—',
        teacherDate: teacherOpen?.date || '—',
      };
    });
  }, [store, today]);

  return (
    <div className="space-y-4">
      <div
        className={`${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} p-4 sm:p-5 space-y-2`}
      >
        <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>Insights</p>
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          District path is the steady baseline. Teacher reality drives trend
          flags when lag grows.
        </p>
        {trendFlag ? (
          <div
            className={`rounded-xl border-[1.5px] px-3 py-2 ${theme.colorErrorContainer || 'border-rose-300 bg-rose-50'} ${theme.colorOnErrorContainer || 'text-rose-900'}`}
          >
            <p className={TYPE.bodyMd}>
              Trend flag: about {lag} instructional days behind district
              expected pace. District would be notified when many schools show
              this pattern.
            </p>
          </div>
        ) : (
          <p className={`${TYPE.bodyMd} ${theme.colorOnSurface}`}>
            On pace relative to district (lag {lag} day{lag === 1 ? '' : 's'}).
          </p>
        )}
      </div>

      <div
        className={`${APP_STATIC_BOARD} ${theme.colorSurface} ${theme.colorOutline} p-4 sm:p-5 space-y-3`}
      >
        <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
          Per curriculum
        </p>
        {rows.length === 0 ? (
          <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            Create a pacing in Content Areas to see comparisons.
          </p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li
                key={row.id}
                className={`rounded-xl border-[1.5px] px-3 py-2 ${theme.colorOutline}`}
              >
                <p className={`${TYPE.bodyMd} font-medium ${theme.colorOnSurface}`}>
                  {row.title}
                </p>
                <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                  Teacher done {row.teacherDone}/{row.total} · District expected
                  date {row.expectedDate} · Teacher current {row.teacherDate}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
