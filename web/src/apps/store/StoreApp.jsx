import { ShoppingBag } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useClasses } from '../../data/classes/ClassContext';
import { EmptyState } from '../../shared/EmptyState';
import { AppPageShell } from '../../shared/AppPageShell';
import { PageHeader } from '../../shared/PageHeader';
import { StoreProvider } from './StoreContext';
import { CatalogView } from './views/CatalogView';
import { StorefrontView } from './views/StorefrontView';
import { CommunityView } from './views/CommunityView';
import { ActivityView } from './views/ActivityView';

/**
 * Edu.Store — catalog, class storefront, and redeem activity.
 */
export function StoreApp({ activeTab, isDarkMode, theme, isLeft }) {
  const { classes, selectedClass, selectClass } = useClasses();

  const activeClasses = useMemo(
    () => (classes || []).filter((c) => !c.isArchived),
    [classes],
  );

  const roster = useMemo(
    () => selectedClass?.studentList || [],
    [selectedClass?.studentList],
  );

  useEffect(() => {
    if (!activeClasses.length) return;
    if (!selectedClass || selectedClass.isArchived) {
      selectClass(activeClasses[0].id);
    }
  }, [activeClasses, selectedClass, selectClass]);

  if (!activeClasses.length) {
    return (
      <AppPageShell variant="page">
        <PageHeader
          title="Store"
          description="Build a classroom storefront students can redeem from."
          isDarkMode={isDarkMode}
        />
        <EmptyState
          isDarkMode={isDarkMode}
          message="No classes yet. Add a class in Edu.Classes, or turn on demo data in Settings."
          illustration={<ShoppingBag size={36} className="text-slate-400" />}
        />
      </AppPageShell>
    );
  }

  return (
    <StoreProvider roster={roster} classId={selectedClass?.id}>
      <AppPageShell variant="scroll">
        {activeTab === 'Catalog' ? (
          <CatalogView
            isDarkMode={isDarkMode}
            theme={theme}
            isLeft={isLeft}
            classLabel={selectedClass?.name}
          />
        ) : activeTab === 'Community' ? (
          <CommunityView
            isDarkMode={isDarkMode}
            theme={theme}
            classLabel={selectedClass?.name}
          />
        ) : activeTab === 'Activity' ? (
          <ActivityView
            isDarkMode={isDarkMode}
            theme={theme}
            classLabel={selectedClass?.name}
          />
        ) : (
          <StorefrontView
            isDarkMode={isDarkMode}
            theme={theme}
            classLabel={selectedClass?.name}
            mode="manage"
          />
        )}
      </AppPageShell>
    </StoreProvider>
  );
}
