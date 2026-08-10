import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { AVATAR_TYPES, getAvatarInitials, normalizeAvatar } from '../data/classes/avatar';
import { AvatarPickerModal } from './AvatarPickerModal';

const SIZE_CLASSES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-10 h-10 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-xl',
  /** Fills parent; set parent to the avatar box size and `text-[Ncqw]` / fontSize. */
  fluid: 'h-full w-full',
};

const EDIT_BADGE = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  fluid: 'w-[28%] h-[28%] min-w-[0.85rem] min-h-[0.85rem]',
};

const EMOJI_TEXT = {
  xs: 'text-sm',
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
  fluid: 'text-[0.92em] leading-none',
};

/**
 * Student avatar — defaults to initials (base user).
 * Pass editable + onAvatarChange to show a pencil and open the emoji library.
 */
export function StudentAvatar({
  student,
  theme,
  size = 'sm',
  className = '',
  editable = false,
  onAvatarChange,
  isDarkMode = false,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const avatar = normalizeAvatar(student);
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.sm;

  const softShell = `${sizeClass} rounded-full flex items-center justify-center font-bold shrink-0 ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`;
  const solidShell = `${sizeClass} rounded-full flex items-center justify-center font-bold shrink-0 ${theme.colorOnPrimary} ${theme.colorPrimary}`;

  let face = null;

  if (
    (avatar.type === AVATAR_TYPES.upload ||
      avatar.type === AVATAR_TYPES.link ||
      avatar.type === AVATAR_TYPES.library) &&
    avatar.imageUrl
  ) {
    face = (
      <div className={`${sizeClass} rounded-full overflow-hidden shrink-0`}>
        <img src={avatar.imageUrl} alt="" className="w-full h-full object-cover" />
      </div>
    );
  } else if (avatar.type === AVATAR_TYPES.emoji && avatar.emoji) {
    face = (
      <div className={softShell} aria-hidden>
        <span className={EMOJI_TEXT[size] || EMOJI_TEXT.sm}>
          {avatar.emoji}
        </span>
      </div>
    );
  } else {
    face = (
      <div
        className={`${solidShell}${size === 'fluid' ? ' text-[0.35em]' : ''}`}
        aria-hidden
      >
        {getAvatarInitials(student)}
      </div>
    );
  }

  if (!editable) {
    return (
      <div className={`${size === 'fluid' ? 'h-full w-full' : ''} ${className}`.trim()}>
        {face}
      </div>
    );
  }

  return (
    <>
      <div
        className={`relative inline-flex shrink-0 ${size === 'fluid' ? 'h-full w-full' : ''} ${className}`.trim()}
      >
        {face}
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className={`absolute -bottom-0.5 -right-0.5 ${EDIT_BADGE[size] || EDIT_BADGE.lg} rounded-full flex items-center justify-center ${theme.colorOnPrimary} border-2 border-white ${theme.colorPrimary} shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${theme.ring}`}
          aria-label="Edit avatar"
          title="Choose avatar"
        >
          <Pencil
            size={size === 'lg' || size === 'fluid' ? 10 : 8}
            className={size === 'fluid' ? 'h-[55%] w-[55%]' : undefined}
            strokeWidth={2.5}
            fill="none"
          />
        </button>
      </div>

      <AvatarPickerModal
        isOpen={pickerOpen}
        student={student}
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setPickerOpen(false)}
        onSave={(nextAvatar) => onAvatarChange?.(nextAvatar)}
      />
    </>
  );
}
