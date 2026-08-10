import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Search, ListFilter, X } from 'lucide-react';
import { useStudents } from '../../data/students/StudentContext';
import { useClasses } from '../../data/classes/ClassContext';
import { EMPTY_ADD_STUDENT_FORM } from '../../data/students/seed';
import { GRADE_OPTIONS } from '../classes/gradeOptions';
import { SCHOOL_OPTIONS } from '../../data/students/seed';
import { PageHeader } from '../../shared/PageHeader';
import { EmptyState } from '../../shared/EmptyState';
import { StudentAvatar } from '../../shared/StudentAvatar';
import { ButtonRow } from '../../shared/ButtonRow';
import { AddStudentModal } from './AddStudentModal';
import { StudentProfilePage } from './StudentProfilePage';
import { AppPageShell } from '../../shared/AppPageShell';
import { appFabClass, APP_SCROLL_BOARD } from '../../shared/layout';
import { toolBtnClass } from '../../shared/toolBtn';
import { TYPE } from '../../shared/typography';
import {
  studentAlternateName,
  studentDisplayName,
} from '../../data/students/displayName';

function studentInClass(student, cls) {
  if (!cls?.studentList?.length) return false;
  if (Array.isArray(student.classIds) && student.classIds.includes(cls.id)) return true;
  return cls.studentList.some(
    (s) => s.id === student.id || s.name?.toLowerCase() === student.name?.toLowerCase()
  );
}

function lastNameOf(student) {
  if (student.lastName) return student.lastName;
  const parts = (student.name || '').trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : parts[0] || '';
}

/**
 * Edu.Students — shared student directory.
 * Teachers add individuals here; Classes and other apps consume profiles later.
 */
export function StudentsApp({ isDarkMode, theme, isLeft }) {
  const { students, addStudent, updateStudent, removeStudent } = useStudents();
  const { classes, updateStudentInAllClasses } = useClasses();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_ADD_STUDENT_FORM);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [gradeFilter, setGradeFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('asc'); // asc | desc

  const filterRef = useRef(null);
  const searchInputRef = useRef(null);

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) || null,
    [students, selectedStudentId]
  );

  const activeClasses = useMemo(
    () => classes.filter((c) => !c.isArchived),
    [classes]
  );

  const schoolOptions = useMemo(() => {
    const fromData = students.map((s) => s.school).filter(Boolean);
    return [...new Set([...SCHOOL_OPTIONS, ...fromData])].sort();
  }, [students]);

  const filtersActive = Boolean(gradeFilter || classFilter || schoolFilter || sortOrder === 'desc');

  const visibleStudents = useMemo(() => {
    let list = [...students];
    const q = searchQuery.trim().toLowerCase();

    if (q) {
      list = list.filter((s) => {
        const siblingNames = (s.siblingIds || [])
          .map((id) => students.find((x) => x.id === id)?.name)
          .filter(Boolean)
          .join(' ');
        const hay = [s.name, s.nickname, s.studentId, s.email, s.grade_level, s.school, siblingNames]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }

    if (gradeFilter) {
      list = list.filter((s) => s.grade_level === gradeFilter);
    }

    if (schoolFilter) {
      list = list.filter((s) => s.school === schoolFilter);
    }

    if (classFilter) {
      const cls = classes.find((c) => String(c.id) === String(classFilter));
      list = list.filter((s) => studentInClass(s, cls));
    }

    list.sort((a, b) => {
      const cmp = lastNameOf(a).localeCompare(lastNameOf(b), undefined, { sensitivity: 'base' });
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [students, searchQuery, gradeFilter, classFilter, schoolFilter, sortOrder, classes]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const onDoc = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    if (filterOpen) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [filterOpen]);

  const resetModal = () => {
    setIsAddOpen(false);
    setForm(EMPTY_ADD_STUDENT_FORM);
  };

  const handleAdd = (student) => {
    addStudent(student);
    resetModal();
  };

  const clearFilters = () => {
    setGradeFilter('');
    setClassFilter('');
    setSchoolFilter('');
    setSortOrder('asc');
  };

  if (selectedStudent) {
    return (
      <StudentProfilePage
        student={selectedStudent}
        theme={theme}
        isDarkMode={isDarkMode}
        allStudents={students}
        classes={activeClasses}
        onBack={() => setSelectedStudentId(null)}
        onSave={(patch) => {
          updateStudent(selectedStudent.id, patch);
          updateStudentInAllClasses(selectedStudent, patch);
        }}
        onDelete={(id) => {
          removeStudent(id);
          setSelectedStudentId(null);
        }}
      />
    );
  }

  const toolBtn = toolBtnClass(isDarkMode);

  return (
    <AppPageShell variant="scroll">
      <PageHeader
        title="Students"
        description="Directory of students from this app and your class rosters."
        isDarkMode={isDarkMode}
      />

      <ButtonRow>
          {searchOpen ? (
            <div
              className={`flex items-center h-9 rounded-xl border overflow-hidden flex-1 min-w-[180px] max-w-sm ${
                isDarkMode ? 'bg-slate-900 border-slate-600' : 'bg-white border-slate-300'
              }`}
            >
              <Search size={16} className={`ml-3 shrink-0 ${theme.text}`} />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students..."
                className={`flex-1 h-full px-2 bg-transparent outline-none text-sm ${
                  isDarkMode ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                }`}
              />
              <button
                type="button"
                className="p-2 text-slate-400 hover:text-slate-600"
                aria-label="Close search"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                }}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={toolBtn}
              onClick={() => setSearchOpen(true)}
              aria-label="Search students"
            >
              <Search size={16} />
              Search
            </button>
          )}

          <div className="relative" ref={filterRef}>
            <button
              type="button"
              className={`${toolBtn} ${filtersActive ? theme.text : ''}`}
              onClick={() => setFilterOpen((v) => !v)}
              aria-expanded={filterOpen}
              aria-label="Filter students"
            >
              <ListFilter size={16} />
              Filter
              {filtersActive ? (
                <span className={`w-1.5 h-1.5 rounded-full ${theme.colorPrimary}`} />
              ) : null}
            </button>

            {filterOpen && (
              <div
                className={`absolute right-0 top-full mt-2 w-64 rounded-2xl border shadow-xl z-30 p-3 space-y-3 ${
                  isDarkMode ? 'bg-slate-900 border-slate-600' : 'bg-white border-slate-300'
                }`}
              >
                <div>
                  <label
                    className={`block ${TYPE.labelMicro} mb-1.5 ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    Grade
                  </label>
                  <select
                    value={gradeFilter}
                    onChange={(e) => setGradeFilter(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-sm outline-none ${
                      isDarkMode
                        ? 'bg-slate-800 border-slate-600 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="">All grades</option>
                    {GRADE_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className={`block ${TYPE.labelMicro} mb-1.5 ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    School
                  </label>
                  <select
                    value={schoolFilter}
                    onChange={(e) => setSchoolFilter(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-sm outline-none ${
                      isDarkMode
                        ? 'bg-slate-800 border-slate-600 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="">All schools</option>
                    {schoolOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className={`block ${TYPE.labelMicro} mb-1.5 ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    Class
                  </label>
                  <select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-sm outline-none ${
                      isDarkMode
                        ? 'bg-slate-800 border-slate-600 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="">All classes</option>
                    {activeClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className={`block ${TYPE.labelMicro} mb-1.5 ${
                      isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    Sort
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'asc', label: 'A–Z' },
                      { id: 'desc', label: 'Z–A' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSortOrder(opt.id)}
                        className={`px-3 py-2 rounded-xl ${TYPE.labelMd} border transition-colors ${
                          sortOrder === opt.id
                            ? `${theme.border} ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`
                            : isDarkMode
                              ? 'border-slate-600 text-slate-300 hover:bg-slate-800'
                              : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filtersActive && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className={`w-full ${TYPE.labelMd} py-2 rounded-xl ${
                      isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        </ButtonRow>

        {students.length === 0 ? (
          <EmptyState
            isDarkMode={isDarkMode}
            message="No students yet. Add one here, or create students in Classes — they show up in this directory."
          />
        ) : visibleStudents.length === 0 ? (
          <EmptyState
            isDarkMode={isDarkMode}
            message="No students match your search or filters."
          />
        ) : (
          <div
            className={`${APP_SCROLL_BOARD} overflow-hidden ${theme.colorSurface} ${theme.colorOutline}`}
          >
            {visibleStudents.map((student) => (
              <button
                key={student.id}
                type="button"
                onClick={() => setSelectedStudentId(student.id)}
                className={`w-full flex items-center p-4 border-b last:border-b-0 text-left transition-colors ${
                  isDarkMode
                    ? 'border-slate-700 hover:bg-slate-800/50'
                    : 'border-slate-200 hover:bg-slate-50/80'
                }`}
              >
                <StudentAvatar student={student} theme={theme} size="sm" className="mr-4" />
                <div className="flex-1 min-w-0">
                  <h4 className={`${TYPE.titleSm} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {studentDisplayName(student)}
                    {studentAlternateName(student) ? (
                      <span
                        className={`ml-2 font-medium ${
                          isDarkMode ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        “{studentAlternateName(student)}”
                      </span>
                    ) : null}
                  </h4>
                  <p className={`${TYPE.bodySm} mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    {[
                      student.grade_level,
                      student.school,
                      student.gender,
                      student.studentId || null,
                      (() => {
                        const names = (student.siblingIds || [])
                          .map((id) => {
                            const s = students.find((x) => x.id === id);
                            return s ? studentDisplayName(s) : null;
                          })
                          .filter(Boolean);
                        if (!names.length) return null;
                        return names.length === 1
                          ? `Sibling: ${names[0]}`
                          : `Siblings: ${names.join(', ')}`;
                      })(),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

      <button
        type="button"
        onClick={() => setIsAddOpen(true)}
        className={`${appFabClass(isLeft)} ${theme.colorOnPrimary} ${theme.colorPrimary}`}
        title="Add student"
        aria-label="Add student"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      <AddStudentModal
        isOpen={isAddOpen}
        form={form}
        onChange={setForm}
        onClose={resetModal}
        onSubmit={handleAdd}
        theme={theme}
        isDarkMode={isDarkMode}
      />
    </AppPageShell>
  );
}
