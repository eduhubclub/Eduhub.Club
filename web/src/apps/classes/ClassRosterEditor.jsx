import { useEffect, useMemo, useState } from 'react';
import { Lock, Plus } from 'lucide-react';
import { isFieldLocked } from '../../data/classes/districtFieldLocks';
import {
  GRID_GUARDIAN_LIMIT,
  guardiansForGrid,
  mergeGridGuardians,
  syncLegacyGuardianFields,
} from '../../data/classes/guardians';
import { getDistrictAuthMethod } from '../../data/students/districtAuth';
import { EMPTY_ADD_STUDENT_FORM } from '../../data/students/seed';
import { ModalPrimaryButton } from '../../shared/ModalPrimaryButton';
import { AddStudentModal } from '../students/AddStudentModal';
import { APP_GRID_CARD } from '../../shared/layout';
import { TYPE } from '../../shared/typography';

const BASE_COLUMNS = [
  { key: 'name', label: 'Name', lockable: false, minWidth: 'min-w-[140px]' },
  { key: 'nickname', label: 'Nickname', lockable: false, minWidth: 'min-w-[120px]' },
  { key: 'studentId', label: 'Student ID', lockable: false, minWidth: 'min-w-[110px]' },
  { key: 'email', label: 'Student Email', lockable: false, minWidth: 'min-w-[180px]' },
  { key: 'password', labelKey: 'auth', lockable: false, minWidth: 'min-w-[120px]' },
  { key: 'gender', label: 'Gender', lockable: false, minWidth: 'min-w-[110px]', type: 'select' },
  { key: 'birthdate', label: 'Birthday', lockable: true, minWidth: 'min-w-[130px]' },
  { key: 'guardianAddress', label: 'Address', lockable: true, minWidth: 'min-w-[180px]' },
];

const GUARDIAN_COLUMNS = Array.from({ length: GRID_GUARDIAN_LIMIT }, (_, i) => {
  const n = i + 1;
  return [
    {
      key: `g${i}_name`,
      label: `Parent ${n}`,
      lockable: true,
      lockKey: 'parentContact',
      minWidth: 'min-w-[140px]',
      guardianIndex: i,
      guardianField: 'name',
    },
    {
      key: `g${i}_phone`,
      label: `Parent ${n} Phone`,
      lockable: true,
      lockKey: 'parentContact',
      minWidth: 'min-w-[130px]',
      guardianIndex: i,
      guardianField: 'phone',
    },
    {
      key: `g${i}_email`,
      label: `Parent ${n} Email`,
      lockable: true,
      lockKey: 'parentContact',
      minWidth: 'min-w-[160px]',
      guardianIndex: i,
      guardianField: 'email',
    },
  ];
}).flat();

const COLUMNS = [...BASE_COLUMNS, ...GUARDIAN_COLUMNS];

const GENDER_OPTIONS = ['', 'Female', 'Male', 'Non-binary', 'Prefer not to say', 'Other'];

function LockedHint() {
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

function CellInput({ value, onChange, disabled, isDarkMode, type = 'text', placeholder }) {
  const base = `w-full px-2.5 py-1.5 rounded-lg border text-sm outline-none transition-colors ${
    disabled
      ? isDarkMode
        ? 'bg-slate-900/60 border-slate-700 text-slate-500 cursor-not-allowed'
        : 'bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed'
      : isDarkMode
        ? 'bg-slate-800 border-slate-600 text-white focus:border-slate-500'
        : 'bg-white border-slate-300 text-slate-900 focus:border-slate-400'
  }`;

  if (type === 'select') {
    return (
      <select
        value={value || ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={base}
      >
        {GENDER_OPTIONS.map((opt) => (
          <option key={opt || 'blank'} value={opt}>
            {opt || '—'}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type={type}
      value={value || ''}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={base}
    />
  );
}

function toDraftRow(s) {
  const slots = guardiansForGrid(s);
  const flat = {};
  slots.forEach((g, i) => {
    flat[`g${i}_name`] = g.name || '';
    flat[`g${i}_phone`] = g.phone || '';
    flat[`g${i}_email`] = g.email || '';
    flat[`g${i}_id`] = g.id;
  });
  return {
    ...s,
    nickname: s.nickname || '',
    studentId: s.studentId || '',
    email: s.email || '',
    password: s.password || '',
    gender: s.gender || '',
    birthdate: s.birthdate || '',
    guardianAddress: s.guardianAddress || s.address || '',
    _gridGuardians: slots,
    ...flat,
  };
}

function columnLocked(col) {
  if (!col.lockable) return false;
  return isFieldLocked(col.lockKey || col.key);
}

/**
 * Whole-class roster editor: one row per student, editable fields in a grid.
 * Up to two parents/guardians can be edited here; additional contacts
 * (grandparents, etc.) live on the individual student profile.
 */
export function ClassRosterEditor({
  students,
  theme,
  isDarkMode,
  onSave,
  onCancel,
  onStudentAdded,
  defaultGrade = '',
}) {
  const [draft, setDraft] = useState(() => students.map(toDraftRow));
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(() => ({
    ...EMPTY_ADD_STUDENT_FORM,
    grade: defaultGrade || '',
  }));
  const authMethod = getDistrictAuthMethod();
  const columns = useMemo(
    () =>
      COLUMNS.map((col) =>
        col.labelKey === 'auth' ? { ...col, label: authMethod.fieldLabel } : col
      ),
    [authMethod.fieldLabel]
  );

  // Keep draft rows when the class list grows (e.g. add student); preserve cell edits.
  useEffect(() => {
    setDraft((prev) => {
      const prevById = new Map(prev.map((row) => [row.id, row]));
      return students.map((s) => prevById.get(s.id) || toDraftRow(s));
    });
  }, [students]);

  const openAddStudent = () => {
    setAddForm({ ...EMPTY_ADD_STUDENT_FORM, grade: defaultGrade || '' });
    setIsAddOpen(true);
  };

  const closeAddStudent = () => {
    setIsAddOpen(false);
    setAddForm({ ...EMPTY_ADD_STUDENT_FORM, grade: defaultGrade || '' });
  };

  const handleAddStudent = (student) => {
    onStudentAdded?.(student);
    closeAddStudent();
  };

  const updateCell = (studentId, col, value) => {
    if (columnLocked(col)) return;
    setDraft((prev) =>
      prev.map((row) => {
        if (row.id !== studentId) return row;
        if (col.guardianIndex != null) {
          const nextSlots = row._gridGuardians.map((g, i) =>
            i === col.guardianIndex ? { ...g, [col.guardianField]: value } : g
          );
          return {
            ...row,
            _gridGuardians: nextSlots,
            [`g${col.guardianIndex}_${col.guardianField}`]: value,
          };
        }
        return { ...row, [col.key]: value };
      })
    );
  };

  const handleSave = () => {
    onSave(
      draft.map((row) => {
        const { _gridGuardians, ...rest } = row;
        // Strip flattened g*_ keys from persisted student object
        const cleaned = Object.fromEntries(
          Object.entries(rest).filter(([k]) => !/^g\d+_/.test(k))
        );
        const guardians = mergeGridGuardians(row, _gridGuardians);
        return {
          ...cleaned,
          name: (row.name || '').trim() || row.name,
          nickname: (row.nickname || '').trim(),
          studentId: (row.studentId || '').trim(),
          email: (row.email || '').trim(),
          password: (row.password || '').trim(),
          gender: row.gender || '',
          birthdate: (row.birthdate || '').trim(),
          guardianAddress: (row.guardianAddress || '').trim(),
          ...syncLegacyGuardianFields(guardians),
        };
      })
    );
  };

  const cellValue = (row, col) => {
    if (col.guardianIndex != null) {
      return row._gridGuardians?.[col.guardianIndex]?.[col.guardianField] || '';
    }
    return row[col.key] || '';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={openAddStudent}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl ${TYPE.labelLg} transition-colors ${
            isDarkMode
              ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          <Plus size={16} strokeWidth={2.5} />
          Add student
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className={`px-4 py-2 rounded-xl ${TYPE.labelLg} ${
              isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Cancel
          </button>
          <ModalPrimaryButton theme={theme} onClick={handleSave}>
            Save changes
          </ModalPrimaryButton>
        </div>
      </div>

      {draft.length === 0 ? (
        <div
          className={`${APP_GRID_CARD} p-8 text-center ${TYPE.bodyMd} text-slate-500 ${theme.colorSurface} ${theme.colorOutline}`}
        >
          No students in this class yet.
        </div>
      ) : (
        <div
          className={`${APP_GRID_CARD} overflow-hidden ${theme.colorSurface} ${theme.colorOutline}`}
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr
                  className={
                    isDarkMode ? 'bg-slate-800/80 text-slate-400' : 'bg-slate-50 text-slate-500'
                  }
                >
                  {columns.map((col) => {
                    const locked = columnLocked(col);
                    return (
                      <th
                        key={col.key}
                        className={`px-3 py-2.5 ${TYPE.labelMicro} whitespace-nowrap ${col.minWidth}`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {col.label}
                          {locked ? <LockedHint /> : null}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {draft.map((row) => (
                  <tr
                    key={row.id}
                    className={`border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
                  >
                    {columns.map((col) => {
                      const locked = columnLocked(col);
                      return (
                        <td key={col.key} className={`px-2 py-2 align-middle ${col.minWidth}`}>
                          <CellInput
                            value={cellValue(row, col)}
                            disabled={locked}
                            isDarkMode={isDarkMode}
                            type={col.type || 'text'}
                            placeholder={col.label}
                            onChange={(value) => updateCell(row.id, col, value)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddStudentModal
        isOpen={isAddOpen}
        form={addForm}
        onChange={setAddForm}
        onClose={closeAddStudent}
        onSubmit={handleAddStudent}
        theme={theme}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
