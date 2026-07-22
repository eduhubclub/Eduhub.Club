import { useMemo, useRef, useState } from 'react';
import {
  UploadCloud,
  Link2,
  UserPlus,
  FileSpreadsheet,
  X,
  Search,
  Plus,
} from 'lucide-react';
import { parseSpreadsheetStudents } from '../../data/classes/parseSpreadsheetStudents';
import { useStudents } from '../../data/students/StudentContext';
import { StudentAvatar } from '../../shared/StudentAvatar';
import { TYPE } from '../../shared/typography';

const IMPORT_METHODS = [
  {
    id: 'spreadsheet',
    title: 'Spreadsheet',
    description: 'Import from a .csv file',
    Icon: FileSpreadsheet,
  },
  {
    id: 'clever',
    title: 'Clever',
    description: 'Sync roster from Clever',
    Icon: CleverMark,
  },
  {
    id: 'google',
    title: 'Google Classroom',
    description: 'Sync with an existing classroom',
    Icon: Link2,
  },
  {
    id: 'manual',
    title: 'Manual Entry',
    description: 'Type or paste student names',
    Icon: UserPlus,
  },
];

function CleverMark({ size = 20, className = '' }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-md bg-[#1464FF] text-white font-bold leading-none ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.55) }}
      aria-hidden
    >
      C
    </span>
  );
}

function ImportMethodButton({ method, selected, onSelect, theme, isDarkMode }) {
  const { Icon, title, description } = method;
  const isSelected = selected === method.id;

  return (
    <button
      type="button"
      onClick={() => onSelect(method.id)}
      className={`w-full p-4 border rounded-xl flex items-center transition-all ${
        isSelected
          ? `${theme.border} ${isDarkMode ? 'bg-slate-800/80' : 'bg-slate-50'} ring-1 ${theme.ring}`
          : isDarkMode
            ? 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/40'
            : 'border-slate-300 hover:border-slate-300 hover:bg-slate-50/50'
      }`}
    >
      <div
        className={`p-2 rounded-lg mr-4 shrink-0 ${
          isSelected
            ? `${theme.colorPrimary} ${theme.colorOnPrimary}`
            : isDarkMode
              ? 'bg-slate-800 text-slate-400'
              : 'bg-slate-100 text-slate-500'
        }`}
      >
        {method.id === 'clever' ? (
          <CleverMark size={20} />
        ) : (
          <Icon size={20} />
        )}
      </div>
      <div className="text-left flex-1 min-w-0">
        <p className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          {title}
        </p>
        <p className={`${TYPE.bodySm} ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
          {description}
        </p>
      </div>
    </button>
  );
}

function appendNameToManualList(current, name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return current;

  const existing = String(current || '')
    .split(/\n|,/)
    .map((line) => line.trim().toLowerCase())
    .filter(Boolean);
  if (existing.includes(trimmed.toLowerCase())) return current;

  const base = String(current || '').trimEnd();
  return base ? `${base}\n${trimmed}` : trimmed;
}

/** Search registered students and add names into the manual entry list. */
function ManualDirectorySearch({
  theme,
  isDarkMode,
  manualStudents,
  onManualStudentsChange,
}) {
  const { students } = useStudents();
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return (students || [])
      .filter((s) => {
        const hay = [
          s.name,
          s.firstName,
          s.lastName,
          s.nickname,
          s.studentId,
          s.school,
          s.grade_level,
          s.district,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 8);
  }, [students, query]);

  const nameToAdd = picked?.name || query.trim();

  const addToList = (name) => {
    const next = appendNameToManualList(manualStudents, name);
    if (next === manualStudents) return;
    onManualStudentsChange(next);
    setQuery('');
    setPicked(null);
  };

  const handlePlus = () => {
    if (picked) {
      addToList(picked.name);
      return;
    }
    if (filtered.length === 1) {
      addToList(filtered[0].name);
      return;
    }
    if (nameToAdd) addToList(nameToAdd);
  };

  return (
    <div className="mb-4 space-y-2">
      <label
        className={`block ${TYPE.labelMd} ${
          isDarkMode ? 'text-slate-400' : 'text-slate-500'
        }`}
      >
        Search registered students
      </label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPicked(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handlePlus();
              }
            }}
            placeholder="Name, school, grade, or ID…"
            className={`w-full h-10 pl-9 pr-3 rounded-xl text-sm font-medium outline-none border ${
              isDarkMode
                ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>
        <button
          type="button"
          onClick={handlePlus}
          disabled={!nameToAdd && filtered.length === 0}
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${theme.colorOnPrimary} transition-all disabled:opacity-40 disabled:pointer-events-none ${theme.colorPrimary} hover:opacity-90`}
          aria-label="Add student to list"
          title="Add to list"
        >
          <Plus size={18} strokeWidth={2.5} />
        </button>
      </div>

      {query.trim() && filtered.length > 0 ? (
        <div
          className={`rounded-xl border overflow-hidden divide-y max-h-40 overflow-y-auto ${
            isDarkMode ? 'border-slate-600 divide-slate-800' : 'border-slate-300 divide-slate-100'
          }`}
        >
          {filtered.map((student) => {
            const isPicked = picked && String(picked.id) === String(student.id);
            return (
              <button
                key={student.id}
                type="button"
                onClick={() => {
                  setPicked(student);
                  setQuery(student.name);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                  isPicked
                    ? isDarkMode
                      ? 'bg-slate-800'
                      : 'bg-slate-50'
                    : isDarkMode
                      ? 'hover:bg-slate-800/50'
                      : 'hover:bg-slate-50'
                }`}
              >
                <StudentAvatar
                  student={student}
                  theme={theme}
                  size="sm"
                  isDarkMode={isDarkMode}
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={`block ${TYPE.titleSm} truncate ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {student.name}
                  </span>
                  <span className={`block ${TYPE.labelMicro} text-slate-500 truncate`}>
                    {[student.school, student.grade_level].filter(Boolean).join(' · ') ||
                      'Directory'}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {query.trim() && students?.length > 0 && filtered.length === 0 ? (
        <p className={`${TYPE.bodySm} ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          No registered students match. You can still press + to add the typed name.
        </p>
      ) : null}
    </div>
  );
}

export function StudentImportPanel({
  theme,
  isDarkMode,
  studentAddMethod,
  onMethodChange,
  manualStudents,
  onManualStudentsChange,
  csvFileName,
  onCsvFileNameChange,
  importedStudents,
  onImportedStudentsChange,
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onCsvFileNameChange(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const students = parseSpreadsheetStudents(String(event.target.result || ''));
      onImportedStudentsChange(students);
    };
    reader.readAsText(file);
  };

  const clearSpreadsheet = () => {
    onCsvFileNameChange('');
    onImportedStudentsChange([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-6 space-y-4">
      <p className={`${TYPE.bodyMd} ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        How would you like to import your class roster?
      </p>

      <div className="space-y-3">
        {IMPORT_METHODS.map((method) => (
          <ImportMethodButton
            key={method.id}
            method={method}
            selected={studentAddMethod}
            onSelect={onMethodChange}
            theme={theme}
            isDarkMode={isDarkMode}
          />
        ))}
      </div>

      {studentAddMethod === 'spreadsheet' && (
        <div
          className={`mt-4 p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center ${
            isDarkMode ? 'border-slate-600 bg-slate-800/50 text-slate-400' : 'border-slate-300 bg-slate-50 text-slate-500'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <UploadCloud
            size={24}
            className={`mb-3 transition-colors ${csvFileName ? theme.text : 'opacity-50'}`}
          />
          <p className={`${TYPE.titleSm} mb-3`}>Upload a spreadsheet file</p>

          {csvFileName ? (
            <div className="flex flex-col items-center gap-2">
              <div
                className={`px-4 py-2 rounded-lg ${TYPE.labelMd} border flex items-center ${
                  isDarkMode ? 'bg-slate-900 border-slate-600' : 'bg-white border-slate-300'
                }`}
              >
                <span className="truncate max-w-[180px]">{csvFileName}</span>
                <button
                  type="button"
                  onClick={clearSpreadsheet}
                  className="ml-2 hover:text-rose-500 transition-colors"
                  aria-label="Remove file"
                >
                  <X size={14} />
                </button>
              </div>
              {importedStudents.length > 0 && (
                <p className={`${TYPE.bodySm} ${theme.text}`}>
                  {importedStudents.length} student{importedStudents.length === 1 ? '' : 's'} found
                </p>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`px-4 py-2 rounded-lg ${TYPE.labelMd} transition-all shadow-sm ${theme.colorOnPrimary} hover:shadow-md hover:-translate-y-0.5 ${theme.colorPrimary}`}
            >
              Browse Files
            </button>
          )}
          <p className={`${TYPE.bodySm} mt-3 opacity-60`}>Supports .csv files only</p>
        </div>
      )}

      {studentAddMethod === 'manual' && (
        <div className="mt-4">
          <ManualDirectorySearch
            theme={theme}
            isDarkMode={isDarkMode}
            manualStudents={manualStudents}
            onManualStudentsChange={onManualStudentsChange}
          />

          <label
            className={`block ${TYPE.labelMd} mb-1.5 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Student names (comma or line separated)
          </label>
          <textarea
            rows={6}
            value={manualStudents}
            onChange={(e) => onManualStudentsChange(e.target.value)}
            placeholder={'Ada Lovelace\nAlan Turing\nGrace Hopper'}
            className={`w-full px-4 py-3 rounded-xl border outline-none resize-none text-sm ${
              isDarkMode
                ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-600'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>
      )}
    </div>
  );
}
