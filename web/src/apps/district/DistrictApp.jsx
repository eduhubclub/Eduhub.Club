import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../data/auth/AuthContext';
import { useClasses } from '../../data/classes/ClassContext';
import { useStudents } from '../../data/students/StudentContext';
import {
  accessPolicyForSchool,
  canEditDistrict,
  canUseCapability,
  scheduleForSchool,
  schoolAccessMode,
  sessionAccessActor,
  teacherSchoolIds,
} from '../../data/district/districtModel';
import { useDistrictOrg } from '../../data/district/useDistrictOrg';
import { PageBackLink } from '../../shared/PageBackLink';
import { SegmentControl } from '../../shared/SegmentControl';
import { districtSchoolNav } from './districtNav';
import { AccessView } from './views/AccessView';
import { AdminAccessView } from './views/AdminAccessView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { AppsView } from './views/AppsView';
import { InsightsView } from './views/InsightsView';
import { SchoolsView } from './views/SchoolsView';
import { ScheduleView } from './views/ScheduleView';
import { ClassesView } from './views/ClassesView';
import { DepartmentsView } from './views/DepartmentsView';
import { RosterView } from './views/RosterView';
import { StaffView } from './views/StaffView';

const SCHOOL_TABS = districtSchoolNav.map((item) => ({
  id: item.name,
  label: item.name,
  icon: item.icon,
}));

/**
 * @param {object} props
 * @param {string} [props.schoolId] — when parent (admin shell) owns the open school
 * @param {(id: string) => void} [props.onOpenSchool]
 * @param {() => void} [props.onCloseSchool]
 */
export function DistrictApp({
  activeTab,
  schoolId: schoolIdProp,
  onOpenSchool,
  onCloseSchool,
  onOpenApp,
  isDarkMode,
  theme,
  isLeft,
  onSetActiveTab,
}) {
  const { session } = useAuth();
  const { classes, allClasses, updateClass, addClass } = useClasses();
  // School workspace always needs the full district roster, even if a tool
  // briefly left visibility scoped (allClasses falls back to classes).
  const districtClasses = allClasses || classes;
  const { upsertStudents } = useStudents();
  const district = useDistrictOrg();
  const canEdit = canEditDistrict(session);
  const mySchoolIds = useMemo(
    () => (canEdit ? [] : teacherSchoolIds(districtClasses, district.org)),
    [canEdit, districtClasses, district.org],
  );
  const parentOwnsSchool = typeof onOpenSchool === 'function';
  const [localSchoolId, setLocalSchoolId] = useState(null);
  const [localSchoolTab, setLocalSchoolTab] = useState('Staff');

  const schoolId = parentOwnsSchool ? schoolIdProp : localSchoolId;
  const schools = district.org.schools;

  const handleAddClass = useCallback(
    (input) => {
      if (!schoolId || !canEdit) return null;
      const id = `cls-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      addClass({
        id,
        name: input.name,
        grade: input.grade || '',
        subject: input.subject || 'Homeroom',
        teacherName: input.teacherName || '',
        room: input.room || '',
        icon: 'BookOpen',
        isArchived: false,
        appCodes: {},
        studentList: [],
        schoolId,
      });
      district.assignClass(id, schoolId);
      return id;
    },
    [addClass, canEdit, district, schoolId],
  );

  const handleAddStudent = useCallback(
    (classId, student) => {
      if (!canEdit || !classId || !student) return null;
      const cls = districtClasses.find((row) => String(row.id) === String(classId));
      if (!cls) return null;
      updateClass(classId, {
        studentList: [...(cls.studentList || []), student],
      });
      upsertStudents([student]);
      return student;
    },
    [canEdit, districtClasses, updateClass, upsertStudents],
  );

  useEffect(() => {
    if (!schoolId) return;
    if (!schools.some((school) => school.id === schoolId)) {
      if (parentOwnsSchool) onCloseSchool?.();
      else setLocalSchoolId(null);
    }
  }, [schoolId, schools, parentOwnsSchool, onCloseSchool]);

  const school = schools.find((row) => row.id === schoolId) || null;
  const access = schoolAccessMode(canEdit, school?.id, mySchoolIds);
  const schoolTab = parentOwnsSchool ? activeTab : localSchoolTab;
  const accessActor = sessionAccessActor(session);
  const schoolPolicy = school ? accessPolicyForSchool(district.org, school.id) : null;
  const allow = (capabilityId) =>
    Boolean(canEdit && school && canUseCapability(schoolPolicy, capabilityId, accessActor));

  const openSchool = (id) => {
    if (parentOwnsSchool) onOpenSchool(id);
    else {
      setLocalSchoolId(id);
      setLocalSchoolTab('Staff');
    }
  };

  const closeSchool = () => {
    if (parentOwnsSchool) onCloseSchool?.();
    else setLocalSchoolId(null);
  };

  const renderSchoolView = (tab) => {
    if (tab === 'Access') {
      return (
        <AccessView
          org={district.org}
          school={school}
          session={session}
          access={access}
          onSavePolicy={canEdit ? district.saveAccessPolicy : undefined}
          isDarkMode={isDarkMode}
          theme={theme}
        />
      );
    }
    if (tab === 'Staff') {
      return (
        <StaffView
          org={district.org}
          school={school}
          classes={districtClasses}
          schedule={school ? scheduleForSchool(district.org, school.id) : null}
          access={access}
          addStaff={allow('addStaff') ? district.addStaff : undefined}
          addStaffMany={allow('addStaff') ? district.addStaffMany : undefined}
          isDarkMode={isDarkMode}
          theme={theme}
          isLeft={isLeft}
        />
      );
    }
    if (tab === 'Departments') {
      return (
        <DepartmentsView
          org={district.org}
          school={school}
          access={access}
          addDepartment={allow('addDepartments') ? district.addDepartment : undefined}
          isDarkMode={isDarkMode}
          theme={theme}
          isLeft={isLeft}
        />
      );
    }
    if (tab === 'Classes') {
      return (
        <ClassesView
          org={district.org}
          school={school}
          classes={districtClasses}
          access={access}
          onUpdateClass={access !== 'surface' ? updateClass : undefined}
          onAddClass={allow('addClasses') ? handleAddClass : undefined}
          isDarkMode={isDarkMode}
          theme={theme}
          isLeft={isLeft}
        />
      );
    }
    if (tab === 'Students' || tab === 'Roster') {
      return (
        <RosterView
          org={district.org}
          school={school}
          classes={districtClasses}
          access={access}
          onAddStudent={allow('addStudents') ? handleAddStudent : undefined}
          isDarkMode={isDarkMode}
          theme={theme}
          isLeft={isLeft}
        />
      );
    }
    return (
      <ScheduleView
        school={school}
        schedule={school ? scheduleForSchool(district.org, school.id) : null}
        onSchedule={
          allow('editSchedule') && school
            ? (next) => district.saveSchedule(school.id, next)
            : undefined
        }
        access={access}
        isDarkMode={isDarkMode}
        theme={theme}
      />
    );
  };

  // Parent shell owns school mode — only school tabs reach here.
  if (parentOwnsSchool && schoolId) {
    return renderSchoolView(schoolTab);
  }

  // Teacher / in-app school workspace (sidebar does not swap).
  if (!parentOwnsSchool && schoolId && school) {
    return (
      <div>
        <div className="mb-2 max-w-7xl">
          <PageBackLink
            label="Back to schools"
            isDarkMode={isDarkMode}
            onClick={closeSchool}
          />
          <div className="mb-4 overflow-x-auto">
            <SegmentControl
              isDarkMode={isDarkMode}
              theme={theme}
              value={localSchoolTab}
              onChange={setLocalSchoolTab}
              options={SCHOOL_TABS}
            />
          </div>
        </div>
        {renderSchoolView(localSchoolTab)}
      </div>
    );
  }

  if (activeTab === 'Schools') {
    return (
      <SchoolsView
        org={district.org}
        schoolId={schoolId}
        mySchoolIds={mySchoolIds}
        canEdit={canEdit}
        onSelectSchool={() => {}}
        onOpenSchool={openSchool}
        addSchool={canEdit ? district.addSchool : undefined}
        updateSchool={canEdit ? district.updateSchool : undefined}
        renameSchool={canEdit ? district.renameSchool : undefined}
        removeSchool={canEdit ? district.removeSchool : undefined}
        isDarkMode={isDarkMode}
        theme={theme}
        isLeft={isLeft}
      />
    );
  }

  if (activeTab === 'Apps') {
    return (
      <AppsView
        canEdit={canEdit}
        onOpenApp={onOpenApp}
        isDarkMode={isDarkMode}
        theme={theme}
      />
    );
  }

  if (activeTab === 'Insights') {
    return (
      <InsightsView
        org={district.org}
        classes={districtClasses}
        isDarkMode={isDarkMode}
        theme={theme}
      />
    );
  }

  if (activeTab === 'App Access') {
    return (
      <AdminAccessView
        canEdit={canEdit}
        session={session}
        isDarkMode={isDarkMode}
        theme={theme}
      />
    );
  }

  return (
    <AdminDashboardView
      org={district.org}
      classes={districtClasses}
      canEdit={canEdit}
      onOpenSchools={() => onSetActiveTab?.('Schools')}
      onOpenSchool={openSchool}
      isDarkMode={isDarkMode}
      theme={theme}
    />
  );
}
