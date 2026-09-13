const DOOR_KEY = 'edu.staff.door';
const STAFF_CODE = '2069';

export function isStaffDoorOpen() {
  try {
    return sessionStorage.getItem(DOOR_KEY) === '1';
  } catch {
    return false;
  }
}

export function openStaffDoor() {
  try {
    sessionStorage.setItem(DOOR_KEY, '1');
  } catch {
    /* private mode */
  }
}

export function codeUnlocks(value) {
  return String(value || '').trim() === STAFF_CODE;
}
