import { GalleryVertical } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useClasses } from '../../data/classes/ClassContext';
import { EmptyState } from '../../shared/EmptyState';
import { AppPageShell } from '../../shared/AppPageShell';
import { PageHeader } from '../../shared/PageHeader';
import { SLIDES_UPDATED_EVENT } from '../../data/slides/types';
import { readSlidesSettings } from '../../data/slides/settings';
import { DecksView } from './views/DecksView';
import { EditView } from './views/EditView';
import { PresentView } from './views/PresentView';
import { ImportView } from './views/ImportView';
import { FollowView } from './views/FollowView';

/**
 * Edu.Slides — teacher lesson decks.
 */
export function SlidesApp({ activeTab, isDarkMode, theme, onSetActiveTab }) {
  const { classes, selectedClass, selectClass } = useClasses();
  const [tick, setTick] = useState(0);
  const [settings, setSettings] = useState(readSlidesSettings);

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

  useEffect(() => {
    const bump = () => {
      setTick((n) => n + 1);
      setSettings(readSlidesSettings());
    };
    window.addEventListener(SLIDES_UPDATED_EVENT, bump);
    return () => window.removeEventListener(SLIDES_UPDATED_EVENT, bump);
  }, []);

  if (!activeClasses.length) {
    return (
      <AppPageShell variant="page">
        <PageHeader
          title="Slides"
          description="Build lesson decks and present them to the class."
          isDarkMode={isDarkMode}
        />
        <EmptyState
          isDarkMode={isDarkMode}
          message="No classes yet. Add a class in Edu.Classes, or turn on demo data in Settings."
          illustration={<GalleryVertical size={36} className="text-slate-400" />}
        />
      </AppPageShell>
    );
  }

  const shared = {
    theme,
    isDarkMode,
    classId: selectedClass?.id,
    classLabel: selectedClass?.name || '',
    roster,
    settings,
    refreshKey: tick,
    onOpenDecks: () => onSetActiveTab?.('Decks'),
    onOpenEdit: () => onSetActiveTab?.('Edit'),
    onOpenPresent: () => onSetActiveTab?.('Present'),
    onOpenFollow: () => onSetActiveTab?.('Follow'),
    onOpenImport: () => onSetActiveTab?.('Import'),
  };

  const variant =
    activeTab === 'Edit' || activeTab === 'Present' || activeTab === 'Follow'
      ? 'stage'
      : 'scroll';

  return (
    <AppPageShell variant={variant}>
      {activeTab === 'Edit' ? (
        <EditView {...shared} />
      ) : activeTab === 'Present' ? (
        <PresentView {...shared} />
      ) : activeTab === 'Import' ? (
        <ImportView {...shared} />
      ) : activeTab === 'Follow' ? (
        <FollowView {...shared} />
      ) : (
        <DecksView {...shared} />
      )}
    </AppPageShell>
  );
}
