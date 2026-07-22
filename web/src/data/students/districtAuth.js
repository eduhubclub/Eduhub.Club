/**
 * District-set student sign-in method.
 * Age span (pre-K through college) means districts choose among
 * picture passwords, PINs, badges, or traditional passwords.
 * Wire to district policy / sync later — local default is PIN.
 */

export const AUTH_METHOD_IDS = ['picture', 'pin', 'badge', 'password'];

export const PICTURE_PASSWORD_OPTIONS = [
  { id: '🍎', label: 'Apple' },
  { id: '⭐', label: 'Star' },
  { id: '🐶', label: 'Dog' },
  { id: '🚗', label: 'Car' },
  { id: '🌈', label: 'Rainbow' },
  { id: '⚽', label: 'Ball' },
  { id: '🐠', label: 'Fish' },
  { id: '🌻', label: 'Flower' },
];

const METHOD_META = {
  picture: {
    id: 'picture',
    shortLabel: 'Picture',
    fieldLabel: 'Picture password',
    placeholder: 'Choose a picture',
    cardTitle: 'Logins & sign-in',
    cardHint: 'Student ID, email, and picture password (district setting).',
    sectionLabel: 'Logins & sign-in',
    inputType: 'picture',
  },
  pin: {
    id: 'pin',
    shortLabel: 'PIN',
    fieldLabel: 'PIN',
    placeholder: '4-digit PIN',
    cardTitle: 'Logins & sign-in',
    cardHint: 'Student ID, email, and classroom PIN (district setting).',
    sectionLabel: 'Logins & sign-in',
    inputType: 'pin',
  },
  badge: {
    id: 'badge',
    shortLabel: 'Badge',
    fieldLabel: 'Badge ID',
    placeholder: 'Scan or enter badge ID',
    cardTitle: 'Logins & sign-in',
    cardHint: 'Student ID, email, and badge ID (district setting).',
    sectionLabel: 'Logins & sign-in',
    inputType: 'text',
  },
  password: {
    id: 'password',
    shortLabel: 'Password',
    fieldLabel: 'Password',
    placeholder: 'Enter password',
    cardTitle: 'Logins & sign-in',
    cardHint: 'Student ID, email, and password (district setting).',
    sectionLabel: 'Logins & sign-in',
    inputType: 'password',
  },
};

/** District policy: which auth method teachers configure for students. */
export const DISTRICT_AUTH = {
  /** @type {'picture' | 'pin' | 'badge' | 'password'} */
  method: 'pin',
};

export function getDistrictAuthMethod() {
  return METHOD_META[DISTRICT_AUTH.method] || METHOD_META.pin;
}

export function getAuthMethodMeta(methodId) {
  return METHOD_META[methodId] || METHOD_META.pin;
}

export function formatAuthCredentialDisplay(value, methodId = DISTRICT_AUTH.method) {
  if (!value) return '';
  if (methodId === 'picture') {
    const opt = PICTURE_PASSWORD_OPTIONS.find((o) => o.id === value);
    return opt ? `${opt.id} ${opt.label}` : value;
  }
  if (methodId === 'password') return '••••••••';
  return value;
}
