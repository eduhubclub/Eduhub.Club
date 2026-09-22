import { AppPageShell } from '../../shared/AppPageShell';
import { EmptyState } from '../../shared/EmptyState';
import { useAuth } from '../../data/auth/AuthContext';
import { TypeClassicView } from './views/TypeClassicView';
import { TodayView } from './views/TodayView';
import { CreateView } from './views/CreateView';
import { SavedView } from './views/SavedView';
import { ClassStatsView } from './views/ClassStatsView';
import { ComingSoonView } from './views/ComingSoonView';

/**
 * Edu.Type hub — stage tools for typing practice.
 * Create / Saved / Class Stats are teacher-only; students use parts via StudentAppFrame.
 */
export function EduTypeApp({ activeTab, isDarkMode, theme, isLeft }) {
  const { session } = useAuth();
  const isTeacher = session?.role === 'teacher' || Boolean(session?.owner);

  if (activeTab === 'Type a Classic' || !activeTab) {
    return (
      <AppPageShell variant="stage">
        <TypeClassicView isDarkMode={isDarkMode} theme={theme} isLeft={isLeft} />
      </AppPageShell>
    );
  }

  if (activeTab === 'Today') {
    return (
      <AppPageShell variant="stage">
        <TodayView isDarkMode={isDarkMode} theme={theme} />
      </AppPageShell>
    );
  }

  if (activeTab === 'Create') {
    if (!isTeacher) {
      return (
        <AppPageShell variant="page">
          <EmptyState
            isDarkMode={isDarkMode}
            message="Only teachers can create practice text."
          />
        </AppPageShell>
      );
    }
    return (
      <AppPageShell variant="scroll">
        <CreateView isDarkMode={isDarkMode} theme={theme} />
      </AppPageShell>
    );
  }

  if (activeTab === 'Saved') {
    if (!isTeacher) {
      return (
        <AppPageShell variant="page">
          <EmptyState
            isDarkMode={isDarkMode}
            message="Saved passages are for teachers."
          />
        </AppPageShell>
      );
    }
    return (
      <AppPageShell variant="scroll">
        <SavedView isDarkMode={isDarkMode} theme={theme} />
      </AppPageShell>
    );
  }

  if (activeTab === 'Class Stats') {
    if (!isTeacher) {
      return (
        <AppPageShell variant="page">
          <EmptyState
            isDarkMode={isDarkMode}
            message="Class stats are for teachers."
          />
        </AppPageShell>
      );
    }
    return (
      <AppPageShell variant="scroll">
        <ClassStatsView isDarkMode={isDarkMode} theme={theme} />
      </AppPageShell>
    );
  }

  if (activeTab === 'Lessons') {
    return (
      <AppPageShell variant="stage">
        <ComingSoonView
          theme={theme}
          isDarkMode={isDarkMode}
          title="Lessons"
          message="Short finger-position lessons are coming soon."
        />
      </AppPageShell>
    );
  }

  if (activeTab === 'Arcade') {
    return (
      <AppPageShell variant="stage">
        <ComingSoonView
          theme={theme}
          isDarkMode={isDarkMode}
          title="Arcade"
          message="Typing arcade games are coming soon."
        />
      </AppPageShell>
    );
  }

  return (
    <AppPageShell variant="page">
      <EmptyState isDarkMode={isDarkMode} message="This part is not available yet." />
    </AppPageShell>
  );
}
