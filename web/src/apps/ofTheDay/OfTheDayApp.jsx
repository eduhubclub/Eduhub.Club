import { OF_THE_DAY_META, OF_THE_DAY_TYPES } from '../../data/ofTheDay/types';
import { TodayView } from './views/TodayView';
import { SavedView } from './views/SavedView';
import { CreateView } from './views/CreateView';
import { CommunityView } from './views/CommunityView';

function focusFromTab(tab) {
  return OF_THE_DAY_TYPES.find((type) => OF_THE_DAY_META[type].label === tab) || 'all';
}

/**
 * Edu.OfTheDay — daily classroom picks.
 */
export function OfTheDayApp({ activeTab, isDarkMode, theme, onSetActiveTab }) {
  if (activeTab === 'Saved') {
    return (
      <SavedView
        theme={theme}
        isDarkMode={isDarkMode}
        onOpenToday={() => onSetActiveTab?.('Today')}
      />
    );
  }

  if (activeTab === 'Create') {
    return <CreateView theme={theme} isDarkMode={isDarkMode} />;
  }

  if (activeTab === 'Community') {
    return (
      <CommunityView
        theme={theme}
        isDarkMode={isDarkMode}
        onOpenToday={() => onSetActiveTab?.('Today')}
      />
    );
  }

  return (
    <TodayView
      theme={theme}
      isDarkMode={isDarkMode}
      focus={focusFromTab(activeTab)}
    />
  );
}
