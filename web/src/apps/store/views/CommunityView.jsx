import { Users } from 'lucide-react';
import { PageHeader } from '../../../shared/PageHeader';
import { TYPE } from '../../../shared/typography';
import { EmptyState } from '../../../shared/EmptyState';
import { useStore } from '../StoreContext';
import { StoreItemCard } from '../components/StoreItemCard';

/**
 * Community — public catalog items (local v1; multi-teacher sync later).
 */
export function CommunityView({ isDarkMode, theme, classLabel }) {
  const {
    catalog,
    classId,
    storefrontIds,
    addToClassStorefront,
    removeFromClassStorefront,
  } = useStore();

  const publicItems = catalog.filter((item) => item.visibility === 'public');

  return (
    <div className="space-y-4">
      <PageHeader
        title="Community"
        description={
          classLabel
            ? `${classLabel} · Public prizes you can add to your storefront`
            : 'Public prizes you can add to your storefront'
        }
        isDarkMode={isDarkMode}
      />

      {publicItems.length === 0 ? (
        <EmptyState
          isDarkMode={isDarkMode}
          message="No public items yet. Mark a catalog item Public to list it here."
          illustration={<Users size={36} className="text-slate-400" />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {publicItems.map((item) => {
            const onFront = storefrontIds.includes(item.id);
            return (
              <StoreItemCard
                key={item.id}
                item={item}
                theme={theme}
                isDarkMode={isDarkMode}
                classId={classId}
                onStorefront={onFront}
                onToggleStorefront={(next) => {
                  if (next) addToClassStorefront(item.id);
                  else removeFromClassStorefront(item.id);
                }}
                footer={
                  <p
                    className={`mt-1 ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                  >
                    Public · your catalog
                  </p>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
