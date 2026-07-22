/**
 * Activity profile switcher — hidden when only one profile is configured.
 */
import { TYPE } from '../../shared/typography';

export function CalibrationProfilePicker({
  profiles,
  activeProfileId,
  onSelect,
  isDarkMode,
  theme,
}) {
  if (profiles.length <= 1) return null;

  const pillClass = (isActive) =>
    `relative z-10 inline-flex items-center justify-center h-8 px-3 rounded-lg ${TYPE.labelMd} transition-colors whitespace-nowrap ${
      isActive
        ? theme.colorOnPrimary
        : isDarkMode
          ? 'text-slate-400 hover:text-slate-200'
          : 'text-slate-600 hover:text-slate-800'
    }`;

  if (profiles.length === 2) {
    const left = profiles[0];
    const right = profiles[1];
    const isRight = activeProfileId === right.id;

    return (
      <div
        className={`relative grid grid-cols-2 p-1 rounded-xl ${
          isDarkMode ? 'bg-slate-800' : 'bg-white border border-slate-300'
        }`}
        role="group"
        aria-label="Activity profile"
      >
        <span
          aria-hidden
          className={`absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-lg shadow-sm transition-transform duration-300 ease-out ${theme.colorPrimary} ${
            isRight ? 'translate-x-full' : 'translate-x-0'
          }`}
        />
        <button
          type="button"
          aria-pressed={!isRight}
          onClick={() => onSelect(left.id)}
          className={pillClass(!isRight)}
        >
          {left.name}
        </button>
        <button
          type="button"
          aria-pressed={isRight}
          onClick={() => onSelect(right.id)}
          className={pillClass(isRight)}
        >
          {right.name}
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-wrap justify-end gap-1.5 p-1 rounded-xl max-w-full ${
        isDarkMode ? 'bg-slate-800' : 'bg-white border border-slate-300'
      }`}
      role="group"
      aria-label="Activity profile"
    >
      {profiles.map((profile) => {
        const isActive = profile.id === activeProfileId;
        return (
          <button
            key={profile.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(profile.id)}
            className={`h-8 px-3 rounded-lg ${TYPE.labelMd} transition-colors whitespace-nowrap ${
              isActive
                ? `${theme.colorPrimary} ${theme.colorOnPrimary} shadow-sm`
                : isDarkMode
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {profile.name}
          </button>
        );
      })}
    </div>
  );
}
