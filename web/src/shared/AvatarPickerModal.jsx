import { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, Search, X } from 'lucide-react';
import {
  AVATAR_IMAGE_LIBRARY,
  AVATAR_MODE_OPTIONS,
  AVATAR_TYPES,
  EMOJI_LIBRARY,
  createDefaultAvatar,
  createEmojiAvatar,
  createLibraryAvatar,
  createUploadAvatar,
  getAvatarInitials,
  normalizeAvatar,
  searchEmojiAvatars,
} from '../data/classes/avatar';
import { Modal } from './Modal';
import { ModalPrimaryButton } from './ModalPrimaryButton';
import { StudentAvatar } from './StudentAvatar';
import { TYPE } from './typography';

/**
 * Avatar picker with mode slider: Initials · Emoji · Upload · Library
 */
export function AvatarPickerModal({
  isOpen,
  student,
  theme,
  isDarkMode,
  onClose,
  onSave,
}) {
  const fileRef = useRef(null);
  const current = normalizeAvatar(student);
  const [draft, setDraft] = useState(current);
  const [mode, setMode] = useState(current.type || AVATAR_TYPES.initials);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    if (isOpen) {
      const next = normalizeAvatar(student);
      setDraft(next);
      setMode(next.type || AVATAR_TYPES.initials);
      setQuery('');
      setActiveCategory('all');
    }
  }, [isOpen, student]);

  const categories = useMemo(() => searchEmojiAvatars(query), [query]);
  const visibleCategories = useMemo(() => {
    if (activeCategory === 'all' || query.trim()) return categories;
    return categories.filter((c) => c.id === activeCategory);
  }, [categories, activeCategory, query]);

  const previewStudent = {
    ...student,
    avatar: draft,
    emoji: draft.type === AVATAR_TYPES.emoji ? draft.emoji : '',
  };

  const statusLabel = () => {
    if (draft.type === AVATAR_TYPES.emoji) return `Emoji · ${draft.emoji}`;
    if (draft.type === AVATAR_TYPES.upload) return 'Uploaded image';
    if (draft.type === AVATAR_TYPES.library) {
      const lib = AVATAR_IMAGE_LIBRARY.find((a) => a.id === draft.libraryId);
      return `Library · ${lib?.label || 'avatar'}`;
    }
    return `Initials · ${getAvatarInitials(student)}`;
  };

  const selectMode = (nextMode) => {
    setMode(nextMode);
    if (nextMode === AVATAR_TYPES.initials) {
      setDraft(createDefaultAvatar());
    }
  };

  const pickEmoji = (emoji) => setDraft(createEmojiAvatar(emoji));

  const pickLibrary = (item) => setDraft(createLibraryAvatar(item.id, item.imageUrl));

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDraft(createUploadAvatar(reader.result));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Choose avatar"
      theme={theme}
      isDarkMode={isDarkMode}
      onClose={onClose}
      maxWidth="max-w-2xl"
      zIndex="z-[220]"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl ${TYPE.labelLg} ${
              isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Cancel
          </button>
          <ModalPrimaryButton theme={theme} onClick={handleSave}>
            Save avatar
          </ModalPrimaryButton>
        </div>
      }
    >
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-4">
          <StudentAvatar student={previewStudent} theme={theme} size="lg" />
          <div className="min-w-0">
            <p className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {student?.name || 'Student'}
            </p>
            <p className={`${TYPE.bodySm} mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              {statusLabel()}
            </p>
          </div>
        </div>

        {/* Mode slider */}
        <div
          role="tablist"
          aria-label="Avatar type"
          className={`grid grid-cols-4 p-1 rounded-xl border ${
            isDarkMode ? 'bg-slate-900 border-slate-600' : 'bg-slate-100 border-slate-300'
          }`}
        >
          {AVATAR_MODE_OPTIONS.map((opt) => {
            const active = mode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectMode(opt.id)}
                className={`px-1.5 sm:px-2 py-2 rounded-lg ${TYPE.labelMd} transition-colors ${
                  active
                    ? isDarkMode
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'bg-white text-slate-900 shadow-sm'
                    : isDarkMode
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {mode === AVATAR_TYPES.initials && (
          <div
            className={`rounded-xl border p-4 flex items-center gap-3 ${
              isDarkMode ? 'border-slate-600 bg-slate-900/40' : 'border-slate-300 bg-slate-50'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${TYPE.labelLg} ${theme.colorOnPrimary} ${theme.colorPrimary}`}
            >
              {getAvatarInitials(student)}
            </div>
            <div>
              <p className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Initials from name
              </p>
              <p className={`${TYPE.bodySm} ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Uses the student&apos;s name letters as their avatar.
              </p>
            </div>
          </div>
        )}

        {mode === AVATAR_TYPES.emoji && (
          <>
            <div
              className={`flex items-center h-10 rounded-xl border overflow-hidden ${
                isDarkMode ? 'bg-slate-900 border-slate-600' : 'bg-slate-50 border-slate-300'
              }`}
            >
              <Search size={16} className={`ml-3 shrink-0 ${theme.text}`} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search emoji library…"
                className={`flex-1 h-full px-2 bg-transparent outline-none text-sm ${
                  isDarkMode
                    ? 'text-white placeholder-slate-500'
                    : 'text-slate-900 placeholder-slate-400'
                }`}
              />
              {query ? (
                <button
                  type="button"
                  className="p-2 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                  onClick={() => setQuery('')}
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>

            {!query.trim() ? (
              <div className="flex flex-wrap gap-1.5">
                <CategoryChip
                  label="All"
                  active={activeCategory === 'all'}
                  onClick={() => setActiveCategory('all')}
                  theme={theme}
                  isDarkMode={isDarkMode}
                />
                {EMOJI_LIBRARY.map((cat) => (
                  <CategoryChip
                    key={cat.id}
                    label={cat.label}
                    active={activeCategory === cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    theme={theme}
                    isDarkMode={isDarkMode}
                  />
                ))}
              </div>
            ) : null}

            <div className="max-h-[38vh] overflow-y-auto space-y-4 pr-1">
              {visibleCategories.length === 0 ? (
                <p
                  className={`text-sm text-center py-8 ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  No emojis match your search.
                </p>
              ) : (
                visibleCategories.map((cat) => (
                  <div key={cat.id}>
                    <p
                      className={`${TYPE.labelMicro} mb-2 ${
                        isDarkMode ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {cat.label}
                      <span className="ml-1.5 font-semibold normal-case tracking-normal opacity-70">
                        {cat.emojis.length}
                      </span>
                    </p>
                    <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5">
                      {cat.emojis.map((item) => {
                        const emoji = item.emoji;
                        const selected =
                          draft.type === AVATAR_TYPES.emoji && draft.emoji === emoji;
                        return (
                          <button
                            key={`${cat.id}-${emoji}`}
                            type="button"
                            title={item.keywords.split(' ').slice(0, 3).join(', ')}
                            aria-label={`Choose ${item.keywords.split(' ')[0] || emoji}`}
                            aria-pressed={selected}
                            onClick={() => pickEmoji(emoji)}
                            className={`aspect-square rounded-xl text-xl sm:text-2xl flex items-center justify-center transition-colors ${
                              selected
                                ? isDarkMode
                                  ? 'bg-cyan-500/20 ring-2 ring-inset ring-cyan-500'
                                  : 'bg-cyan-50 ring-2 ring-inset ring-cyan-500'
                                : isDarkMode
                                  ? 'hover:bg-slate-800'
                                  : 'hover:bg-slate-100'
                            }`}
                          >
                            {emoji}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {mode === AVATAR_TYPES.upload && (
          <div className="space-y-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileChange}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={`w-full flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-10 transition-colors ${
                isDarkMode
                  ? 'border-slate-600 hover:bg-slate-800/60 text-slate-300'
                  : 'border-slate-300 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <ImagePlus size={28} strokeWidth={2} className={theme.text} />
              <span className={TYPE.titleSm}>Upload an image</span>
              <span className={`${TYPE.bodySm} ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                PNG, JPG, or WebP from your device
              </span>
            </button>
            {draft.type === AVATAR_TYPES.upload && draft.imageUrl ? (
              <p className={`${TYPE.bodySm} text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Image selected — preview updates above. Save to keep it.
              </p>
            ) : null}
          </div>
        )}

        {mode === AVATAR_TYPES.library && (
          <div className="max-h-[42vh] overflow-y-auto pr-1">
            <p
              className={`${TYPE.labelMicro} mb-2 ${
                isDarkMode ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Avatar images
              <span className="ml-1.5 font-semibold normal-case tracking-normal opacity-70">
                {AVATAR_IMAGE_LIBRARY.length}
              </span>
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {AVATAR_IMAGE_LIBRARY.map((item) => {
                const selected =
                  draft.type === AVATAR_TYPES.library && draft.libraryId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    title={item.label}
                    aria-label={`Choose ${item.label} avatar`}
                    aria-pressed={selected}
                    onClick={() => pickLibrary(item)}
                    className={`aspect-square rounded-xl overflow-hidden transition-colors ${
                      selected
                        ? 'ring-2 ring-inset ring-cyan-500'
                        : isDarkMode
                          ? 'hover:ring-2 hover:ring-inset hover:ring-slate-600'
                          : 'hover:ring-2 hover:ring-inset hover:ring-slate-200'
                    }`}
                  >
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function CategoryChip({ label, active, onClick, theme, isDarkMode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
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
