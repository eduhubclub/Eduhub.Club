import { useEffect, useMemo, useRef, useState } from 'react';
import { ListFilter, Plus, Search, X } from 'lucide-react';
import { AppPageShell } from '../../../shared/AppPageShell';
import { AppBoard } from '../../../shared/AppBoard';
import { AppFab } from '../../../shared/AppFab';
import { EmptyState } from '../../../shared/EmptyState';
import { PageHeader } from '../../../shared/PageHeader';
import { StudentAvatar } from '../../../shared/StudentAvatar';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { sortStudentsByLastName } from '../../../data/classes/seed';
import { EMPTY_ADD_STUDENT_FORM } from '../../../data/students/seed';
import { studentDisplayName } from '../../../data/students/displayName';
import { classesAtSchool, studentsAtSchool } from '../../../data/district/districtModel';
import { AddStudentModal } from '../../students/AddStudentModal';

export function RosterView({
  org,
  school,
  classes,
  access = 'edit',
  onAddStudent,
  isDarkMode,
  theme,
  isLeft = true,
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [gradeFilter, setGradeFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_ADD_STUDENT_FORM);
  const [classId, setClassId] = useState('');
  const filterRef = useRef(null);
  const searchInputRef = useRef(null);
  const canEdit = access === 'edit';
  const canAddStudent = canEdit && Boolean(onAddStudent);

  const atSchool = useMemo(
    () => (school ? classesAtSchool(classes, school, org) : []),
    [classes, school, org],
  );
  const enrolled = useMemo(
    () => (school ? studentsAtSchool(classes, school, org) : []),
    [classes, school, org],
  );

  const gradeOptions = useMemo(() => {
    const grades = enrolled.map((row) => row.student.grade_level).filter(Boolean);
    return [...new Set(grades)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [enrolled]);

  const filtersActive = Boolean(gradeFilter || classFilter || sortOrder === 'desc');

  const visibleRows = useMemo(() => {
    let list = [...enrolled];
    const q = searchQuery.trim().toLowerCase();

    if (q) {
      list = list.filter(({ student, classNames }) => {
        const hay = [
          studentDisplayName(student),
          student.name,
          student.nickname,
          student.firstName,
          student.lastName,
          student.studentId,
          student.email,
          student.grade_level,
          ...(classNames || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }

    if (gradeFilter) {
      list = list.filter(({ student }) => student.grade_level === gradeFilter);
    }

    if (classFilter) {
      const cls = atSchool.find((row) => String(row.id) === String(classFilter));
      const className = cls?.name || '';
      list = list.filter(({ student, classNames }) => {
        if (classNames?.includes(className)) return true;
        return (cls?.studentList || []).some((row) => String(row.id) === String(student.id));
      });
    }

    const students = list.map((row) => row.student);
    const sorted = sortStudentsByLastName(students, sortOrder);
    return sorted.map((student) => list.find((row) => row.student === student)).filter(Boolean);
  }, [enrolled, searchQuery, gradeFilter, classFilter, sortOrder, atSchool]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!filterOpen) return undefined;
    const onDoc = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [filterOpen]);

  useEffect(() => {
    setSearchQuery('');
    setSearchOpen(false);
    setGradeFilter('');
    setClassFilter('');
    setSortOrder('asc');
    setFilterOpen(false);
    setEditorOpen(false);
    setForm(EMPTY_ADD_STUDENT_FORM);
    setClassId('');
  }, [school?.id]);

  const clearFilters = () => {
    setGradeFilter('');
    setClassFilter('');
    setSortOrder('asc');
  };

  const classOptions = useMemo(
    () =>
      atSchool.map((cls) => ({
        id: cls.id,
        label: [cls.name, cls.teacherName].filter(Boolean).join(' · '),
        grade: cls.grade || '',
      })),
    [atSchool],
  );

  const resetAddModal = () => {
    setEditorOpen(false);
    setForm(EMPTY_ADD_STUDENT_FORM);
    setClassId('');
  };

  const openAddStudent = () => {
    const first = atSchool[0];
    setForm({
      ...EMPTY_ADD_STUDENT_FORM,
      district: org?.name || '',
      school: school?.name || '',
      grade: first?.grade || '',
    });
    setClassId(first ? String(first.id) : '');
    setEditorOpen(true);
  };

  const handleAddStudent = (student) => {
    if (!classId || !school || !canEdit) return;
    onAddStudent?.(classId, {
      ...student,
      school: school.name,
      district: org?.name || student.district || '',
      managedByDistrict: true,
    });
    resetAddModal();
  };

  if (!school) {
    return (
      <AppPageShell variant="page">
        <PageHeader
          title="Students"
          description="Students enrolled at the selected school."
          isDarkMode={isDarkMode}
        />
        <EmptyState
          isDarkMode={isDarkMode}
          message={access === 'edit' ? 'Add a school first.' : 'Pick a school to see its students.'}
        />
      </AppPageShell>
    );
  }

  const toolBtn = toolBtnClass(isDarkMode);
  const selectClass = `edu-control w-full px-3 py-2 rounded-xl border-[1.5px] text-sm outline-none ${
    isDarkMode
      ? 'bg-slate-800 border-slate-600 text-white'
      : 'bg-slate-50 border-slate-300 text-slate-900'
  }`;

  return (
    <AppPageShell variant="scroll">
      <PageHeader
        title="Students"
        description={
          access === 'surface'
            ? `Students at ${school.name}.`
            : `Everyone enrolled in classes at ${school.name}.`
        }
        isDarkMode={isDarkMode}
        actions={
          enrolled.length > 0 ? (
            <div className="flex flex-nowrap items-center justify-end gap-2">
              <div className="relative shrink-0">
                <button
                  type="button"
                  className={`${toolBtn}${searchOpen ? ' invisible' : ''}`}
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search students"
                  tabIndex={searchOpen ? -1 : undefined}
                  aria-hidden={searchOpen || undefined}
                >
                  <Search size={16} />
                  Search
                </button>
                {searchOpen ? (
                  <div
                    className={`absolute right-0 top-0 z-20 flex h-9 w-[min(70vw,16rem)] items-center overflow-hidden rounded-xl border-[1.5px] shadow-sm ${
                      isDarkMode ? 'border-slate-600 bg-slate-900' : 'border-slate-300 bg-white'
                    }`}
                  >
                    <Search size={16} className={`ml-3 shrink-0 ${theme.text}`} />
                    <input
                      ref={searchInputRef}
                      type="search"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search students..."
                      className={`h-full min-w-0 flex-1 appearance-none bg-transparent px-2 text-sm outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none ${
                        isDarkMode
                          ? 'text-white placeholder-slate-500'
                          : 'text-slate-900 placeholder-slate-400'
                      }`}
                    />
                    <button
                      type="button"
                      className="edu-control p-2 text-slate-400 hover:text-slate-600"
                      aria-label="Close search"
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery('');
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="relative" ref={filterRef}>
                <button
                  type="button"
                  className={`${toolBtn} ${filtersActive ? theme.text : ''}`}
                  onClick={() => setFilterOpen((value) => !value)}
                  aria-expanded={filterOpen}
                  aria-label="Filter students"
                >
                  <ListFilter size={16} />
                  Filter
                  {filtersActive ? (
                    <span className={`h-1.5 w-1.5 rounded-full ${theme.colorPrimary}`} />
                  ) : null}
                </button>

                {filterOpen ? (
                  <div
                    className={`absolute right-0 top-full z-30 mt-2 w-64 space-y-3 rounded-2xl border-[1.5px] p-3 shadow-xl ${
                      isDarkMode ? 'border-slate-600 bg-slate-900' : 'border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <label
                        className={`mb-1.5 block ${TYPE.labelMicro} ${
                          isDarkMode ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        Grade
                      </label>
                      <select
                        value={gradeFilter}
                        onChange={(event) => setGradeFilter(event.target.value)}
                        className={selectClass}
                      >
                        <option value="">All grades</option>
                        {gradeOptions.map((grade) => (
                          <option key={grade} value={grade}>
                            {grade}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        className={`mb-1.5 block ${TYPE.labelMicro} ${
                          isDarkMode ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        Class
                      </label>
                      <select
                        value={classFilter}
                        onChange={(event) => setClassFilter(event.target.value)}
                        className={selectClass}
                      >
                        <option value="">All classes</option>
                        {atSchool.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        className={`mb-1.5 block ${TYPE.labelMicro} ${
                          isDarkMode ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        Sort
                      </label>
                      <select
                        value={sortOrder}
                        onChange={(event) => setSortOrder(event.target.value)}
                        className={selectClass}
                      >
                        <option value="asc">Last name A–Z</option>
                        <option value="desc">Last name Z–A</option>
                      </select>
                    </div>

                    {filtersActive ? (
                      <button
                        type="button"
                        className={`edu-control w-full rounded-xl px-3 py-2 text-left ${TYPE.labelMd} ${theme.colorOnSurfaceVariant} ${theme.hoverBg}`}
                        onClick={clearFilters}
                      >
                        Clear filters
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null
        }
      />

      {enrolled.length === 0 ? (
        <EmptyState
          isDarkMode={isDarkMode}
          message={
            canEdit
              ? atSchool.length === 0
                ? 'Add a class first, then use + to enroll students.'
                : 'No students yet. Use + to add someone to a class.'
              : 'Students show up here when their class is at this school.'
          }
        />
      ) : visibleRows.length === 0 ? (
        <EmptyState
          isDarkMode={isDarkMode}
          message="No students match this search or filter."
        />
      ) : (
        <AppBoard mode="static" theme={theme}>
          <h2 className={`mb-3 ${TYPE.titleMd} ${theme.colorOnSurface}`}>
            Students
            <span className={`ml-2 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              {visibleRows.length}
              {visibleRows.length !== enrolled.length ? ` of ${enrolled.length}` : ''}
            </span>
          </h2>
          <ul className="flex flex-col">
            {visibleRows.map((row) => (
              <li
                key={row.student.id || row.student.name}
                className={`flex items-center gap-3 border-b py-2.5 last:border-b-0 ${theme.colorOutline}`}
              >
                <StudentAvatar student={row.student} theme={theme} size="sm" />
                <div className="min-w-0">
                  <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
                    {studentDisplayName(row.student)}
                  </p>
                  <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                    {[row.student.grade_level, row.classNames.join(', ')].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </AppBoard>
      )}

      {canAddStudent ? (
        <>
          <AppFab
            isLeft={isLeft}
            theme={theme}
            aria-label="Add student"
            onClick={openAddStudent}
            disabled={atSchool.length === 0}
          >
            <Plus size={28} strokeWidth={2.5} />
          </AppFab>
          <AddStudentModal
            isOpen={editorOpen}
            form={form}
            onChange={setForm}
            onClose={resetAddModal}
            onSubmit={handleAddStudent}
            theme={theme}
            isDarkMode={isDarkMode}
            classOptions={classOptions}
            classId={classId}
            onClassIdChange={setClassId}
            lockPlacement
          />
        </>
      ) : null}
    </AppPageShell>
  );
}
