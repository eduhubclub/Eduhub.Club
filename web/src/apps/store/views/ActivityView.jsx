import { Check, X } from 'lucide-react';
import { PageHeader } from '../../../shared/PageHeader';
import { TYPE } from '../../../shared/typography';
import { APP_GRID_CARD } from '../../../shared/layout';
import { useStore } from '../StoreContext';
import { studentDisplayName } from '../../../data/students/displayName';
import { formatStorePrice } from '../../../data/store/storeModel';
import { resolveStoreItemImageSrc } from '../../../data/store/demoStoreImages';
import { readCatalog } from '../../../data/store/storeStorage';

function purchaseItemImage(purchase, catalogById) {
  if (!purchase) return '';
  const item =
    catalogById[String(purchase.itemId)] ||
    Object.values(catalogById).find(
      (entry) =>
        String(entry.name || '').toLowerCase() ===
        String(purchase.itemName || '').toLowerCase(),
    );
  return resolveStoreItemImageSrc(item);
}

export function ActivityView({ isDarkMode, theme, classLabel }) {
  const { pending, purchases, roster, approvePending, denyPending } = useStore();
  const byId = Object.fromEntries(
    (roster || []).map((s) => [String(s.id), s]),
  );
  const catalogById = Object.fromEntries(
    readCatalog().map((item) => [String(item.id), item]),
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Activity"
        description={
          classLabel
            ? `${classLabel} · Approvals and recent redemptions`
            : 'Approvals and recent redemptions'
        }
        isDarkMode={isDarkMode}
      />

      <section className="space-y-2">
        <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
          Pending approval
        </h2>
        {pending.length === 0 ? (
          <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            No pending self-serve requests.
          </p>
        ) : (
          <ul className="space-y-2">
            {pending.map((p) => (
              <li
                key={p.id}
                className={`${APP_GRID_CARD} flex flex-wrap items-center gap-3 p-4 ${theme.colorSurface} ${theme.colorOutline}`}
              >
                <div className="min-w-0 flex-1">
                  <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
                    {p.itemName}
                  </p>
                  <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                    {formatStorePrice({
                      price: p.price,
                      currency: p.currency,
                    })}{' '}
                    ·{' '}
                    {(p.studentIds || [])
                      .map((id) =>
                        studentDisplayName(byId[id] || { id, name: id }),
                      )
                      .join(', ')}
                  </p>
                </div>
                <button
                  type="button"
                  className={`edu-control inline-flex items-center gap-1 rounded-lg px-3 py-1.5 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
                  onClick={() => approvePending(p.id)}
                >
                  <Check size={14} strokeWidth={2.5} />
                  Approve
                </button>
                <button
                  type="button"
                  className={`edu-control inline-flex items-center gap-1 rounded-lg px-3 py-1.5 ${TYPE.labelMd} ${
                    isDarkMode
                      ? 'bg-slate-800 text-slate-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                  onClick={() => denyPending(p.id)}
                >
                  <X size={14} strokeWidth={2.5} />
                  Deny
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
          Recent purchases
        </h2>
        {purchases.length === 0 ? (
          <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            No redemptions yet.
          </p>
        ) : (
          <ul
            className={`${APP_GRID_CARD} divide-y ${theme.colorSurface} ${theme.colorOutline} ${
              isDarkMode ? 'divide-slate-700' : 'divide-slate-200'
            }`}
          >
            {purchases.slice(0, 40).map((p) => {
              const imageSrc = purchaseItemImage(p, catalogById);
              return (
                <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt=""
                      className="h-7 w-7 shrink-0 rounded-full object-cover"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
                      {p.itemName}
                    </p>
                    <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                      {studentDisplayName(
                        byId[String(p.studentId)] || {
                          id: p.studentId,
                          name: p.studentId,
                        },
                      )}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                  >
                    {formatStorePrice({
                      price: p.price,
                      currency: p.wallet === 'points' ? 'points' : 'bank',
                    })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
