import { Lock, Package, Pencil, ShoppingBag, Users } from 'lucide-react';
import { TYPE } from '../../../shared/typography';
import { APP_GRID_CARD } from '../../../shared/layout';
import { formatStorePrice } from '../../../data/store/storeModel';
import { getRemainingStock } from '../../../data/store/storeStorage';
import { resolveStoreItemImageSrc } from '../../../data/store/demoStoreImages';

export function StoreItemCard({
  item,
  theme,
  isDarkMode,
  classId,
  actions = null,
  onClick,
  onEdit,
  onStorefront = false,
  onToggleStorefront,
  showVisibility = false,
  footer = null,
}) {
  const remaining =
    classId != null ? getRemainingStock(item, classId) : item.stock;
  const stockLabel =
    item.inventoryMode === 'unlimited'
      ? 'Unlimited'
      : remaining === Infinity
        ? 'Unlimited'
        : remaining <= 0
          ? 'Out of stock'
          : `${remaining} left`;
  const imageSrc = resolveStoreItemImageSrc(item);
  const isPublic = item.visibility === 'public';

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`${APP_GRID_CARD} overflow-hidden ${theme.colorSurface} ${theme.colorOutline} ${
        onClick ? 'edu-control cursor-pointer hover:opacity-95' : ''
      }`}
    >
      <div
        className={`relative aspect-[4/3] ${
          isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
        }`}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <Package size={36} />
          </div>
        )}
        {onToggleStorefront ? (
          <button
            type="button"
            role="switch"
            aria-checked={onStorefront}
            className={`edu-control absolute top-2 left-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full shadow-sm ${
              onStorefront
                ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                : `${theme.colorSurface} ${theme.colorOnSurfaceVariant}`
            }`}
            title={
              onStorefront ? 'On storefront — click to remove' : 'Add to storefront'
            }
            aria-label={
              onStorefront
                ? `Remove ${item.name} from storefront`
                : `Add ${item.name} to storefront`
            }
            onClick={(e) => {
              e.stopPropagation();
              onToggleStorefront(!onStorefront);
            }}
          >
            <ShoppingBag size={14} strokeWidth={2.5} />
          </button>
        ) : null}
        {onEdit ? (
          <button
            type="button"
            className={`edu-control absolute top-2 right-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full shadow-sm ${theme.colorSurface} ${theme.colorOnSurface}`}
            title="Edit item"
            aria-label={`Edit ${item.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Pencil size={14} strokeWidth={2.5} />
          </button>
        ) : null}
        <span
          className={`absolute bottom-2 right-2 rounded-full px-3 py-1 text-[28px] font-semibold leading-none text-white ${
            item.currency === 'points'
              ? 'bg-indigo-500'
              : item.currency === 'both'
                ? 'bg-violet-500'
                : 'bg-red-500'
          }`}
        >
          {formatStorePrice(item)}
        </span>
      </div>
      <div className="space-y-1 p-3">
        <div className="flex items-start gap-2">
          <p className={`min-w-0 flex-1 ${TYPE.titleSm} ${theme.colorOnSurface}`}>
            {item.name}
          </p>
          {showVisibility ? (
            <span
              className={`mt-0.5 inline-flex shrink-0 items-center ${theme.colorOnSurface}`}
              title={isPublic ? 'Public (community)' : 'Private'}
              aria-label={isPublic ? 'Public' : 'Private'}
            >
              {isPublic ? (
                <Users size={16} strokeWidth={2.5} />
              ) : (
                <Lock size={16} strokeWidth={2.5} />
              )}
            </span>
          ) : null}
        </div>
        {item.description ? (
          <p
            className={`line-clamp-2 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
          >
            {item.description}
          </p>
        ) : null}
        <p className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
          {stockLabel}
          {item.allowRepurchase ? ' · Repeat OK' : ' · One per student'}
        </p>
        {actions}
        {footer}
      </div>
    </div>
  );
}
