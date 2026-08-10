import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '../../../shared/PageHeader';
import { TYPE } from '../../../shared/typography';
import { appFabClass } from '../../../shared/layout';
import { useStore } from '../StoreContext';
import { StoreItemCard } from '../components/StoreItemCard';
import { StoreItemEditorModal } from '../components/StoreItemEditorModal';

export function CatalogView({
  isDarkMode,
  theme,
  isLeft = true,
  classLabel,
}) {
  const {
    catalog,
    classId,
    storefrontIds,
    saveItem,
    deleteItem,
    addToClassStorefront,
    removeFromClassStorefront,
    settings,
  } = useStore();
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const showCurrency = settings.connectBank && settings.connectBehavior;

  return (
    <div className="relative space-y-4 pb-20">
      <PageHeader
        title="Catalog"
        description={
          classLabel
            ? `${classLabel} · Build items, then add them to the storefront`
            : 'Build items for any class storefront'
        }
        isDarkMode={isDarkMode}
      />

      {catalog.length === 0 ? (
        <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
          No catalog items yet. Create a prize card to get started.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.map((item) => {
            const onFront = storefrontIds.includes(item.id);
            return (
              <StoreItemCard
                key={item.id}
                item={item}
                theme={theme}
                isDarkMode={isDarkMode}
                classId={classId}
                showVisibility
                onEdit={() => setEditing(item)}
                onStorefront={onFront}
                onToggleStorefront={(next) => {
                  if (next) addToClassStorefront(item.id);
                  else removeFromClassStorefront(item.id);
                }}
              />
            );
          })}
        </div>
      )}

      <button
        type="button"
        className={`${appFabClass(isLeft)} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
        onClick={() => setCreating(true)}
        title="New item"
        aria-label="New item"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      <StoreItemEditorModal
        isOpen={creating || Boolean(editing)}
        item={editing}
        theme={theme}
        isDarkMode={isDarkMode}
        showCurrency={showCurrency}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSave={(item) => {
          const currency =
            settings.connectBank && settings.connectBehavior
              ? item.currency
              : settings.connectBehavior && !settings.connectBank
                ? 'points'
                : 'bank';
          const saved = saveItem({ ...item, currency });
          if (creating && saved) addToClassStorefront(saved.id);
        }}
        onDelete={deleteItem}
      />
    </div>
  );
}
