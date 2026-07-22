import { useEffect, useState } from 'react';
import {
  EMPTY_ADD_STUDENT_FORM,
  GENDER_OPTIONS,
  buildStudentFromForm,
  isAddStudentFormValid,
} from '../../data/students/seed';
import { GRADE_OPTIONS } from '../classes/gradeOptions';
import { DISTRICT_OPTIONS, SCHOOL_OPTIONS } from '../../data/students/seed';
import { getDistrictAuthMethod } from '../../data/students/districtAuth';
import { StudentAuthField } from '../../shared/StudentAuthField';
import { Modal } from '../../shared/Modal';
import { ModalPrimaryButton } from '../../shared/ModalPrimaryButton';
import { TYPE } from '../../shared/typography';

export { EMPTY_ADD_STUDENT_FORM };

const TOTAL_PAGES = 4;

const PAGES = [
  {
    id: 'info',
    title: 'Student info',
    hint: 'Name and personal details.',
  },
  {
    id: 'school',
    title: 'School',
    hint: 'District, school, and grade.',
  },
  {
    id: 'login',
    title: null, // filled from district auth
    hint: null,
  },
  {
    id: 'family',
    title: 'Family information',
    hint: 'Home address and guardians. First two contacts appear in class grids.',
  },
];

function FieldLabel({ children, required, isDarkMode }) {
  return (
    <label
      className={`block ${TYPE.labelMicro} mb-1.5 ${
        isDarkMode ? 'text-slate-500' : 'text-slate-400'
      }`}
    >
      {children}
      {required ? <span className="text-rose-500 ml-0.5">*</span> : null}
    </label>
  );
}

function inputClass(isDarkMode) {
  return `w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${
    isDarkMode
      ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-600'
      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
  }`;
}

function PageDots({ page, total, theme, isDarkMode, onSelect }) {
  return (
    <div className="flex items-center justify-center gap-2 pt-1" role="tablist" aria-label="Form pages">
      {Array.from({ length: total }, (_, i) => {
        const index = i + 1;
        const active = index === page;
        const done = index < page;
        return (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={`Page ${index} of ${total}${active ? ', current' : ''}`}
            onClick={() => {
              if (index <= page) onSelect(index);
            }}
            className={`rounded-full transition-all ${
              active
                ? `w-2.5 h-2.5 ${theme.colorPrimary}`
                : done
                  ? `w-2 h-2 ${theme.colorPrimary} opacity-50`
                  : `w-2 h-2 ${isDarkMode ? 'bg-slate-600' : 'bg-slate-300'}`
            }`}
          />
        );
      })}
    </div>
  );
}

function isInfoPageValid(form) {
  return Boolean(
    (form.firstName || '').trim() && (form.lastName || '').trim() && form.gender
  );
}

function isSchoolPageValid(form) {
  return Boolean(form.grade);
}

/** Auto-insert MM/DD/YYYY slashes while typing digits. */
function formatBirthdateInput(raw) {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/**
 * Add Student modal — pages mirror student profile cards:
 * Student info · School · Logins & sign-in · Family information
 */
export function AddStudentModal({
  isOpen,
  form,
  onChange,
  onClose,
  onSubmit,
  theme,
  isDarkMode,
}) {
  const [page, setPage] = useState(1);
  const set = (key) => (e) => onChange({ ...form, [key]: e.target.value });
  const authMethod = getDistrictAuthMethod();
  const valid = isAddStudentFormValid(form);
  const isLast = page === TOTAL_PAGES;

  const pageMeta = PAGES[page - 1];
  const pageTitle =
    pageMeta.id === 'login' ? authMethod.cardTitle : pageMeta.title;
  const pageHint = pageMeta.id === 'login' ? authMethod.cardHint : pageMeta.hint;

  useEffect(() => {
    if (isOpen) setPage(1);
  }, [isOpen]);

  const canAdvance = () => {
    if (page === 1) return isInfoPageValid(form);
    if (page === 2) return isSchoolPageValid(form);
    return true;
  };

  const handleSubmit = () => {
    if (!valid) return;
    onSubmit(buildStudentFromForm(form));
  };

  const goNext = () => {
    if (!canAdvance()) return;
    if (page < TOTAL_PAGES) setPage((p) => p + 1);
  };

  const goBack = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Add Student"
      theme={theme}
      isDarkMode={isDarkMode}
      onClose={onClose}
      maxWidth="max-w-xl"
      zIndex="z-[200]"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <div className="min-w-[4rem]">
            {page > 1 ? (
              <button
                type="button"
                onClick={goBack}
                className={`px-1 py-2 ${TYPE.labelLg} transition-colors ${
                  isDarkMode
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Back
              </button>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl ${TYPE.labelLg} ${
                isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Cancel
            </button>
            {isLast ? (
              <ModalPrimaryButton theme={theme} disabled={!valid} onClick={handleSubmit}>
                Add Student
              </ModalPrimaryButton>
            ) : (
              <ModalPrimaryButton theme={theme} disabled={!canAdvance()} onClick={goNext}>
                Next
              </ModalPrimaryButton>
            )}
          </div>
        </div>
      }
    >
      <div className="px-6 pt-6 pb-3 space-y-4">
        <div
          className={`pb-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
        >
          <p className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            {pageTitle}
          </p>
          <p className={`${TYPE.bodySm} mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            {pageHint}
          </p>
        </div>

        {page === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <FieldLabel required isDarkMode={isDarkMode}>
                First name
              </FieldLabel>
              <input
                autoFocus
                value={form.firstName}
                onChange={set('firstName')}
                placeholder="Harper"
                className={inputClass(isDarkMode)}
              />
            </div>
            <div>
              <FieldLabel required isDarkMode={isDarkMode}>
                Last name
              </FieldLabel>
              <input
                value={form.lastName}
                onChange={set('lastName')}
                placeholder="Anderson"
                className={inputClass(isDarkMode)}
              />
            </div>
            <div>
              <FieldLabel isDarkMode={isDarkMode}>Nickname</FieldLabel>
              <input
                value={form.nickname}
                onChange={set('nickname')}
                placeholder="Optional"
                className={inputClass(isDarkMode)}
              />
            </div>
            <div>
              <FieldLabel required isDarkMode={isDarkMode}>
                Gender
              </FieldLabel>
              <select
                value={form.gender}
                onChange={set('gender')}
                className={inputClass(isDarkMode)}
              >
                <option value="" disabled>
                  Select gender
                </option>
                {GENDER_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <FieldLabel isDarkMode={isDarkMode}>Birthday</FieldLabel>
              <input
                value={form.birthdate}
                onChange={(e) => onChange({ ...form, birthdate: formatBirthdateInput(e.target.value) })}
                inputMode="numeric"
                placeholder="MM/DD/YYYY"
                maxLength={10}
                className={inputClass(isDarkMode)}
              />
            </div>
          </div>
        )}

        {page === 2 && (
          <div className="grid grid-cols-1 gap-3">
            <div>
              <FieldLabel isDarkMode={isDarkMode}>District</FieldLabel>
              <input
                autoFocus
                value={form.district}
                onChange={set('district')}
                list="add-student-districts"
                placeholder="Tahoma School District"
                className={inputClass(isDarkMode)}
              />
              <datalist id="add-student-districts">
                {DISTRICT_OPTIONS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div>
              <FieldLabel isDarkMode={isDarkMode}>School</FieldLabel>
              <input
                value={form.school}
                onChange={set('school')}
                list="add-student-schools"
                placeholder="Tahoma Elementary"
                className={inputClass(isDarkMode)}
              />
              <datalist id="add-student-schools">
                {SCHOOL_OPTIONS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div>
              <FieldLabel required isDarkMode={isDarkMode}>
                Grade
              </FieldLabel>
              <select value={form.grade} onChange={set('grade')} className={inputClass(isDarkMode)}>
                <option value="" disabled>
                  Select grade
                </option>
                {GRADE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {page === 3 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <FieldLabel isDarkMode={isDarkMode}>Student ID</FieldLabel>
              <input
                autoFocus
                value={form.studentId}
                onChange={set('studentId')}
                placeholder="9-digit ID"
                className={inputClass(isDarkMode)}
              />
            </div>
            <div>
              <FieldLabel isDarkMode={isDarkMode}>Student email</FieldLabel>
              <input
                value={form.email}
                onChange={set('email')}
                placeholder="handerson@edu.hub"
                className={inputClass(isDarkMode)}
              />
            </div>
            <div className="sm:col-span-2">
              <StudentAuthField
                value={form.password}
                onChange={(value) => onChange({ ...form, password: value })}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        )}

        {page === 4 && (
          <div className="space-y-4">
            <div>
              <FieldLabel isDarkMode={isDarkMode}>Address</FieldLabel>
              <input
                autoFocus
                value={form.guardianAddress}
                onChange={set('guardianAddress')}
                placeholder="Street, City, State ZIP"
                className={inputClass(isDarkMode)}
              />
            </div>

            <div>
              <p
                className={`${TYPE.labelMicro} mb-3 ${
                  isDarkMode ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                Parents & guardians
              </p>
              <div className="space-y-3">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className={`rounded-xl border p-4 ${
                      isDarkMode
                        ? 'border-slate-700 bg-slate-800/40'
                        : 'border-slate-300 bg-slate-50/80'
                    }`}
                  >
                    <p
                      className={`${TYPE.labelMd} mb-3 ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      Parent / Guardian {n}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <FieldLabel isDarkMode={isDarkMode}>Name</FieldLabel>
                        <input
                          value={form[`parent${n}Name`]}
                          onChange={set(`parent${n}Name`)}
                          className={inputClass(isDarkMode)}
                        />
                      </div>
                      <div>
                        <FieldLabel isDarkMode={isDarkMode}>Phone</FieldLabel>
                        <input
                          value={form[`parent${n}Phone`]}
                          onChange={set(`parent${n}Phone`)}
                          className={inputClass(isDarkMode)}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <FieldLabel isDarkMode={isDarkMode}>Email</FieldLabel>
                        <input
                          value={form[`parent${n}Email`]}
                          onChange={set(`parent${n}Email`)}
                          className={inputClass(isDarkMode)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <PageDots
          page={page}
          total={TOTAL_PAGES}
          theme={theme}
          isDarkMode={isDarkMode}
          onSelect={setPage}
        />
      </div>
    </Modal>
  );
}
