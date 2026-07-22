import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { NAV_HEIGHT } from '../shared/theme';
import { TYPE } from '../shared/typography';

function panelItemKey(sub) {
  return sub.id ?? sub.label;
}

function normalizeSubItems(sub) {
  if (!Array.isArray(sub.subItems) || sub.subItems.length === 0) return null;
  return sub.subItems.map((child) =>
    typeof child === 'string'
      ? { id: child, label: child }
      : { id: child.id ?? child.label, label: child.label, desc: child.desc, icon: child.icon }
  );
}

function matchesQuery(item, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    item.label?.toLowerCase().includes(q) ||
    item.desc?.toLowerCase().includes(q)
  );
}

/** Secondary slide-out panel — only mounted when an open panel nav item exists. */
export function SecondaryPanel({
  panelRef,
  panelItem,
  panelNavItem,
  isLeft,
  isDarkMode,
  theme,
  activeTab,
  /** Optional id for highlighting (e.g. selected class). Falls back to Resource: label. */
  activePanelId = null,
  panelSearchQuery,
  onPanelSearchChange,
  onClose,
  onAddClick,
  onSelectItem,
  isDesktop,
  /** Hide the + control (e.g. class picker panels). */
  hideAdd = false,
  /** Lessons panel: add pasted URL */
  onAddLessonLink = null,
  /** Lessons panel: upload local file */
  onUploadLessonFile = null,
  /** Lessons panel: delete resource */
  onDeleteLesson = null,
  lessonsEmptyHint = null,
}) {
  const title = panelNavItem?.panelTitle || panelNavItem?.name || 'Panel';
  const isOpen = Boolean(panelItem);
  const isLessons = panelNavItem?.panelSource === 'lessons';
  const showAdd = Boolean(onAddClick) && !hideAdd && !isLessons;
  const [lessonLinkDraft, setLessonLinkDraft] = useState('');
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(true);
  /** Contained accordion sections inside the panel list. */
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const fileInputRef = useRef(null);

  // Keep accordion open when a nested item is the active tab.
  useEffect(() => {
    const content = panelNavItem?.panelContent;
    if (!content?.length || !activeTab) return;
    setExpandedIds((prev) => {
      let next = prev;
      for (const sub of content) {
        const children = normalizeSubItems(sub);
        if (!children) continue;
        const childActive = children.some(
          (c) => activeTab === c.label || activeTab === `Resource: ${c.label}`
        );
        if (childActive && !prev.has(panelItemKey(sub))) {
          if (next === prev) next = new Set(prev);
          next.add(panelItemKey(sub));
        }
      }
      return next;
    });
  }, [activeTab, panelNavItem?.panelContent]);

  // Phone: full-screen sheet. Desktop: rail beside the sidebar.
  // Only the outer seam (panel ↔ main) is drawn here; the primary sidebar
  // keeps its adjacent border so we never flash a double/black line mid-animation.
  const shellClass = isDesktop
    ? `z-40 h-full transition-[width] duration-300 ease-in-out overflow-hidden flex flex-col shrink-0 ${
        isOpen ? 'w-72' : 'w-0'
      } ${theme.colorSurface} ${
        isOpen
          ? `${isLeft ? 'border-r-[1.5px]' : 'border-l-[1.5px]'} ${theme.colorOutline}`
          : 'border-0'
      }`
    : `fixed inset-0 z-[60] flex flex-col transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : isLeft ? '-translate-x-full' : 'translate-x-full'
      } ${theme.colorSurface}`;

  const filtered =
    panelNavItem?.panelContent?.filter((sub) => {
      if (matchesQuery(sub, panelSearchQuery)) return true;
      const children = normalizeSubItems(sub);
      return children?.some((c) => matchesQuery(c, panelSearchQuery)) ?? false;
    }) || [];

  const isItemActive = (sub) =>
    (activePanelId != null &&
      sub.id != null &&
      String(activePanelId) === String(sub.id)) ||
    activeTab === `Resource: ${sub.label}` ||
    activeTab === sub.label;

  const toggleAccordion = (key) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const renderRow = ({
    sub,
    isActive,
    onClick,
    trailing,
    indent = false,
    rowKey,
  }) => {
    const Icon = sub.icon;
    return (
      <div
        key={rowKey ?? panelItemKey(sub)}
        className={`w-full flex items-center text-left group transition-colors relative border-b ${
          isActive
            ? `${theme.colorPrimaryContainer} ${theme.colorOutline}`
            : `${theme.colorSurface} ${theme.colorOutline}`
        }`}
      >
        <button
          type="button"
          onClick={onClick}
          className={`flex-1 flex items-center min-w-0 text-left ${
            indent ? 'py-2 pl-8 pr-5' : 'p-5'
          }`}
          aria-expanded={trailing?.ariaExpanded}
        >
          <div
            className={`flex items-center justify-center transition-colors duration-300 shrink-0 ${
              indent ? 'w-8 h-8' : 'w-10 h-10'
            } ${isActive ? theme.text : theme.colorOnSurfaceVariant} ${theme.groupHoverText}`}
          >
            {Icon ? <Icon size={indent ? 16 : 18} /> : null}
          </div>
          <div className={`${indent ? 'ml-3' : 'ml-4'} flex-1 min-w-0`}>
            <span
              className={`block ${TYPE.titleSm} truncate transition-colors ${
                isActive
                  ? theme.colorOnPrimaryContainer
                  : isDarkMode
                    ? 'text-slate-200'
                    : 'text-slate-700'
              } ${theme.groupHoverText}`}
            >
              {sub.label}
            </span>
            {sub.desc ? (
              <span
                className={`block ${TYPE.labelMicro} truncate transition-colors ${
                  isActive ? theme.text : 'text-slate-500'
                } ${theme.groupHoverText}`}
              >
                {sub.desc}
              </span>
            ) : null}
          </div>
          {trailing?.node}
        </button>
        {trailing?.aside}
      </div>
    );
  };

  return (
    <div ref={panelRef} className={shellClass}>
      <div
        className={`${isDesktop ? 'w-72' : 'w-full'} flex flex-col h-full transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className={`flex items-center justify-between px-4 shrink-0 border-b ${theme.colorOutline} ${NAV_HEIGHT}`}
        >
          <h2
            className={`${TYPE.labelMicro} truncate ${theme.colorOnSurfaceVariant}`}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`p-1 rounded-md transition-colors shrink-0 ${theme.colorOnSurfaceVariant} ${theme.hoverBg} ${theme.hoverText}`}
          >
            <X size={16} />
          </button>
        </div>

        <div
          className={`flex items-stretch shrink-0 border-b-[0.5px] ${theme.colorOutline}`}
        >
          <div className="relative flex-1 min-w-0">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={panelSearchQuery}
              onChange={(e) => onPanelSearchChange(e.target.value)}
              placeholder="Search..."
              className={`w-full h-10 pl-9 ${TYPE.bodySm} outline-none transition-colors border-0 rounded-none ${
                panelSearchQuery ? 'pr-9' : 'pr-3'
              } ${
                isDarkMode
                  ? 'bg-slate-800 text-slate-200 placeholder-slate-500 focus:bg-slate-800'
                  : 'bg-white text-slate-700 placeholder-slate-400'
              }`}
            />
            {panelSearchQuery ? (
              <button
                type="button"
                onClick={() => onPanelSearchChange('')}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${theme.colorOnSurfaceVariant} ${theme.hoverBg} ${theme.hoverText}`}
                aria-label="Clear search"
                title="Clear search"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>
          {showAdd ? (
            <button
              type="button"
              onClick={onAddClick}
              className={`w-10 h-10 flex items-center justify-center shrink-0 transition-colors border-0 border-l-[0.5px] rounded-none ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurfaceVariant} ${theme.hoverBg} ${theme.hoverText}`}
            >
              <Plus size={16} />
            </button>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {filtered.map((sub) => {
            const key = panelItemKey(sub);
            const children = normalizeSubItems(sub);
            const isAccordion = Boolean(children);
            const childActive =
              children?.some(
                (c) => activeTab === c.label || activeTab === `Resource: ${c.label}`
              ) ?? false;
            const isActive = isItemActive(sub) || childActive;
            const forceExpand = Boolean(
              panelSearchQuery &&
                children?.some((c) => matchesQuery(c, panelSearchQuery))
            );
            const isExpanded = isAccordion && (expandedIds.has(key) || forceExpand);

            const visibleChildren = children?.filter(
              (c) =>
                !panelSearchQuery ||
                matchesQuery(sub, panelSearchQuery) ||
                matchesQuery(c, panelSearchQuery)
            );

            if (isAccordion) {
              return (
                <div key={key} className="flex flex-col">
                  {renderRow({
                    sub,
                    isActive,
                    onClick: () => {
                      toggleAccordion(key);
                      // Opening the section also shows the parent overview.
                      if (!expandedIds.has(key) || forceExpand) {
                        onSelectItem(sub);
                      }
                    },
                    trailing: {
                      ariaExpanded: isExpanded,
                      node: (
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 shrink-0 ${
                            isExpanded ? 'rotate-180' : ''
                          } ${
                            isActive
                              ? theme.text
                              : `text-slate-300 group-hover:opacity-100 ${theme.groupHoverText}`
                          }`}
                        />
                      ),
                    },
                  })}
                  <div
                    className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                      isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div className="overflow-hidden min-h-0">
                      <div
                        className={`${
                          isDarkMode ? 'bg-slate-950/40' : 'bg-slate-50/90'
                        } border-b ${theme.colorOutline}`}
                      >
                        {visibleChildren?.map((child) =>
                          renderRow({
                            sub: child,
                            isActive: isItemActive(child),
                            indent: true,
                            onClick: () => onSelectItem(child),
                            trailing: {
                              node: (
                                <ChevronRight
                                  size={12}
                                  className={`transition-all transform shrink-0 ${
                                    isLeft ? '' : 'rotate-180'
                                  } ${
                                    isItemActive(child)
                                      ? `opacity-100 ${theme.text}`
                                      : 'text-slate-300 opacity-0 group-hover:opacity-100'
                                  }`}
                                />
                              ),
                            },
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={key}>
                {renderRow({
                  sub,
                  isActive,
                  onClick: () => onSelectItem(sub),
                  trailing: {
                    node: !isLessons ? (
                      <ChevronRight
                        size={14}
                        className={`transition-all transform shrink-0 ${isLeft ? '' : 'rotate-180'} ${
                          isActive
                            ? `opacity-100 ${theme.text} ${isLeft ? 'translate-x-1' : '-translate-x-1'}`
                            : `text-slate-300 opacity-0 group-hover:opacity-100 ${theme.groupHoverText} ${
                                isLeft
                                  ? 'group-hover:translate-x-1'
                                  : 'group-hover:-translate-x-1'
                              }`
                          }`}
                      />
                    ) : null,
                    aside: isLessons ? (
                      <div className="flex items-center gap-0.5 pr-3 shrink-0">
                        {sub.link ? (
                          <button
                            type="button"
                            title={
                              String(sub.link).startsWith('blob:')
                                ? 'Download file'
                                : 'Open in new tab'
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              const link = String(sub.link);
                              if (link.startsWith('blob:')) {
                                const a = document.createElement('a');
                                a.href = link.replace(/(#pdf|#img|#other)$/, '');
                                a.download = sub.label;
                                a.click();
                              } else {
                                window.open(
                                  link.replace('/embed?rm=minimal', '/edit'),
                                  '_blank',
                                  'noopener,noreferrer'
                                );
                              }
                            }}
                            className={`p-1.5 rounded-md transition-colors ${theme.colorOnSurfaceVariant} ${theme.hoverBg} ${theme.hoverText}`}
                          >
                            <ExternalLink size={14} />
                          </button>
                        ) : null}
                        {onDeleteLesson ? (
                          <button
                            type="button"
                            title="Delete resource"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteLesson(sub);
                            }}
                            className={`p-1.5 rounded-md transition-colors text-slate-400 hover:text-rose-500 ${theme.hoverBg}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : null}
                      </div>
                    ) : null,
                  },
                })}
              </div>
            );
          })}
          {panelNavItem?.panelContent?.length === 0 ? (
            <div
              className={`p-6 text-center ${TYPE.bodyMd} ${
                isDarkMode ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              {lessonsEmptyHint ||
                (panelNavItem?.panelSource === 'classes'
                  ? 'No classes yet'
                  : 'Nothing here yet')}
            </div>
          ) : null}
        </div>

        {isLessons ? (
          <div
            className={`border-t shrink-0 ${theme.colorOutline} ${
              isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50/80'
            }`}
          >
            <button
              type="button"
              onClick={() => setIsAddResourceOpen((open) => !open)}
              className={`w-full flex items-center justify-between gap-2 px-4 pt-4 ${
                isAddResourceOpen ? 'pb-2' : 'pb-4'
              } text-left`}
              aria-expanded={isAddResourceOpen}
              title={isAddResourceOpen ? 'Collapse add resource' : 'Expand add resource'}
            >
              <span className={`${TYPE.labelMicro} text-slate-400 px-1`}>
                Add Resource
              </span>
              <ChevronDown
                size={16}
                className={`shrink-0 text-slate-400 transition-transform duration-200 ${
                  isAddResourceOpen ? 'rotate-0' : '-rotate-90'
                }`}
              />
            </button>

            {isAddResourceOpen ? (
              <div className="flex items-center gap-2 px-4 pb-4">
                <input
                  type="text"
                  placeholder="Paste link here..."
                  value={lessonLinkDraft}
                  onChange={(e) => setLessonLinkDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === 'Enter' &&
                      lessonLinkDraft.trim() &&
                      onAddLessonLink
                    ) {
                      onAddLessonLink(lessonLinkDraft.trim());
                      setLessonLinkDraft('');
                    }
                  }}
                  className={`flex-1 min-w-0 h-10 px-3 rounded-lg border ${TYPE.bodySm} outline-none ${
                    isDarkMode
                      ? 'bg-slate-800 border-slate-600 text-white placeholder:text-slate-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="application/pdf,image/*,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && onUploadLessonFile) onUploadLessonFile(file);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  disabled={!lessonLinkDraft.trim() || !onAddLessonLink}
                  title={
                    onAddLessonLink
                      ? 'Add link'
                      : 'Select or create a class first'
                  }
                  onClick={() => {
                    const url = lessonLinkDraft.trim();
                    if (!url || !onAddLessonLink) return;
                    onAddLessonLink(url);
                    setLessonLinkDraft('');
                  }}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 disabled:pointer-events-none ${
                    lessonLinkDraft.trim() && onAddLessonLink
                      ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                      : isDarkMode
                        ? 'bg-slate-800 text-slate-600'
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Plus size={16} strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  title="Upload local file"
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    isDarkMode
                      ? 'bg-slate-800 text-slate-400 hover:text-white'
                      : 'bg-slate-100 text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Upload size={16} strokeWidth={2.5} />
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
