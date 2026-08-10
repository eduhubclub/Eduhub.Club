import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { PageHeader } from '../../../shared/PageHeader';
import { TYPE } from '../../../shared/typography';
import {
  APP_BOARD_PAD,
  APP_SCROLL_BOARD,
  APP_GRID_CARD,
  appFabClass,
} from '../../../shared/layout';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import {
  EMOJI_LIBRARY,
  searchEmojiAvatars,
} from '../../../data/classes/avatar';
import { useBehavior } from '../BehaviorContext';

const DEFAULT_ICON = '⭐';

function CategoryChip({ label, active, onClick, theme, isDarkMode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`edu-control rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-colors ${
        active
          ? `${theme.border} ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`
          : isDarkMode
            ? 'border-slate-600 text-slate-400 hover:bg-slate-800'
            : 'border-slate-300 text-slate-500 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );
}

/**
 * Behavior catalog — positive and needs-work skills.
 */
export function BehaviorsView({ isDarkMode, theme, isLeft = true }) {
  const { showNeedsWork, catalog, addBehavior, updateBehavior } = useBehavior();
  const [editor, setEditor] = useState(null); // null | { mode: 'create' } | { mode: 'edit', behavior }
  const [name, setName] = useState('');
  const [points, setPoints] = useState(1);
  const [icon, setIcon] = useState(DEFAULT_ICON);
  const [category, setCategory] = useState('positive');
  const [emojiQuery, setEmojiQuery] = useState('');
  const [emojiCategory, setEmojiCategory] = useState(
    () => EMOJI_LIBRARY[0]?.id || 'faces',
  );

  const isOpen = Boolean(editor);
  const isEdit = editor?.mode === 'edit';

  useEffect(() => {
    if (!editor) return;
    setEmojiQuery('');
    setEmojiCategory(EMOJI_LIBRARY[0]?.id || 'faces');
    if (editor.mode === 'edit' && editor.behavior) {
      const b = editor.behavior;
      setName(b.name || '');
      setPoints(Math.min(10, Math.max(1, Math.abs(Number(b.points) || 1))));
      setIcon(b.icon || DEFAULT_ICON);
      setCategory(
        b.category === 'needsWork' || Number(b.points) < 0
          ? 'needsWork'
          : 'positive',
      );
      return;
    }
    setName('');
    setPoints(1);
    setIcon(DEFAULT_ICON);
    setCategory('positive');
  }, [editor]);

  const emojiCategories = useMemo(
    () => searchEmojiAvatars(emojiQuery),
    [emojiQuery],
  );
  const pageEmojis = useMemo(() => {
    if (emojiQuery.trim()) {
      return emojiCategories.flatMap((cat) =>
        cat.emojis.map((item) => ({ ...item, catId: cat.id })),
      );
    }
    const cat =
      emojiCategories.find((c) => c.id === emojiCategory) || emojiCategories[0];
    return (cat?.emojis || []).map((item) => ({
      ...item,
      catId: cat.id,
    }));
  }, [emojiCategories, emojiCategory, emojiQuery]);

  const canSave = Boolean(name.trim()) && points >= 1 && points <= 10 && icon;

  const closeEditor = () => setEditor(null);

  const save = () => {
    if (!canSave) return;
    if (isEdit && editor.behavior?.id) {
      updateBehavior(editor.behavior.id, { name, points, icon, category });
    } else {
      addBehavior({ name, points, icon, category });
    }
    closeEditor();
  };

  const openEdit = (behavior, tone) => {
    setEditor({
      mode: 'edit',
      behavior: {
        ...behavior,
        category:
          behavior.category ||
          (tone === 'neg' || Number(behavior.points) < 0
            ? 'needsWork'
            : 'positive'),
      },
    });
  };

  const Section = ({ title, items, tone }) => (
    <div
      className={`${APP_SCROLL_BOARD} ${APP_BOARD_PAD} ${theme.colorSurface} ${theme.colorOutline}`}
    >
      <h2 className={`${TYPE.titleMd} mb-3 ${theme.colorOnSurface}`}>{title}</h2>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
        {items.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => openEdit(b, tone)}
            aria-label={`Edit ${b.name}`}
            className={`edu-control @container relative flex aspect-square flex-col overflow-hidden text-left transition hover:-translate-y-0.5 ${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} ${
              isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
            }`}
          >
            <span
              className={`absolute top-1 right-1 z-10 flex h-[23cqw] min-h-[1.875rem] w-[23cqw] min-w-[1.875rem] items-center justify-center rounded-full font-normal tabular-nums ${
                tone === 'pos'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-rose-500 text-white'
              }`}
              style={{ fontSize: 'clamp(0.75rem, 11cqw, 0.9375rem)' }}
            >
              {b.points > 0 ? `+${b.points}` : b.points}
            </span>
            <span
              className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center leading-none"
              style={{ fontSize: 'clamp(1.25rem, 40cqw, 3.75rem)' }}
              aria-hidden
            >
              <span className="block max-h-[44cqw] max-w-full">{b.icon}</span>
            </span>
            <div className="relative z-[1] mt-auto w-full px-[8cqw] pb-[8cqw]">
              <p
                className={`w-full text-center font-semibold leading-snug ${theme.colorOnSurface}`}
                style={{ fontSize: 'clamp(0.625rem, 13cqw, 0.875rem)' }}
              >
                {b.name}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative space-y-4 pb-20">
      <PageHeader
        title="Behaviors"
        description="Skills you can award from the Award board."
        isDarkMode={isDarkMode}
      />
      <Section title="Positive" items={catalog.positive} tone="pos" />
      {showNeedsWork ? (
        <Section title="Needs work" items={catalog.needsWork} tone="neg" />
      ) : null}

      <button
        type="button"
        className={`${appFabClass(isLeft)} edu-control flex h-14 w-14 items-center justify-center rounded-full shadow-lg ${theme.colorPrimary} ${theme.colorOnPrimary}`}
        onClick={() => setEditor({ mode: 'create' })}
        aria-label="Add behavior"
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>

      <Modal
        isOpen={isOpen}
        title={isEdit ? 'Edit behavior' : 'Add behavior'}
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={closeEditor}
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className={`edu-control rounded-xl px-4 py-2 ${TYPE.labelLg} ${theme.colorOnSurfaceVariant}`}
              onClick={closeEditor}
            >
              Cancel
            </button>
            <ModalPrimaryButton theme={theme} disabled={!canSave} onClick={save}>
              {isEdit ? 'Save' : 'Add'}
            </ModalPrimaryButton>
          </div>
        }
      >
        <div className="space-y-4 p-6">
          {showNeedsWork ? (
            <div className="flex justify-center gap-2">
              {[
                { id: 'positive', label: 'Positive' },
                { id: 'needsWork', label: 'Needs work' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCategory(opt.id)}
                  className={`edu-control rounded-xl px-4 py-2 ${TYPE.titleSm} ${
                    category === opt.id
                      ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
                      : `${theme.colorSurfaceVariant} ${theme.colorOnSurfaceVariant}`
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex items-start gap-3">
            <label className="min-w-0 flex-1 space-y-1.5">
              <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
                Title
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kind words"
                maxLength={40}
                className={`edu-control h-11 w-full rounded-xl border-[1.5px] px-3 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface} focus:outline-none focus-visible:ring-2 ${theme.ring}`}
              />
            </label>
            <label className="shrink-0 space-y-1.5">
              <span className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
                Points
              </span>
              <select
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                aria-label={
                  category === 'needsWork'
                    ? 'Points from −1 to −10'
                    : 'Points from +1 to +10'
                }
                className={`edu-control box-border block h-11 w-[4.75rem] rounded-xl border-[1.5px] px-2.5 tabular-nums ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface} focus:outline-none focus-visible:ring-2 ${theme.ring}`}
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {category === 'needsWork' ? `-${n}` : `+${n}`}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-3">
            <p className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>
              Icon
            </p>
            <div
              className={`flex h-10 items-center overflow-hidden rounded-xl border-[1.5px] ${theme.colorSurface} ${theme.colorOutline}`}
            >
              <Search size={16} className={`ml-3 shrink-0 ${theme.text}`} />
              <input
                type="search"
                value={emojiQuery}
                onChange={(e) => setEmojiQuery(e.target.value)}
                placeholder="Search emoji library…"
                className={`h-full flex-1 bg-transparent px-2 outline-none ${TYPE.bodySm} ${theme.colorOnSurface} placeholder:text-slate-400`}
              />
              {emojiQuery ? (
                <button
                  type="button"
                  className="edu-control p-2 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                  onClick={() => setEmojiQuery('')}
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>

            {!emojiQuery.trim() ? (
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_LIBRARY.map((cat) => (
                  <CategoryChip
                    key={cat.id}
                    label={cat.label}
                    active={emojiCategory === cat.id}
                    onClick={() => setEmojiCategory(cat.id)}
                    theme={theme}
                    isDarkMode={isDarkMode}
                  />
                ))}
              </div>
            ) : null}

            <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
              {pageEmojis.length === 0 ? (
                <p
                  className={`col-span-full py-8 text-center ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
                >
                  No emojis match your search.
                </p>
              ) : (
                pageEmojis.map((item) => {
                  const emoji = item.emoji;
                  const on = icon === emoji;
                  return (
                    <button
                      key={`${item.catId}-${emoji}`}
                      type="button"
                      title={item.keywords.split(' ').slice(0, 3).join(', ')}
                      aria-label={`Choose ${item.keywords.split(' ')[0] || emoji}`}
                      aria-pressed={on}
                      onClick={() => setIcon(emoji)}
                      className={`edu-control flex aspect-square items-center justify-center rounded-xl text-xl transition-colors sm:text-2xl ${
                        on
                          ? `${theme.colorPrimaryContainer} ring-2 ring-inset ${theme.ring}`
                          : isDarkMode
                            ? 'hover:bg-slate-800'
                            : 'hover:bg-slate-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
