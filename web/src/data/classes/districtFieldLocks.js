/**
 * District-controlled field locks for student profile / roster editing.
 * When true, teachers can view but not edit that field group.
 * Wire to district policy / sync later — local defaults are unlocked.
 */
export const DISTRICT_FIELD_LOCKS = {
  birthdate: false,
  address: false,
  /** Locks guardian/parent name, phone, and email together */
  parentContact: false,
};

export function isFieldLocked(fieldKey) {
  if (fieldKey === 'birthdate') return DISTRICT_FIELD_LOCKS.birthdate;
  if (fieldKey === 'address' || fieldKey === 'guardianAddress') return DISTRICT_FIELD_LOCKS.address;
  if (
    fieldKey === 'guardianName' ||
    fieldKey === 'guardianPhone' ||
    fieldKey === 'guardianEmail' ||
    fieldKey === 'parentContact'
  ) {
    return DISTRICT_FIELD_LOCKS.parentContact;
  }
  return false;
}

/** True when every editable profile field is district-locked (name/nickname/gender stay teacher-editable). */
export function isProfileFullyLocked() {
  return (
    DISTRICT_FIELD_LOCKS.birthdate &&
    DISTRICT_FIELD_LOCKS.address &&
    DISTRICT_FIELD_LOCKS.parentContact
  );
}
