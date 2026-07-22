import { EmptyState } from '../../../shared/EmptyState';
import { AppPageShell } from '../../../shared/AppPageShell';

/**
 * Stub for Early Literacy tools not built yet.
 * Stage/widget tools omit PageHeader — nav names the tool; Hub Apps
 * Description popout explains the app.
 */
export function PlaceholderToolView({ message, isDarkMode }) {
  return (
    <AppPageShell variant="page">
      <EmptyState
        isDarkMode={isDarkMode}
        message={message || 'Placeholder — this tool will be fine-tuned later.'}
      />
    </AppPageShell>
  );
}
