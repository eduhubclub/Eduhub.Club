import { DesignGuidePage } from '../../shell/DesignGuidePage';
import {
  APP_BOARD_PAD,
  APP_MAX_WIDTH,
  APP_PAGE_BOTTOM,
  APP_SCROLL_BOARD,
} from '../../shared/layout';
import { TYPE } from '../../shared/typography';
import { AppLayoutPatternView } from './AppLayoutPatternView';
import { AppShellPatternView } from './AppShellPatternView';
import { CardExampleLiveView } from './CardExampleLiveView';
import { CardStyleLiveView } from './CardStyleLiveView';
import { CardTypeLiveView } from './CardTypeLiveView';
import { LiveViewPage } from './LiveViewPage';
import { ModalLiveView } from './ModalLiveView';
import { StageSizingPlaygroundView } from './StageSizingPlaygroundView';
import { CARD_EXAMPLE_VIEWS } from './cardExamples';
import { CARD_STYLE_VIEWS } from './cardStyles';
import { CARD_TYPE_VIEWS } from './cardTypes';

/** Pattern views from the Patterns secondary panel. */
const PATTERN_VIEWS = {
  'App Shell': AppShellPatternView,
  'App Layout': AppLayoutPatternView,
  'Stage Sizing': StageSizingPlaygroundView,
};

function CardsSectionOverview({ title, blurb, items, isDarkMode, theme }) {
  const surface = `${theme.colorSurface} ${theme.colorOutline}`;
  const muted = theme.colorOnSurfaceVariant;
  const body = isDarkMode ? 'text-slate-300' : 'text-slate-600';

  return (
    <div className={`relative ${APP_MAX_WIDTH} ${APP_PAGE_BOTTOM}`}>
      <div className={`${APP_SCROLL_BOARD} ${APP_BOARD_PAD} ${surface}`}>
        <p className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>{title}</p>
        <p className={`${TYPE.bodyMd} mt-2 ${body}`}>{blurb}</p>
        <ul className={`mt-4 space-y-1.5 ${TYPE.bodySm} ${muted}`}>
          {items.map((item) => (
            <li key={item} className="font-mono">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Edu.Design — style guide driven by shell sidebar `activeTab`.
 * Patterns / Cards panels + leaf live pages for card types and styles.
 */
export function DesignApp({
  activeTab,
  isDarkMode,
  theme,
  isLeft,
  onLiveSpaceDebugChange,
}) {
  if (activeTab === 'Live View') {
    return (
      <LiveViewPage
        isDarkMode={isDarkMode}
        theme={theme}
        isLeft={isLeft}
        onLiveSpaceDebugChange={onLiveSpaceDebugChange}
      />
    );
  }

  if (activeTab === 'Modal') {
    return <ModalLiveView isDarkMode={isDarkMode} theme={theme} />;
  }

  if (activeTab === 'Card Types') {
    return (
      <CardsSectionOverview
        title="Card Types"
        blurb="Pick a layout token from the Cards sidebar — each opens a live page in the real shell."
        items={CARD_TYPE_VIEWS}
        isDarkMode={isDarkMode}
        theme={theme}
      />
    );
  }

  if (activeTab === 'Card Styles') {
    return (
      <CardsSectionOverview
        title="Card Styles"
        blurb="M3-aligned styles — outlined (default), filled, hierarchy, actions, and accessibility."
        items={CARD_STYLE_VIEWS}
        isDarkMode={isDarkMode}
        theme={theme}
      />
    );
  }

  if (activeTab === 'Card Examples') {
    return (
      <CardsSectionOverview
        title="Card Examples"
        blurb="Live product-shaped cards — headers, library, tools, groups, choices, and empty waiting."
        items={CARD_EXAMPLE_VIEWS}
        isDarkMode={isDarkMode}
        theme={theme}
      />
    );
  }

  if (CARD_TYPE_VIEWS.includes(activeTab)) {
    return (
      <CardTypeLiveView cardType={activeTab} isDarkMode={isDarkMode} theme={theme} />
    );
  }

  if (CARD_STYLE_VIEWS.includes(activeTab)) {
    return (
      <CardStyleLiveView cardStyle={activeTab} isDarkMode={isDarkMode} theme={theme} />
    );
  }

  if (CARD_EXAMPLE_VIEWS.includes(activeTab)) {
    return (
      <CardExampleLiveView example={activeTab} isDarkMode={isDarkMode} theme={theme} />
    );
  }

  const PatternView = PATTERN_VIEWS[activeTab];
  if (PatternView) {
    return <PatternView isDarkMode={isDarkMode} theme={theme} isLeft={isLeft} />;
  }

  return (
    <DesignGuidePage theme={theme} isDarkMode={isDarkMode} activeTab={activeTab} />
  );
}
