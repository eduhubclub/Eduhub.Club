import { useEffect, useMemo, useRef, useState } from 'react';
import { ListFilter, Search, Trash2, X } from 'lucide-react';
import { isStudentManagedByDistrict } from '../../data/students/seed';
import { PageHeader } from '../../shared/PageHeader';
import { AppPageShell } from '../../shared/AppPageShell';
import { PageBackLink } from '../../shared/PageBackLink';
import { ButtonRow } from '../../shared/ButtonRow';
import { APP_EMPTY_SLOT } from '../../shared/layout';
import { toolBtnClass } from '../../shared/toolBtn';
import { StudentProfileCard } from '../classes/StudentProfileCard';
import { TYPE } from '../../shared/typography';

const SECTION_OPTIONS = [
  { id: 'info', label: 'Student info' },
  { id: 'school', label: 'School' },
  { id: 'login', label: 'Logins & sign-in' },
  { id: 'family', label: 'Family information' },
  { id: 'insights', label: 'Insights & highlights' },
];

const DEFAULT_SECTIONS = Object.fromEntries(SECTION_OPTIONS.map((s) => [s.id, true]));

function sectionsMatchingQuery(student, allStudents, query) {
  const q = query.trim().toLowerCase();
  if (!q) return { ...DEFAULT_SECTIONS };

  const siblingNames = (student.siblingIds || [])
    .map((id) => allStudents.find((x) => x.id === id)?.name)
    .filter(Boolean)
    .join(' ');
  const guardianText = (student.guardians || [])
    .map((g) => [g.name, g.phone, g.email, g.relationship].filter(Boolean).join(' '))
    .join(' ');

  const includes = (parts) =>
    parts
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(q);

  return {
    info: includes([student.name, student.nickname, student.gender, student.birthdate, 'student info']),
    school: includes([
      student.grade_level,
      student.school,
      student.district,
      'school',
      'district',
      'grade',
    ]),
    login: includes([student.studentId, student.email, student.password, 'login', 'password', 'email']),
    family: includes([
      student.guardianAddress || student.address,
      siblingNames,
      guardianText,
      'family',
      'address',
      'sibling',
      'parent',
      'guardian',
    ]),
    insights: includes(['insight', 'highlight']),
  };
}

/**
 * Individual student profile in Edu.Students.
 * Today: personal information (editable).
 * Later: data insights and highlights from other apps.
 */
export function StudentProfilePage({
  student,
  theme,
  isDarkMode,
  onBack,
  onSave,
  onDelete,
  allStudents = [],
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [sectionFilter, setSectionFilter] = useState(DEFAULT_SECTIONS);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const searchInputRef = useRef(null);
  const filterRef = useRef(null);

  const districtManaged = isStudentManagedByDistrict(student);

  const toolBtn = toolBtnClass(isDarkMode);

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

  const filtersActive = SECTION_OPTIONS.some((s) => !sectionFilter[s.id]);

  const sectionVisibility = useMemo(() => {
    const fromSearch = sectionsMatchingQuery(student, allStudents, searchQuery);
    return Object.fromEntries(
      SECTION_OPTIONS.map((s) => [s.id, sectionFilter[s.id] !== false && fromSearch[s.id] !== false])
    );
  }, [student, allStudents, searchQuery, sectionFilter]);

  const handleDelete = () => {
    if (districtManaged || !onDelete) return;
    onDelete(student.id);
  };

  return (
    <AppPageShell variant="page">
      <PageBackLink
        label="Back to Students"
        isDarkMode={isDarkMode}
        onClick={onBack}
      />

      <PageHeader
        title={student.name}
        description="Personal information for this student."
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
              placeholder="Search this profile..."
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
            aria-label="Search profile"
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
            aria-label="Filter profile sections"
          >
            <ListFilter size={16} />
            Filter
            {filtersActive ? <span className={`w-1.5 h-1.5 rounded-full ${theme.colorPrimary}`} /> : null}
          </button>

          {filterOpen && (
            <div
              className={`absolute right-0 top-full mt-2 w-64 rounded-2xl border shadow-xl z-30 p-3 space-y-2 ${
                isDarkMode ? 'bg-slate-900 border-slate-600' : 'bg-white border-slate-300'
              }`}
            >
              <p
                className={`${TYPE.labelMicro} mb-1 ${
                  isDarkMode ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                Show sections
              </p>
              {SECTION_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-2.5 px-2 py-1.5 rounded-xl cursor-pointer ${TYPE.bodyMd} ${
                    isDarkMode ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={sectionFilter[opt.id] !== false}
                    onChange={() =>
                      setSectionFilter((prev) => ({
                        ...prev,
                        [opt.id]: !prev[opt.id],
                      }))
                    }
                    className="rounded border-slate-300"
                  />
                  {opt.label}
                </label>
              ))}
              {filtersActive && (
                <button
                  type="button"
                  onClick={() => setSectionFilter(DEFAULT_SECTIONS)}
                  className={`w-full ${TYPE.labelMd} py-2 rounded-xl ${
                    isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Show all
                </button>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          className={`${toolBtn} ${
            districtManaged
              ? 'opacity-40 cursor-not-allowed'
              : isDarkMode
                ? 'hover:border-rose-500/50 hover:text-rose-400'
                : 'hover:border-rose-300 hover:text-rose-600'
          }`}
          onClick={() => {
            if (districtManaged) return;
            setConfirmDelete(true);
          }}
          disabled={districtManaged}
          title={
            districtManaged
              ? 'This student is managed by the district and cannot be deleted.'
              : 'Delete student profile'
          }
          aria-label={
            districtManaged ? 'Delete unavailable — district managed' : 'Delete student profile'
          }
        >
          <Trash2 size={16} />
          Delete
        </button>
      </ButtonRow>

      {confirmDelete && !districtManaged ? (
        <div
          className={`mb-4 rounded-2xl border-[1.5px] p-4 flex flex-wrap items-center justify-between gap-3 ${
            isDarkMode ? 'bg-rose-950/30 border-rose-900/50' : 'bg-rose-50 border-rose-200'
          }`}
        >
          <p className={`${TYPE.bodyMd} ${isDarkMode ? 'text-rose-200' : 'text-rose-800'}`}>
            Delete {student.name} from the directory? This cannot be undone.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className={`px-3 py-1.5 rounded-lg ${TYPE.labelMd} ${
                isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-white'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className={`px-3 py-1.5 rounded-lg ${TYPE.labelMd} text-white bg-rose-600 hover:bg-rose-700`}
            >
              Delete profile
            </button>
          </div>
        </div>
      ) : null}

      <div className="space-y-6">
        <section aria-labelledby="student-personal-heading">
          <h2 id="student-personal-heading" className="sr-only">
            Personal information
          </h2>
          <StudentProfileCard
            student={student}
            theme={theme}
            isDarkMode={isDarkMode}
            allStudents={allStudents}
            sectionVisibility={sectionVisibility}
            onSave={onSave}
          />
        </section>

        {sectionVisibility.insights !== false ? (
          <section aria-labelledby="student-insights-heading">
            <h2
              id="student-insights-heading"
              className={`${TYPE.titleSm} mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
            >
              Insights & highlights
            </h2>
            <div
              className={`${APP_EMPTY_SLOT} px-6 py-10 text-center ${
                isDarkMode ? 'border-slate-600 bg-slate-900/40' : 'border-slate-300 bg-slate-50/60'
              }`}
            >
              <p className={`${TYPE.bodyMd} ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Data insights and highlights from other Edu.Hub apps will appear here.
              </p>
            </div>
          </section>
        ) : null}
      </div>
    </AppPageShell>
  );
}
