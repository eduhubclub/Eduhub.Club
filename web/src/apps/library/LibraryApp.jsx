import { Library } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useClasses } from '../../data/classes/ClassContext';
import { EmptyState } from '../../shared/EmptyState';
import { AppPageShell } from '../../shared/AppPageShell';
import { PageHeader } from '../../shared/PageHeader';
import { LIBRARY_UPDATED_EVENT } from '../../data/library/types';
import { readLibrarySettings } from '../../data/library/settings';
import { ScanView } from './views/ScanView';
import { ShelfView } from './views/ShelfView';
import { OutView } from './views/OutView';
import { ManageLibraryView } from './views/ManageLibraryView';
import { LabelsView } from './views/LabelsView';

/**
 * Edu.Library — teacher shelf + checkout.
 */
export function LibraryApp({ activeTab, isDarkMode, theme, onSetActiveTab }) {
  const { classes, selectedClass, selectClass } = useClasses();
  const [tick, setTick] = useState(0);
  const [settings, setSettings] = useState(readLibrarySettings);

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
      setSettings(readLibrarySettings());
    };
    window.addEventListener(LIBRARY_UPDATED_EVENT, bump);
    return () => window.removeEventListener(LIBRARY_UPDATED_EVENT, bump);
  }, []);

  if (!activeClasses.length) {
    return (
      <AppPageShell variant="page">
        <PageHeader
          title="Library"
          description="Scan books onto your classroom shelf and check them out to students."
          isDarkMode={isDarkMode}
        />
        <EmptyState
          isDarkMode={isDarkMode}
          message="No classes yet. Add a class in Edu.Classes, or turn on demo data in Settings."
          illustration={<Library size={36} className="text-slate-400" />}
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
  };

  return (
    <AppPageShell variant="scroll">
      {activeTab === 'Library' ? (
        <ShelfView {...shared} onOpenManage={() => onSetActiveTab?.('Manage Library')} />
      ) : activeTab === 'Out' ? (
        <OutView {...shared} />
      ) : activeTab === 'Manage Library' ? (
        <ManageLibraryView
          {...shared}
          onOpenLabels={() => onSetActiveTab?.('Labels')}
        />
      ) : activeTab === 'Labels' ? (
        <LabelsView {...shared} />
      ) : (
        <ScanView {...shared} onOpenLabels={() => onSetActiveTab?.('Labels')} />
      )}
    </AppPageShell>
  );
}
