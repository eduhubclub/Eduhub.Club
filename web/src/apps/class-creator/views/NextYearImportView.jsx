import { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { AppBoard } from '../../../shared/AppBoard';
import { EmptyState } from '../../../shared/EmptyState';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import {
  normalizeStudentSnapshot,
  studentList,
} from '../../../data/class-creator/classCreatorModel';
import {
  PLACEMENT_CSV_TEMPLATE,
  parsePlacementCsv,
} from '../../../data/class-creator/parsePlacementCsv';

/**
 * Skyward / CSV intake for Kindergarten and new students — lives on Setup.
 */
export function NextYearImportView({ theme, isDarkMode, run, upsertActiveRun }) {
  const [preview, setPreview] = useState([]);
  const [errors, setErrors] = useState([]);
  const [message, setMessage] = useState('');

  if (!run) {
    return (
      <EmptyState
        message="Start a placement run first — Choose school and band above, then import next-year students."
        isDarkMode={isDarkMode}
      />
    );
  }

  const externalList = studentList(run).filter((student) => student.source === 'external');

  const onFile = async (file) => {
    if (!file) return;
    const text = await file.text();
    const { students: rows, errors: parseErrors } = parsePlacementCsv(text);
    setErrors(parseErrors);
    setPreview(rows);
    setMessage(rows.length ? `${rows.length} rows ready to import.` : 'No rows found.');
  };

  const commitCsv = () => {
    if (!preview.length) return;
    const students = { ...run.students };
    const externalStudentIds = [...run.externalStudentIds];
    for (const row of preview) {
      const snap = normalizeStudentSnapshot(row);
      students[snap.id] = { ...students[snap.id], ...snap };
      if (!externalStudentIds.includes(snap.id) && !run.cohortStudentIds.includes(snap.id)) {
        externalStudentIds.push(snap.id);
      }
    }
    upsertActiveRun({ students, externalStudentIds });
    setMessage(`Imported ${preview.length} next-year student(s).`);
    setPreview([]);
  };

  const downloadTemplate = () => {
    const blob = new Blob([PLACEMENT_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'class-creator-skyward-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <AppBoard mode="scroll" pad="board" theme={theme}>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <h2 className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Import for next year
            </h2>
            <p className={`mt-1 ${TYPE.bodySm} ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Skyward CSV for Kindergarten and new students not already on the current roster.
              Sorted on demographics, services, and gender only.
            </p>
            {message ? (
              <p className={`mt-2 ${TYPE.bodySm} ${isDarkMode ? 'text-sky-300' : 'text-sky-700'}`}>
                {message}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className={`${toolBtnClass(isDarkMode)} edu-control`}
            onClick={downloadTemplate}
          >
            <Download className="w-4 h-4" />
            Template
          </button>
        </div>
        <label
          className={`edu-control inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer ${theme.colorOutline} ${
            isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span className="text-sm font-medium">Upload CSV</span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </label>
        {errors.length ? (
          <ul className={`mt-3 ${TYPE.bodySm} text-rose-600 space-y-1`}>
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        ) : null}
        {preview.length ? (
          <div className="mt-4">
            <p className={`${TYPE.bodySm} mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Preview ({preview.length})
            </p>
            <div className="max-h-48 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm">
                <thead
                  className={
                    isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }
                >
                  <tr>
                    <th className="text-left px-3 py-2">Name</th>
                    <th className="text-left px-3 py-2">Gender</th>
                    <th className="text-left px-3 py-2">Grade</th>
                    <th className="text-left px-3 py-2">ID</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 40).map((row) => (
                    <tr
                      key={row.id}
                      className={isDarkMode ? 'border-slate-700' : 'border-slate-200'}
                    >
                      <td className="px-3 py-1.5">{row.name}</td>
                      <td className="px-3 py-1.5">{row.gender || '—'}</td>
                      <td className="px-3 py-1.5">{row.grade_level || '—'}</td>
                      <td className="px-3 py-1.5 font-mono text-xs">
                        {row.studentId || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              className={`mt-3 ${toolBtnClass(isDarkMode)} edu-control ${theme.colorPrimary} ${theme.colorOnPrimary}`}
              onClick={commitCsv}
            >
              Add to next-year intake
            </button>
          </div>
        ) : null}
      </AppBoard>

      <AppBoard mode="scroll" pad="board" theme={theme}>
        <h2 className={`${TYPE.titleSm} mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          Next-year intake ({externalList.length})
        </h2>
        {externalList.length === 0 ? (
          <p className={`${TYPE.bodySm} ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
            No CSV students imported yet.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {externalList.map((student) => (
              <li
                key={student.id}
                className={`px-3 py-2 rounded-xl border text-sm ${theme.colorOutline} ${
                  isDarkMode ? 'bg-slate-800/40' : 'bg-slate-50'
                }`}
              >
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {student.name}
                </span>
                <span
                  className={`ml-2 ${TYPE.bodySm} ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {student.grade_level || 'Grade unset'}
                  {student.gender ? ` · ${student.gender}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </AppBoard>
    </div>
  );
}
