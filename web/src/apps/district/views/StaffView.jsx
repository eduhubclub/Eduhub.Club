import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpDown, DoorOpen, FileSpreadsheet, LayoutGrid, List, Mail, Phone, Plus, Search, Upload, UserPlus, X } from 'lucide-react';
import { AppPageShell } from '../../../shared/AppPageShell';
import { AppBoard } from '../../../shared/AppBoard';
import { AppFab } from '../../../shared/AppFab';
import { ContentCardGrid } from '../../../shared/ContentCardGrid';
import { EmptyState } from '../../../shared/EmptyState';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { PageBackLink } from '../../../shared/PageBackLink';
import { PageHeader } from '../../../shared/PageHeader';
import { SegmentControl } from '../../../shared/SegmentControl';
import { StudentAvatar } from '../../../shared/StudentAvatar';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { createUploadAvatar } from '../../../data/classes/avatar';
import { sortStudentsByLastName } from '../../../data/classes/seed';
import { studentDisplayName } from '../../../data/students/displayName';
import {
  departmentsForSchool,
  formatMinutes,
  periodMinutes,
  staffDepartmentLabel,
  staffForSchool,
} from '../../../data/district/districtModel';
import {
  parseSpreadsheetStaff,
  STAFF_CSV_TEMPLATE,
} from '../../../data/district/parseSpreadsheetStaff';
import { districtFieldClass, districtQuietButton } from '../fields';

const EMPTY_STAFF = {
  name: '',
  role: '',
  department: 'administration',
  room: '',
  extension: '',
  email: '',
};

const SUPPORT_ROLE_ORDER = [
  'building manager',
  'admin assistant',
  'office assistant',
  'registrar',
  'librarian',
  'coach',
  'reading specialist',
  'playground staff',
  'counselor',
  'psychologist',
  'ot/pt (sails)',
  'security officer',
  'paraeducator',
  'cafeteria staff',
  'custodian',
];

/** Principal → AP → building support → classroom roles (A–Z, then name). */
function roleLeadershipRank(role) {
  const value = String(role || '').trim().toLowerCase();
  if (!value) return 40;
  if (
    /\b(assistant|vice|deputy)\b/.test(value) &&
    /\b(principal|head|headmaster|headmistress)\b/.test(value)
  ) {
    return 1;
  }
  if (
    value === 'principal' ||
    value === 'headmaster' ||
    value === 'headmistress' ||
    value === 'head of school' ||
    /\bprincipal\b/.test(value)
  ) {
    return 0;
  }
  const supportIndex = SUPPORT_ROLE_ORDER.indexOf(value);
  if (supportIndex >= 0) return 10 + supportIndex;
  return 30;
}

function sortStaff(list, organizeMode) {
  const next = [...list];
  next.sort((a, b) => {
    if (organizeMode === 'role') {
      const rankCmp = roleLeadershipRank(a.role) - roleLeadershipRank(b.role);
      if (rankCmp !== 0) return rankCmp;
      const roleCmp = String(a.role || '').localeCompare(String(b.role || ''), undefined, {
        sensitivity: 'base',
      });
      if (roleCmp !== 0) return roleCmp;
      return String(a.name || '').localeCompare(String(b.name || ''), undefined, {
        sensitivity: 'base',
      });
    }
    const nameCmp = String(a.name || '').localeCompare(String(b.name || ''), undefined, {
      sensitivity: 'base',
    });
    return organizeMode === 'za' ? -nameCmp : nameCmp;
  });
  return next;
}

function staffAsAvatarSubject(member) {
  return {
    name: member.name,
    avatar: member.avatarUrl
      ? createUploadAvatar(member.avatarUrl, member.avatarUrl)
      : undefined,
  };
}

function StaffMetaLine({ member, theme }) {
  const department = staffDepartmentLabel(member.department);
  const bits = [department, member.room, member.extension].filter(Boolean);
  return (
    <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
      {bits.length ? bits.join(' · ') : member.role}
      {member.email ? (
        <>
          {bits.length || member.role ? ' · ' : null}
          {member.email}
        </>
      ) : null}
    </p>
  );
}

function StaffProfile({
  member,
  school,
  schedule,
  students,
  className,
  onBack,
  isDarkMode,
  theme,
}) {
  return (
    <AppPageShell variant="scroll">
      <PageBackLink label="Back to staff" onClick={onBack} isDarkMode={isDarkMode} />
      <PageHeader
        title={member.name}
        description={[member.role, staffDepartmentLabel(member.department), school?.name]
          .filter(Boolean)
          .join(' · ')}
        isDarkMode={isDarkMode}
      />

      <AppBoard mode="static" theme={theme} className="mb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <StudentAvatar student={staffAsAvatarSubject(member)} theme={theme} size="lg" />
          <div className="min-w-0 flex-1">
            <p className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>{member.name}</p>
            <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>{member.role}</p>
            <ul className={`mt-3 flex flex-col gap-1.5 ${TYPE.bodySm} ${theme.colorOnSurface}`}>
              {member.room ? (
                <li className="inline-flex items-center gap-2">
                  <DoorOpen size={14} className="shrink-0" aria-hidden />
                  {member.room}
                </li>
              ) : null}
              {member.extension ? (
                <li className="inline-flex items-center gap-2">
                  <Phone size={14} className="shrink-0" aria-hidden />
                  Ext. {member.extension.replace(/^x/i, '')}
                </li>
              ) : null}
              {member.email ? (
                <li className="inline-flex items-center gap-2">
                  <Mail size={14} className="shrink-0" aria-hidden />
                  <a
                    href={`mailto:${member.email}`}
                    className={`underline-offset-2 hover:underline ${theme.colorPrimary}`}
                  >
                    {member.email}
                  </a>
                </li>
              ) : null}
            </ul>
            {className ? (
              <p className={`mt-3 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                Class: {className}
              </p>
            ) : null}
          </div>
        </div>
      </AppBoard>

      <AppBoard mode="static" theme={theme} className="mb-4">
        <h2 className={`mb-3 ${TYPE.titleMd} ${theme.colorOnSurface}`}>Schedule</h2>
        {!schedule?.periods?.length ? (
          <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
            No building schedule for this school yet.
          </p>
        ) : (
          <ul className="flex flex-col">
            {schedule.periods.map((period) => (
              <li
                key={period.id}
                className={`flex flex-wrap items-baseline justify-between gap-2 border-b py-2.5 last:border-b-0 ${theme.colorOutline}`}
              >
                <span className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
                  {period.label || 'Untitled'}
                </span>
                <span className={`${TYPE.bodySm} tabular-nums ${theme.colorOnSurfaceVariant}`}>
                  {[period.startTime, period.endTime].filter(Boolean).join('–') || 'No times'}
                  {` · ${formatMinutes(periodMinutes(period))}`}
                  {period.kind === 'nonInstruction' ? ' · Not teaching' : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </AppBoard>

      <AppBoard mode="static" theme={theme}>
        <h2 className={`mb-3 ${TYPE.titleMd} ${theme.colorOnSurface}`}>
          Students
          <span className={`ml-2 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            {students.length}
          </span>
        </h2>
        {students.length === 0 ? (
          <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
            {member.classId
              ? 'No students on this teacher’s class roster yet.'
              : 'This staff member is not linked to a class roster.'}
          </p>
        ) : (
          <ul className="flex flex-col">
            {students.map((student) => (
              <li
                key={student.id || student.name}
                className={`flex items-center gap-3 border-b py-2.5 last:border-b-0 ${theme.colorOutline}`}
              >
                <StudentAvatar student={student} theme={theme} size="sm" />
                <div className="min-w-0">
                  <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
                    {studentDisplayName(student)}
                  </p>
                  <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                    {student.grade_level || 'Student'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AppBoard>
    </AppPageShell>
  );
}

/**
 * School staff directory — list opens a teacher profile with schedule + students.
 */
export function StaffView({
  org,
  school,
  classes = [],
  schedule = null,
  access = 'edit',
  addStaff,
  addStaffMany,
  isDarkMode,
  theme,
  isLeft = true,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [organizeMode, setOrganizeMode] = useState('role');
  const [organizeOpen, setOrganizeOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [addKind, setAddKind] = useState('one');
  const [staffDraft, setStaffDraft] = useState(EMPTY_STAFF);
  const [csvFileName, setCsvFileName] = useState('');
  const [csvRows, setCsvRows] = useState([]);
  const [csvError, setCsvError] = useState('');
  const searchInputRef = useRef(null);
  const organizeRef = useRef(null);
  const csvInputRef = useRef(null);
  const canEdit = access === 'edit';
  const canAddStaff = canEdit && Boolean(addStaff || addStaffMany);

  const staff = useMemo(
    () => (school ? staffForSchool(org, school.id) : []),
    [org, school],
  );
  const catalog = useMemo(
    () => (school ? departmentsForSchool(org, school.id) : []),
    [org, school],
  );

  const visibleStaff = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = !q
      ? staff
      : staff.filter((member) => {
          const hay = [
            member.name,
            member.role,
            staffDepartmentLabel(member.department),
            member.department,
            member.room,
            member.extension,
            member.email,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return hay.includes(q);
        });
    return sortStaff(filtered, organizeMode);
  }, [staff, searchQuery, organizeMode]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!organizeOpen) return undefined;
    const onPointerDown = (event) => {
      if (organizeRef.current?.contains(event.target)) return;
      setOrganizeOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOrganizeOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [organizeOpen]);

  useEffect(() => {
    setSelectedId(null);
    setSearchQuery('');
    setSearchOpen(false);
    setOrganizeMode('role');
    setOrganizeOpen(false);
    setEditorOpen(false);
  }, [school?.id]);

  const clearCsv = () => {
    setCsvFileName('');
    setCsvRows([]);
    setCsvError('');
    if (csvInputRef.current) csvInputRef.current.value = '';
  };

  const openAddStaff = () => {
    setAddKind('one');
    setStaffDraft({
      ...EMPTY_STAFF,
      department: catalog[0]?.id || 'administration',
    });
    clearCsv();
    setEditorOpen(true);
  };

  const downloadStaffTemplate = () => {
    const blob = new Blob([STAFF_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'staff-import-template.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const onPickCsv = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseSpreadsheetStaff(String(reader.result || ''), catalog);
        setCsvFileName(file.name);
        setCsvRows(rows);
        setCsvError(rows.length ? '' : 'No staff rows found in that file.');
      } catch {
        setCsvFileName(file.name);
        setCsvRows([]);
        setCsvError('Could not read that CSV.');
      }
    };
    reader.onerror = () => {
      setCsvError('Could not read that CSV.');
      setCsvRows([]);
    };
    reader.readAsText(file);
  };

  const saveStaff = () => {
    if (!school || !canEdit) return;
    if (addKind === 'csv') {
      if (!csvRows.length) return;
      addStaffMany?.(school.id, csvRows);
      setEditorOpen(false);
      clearCsv();
      return;
    }
    const name = staffDraft.name.trim();
    if (!name) return;
    const created = addStaff?.(school.id, {
      name,
      role: staffDraft.role.trim() || 'Staff',
      department: staffDraft.department,
      room: staffDraft.room.trim(),
      extension: staffDraft.extension.trim(),
      email: staffDraft.email.trim(),
    });
    setEditorOpen(false);
    if (created?.id) setSelectedId(created.id);
  };

  if (!school) {
    return (
      <AppPageShell variant="page">
        <PageHeader title="Staff" description="People who work in this building." isDarkMode={isDarkMode} />
        <EmptyState isDarkMode={isDarkMode} message="Open a school to see its staff." />
      </AppPageShell>
    );
  }

  const selected = staff.find((row) => row.id === selectedId) || null;

  if (selected) {
    const linkedClass = selected.classId
      ? classes.find((cls) => String(cls.id) === String(selected.classId))
      : null;
    const students = sortStudentsByLastName(linkedClass?.studentList || [], 'asc');
    return (
      <StaffProfile
        member={selected}
        school={school}
        schedule={schedule}
        students={students}
        className={linkedClass?.name || ''}
        onBack={() => setSelectedId(null)}
        isDarkMode={isDarkMode}
        theme={theme}
      />
    );
  }

  const toolBtn = toolBtnClass(isDarkMode);

  return (
    <AppPageShell variant="scroll">
      <PageHeader
        title="Staff"
        description={
          access === 'surface'
            ? `People who work at ${school.name}.`
            : `Directory for ${school.name} — open someone for schedule and students.`
        }
        isDarkMode={isDarkMode}
        actions={
          staff.length > 0 ? (
            <div className="flex flex-nowrap items-center justify-end gap-2">
              <div className="relative shrink-0">
                <button
                  type="button"
                  className={`${toolBtn}${searchOpen ? ' invisible' : ''}`}
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search staff"
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
                      placeholder="Search staff..."
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

              <div className="relative" ref={organizeRef}>
                <button
                  type="button"
                  className={`${toolBtn} ${organizeMode !== 'role' ? theme.text : ''}`}
                  onClick={() => setOrganizeOpen((value) => !value)}
                  aria-expanded={organizeOpen}
                  aria-label="Organize staff"
                >
                  <ArrowUpDown size={16} />
                  Organize
                  {organizeMode !== 'role' ? (
                    <span className={`h-1.5 w-1.5 rounded-full ${theme.colorPrimary}`} />
                  ) : null}
                </button>
                {organizeOpen ? (
                  <div
                    role="menu"
                    className={`absolute right-0 top-full z-30 mt-2 w-44 overflow-hidden rounded-2xl border-[1.5px] p-1 shadow-xl ${
                      isDarkMode ? 'border-slate-600 bg-slate-900' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {[
                      { id: 'role', label: 'Role' },
                      { id: 'az', label: 'A–Z' },
                      { id: 'za', label: 'Z–A' },
                    ].map((option) => {
                      const active = organizeMode === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          role="menuitemradio"
                          aria-checked={active}
                          className={`edu-control flex w-full items-center rounded-xl px-3 py-2 text-left ${TYPE.bodySm} ${
                            active
                              ? `${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`
                              : theme.colorOnSurface
                          }`}
                          onClick={() => {
                            setOrganizeMode(option.id);
                            setOrganizeOpen(false);
                          }}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <SegmentControl
                isDarkMode={isDarkMode}
                theme={theme}
                value={viewMode}
                onChange={setViewMode}
                options={[
                  { id: 'list', label: 'List', icon: List },
                  { id: 'tiles', label: 'Tiles', icon: LayoutGrid },
                ]}
              />
            </div>
          ) : null
        }
      />

      {staff.length === 0 ? (
        <EmptyState
          isDarkMode={isDarkMode}
          message={
            canEdit
              ? 'No staff in this building yet. Use + to add someone.'
              : 'No staff listed for this school yet.'
          }
        />
      ) : visibleStaff.length === 0 ? (
        <EmptyState isDarkMode={isDarkMode} message="No staff match this search." />
      ) : viewMode === 'tiles' ? (
        <ContentCardGrid>
          {visibleStaff.map((member) => (
            <button
              key={member.id}
              type="button"
              className="edu-control text-left"
              onClick={() => setSelectedId(member.id)}
            >
              <AppBoard mode="grid" theme={theme} className="h-full">
                <div className="flex items-center gap-3">
                  <StudentAvatar student={staffAsAvatarSubject(member)} theme={theme} size="md" />
                  <div className="min-w-0">
                    <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>{member.name}</p>
                    <p className={`mt-0.5 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                      {member.role}
                    </p>
                    <StaffMetaLine member={member} theme={theme} />
                  </div>
                </div>
              </AppBoard>
            </button>
          ))}
        </ContentCardGrid>
      ) : (
        <ul className="flex flex-col gap-2">
          {visibleStaff.map((member) => (
            <li key={member.id}>
              <button
                type="button"
                className={`edu-control flex w-full items-center gap-3 rounded-xl border-[1.5px] px-3 py-3 text-left ${theme.colorSurface} ${theme.colorOutline} ${theme.hoverBg}`}
                onClick={() => setSelectedId(member.id)}
              >
                <StudentAvatar student={staffAsAvatarSubject(member)} theme={theme} size="md" />
                <span className="min-w-0 flex-1">
                  <span className={`block ${TYPE.titleSm} ${theme.colorOnSurface}`}>
                    {member.name}
                  </span>
                  <span className={`block ${TYPE.labelSm} ${theme.colorOnSurfaceVariant}`}>
                    {member.role}
                  </span>
                  <StaffMetaLine member={member} theme={theme} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {canAddStaff ? (
        <>
          <AppFab isLeft={isLeft} theme={theme} aria-label="Add staff" onClick={openAddStaff}>
            <Plus size={28} strokeWidth={2.5} />
          </AppFab>
          <Modal
            isOpen={editorOpen}
            title="Add staff"
            theme={theme}
            isDarkMode={isDarkMode}
            onClose={() => {
              setEditorOpen(false);
              clearCsv();
            }}
            footer={
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditorOpen(false);
                    clearCsv();
                  }}
                  className={`edu-control rounded-xl px-4 py-2.5 ${TYPE.labelLg} ${theme.colorOnSurfaceVariant} ${theme.hoverBg}`}
                >
                  Cancel
                </button>
                <ModalPrimaryButton
                  theme={theme}
                  onClick={saveStaff}
                  disabled={
                    addKind === 'csv' ? csvRows.length === 0 : !staffDraft.name.trim()
                  }
                >
                  {addKind === 'csv'
                    ? csvRows.length
                      ? `Import ${csvRows.length}`
                      : 'Import CSV'
                    : 'Add staff'}
                </ModalPrimaryButton>
              </div>
            }
          >
            <form
              className="flex flex-col gap-4 p-5 sm:p-6"
              onSubmit={(event) => {
                event.preventDefault();
                saveStaff();
              }}
            >
              <SegmentControl
                isDarkMode={isDarkMode}
                theme={theme}
                value={addKind}
                onChange={setAddKind}
                options={[
                  { id: 'one', label: 'One person', icon: UserPlus },
                  { id: 'csv', label: 'CSV upload', icon: FileSpreadsheet },
                ]}
              />

              {addKind === 'csv' ? (
                <div className="flex flex-col gap-3">
                  <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                    Import a whole building roster at once. Use columns for name (or first/last),
                    role, department, room, extension, and email.
                  </p>
                  <input
                    ref={csvInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="sr-only"
                    onChange={onPickCsv}
                  />
                  <div
                    className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-6 ${
                      isDarkMode
                        ? 'border-slate-600 bg-slate-800/50'
                        : 'border-slate-300 bg-slate-50'
                    }`}
                  >
                    <Upload
                      size={22}
                      className={csvFileName ? theme.text : 'opacity-50'}
                      aria-hidden
                    />
                    {csvFileName ? (
                      <>
                        <div
                          className={`inline-flex max-w-full items-center gap-2 rounded-lg border-[1.5px] px-3 py-2 ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOutline}`}
                        >
                          <span className="truncate">{csvFileName}</span>
                          <button
                            type="button"
                            className="edu-control text-slate-400 hover:text-rose-500"
                            aria-label="Remove file"
                            onClick={clearCsv}
                          >
                            <X size={14} />
                          </button>
                        </div>
                        {csvRows.length > 0 ? (
                          <p className={`${TYPE.bodySm} ${theme.colorOnSurface}`}>
                            {csvRows.length} {csvRows.length === 1 ? 'person' : 'people'} ready to
                            import
                          </p>
                        ) : null}
                      </>
                    ) : (
                      <button
                        type="button"
                        className={districtQuietButton(theme)}
                        onClick={() => csvInputRef.current?.click()}
                      >
                        <Upload size={14} />
                        Browse CSV
                      </button>
                    )}
                  </div>
                  {csvError ? (
                    <p className={`${TYPE.bodySm} text-rose-600`}>{csvError}</p>
                  ) : null}
                  <button
                    type="button"
                    className={`self-start ${TYPE.labelMd} underline-offset-2 hover:underline ${theme.colorPrimary}`}
                    onClick={downloadStaffTemplate}
                  >
                    Download CSV template
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label
                      className={`block ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                      htmlFor="staff-tab-name"
                    >
                      Name
                    </label>
                    <input
                      id="staff-tab-name"
                      className={`mt-2 ${districtFieldClass(theme)}`}
                      value={staffDraft.name}
                      onChange={(event) =>
                        setStaffDraft((current) => ({ ...current, name: event.target.value }))
                      }
                      placeholder="Full name"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label
                      className={`block ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                      htmlFor="staff-tab-role"
                    >
                      Role
                    </label>
                    <input
                      id="staff-tab-role"
                      className={`mt-2 ${districtFieldClass(theme)}`}
                      value={staffDraft.role}
                      onChange={(event) =>
                        setStaffDraft((current) => ({ ...current, role: event.target.value }))
                      }
                      placeholder="e.g. 3rd Grade Teacher"
                    />
                  </div>
                  <div>
                    <label
                      className={`block ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                      htmlFor="staff-tab-department"
                    >
                      Department
                    </label>
                    <select
                      id="staff-tab-department"
                      className={`mt-2 ${districtFieldClass(theme)}`}
                      value={staffDraft.department}
                      onChange={(event) =>
                        setStaffDraft((current) => ({
                          ...current,
                          department: event.target.value,
                        }))
                      }
                    >
                      {catalog.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        className={`block ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                        htmlFor="staff-tab-room"
                      >
                        Room
                      </label>
                      <input
                        id="staff-tab-room"
                        className={`mt-2 ${districtFieldClass(theme)}`}
                        value={staffDraft.room}
                        onChange={(event) =>
                          setStaffDraft((current) => ({ ...current, room: event.target.value }))
                        }
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label
                        className={`block ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                        htmlFor="staff-tab-ext"
                      >
                        Extension
                      </label>
                      <input
                        id="staff-tab-ext"
                        className={`mt-2 ${districtFieldClass(theme)}`}
                        value={staffDraft.extension}
                        onChange={(event) =>
                          setStaffDraft((current) => ({
                            ...current,
                            extension: event.target.value,
                          }))
                        }
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      className={`block ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                      htmlFor="staff-tab-email"
                    >
                      Email
                    </label>
                    <input
                      id="staff-tab-email"
                      type="email"
                      className={`mt-2 ${districtFieldClass(theme)}`}
                      value={staffDraft.email}
                      onChange={(event) =>
                        setStaffDraft((current) => ({ ...current, email: event.target.value }))
                      }
                      placeholder="Optional"
                    />
                  </div>
                </>
              )}
            </form>
          </Modal>
        </>
      ) : null}
    </AppPageShell>
  );
}
