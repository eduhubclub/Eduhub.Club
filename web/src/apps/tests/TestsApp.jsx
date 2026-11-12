import { useEffect, useMemo } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { useStudentParts } from '../../data/access/StudentPartAccess';
import { useClasses } from '../../data/classes/ClassContext';
import { useTestsData } from '../../data/tests/useTestsData';
import { AppPageShell } from '../../shared/AppPageShell';
import { EmptyState } from '../../shared/EmptyState';
import { PageHeader } from '../../shared/PageHeader';
import { AssessmentCalendarView } from './views/AssessmentCalendarView';
import { TakeView } from './views/TakeView';
import { AssessmentEditor } from './views/AssessmentEditor';
import { TestsHomeView } from './views/TestsHomeView';

const STUDENT_TAB = 'Student view';

const LIBRARIES = {
  District: 'district',
  'Saved Assessments': 'saved',
  'Archived Assessments': 'archived',
  'Community Assessments': 'community',
};

/**
 * Teacher authors on Tests. Students, and a teacher preview, use Take.
 */
export function TestsApp({ activeTab, isDarkMode, theme, onSetActiveTab }) {
  const { isStudentFrame } = useStudentParts();
  const { classes, selectedClass, selectClass } = useClasses();
  const { store, ownerId } = useTestsData();

  const activeClasses = useMemo(
    () => (classes || []).filter((item) => !item.isArchived),
    [classes],
  );

  useEffect(() => {
    if (!activeClasses.length) return;
    if (!selectedClass || selectedClass.isArchived) {
      selectClass(activeClasses[0].id);
    }
  }, [activeClasses, selectedClass, selectClass]);

  useEffect(() => {
    if (isStudentFrame && activeTab !== STUDENT_TAB) onSetActiveTab?.(STUDENT_TAB);
    else if (!isStudentFrame && (activeTab === 'Tests' || activeTab === 'Take')) {
      onSetActiveTab?.(activeTab === 'Take' ? STUDENT_TAB : 'Saved Assessments');
    }
  }, [isStudentFrame, activeTab, onSetActiveTab]);

  if (!isStudentFrame && !activeClasses.length && activeTab !== STUDENT_TAB) {
    return (
      <AppPageShell variant="page">
        <PageHeader
          title="Tests"
          description="Create a test and assign it to a class."
          isDarkMode={isDarkMode}
        />
        <EmptyState
          isDarkMode={isDarkMode}
          message="No classes yet. Add a class in Edu.Classes, or turn on demo data in Settings."
          illustration={<ClipboardCheck size={36} className="text-slate-400" />}
        />
      </AppPageShell>
    );
  }

  if (isStudentFrame || activeTab === STUDENT_TAB) {
    return (
      <TakeView
        theme={theme}
        isDarkMode={isDarkMode}
        store={store}
        ownerId={ownerId}
        classes={activeClasses}
        selectedClass={selectedClass}
        isStudentFrame={isStudentFrame}
      />
    );
  }

  if (activeTab === 'Assessment Calendar') {
    return (
      <AssessmentCalendarView
        theme={theme}
        isDarkMode={isDarkMode}
        store={store}
        ownerId={ownerId}
        classes={activeClasses}
        selectedClass={selectedClass}
      />
    );
  }

  if (activeTab === 'Create Assessments') {
    return (
      <AssessmentEditor
        theme={theme}
        isDarkMode={isDarkMode}
        ownerId={ownerId}
        classId={selectedClass?.id || ''}
        className={selectedClass?.name || ''}
        initial={null}
        onDone={() => onSetActiveTab?.('Saved Assessments')}
      />
    );
  }

  return (
    <TestsHomeView
      theme={theme}
      isDarkMode={isDarkMode}
      store={store}
      ownerId={ownerId}
      selectedClass={selectedClass}
      library={LIBRARIES[activeTab] || 'saved'}
      onCreate={() => onSetActiveTab?.('Create Assessments')}
      onOpenStudent={() => onSetActiveTab?.(STUDENT_TAB)}
      onCopied={() => onSetActiveTab?.('Saved Assessments')}
    />
  );
}
