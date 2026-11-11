import { useMemo, useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { AppPageShell } from '../../../shared/AppPageShell';
import { AppBoard } from '../../../shared/AppBoard';
import { AppFab } from '../../../shared/AppFab';
import { ContentCardGrid } from '../../../shared/ContentCardGrid';
import { EmptyState } from '../../../shared/EmptyState';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { PageBackLink } from '../../../shared/PageBackLink';
import { PageHeader } from '../../../shared/PageHeader';
import { StudentAvatar } from '../../../shared/StudentAvatar';
import { TYPE } from '../../../shared/typography';
import { createUploadAvatar } from '../../../data/classes/avatar';
import {
  departmentsForSchool,
  staffDepartmentLabel,
  staffForSchool,
} from '../../../data/district/districtModel';
import { districtFieldClass } from '../fields';

function staffAsAvatarSubject(member) {
  return {
    name: member.name,
    avatar: member.avatarUrl
      ? createUploadAvatar(member.avatarUrl, member.avatarUrl)
      : undefined,
  };
}

/**
 * School departments — filter into staff assigned to each department.
 * Editors can add departments from the FAB + modal.
 */
export function DepartmentsView({
  org,
  school,
  access = 'edit',
  addDepartment,
  isDarkMode,
  theme,
  isLeft = true,
}) {
  const [departmentId, setDepartmentId] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deptLabel, setDeptLabel] = useState('');

  const canEdit = access === 'edit';
  const canAddDepartment = canEdit && Boolean(addDepartment);

  const staff = useMemo(
    () => (school ? staffForSchool(org, school.id) : []),
    [org, school],
  );

  const catalog = useMemo(
    () => (school ? departmentsForSchool(org, school.id) : []),
    [org, school],
  );

  const departments = useMemo(() => {
    const counts = new Map(catalog.map((row) => [row.id, 0]));
    for (const member of staff) {
      const id = member.department || 'operations';
      counts.set(id, (counts.get(id) || 0) + 1);
    }
    const rows = catalog.map((row) => ({
      ...row,
      count: counts.get(row.id) || 0,
    }));
    for (const [id, count] of counts) {
      if (rows.some((row) => row.id === id)) continue;
      rows.push({
        id,
        label: staffDepartmentLabel(id, catalog) || id,
        count,
      });
    }
    return rows.filter((row) => row.count > 0 || canEdit);
  }, [staff, catalog, canEdit]);

  const selected = departments.find((row) => row.id === departmentId) || null;
  const departmentStaff = useMemo(() => {
    if (!selected) return [];
    return staff
      .filter((member) => member.department === selected.id)
      .slice()
      .sort((a, b) =>
        String(a.name || '').localeCompare(String(b.name || ''), undefined, {
          sensitivity: 'base',
        }),
      );
  }, [staff, selected]);

  const openAddDepartment = () => {
    setDeptLabel('');
    setEditorOpen(true);
  };

  const closeEditor = () => setEditorOpen(false);

  const saveDepartment = () => {
    const label = deptLabel.trim();
    if (!label || !school || !canEdit) return;
    const created = addDepartment?.(school.id, { label });
    if (created) setDepartmentId(created.id);
    closeEditor();
  };

  if (!school) {
    return (
      <AppPageShell variant="page">
        <PageHeader
          title="Departments"
          description="Staff groups in this building."
          isDarkMode={isDarkMode}
        />
        <EmptyState isDarkMode={isDarkMode} message="Open a school to see its departments." />
      </AppPageShell>
    );
  }

  const addModal =
    canAddDepartment && !selected ? (
      <>
        <AppFab
          isLeft={isLeft}
          theme={theme}
          aria-label="Add department"
          onClick={openAddDepartment}
        >
          <Plus size={28} strokeWidth={2.5} />
        </AppFab>

        <Modal
          isOpen={editorOpen}
          title="Add department"
          theme={theme}
          isDarkMode={isDarkMode}
          onClose={closeEditor}
          footer={
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEditor}
                className={`edu-control rounded-xl px-4 py-2.5 ${TYPE.labelLg} ${theme.colorOnSurfaceVariant} ${theme.hoverBg}`}
              >
                Cancel
              </button>
              <ModalPrimaryButton
                theme={theme}
                onClick={saveDepartment}
                disabled={!deptLabel.trim()}
              >
                Add department
              </ModalPrimaryButton>
            </div>
          }
        >
          <form
            className="flex flex-col gap-4 p-5 sm:p-6"
            onSubmit={(event) => {
              event.preventDefault();
              saveDepartment();
            }}
          >
            <div>
              <label
                className={`block ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                htmlFor="dept-label"
              >
                Department name
              </label>
              <input
                id="dept-label"
                className={`mt-2 ${districtFieldClass(theme)}`}
                value={deptLabel}
                onChange={(event) => setDeptLabel(event.target.value)}
                placeholder="e.g. Music"
                autoFocus
              />
            </div>
          </form>
        </Modal>
      </>
    ) : null;

  if (selected) {
    return (
      <AppPageShell variant="scroll">
        <PageBackLink
          label="All departments"
          onClick={() => setDepartmentId(null)}
          isDarkMode={isDarkMode}
        />
        <PageHeader
          title={selected.label}
          description={`${departmentStaff.length} ${
            departmentStaff.length === 1 ? 'person' : 'people'
          } in ${selected.label} at ${school.name}.`}
          isDarkMode={isDarkMode}
        />

        {departmentStaff.length === 0 ? (
          <EmptyState
            isDarkMode={isDarkMode}
            message="No staff in this department yet. Add people from the Staff tab."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {departmentStaff.map((member) => (
              <li
                key={member.id}
                className={`flex items-center gap-3 rounded-xl border-[1.5px] px-3 py-3 ${theme.colorSurface} ${theme.colorOutline}`}
              >
                <StudentAvatar student={staffAsAvatarSubject(member)} theme={theme} size="md" />
                <div className="min-w-0 flex-1">
                  <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>{member.name}</p>
                  <p className={`mt-0.5 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                    {member.role}
                  </p>
                  <p className={`mt-1 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                    {[member.room, member.extension, member.email].filter(Boolean).join(' · ') ||
                      staffDepartmentLabel(member.department, catalog)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AppPageShell>
    );
  }

  return (
    <AppPageShell variant="scroll">
      <PageHeader
        title="Departments"
        description={
          access === 'surface'
            ? `Departments at ${school.name}.`
            : `Filter staff by department at ${school.name}. Use + to add a department.`
        }
        isDarkMode={isDarkMode}
      />

      {departments.length === 0 ? (
        <EmptyState
          isDarkMode={isDarkMode}
          message={
            canEdit
              ? 'No departments yet. Use + to add one.'
              : 'No staff listed for this school yet.'
          }
        />
      ) : (
        <ContentCardGrid>
          {departments.map((dept) => (
            <button
              key={dept.id}
              type="button"
              className="edu-control text-left"
              onClick={() => setDepartmentId(dept.id)}
            >
              <AppBoard mode="grid" theme={theme} className="h-full">
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${theme.colorPrimary}`}
                  >
                    <Users size={20} className={theme.colorOnPrimary} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>{dept.label}</p>
                    <p className={`mt-1 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                      {dept.count} {dept.count === 1 ? 'person' : 'people'}
                    </p>
                  </div>
                </div>
              </AppBoard>
            </button>
          ))}
        </ContentCardGrid>
      )}
      {addModal}
    </AppPageShell>
  );
}
