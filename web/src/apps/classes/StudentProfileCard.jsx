import { useEffect, useState } from 'react';
import { ChevronDown, Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import { isFieldLocked } from '../../data/classes/districtFieldLocks';
import {
  GRID_GUARDIAN_LIMIT,
  RELATIONSHIP_OPTIONS,
  createEmptyGuardian,
  normalizeGuardians,
  syncLegacyGuardianFields,
} from '../../data/classes/guardians';
import { StudentAvatar } from '../../shared/StudentAvatar';
import { StudentBankQr } from '../../shared/StudentBankQr';
import { ModalPrimaryButton } from '../../shared/ModalPrimaryButton';
import { StudentAuthDisplay, StudentAuthField } from '../../shared/StudentAuthField';
import { getDistrictAuthMethod } from '../../data/students/districtAuth';
import { GRADE_OPTIONS } from './gradeOptions';
import { DISTRICT_OPTIONS, SCHOOL_OPTIONS } from '../../data/students/seed';
import { APP_GRID_CARD } from '../../shared/layout';
import { SegmentControl } from '../../shared/SegmentControl';
import { TYPE } from '../../shared/typography';
import {
  APP_DISPLAY_NAME,
  normalizeAppDisplayName,
  resolveAppDisplayName,
  studentNickname,
  studentDisplayName,
} from '../../data/students/displayName';

const GENDER_OPTIONS = ['', 'Female', 'Male', 'Non-binary', 'Prefer not to say', 'Other'];

const STUDENT_INFO_FIELDS = [
  { key: 'name', label: 'Name' },
  { key: 'nickname', label: 'Nickname' },
  { key: 'gender', label: 'Gender', type: 'select' },
  { key: 'birthdate', label: 'Birthday', lockable: true },
];

const APP_NAME_OPTIONS = [
  { id: APP_DISPLAY_NAME.legal, label: 'Full name' },
  { id: APP_DISPLAY_NAME.nickname, label: 'Nickname' },
];

const SCHOOL_FIELDS = [
  { key: 'district', label: 'District', type: 'district' },
  { key: 'school', label: 'School', type: 'school' },
  { key: 'grade_level', label: 'Grade', type: 'grade' },
];

const LOGIN_ID_FIELDS = [
  { key: 'studentId', label: 'Student ID' },
  { key: 'email', label: 'Student Email' },
];

const ADDRESS_FIELD = { key: 'guardianAddress', label: 'Address', lockable: true };

function LockedBadge() {
  return (
    <span
      className={`inline-flex items-center gap-1 ${TYPE.labelMicro} opacity-70`}
      title="Locked by your district"
    >
      <Lock size={10} strokeWidth={2.5} />
      District
    </span>
  );
}

function FieldDisplay({ label, value, locked, isDarkMode }) {
  return (
    <div>
      <dt
        className={`${TYPE.labelMicro} flex items-center gap-1.5 ${
          isDarkMode ? 'text-slate-500' : 'text-slate-400'
        }`}
      >
        {label}
        {locked ? <LockedBadge /> : null}
      </dt>
      <dd className={`mt-1 text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
        {value || <span className={isDarkMode ? 'text-slate-600' : 'text-slate-300'}>—</span>}
      </dd>
    </div>
  );
}

function inputClass(locked, isDarkMode) {
  return `w-full mt-1 px-3 py-2 rounded-xl border text-sm outline-none ${
    locked
      ? isDarkMode
        ? 'bg-slate-900/60 border-slate-700 text-slate-500 cursor-not-allowed'
        : 'bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed'
      : isDarkMode
        ? 'bg-slate-800 border-slate-600 text-white'
        : 'bg-white border-slate-300 text-slate-900'
  }`;
}

function FieldEditor({ field, value, onChange, isDarkMode }) {
  const lockKey =
    field.key === 'guardianAddress' || field.key === 'address'
      ? 'address'
      : field.key === 'birthdate'
        ? 'birthdate'
        : field.key;
  const locked = field.lockable && isFieldLocked(lockKey);
  const base = inputClass(locked, isDarkMode);

  return (
    <label className="block">
      <span
        className={`${TYPE.labelMicro} inline-flex items-center gap-1.5 ${
          isDarkMode ? 'text-slate-500' : 'text-slate-400'
        }`}
      >
        {field.label}
        {locked ? <LockedBadge /> : null}
      </span>
      {field.type === 'select' ? (
        <select
          value={value || ''}
          disabled={locked}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        >
          {GENDER_OPTIONS.map((opt) => (
            <option key={opt || 'blank'} value={opt}>
              {opt || '—'}
            </option>
          ))}
        </select>
      ) : field.type === 'grade' ? (
        <select
          value={value || ''}
          disabled={locked}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        >
          <option value="">—</option>
          {GRADE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : field.type === 'school' ? (
        <>
          <input
            type="text"
            list="edu-school-options"
            value={value || ''}
            disabled={locked}
            onChange={(e) => onChange(e.target.value)}
            placeholder="School name"
            className={base}
          />
          <datalist id="edu-school-options">
            {SCHOOL_OPTIONS.map((opt) => (
              <option key={opt} value={opt} />
            ))}
          </datalist>
        </>
      ) : field.type === 'district' ? (
        <>
          <input
            type="text"
            list="edu-district-options"
            value={value || ''}
            disabled={locked}
            onChange={(e) => onChange(e.target.value)}
            placeholder="School district"
            className={base}
          />
          <datalist id="edu-district-options">
            {DISTRICT_OPTIONS.map((opt) => (
              <option key={opt} value={opt} />
            ))}
          </datalist>
        </>
      ) : (
        <input
          type="text"
          value={value || ''}
          disabled={locked}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        />
      )}    </label>
  );
}

function ProfileSectionCard({
  title,
  hint,
  isDarkMode,
  editing,
  onEdit,
  onCancel,
  onSave,
  theme,
  children,
  className = '',
  defaultCollapsed = false,
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const isCollapsed = collapsed && !editing;

  const headerBtn = isDarkMode
    ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
    : 'bg-slate-100 text-slate-700 hover:bg-slate-200';

  return (
    <div
      className={`${APP_GRID_CARD} min-w-0 overflow-hidden ${theme.colorSurface} ${theme.colorOutline} ${className}`}
    >
      <div
        className={`flex items-start justify-between gap-3 px-5 sm:px-6 pt-5 sm:pt-6 ${
          isCollapsed ? 'pb-5 sm:pb-6' : `pb-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`
        }`}
      >
        <div className="min-w-0">
          <h3 className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            {title}
          </h3>
          {hint ? (
            <p className={`${TYPE.bodySm} mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              {hint}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!editing ? (
            <button
              type="button"
              onClick={onEdit}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${TYPE.labelMd} ${headerBtn}`}
            >
              <Pencil size={14} strokeWidth={2.5} />
              Edit
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onCancel}
                className={`px-3 py-1.5 rounded-lg ${TYPE.labelMd} ${
                  isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Cancel
              </button>
              <ModalPrimaryButton theme={theme} onClick={onSave}>
                Save
              </ModalPrimaryButton>
            </>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            disabled={editing}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? `Expand ${title}` : `Collapse ${title}`}
            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${headerBtn} ${
              editing ? 'opacity-40 cursor-not-allowed' : ''
            }`}
          >
            <ChevronDown
              size={16}
              strokeWidth={2.5}
              className={`transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`}
            />
          </button>
        </div>
      </div>
      {!isCollapsed ? <div className="px-5 sm:px-6 py-5 sm:py-6">{children}</div> : null}
    </div>
  );
}

function fieldValue(student, key) {
  if (key === 'guardianAddress') return student.guardianAddress || student.address || '';
  return student[key] || '';
}

function toDraft(student) {
  return {
    ...student,
    nickname: student.nickname || '',
    appDisplayName: resolveAppDisplayName(student),
    studentId: student.studentId || '',
    email: student.email || '',
    password: student.password || '',
    gender: student.gender || '',
    grade_level: student.grade_level || '',
    school: student.school || '',
    district: student.district || '',
    siblingIds: Array.isArray(student.siblingIds) ? [...student.siblingIds] : [],
    birthdate: student.birthdate || '',
    guardianAddress: student.guardianAddress || student.address || '',
    guardians: normalizeGuardians(student),
  };
}

/**
 * Student profile as focused cards:
 * Student info · School · Logins & sign-in · Family information
 */
export function StudentProfileCard({
  student,
  theme,
  isDarkMode,
  onSave,
  allStudents = [],
  sectionVisibility = null,
  showBankQr = true,
}) {
  const [editingSection, setEditingSection] = useState(null);
  const [draft, setDraft] = useState(() => toDraft(student));

  useEffect(() => {
    setDraft(toDraft(student));
    setEditingSection(null);
  }, [student]);

  const contactLocked = isFieldLocked('parentContact');
  const display = editingSection ? draft : toDraft(student);
  const guardians = display.guardians || [];
  const show = (key) => !sectionVisibility || sectionVisibility[key] !== false;

  const updateDraft = (key, value) => {
    if (key === 'birthdate' && isFieldLocked('birthdate')) return;
    if ((key === 'guardianAddress' || key === 'address') && isFieldLocked('address')) return;
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'nickname') {
        next.appDisplayName = normalizeAppDisplayName(prev.appDisplayName, value);
      }
      return next;
    });
  };

  const updateGuardian = (index, patch) => {
    if (contactLocked) return;
    setDraft((prev) => ({
      ...prev,
      guardians: prev.guardians.map((g, i) => (i === index ? { ...g, ...patch } : g)),
    }));
  };

  const addGuardian = () => {
    if (contactLocked) return;
    const relationship = draft.guardians.length >= GRID_GUARDIAN_LIMIT ? 'Grandparent' : 'Parent';
    setDraft((prev) => ({
      ...prev,
      guardians: [...prev.guardians, createEmptyGuardian(relationship)],
    }));
  };

  const removeGuardian = (index) => {
    if (contactLocked) return;
    setDraft((prev) => ({
      ...prev,
      guardians: prev.guardians.filter((_, i) => i !== index),
    }));
  };

  const startEdit = (section) => {
    setDraft(toDraft(student));
    setEditingSection(section);
  };

  const cancelEdit = () => {
    setDraft(toDraft(student));
    setEditingSection(null);
  };

  const persist = (nextDraft) => {
    const guardiansList = (nextDraft.guardians || [])
      .map((g) => ({
        ...g,
        name: (g.name || '').trim(),
        phone: (g.phone || '').trim(),
        email: (g.email || '').trim(),
        relationship: g.relationship || 'Parent',
      }))
      .filter((g) => g.name || g.phone || g.email);

    const nickname = (nextDraft.nickname || '').trim();
    onSave({
      ...nextDraft,
      name: (nextDraft.name || '').trim() || student.name,
      nickname,
      appDisplayName: normalizeAppDisplayName(nextDraft.appDisplayName, nickname),
      studentId: (nextDraft.studentId || '').trim(),
      email: (nextDraft.email || '').trim(),
      password: (nextDraft.password || '').trim(),
      gender: nextDraft.gender || '',
      grade_level: nextDraft.grade_level || '',
      school: (nextDraft.school || '').trim(),
      district: (nextDraft.district || '').trim(),
      siblingIds: Array.isArray(nextDraft.siblingIds) ? nextDraft.siblingIds : [],
      birthdate: (nextDraft.birthdate || '').trim(),
      guardianAddress: (nextDraft.guardianAddress || '').trim(),
      ...syncLegacyGuardianFields(guardiansList),
    });
    setEditingSection(null);
  };

  const toggleSibling = (siblingId) => {
    setDraft((prev) => {
      const current = prev.siblingIds || [];
      const next = current.includes(siblingId)
        ? current.filter((id) => id !== siblingId)
        : [...current, siblingId];
      return { ...prev, siblingIds: next };
    });
  };

  const siblingCandidates = allStudents.filter((s) => s.id !== student.id);
  const linkedSiblings = siblingCandidates.filter((s) =>
    (display.siblingIds || []).includes(s.id)
  );

  const cardShell = `${APP_GRID_CARD} p-5 sm:p-6 ${theme.colorSurface} ${theme.colorOutline}`;

  // Family card spans full width — guardians + siblings share one edit flow.
  const familyEditing = editingSection === 'family';
  const authMethod = getDistrictAuthMethod();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      {/* Identity strip — full width */}
      <div className={`${cardShell} lg:col-span-2`}>
        <div className="flex items-center gap-4 min-w-0">
          <StudentAvatar
            student={display}
            theme={theme}
            size="lg"
            isDarkMode={isDarkMode}
            editable
            onAvatarChange={(avatar) => {
              onSave({
                ...student,
                avatar,
                emoji: avatar.type === 'emoji' ? avatar.emoji : '',
              });
            }}
          />
          <div className="min-w-0">
            <p className={`${TYPE.titleMd} truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {display.name}
              {display.nickname ? (
                <span className={`ml-2 font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  “{display.nickname}”
                </span>
              ) : null}
            </p>
            <p className={`${TYPE.bodyMd} mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {[display.grade_level, display.school, display.district, display.gender]
                .filter(Boolean)
                .join(' · ') || 'Student profile'}
            </p>
          </div>
        </div>
      </div>

      {show('info') ? (
      <ProfileSectionCard
        title="Student info"
        hint="Name and personal details."
        isDarkMode={isDarkMode}
        theme={theme}
        editing={editingSection === 'info'}
        onEdit={() => startEdit('info')}
        onCancel={cancelEdit}
        onSave={() => persist(draft)}
      >
        {editingSection === 'info' ? (
          <div className="grid grid-cols-1 gap-4">
            {STUDENT_INFO_FIELDS.map((field) => (
              <FieldEditor
                key={field.key}
                field={field}
                value={fieldValue(draft, field.key)}
                onChange={(value) => updateDraft(field.key, value)}
                isDarkMode={isDarkMode}
              />
            ))}
            <div>
              <p
                className={`${TYPE.labelMicro} mb-2 ${
                  isDarkMode ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                Name used in apps
              </p>
              <SegmentControl
                isDarkMode={isDarkMode}
                theme={theme}
                value={resolveAppDisplayName(draft)}
                onChange={(id) => {
                  if (id === APP_DISPLAY_NAME.nickname && !studentNickname(draft)) return;
                  updateDraft('appDisplayName', id);
                }}
                options={APP_NAME_OPTIONS.map((opt) =>
                  opt.id === APP_DISPLAY_NAME.nickname && !studentNickname(draft)
                    ? { ...opt, label: 'Nickname (add one)' }
                    : opt
                )}
              />
              <p
                className={`mt-2 ${TYPE.bodySm} ${
                  isDarkMode ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                Randomizer, Behavior, Bank, Timer, and other apps use this name.
              </p>
            </div>
          </div>
        ) : (
          <dl className="grid grid-cols-1 gap-4">
            {STUDENT_INFO_FIELDS.map((field) => (
              <FieldDisplay
                key={field.key}
                label={field.label}
                value={fieldValue(display, field.key)}
                locked={field.lockable && isFieldLocked(field.key)}
                isDarkMode={isDarkMode}
              />
            ))}
            <FieldDisplay
              label="Name used in apps"
              value={
                resolveAppDisplayName(display) === APP_DISPLAY_NAME.nickname
                  ? `Nickname (${studentNickname(display)})`
                  : 'Full name'
              }
              isDarkMode={isDarkMode}
            />
          </dl>
        )}
      </ProfileSectionCard>
      ) : null}

      {show('school') ? (
      <ProfileSectionCard
        title="School"
        hint="District, school, and grade."
        isDarkMode={isDarkMode}
        theme={theme}
        editing={editingSection === 'school'}
        onEdit={() => startEdit('school')}
        onCancel={cancelEdit}
        onSave={() => persist(draft)}
      >
        {editingSection === 'school' ? (
          <div className="grid grid-cols-1 gap-4">
            {SCHOOL_FIELDS.map((field) => (
              <FieldEditor
                key={field.key}
                field={field}
                value={fieldValue(draft, field.key)}
                onChange={(value) => updateDraft(field.key, value)}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        ) : (
          <dl className="grid grid-cols-1 gap-4">
            {SCHOOL_FIELDS.map((field) => (
              <FieldDisplay
                key={field.key}
                label={field.label}
                value={fieldValue(display, field.key)}
                isDarkMode={isDarkMode}
              />
            ))}
          </dl>
        )}
      </ProfileSectionCard>
      ) : null}

      {show('login') ? (
      <ProfileSectionCard
        title={authMethod.cardTitle}
        hint={authMethod.cardHint}
        isDarkMode={isDarkMode}
        theme={theme}
        editing={editingSection === 'login'}
        onEdit={() => startEdit('login')}
        onCancel={cancelEdit}
        onSave={() => persist(draft)}
        className="lg:col-span-2"
      >
        {editingSection === 'login' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {LOGIN_ID_FIELDS.map((field) => (
              <FieldEditor
                key={field.key}
                field={field}
                value={draft[field.key] || ''}
                onChange={(value) => updateDraft(field.key, value)}
                isDarkMode={isDarkMode}
              />
            ))}
            <div className="sm:col-span-2">
              <StudentAuthField
                value={draft.password}
                onChange={(value) => updateDraft('password', value)}
                isDarkMode={isDarkMode}
                compact
              />
            </div>
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 gap-6 ${
              showBankQr ? 'lg:grid-cols-[1fr_auto] lg:items-start' : ''
            }`}
          >
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {LOGIN_ID_FIELDS.map((field) => (
                <FieldDisplay
                  key={field.key}
                  label={field.label}
                  value={display[field.key]}
                  isDarkMode={isDarkMode}
                />
              ))}
              <StudentAuthDisplay value={display.password} isDarkMode={isDarkMode} />
            </dl>
            {showBankQr ? (
              <div className="justify-self-center lg:justify-self-end">
                <p
                  className={`mb-2 text-center ${TYPE.labelMicro} ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  ClassBank card
                </p>
                <StudentBankQr
                  student={display}
                  size={128}
                  theme={theme}
                  isDarkMode={isDarkMode}
                  showCaption={false}
                />
                <p
                  className={`mt-2 max-w-[10rem] text-center ${TYPE.bodySm} ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Scan to log in to ClassBank
                </p>
              </div>
            ) : null}
          </div>
        )}
      </ProfileSectionCard>
      ) : null}

      {show('family') ? (
      <ProfileSectionCard
        title="Family information"
        hint="Home address, guardians, and siblings. First two contacts appear in class grids."
        isDarkMode={isDarkMode}
        theme={theme}
        editing={familyEditing}
        onEdit={() => startEdit('family')}
        onCancel={cancelEdit}
        onSave={() => persist(draft)}
        className="lg:col-span-2"
      >
        <div className="space-y-6">
          <div>
            {familyEditing ? (
              <FieldEditor
                field={ADDRESS_FIELD}
                value={fieldValue(draft, 'guardianAddress')}
                onChange={(value) => updateDraft('guardianAddress', value)}
                isDarkMode={isDarkMode}
              />
            ) : (
              <dl>
                <FieldDisplay
                  label={ADDRESS_FIELD.label}
                  value={fieldValue(display, 'guardianAddress')}
                  locked={isFieldLocked('address')}
                  isDarkMode={isDarkMode}
                />
              </dl>
            )}
          </div>

          <div>
            <h4
              className={`${TYPE.labelMicro} mb-3 ${
                isDarkMode ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Parents & guardians
            </h4>
            {familyEditing ? (
              <div className="space-y-3">
                <div className="flex justify-end">
                  {!contactLocked && (
                    <button
                      type="button"
                      onClick={addGuardian}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${TYPE.labelMd} ${
                        isDarkMode
                          ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Plus size={14} strokeWidth={2.5} />
                      Add contact
                    </button>
                  )}
                </div>
                {guardians.length === 0 ? (
                  <p className={`${TYPE.bodyMd} ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    No contacts yet.
                  </p>
                ) : (
                  guardians.map((g, index) => (
                    <div
                      key={g.id || index}
                      className={`rounded-xl border p-4 ${
                        isDarkMode
                          ? 'border-slate-700 bg-slate-800/40'
                          : 'border-slate-300 bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`${TYPE.labelMd} ${
                            isDarkMode ? 'text-slate-300' : 'text-slate-600'
                          }`}
                        >
                          {index < GRID_GUARDIAN_LIMIT
                            ? `Parent / Guardian ${index + 1}`
                            : `Additional contact ${index - GRID_GUARDIAN_LIMIT + 1}`}
                        </span>
                        {!contactLocked && (
                          <button
                            type="button"
                            onClick={() => removeGuardian(index)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10"
                            aria-label="Remove contact"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="block">
                          <span
                            className={`${TYPE.labelMicro} ${
                              isDarkMode ? 'text-slate-500' : 'text-slate-400'
                            }`}
                          >
                            Relationship
                          </span>
                          <select
                            value={g.relationship || 'Parent'}
                            disabled={contactLocked}
                            onChange={(e) =>
                              updateGuardian(index, { relationship: e.target.value })
                            }
                            className={inputClass(contactLocked, isDarkMode)}
                          >
                            {RELATIONSHIP_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span
                            className={`${TYPE.labelMicro} ${
                              isDarkMode ? 'text-slate-500' : 'text-slate-400'
                            }`}
                          >
                            Name
                          </span>
                          <input
                            type="text"
                            value={g.name || ''}
                            disabled={contactLocked}
                            onChange={(e) => updateGuardian(index, { name: e.target.value })}
                            className={inputClass(contactLocked, isDarkMode)}
                          />
                        </label>
                        <label className="block">
                          <span
                            className={`${TYPE.labelMicro} ${
                              isDarkMode ? 'text-slate-500' : 'text-slate-400'
                            }`}
                          >
                            Phone
                          </span>
                          <input
                            type="text"
                            value={g.phone || ''}
                            disabled={contactLocked}
                            onChange={(e) => updateGuardian(index, { phone: e.target.value })}
                            className={inputClass(contactLocked, isDarkMode)}
                          />
                        </label>
                        <label className="block">
                          <span
                            className={`${TYPE.labelMicro} ${
                              isDarkMode ? 'text-slate-500' : 'text-slate-400'
                            }`}
                          >
                            Email
                          </span>
                          <input
                            type="text"
                            value={g.email || ''}
                            disabled={contactLocked}
                            onChange={(e) => updateGuardian(index, { email: e.target.value })}
                            className={inputClass(contactLocked, isDarkMode)}
                          />
                        </label>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : guardians.length === 0 ? (
              <p className={`${TYPE.bodyMd} ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                No contacts on file.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {guardians.map((g, index) => (
                  <div
                    key={g.id || index}
                    className={`rounded-xl border p-4 ${
                      isDarkMode ? 'border-slate-700' : 'border-slate-200'
                    }`}
                  >
                    <p className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {g.name || 'Unnamed contact'}
                      <span
                        className={`ml-2 ${TYPE.labelMd} ${
                          isDarkMode ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        {g.relationship || 'Parent'}
                        {index >= GRID_GUARDIAN_LIMIT ? ' · profile only' : ''}
                      </span>
                    </p>
                    <dl className="grid grid-cols-1 gap-3 mt-3">
                      <FieldDisplay label="Phone" value={g.phone} isDarkMode={isDarkMode} />
                      <FieldDisplay label="Email" value={g.email} isDarkMode={isDarkMode} />
                    </dl>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4
              className={`${TYPE.labelMicro} mb-3 ${
                isDarkMode ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Siblings
            </h4>
            {familyEditing ? (
              siblingCandidates.length === 0 ? (
                <p className={`${TYPE.bodyMd} ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Add more students to link siblings.
                </p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {siblingCandidates.map((s) => {
                    const checked = (draft.siblingIds || []).includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer ${
                          isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSibling(s.id)}
                          className="rounded border-slate-300"
                        />
                        <span
                          className={`text-sm font-medium ${
                            isDarkMode ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {studentDisplayName(s)}
                        </span>
                        <span className={`${TYPE.bodySm} ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          {[s.grade_level, s.school].filter(Boolean).join(' · ')}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )
            ) : linkedSiblings.length === 0 ? (
              <p className={`${TYPE.bodyMd} ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                No siblings linked.
              </p>
            ) : (
              <ul className="space-y-2">
                {linkedSiblings.map((s) => (
                  <li
                    key={s.id}
                    className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}
                  >
                    {studentDisplayName(s)}
                    <span
                      className={`ml-2 ${TYPE.labelSm} ${
                        isDarkMode ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {[s.grade_level, s.school].filter(Boolean).join(' · ')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </ProfileSectionCard>
      ) : null}
    </div>
  );
}
