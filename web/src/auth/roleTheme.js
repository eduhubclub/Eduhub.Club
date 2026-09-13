import { getTheme } from '../shared/theme';

/** Sign-in card and modal primary. Keep the landing pops and modal header on the same key. */
export const ROLE_PRIMARY = {
  admin: 'Pink',
  teacher: 'Amber',
  student: 'Emerald',
  parent: 'Blue',
};

export function themeForRole(role, isDarkMode = false) {
  return getTheme(ROLE_PRIMARY[role] || 'Blue', isDarkMode);
}
