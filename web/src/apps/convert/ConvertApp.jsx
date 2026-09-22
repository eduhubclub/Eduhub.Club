import { AppPageShell } from '../../shared/AppPageShell';
import { ComingSoonView } from './views/ComingSoonView';
import { ImagesView } from './views/ImagesView';
import { PdfView } from './views/PdfView';

/**
 * Edu.Convert — browser-only conversion tools (Images + PDF).
 */
export function ConvertApp({ activeTab, isDarkMode, theme }) {
  if (activeTab === 'Images') {
    return (
      <AppPageShell variant="scroll">
        <ImagesView theme={theme} isDarkMode={isDarkMode} />
      </AppPageShell>
    );
  }

  if (activeTab === 'PDF') {
    return (
      <AppPageShell variant="scroll">
        <PdfView theme={theme} isDarkMode={isDarkMode} />
      </AppPageShell>
    );
  }

  const label = activeTab === 'Office' ? 'Office' : activeTab === 'Media' ? 'Media' : activeTab;

  return (
    <AppPageShell variant="page">
      <ComingSoonView kind={label} theme={theme} isDarkMode={isDarkMode} />
    </AppPageShell>
  );
}
