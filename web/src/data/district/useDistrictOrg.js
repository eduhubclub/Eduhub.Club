import { useCallback, useEffect, useState } from 'react';
import { useClasses } from '../classes/ClassContext';
import { useStudents } from '../students/StudentContext';
import {
  classMatchesSchool,
  normalizeBuildingSchedule,
  normalizeDepartment,
  normalizeSchool,
  normalizeSchoolAccess,
  normalizeStaffMember,
  resolveClassSchoolId,
} from './districtModel';
import { readDistrictAdminAccess } from './districtAdminAccess';
import {
  DISTRICT_UPDATED_EVENT,
  readDistrictOrg,
  updateDistrictOrg,
} from './districtStorage';

function findClass(classes, classId) {
  return classes.find((cls) => String(cls.id) === String(classId)) || null;
}

/**
 * District org plus the class/student writes that keep a school link
 * visible on the shared roster.
 */
export function useDistrictOrg() {
  const { classes, updateClass, updateStudent } = useClasses();
  const { updateStudent: updateDirectoryStudent, upsertStudents } = useStudents();
  const [org, setOrg] = useState(() => readDistrictOrg());

  useEffect(() => {
    const sync = () => setOrg(readDistrictOrg());
    window.addEventListener(DISTRICT_UPDATED_EVENT, sync);
    return () => window.removeEventListener(DISTRICT_UPDATED_EVENT, sync);
  }, []);

  useEffect(() => {
    for (const cls of classes) {
      const resolved = resolveClassSchoolId(cls, org);
      const key = String(cls.id);
      const hasLink = Object.prototype.hasOwnProperty.call(org.classSchools || {}, key);
      if (resolved && cls.schoolId !== resolved) {
        updateClass(cls.id, { schoolId: resolved });
      } else if (resolved === null && hasLink && cls.schoolId !== null) {
        updateClass(cls.id, { schoolId: null });
      }
    }
  }, [classes, org, updateClass]);

  const stampClass = useCallback(
    (cls, patch) => {
      const students = cls?.studentList || [];
      for (const student of students) {
        updateStudent(cls.id, student.id, patch);
        updateDirectoryStudent(student.id, patch);
      }
      if (students.length) {
        upsertStudents(students.map((student) => ({ ...student, ...patch })));
      }
    },
    [updateDirectoryStudent, updateStudent, upsertStudents],
  );

  const renameDistrict = useCallback(
    (name) => {
      const trimmed = String(name || '').trim();
      if (!trimmed) return readDistrictOrg();
      const previous = readDistrictOrg().name;
      const next = updateDistrictOrg((current) => ({ ...current, name: trimmed }));
      if (previous && previous !== trimmed) {
        const patch = { district: trimmed };
        for (const cls of classes) {
          const students = (cls.studentList || []).filter((student) => student.district === previous);
          if (!students.length) continue;
          for (const student of students) {
            updateStudent(cls.id, student.id, patch);
            updateDirectoryStudent(student.id, patch);
          }
        }
      }
      return next;
    },
    [classes, updateDirectoryStudent, updateStudent],
  );

  const addSchool = useCallback((input) => {
    let createdId = null;
    const next = updateDistrictOrg((current) => {
      const school = normalizeSchool(typeof input === 'string' ? { name: input } : input);
      if (!school) return current;
      createdId = school.id;
      return {
        ...current,
        schools: [...current.schools, school],
        schedules: {
          ...current.schedules,
          [school.id]: normalizeBuildingSchedule(null),
        },
        staff: {
          ...current.staff,
          [school.id]: [],
        },
        departments: {
          ...current.departments,
          [school.id]: [],
        },
        accessPolicies: {
          ...current.accessPolicies,
          [school.id]: normalizeSchoolAccess(
            readDistrictAdminAccess().changePolicy,
          ),
        },
      };
    });
    return next.schools.find((school) => school.id === createdId) || null;
  }, []);

  const updateSchool = useCallback(
    (schoolId, patch) => {
      const current = readDistrictOrg();
      const school = current.schools.find((row) => row.id === schoolId);
      if (!school) return current;
      const nextSchool = normalizeSchool({ ...school, ...patch, id: schoolId });
      if (!nextSchool) return current;
      const nameChanged = nextSchool.name !== school.name;
      const affected = nameChanged
        ? classes.filter((cls) => classMatchesSchool(cls, school, current))
        : [];
      const next = updateDistrictOrg((org) => {
        const classSchools = { ...org.classSchools };
        for (const cls of affected) classSchools[String(cls.id)] = schoolId;
        return {
          ...org,
          schools: org.schools.map((row) => (row.id === schoolId ? nextSchool : row)),
          classSchools,
        };
      });
      if (nameChanged) {
        const studentPatch = {
          school: nextSchool.name,
          district: next.name,
          managedByDistrict: true,
        };
        for (const cls of affected) {
          updateClass(cls.id, { schoolId });
          stampClass(cls, studentPatch);
        }
      }
      return next;
    },
    [classes, stampClass, updateClass],
  );

  const renameSchool = useCallback(
    (schoolId, name) => updateSchool(schoolId, { name }),
    [updateSchool],
  );

  const removeSchool = useCallback(
    (schoolId) => {
      const current = readDistrictOrg();
      const school = current.schools.find((row) => row.id === schoolId);
      const affected = school
        ? classes.filter(
            (cls) =>
              classMatchesSchool(cls, school, current) ||
              resolveClassSchoolId(cls, current) === schoolId,
          )
        : [];
      const next = updateDistrictOrg((org) => {
        const classSchools = { ...org.classSchools };
        for (const cls of affected) classSchools[String(cls.id)] = null;
        const schedules = { ...org.schedules };
        delete schedules[schoolId];
        const staff = { ...org.staff };
        delete staff[schoolId];
        const departments = { ...org.departments };
        delete departments[schoolId];
        const accessPolicies = { ...org.accessPolicies };
        delete accessPolicies[schoolId];
        return {
          ...org,
          schools: org.schools.filter((row) => row.id !== schoolId),
          schedules,
          staff,
          departments,
          accessPolicies,
          classSchools,
        };
      });
      for (const cls of affected) updateClass(cls.id, { schoolId: null });
      return next;
    },
    [classes, updateClass],
  );

  const saveSchedule = useCallback((schoolId, schedule) => {
    if (!schoolId) return readDistrictOrg();
    return updateDistrictOrg((current) => ({
      ...current,
      schedules: {
        ...current.schedules,
        [schoolId]: schedule,
      },
    }));
  }, []);

  /** Add a staff member; department is taken from input or inferred from role. */
  const addStaff = useCallback((schoolId, input) => {
    if (!schoolId) return null;
    let created = null;
    updateDistrictOrg((current) => {
      if (!current.schools.some((school) => school.id === schoolId)) return current;
      const member = normalizeStaffMember(input);
      if (!member) return current;
      created = member;
      const existing = Array.isArray(current.staff?.[schoolId]) ? current.staff[schoolId] : [];
      return {
        ...current,
        staff: {
          ...current.staff,
          [schoolId]: [...existing, member],
        },
      };
    });
    return created;
  }, []);

  /** Mass-add staff from CSV / spreadsheet rows (one write). */
  const addStaffMany = useCallback((schoolId, rows) => {
    if (!schoolId || !Array.isArray(rows) || rows.length === 0) return [];
    let created = [];
    updateDistrictOrg((current) => {
      if (!current.schools.some((school) => school.id === schoolId)) return current;
      const members = rows.map((row) => normalizeStaffMember(row)).filter(Boolean);
      if (!members.length) return current;
      created = members;
      const existing = Array.isArray(current.staff?.[schoolId]) ? current.staff[schoolId] : [];
      return {
        ...current,
        staff: {
          ...current.staff,
          [schoolId]: [...existing, ...members],
        },
      };
    });
    return created;
  }, []);

  const saveAccessPolicy = useCallback((schoolId, policy) => {
    if (!schoolId) return readDistrictOrg();
    return updateDistrictOrg((current) => ({
      ...current,
      accessPolicies: {
        ...current.accessPolicies,
        [schoolId]: normalizeSchoolAccess(policy),
      },
    }));
  }, []);

  /** Add a custom department to a school (built-ins are always available). */
  const addDepartment = useCallback((schoolId, input) => {
    if (!schoolId) return null;
    let created = null;
    updateDistrictOrg((current) => {
      if (!current.schools.some((school) => school.id === schoolId)) return current;
      const dept = normalizeDepartment(typeof input === 'string' ? { label: input } : input);
      if (!dept) return current;
      const existing = Array.isArray(current.departments?.[schoolId])
        ? current.departments[schoolId]
        : [];
      if (existing.some((row) => row.id === dept.id)) {
        created = existing.find((row) => row.id === dept.id) || dept;
        return current;
      }
      created = dept;
      return {
        ...current,
        departments: {
          ...current.departments,
          [schoolId]: [...existing, dept],
        },
      };
    });
    return created;
  }, []);

  const assignClass = useCallback(
    (classId, schoolId) => {
      const current = readDistrictOrg();
      const school = current.schools.find((row) => row.id === schoolId);
      const cls = findClass(classes, classId);
      if (!school || !cls) return current;
      const next = updateDistrictOrg((org) => ({
        ...org,
        classSchools: {
          ...org.classSchools,
          [String(classId)]: schoolId,
        },
      }));
      updateClass(cls.id, { schoolId });
      stampClass(cls, {
        school: school.name,
        district: next.name,
        managedByDistrict: true,
      });
      return next;
    },
    [classes, stampClass, updateClass],
  );

  const unassignClass = useCallback(
    (classId) => {
      const cls = findClass(classes, classId);
      const next = updateDistrictOrg((org) => ({
        ...org,
        classSchools: {
          ...org.classSchools,
          [String(classId)]: null,
        },
      }));
      if (cls) updateClass(cls.id, { schoolId: null });
      return next;
    },
    [classes, updateClass],
  );

  return {
    org,
    renameDistrict,
    addSchool,
    updateSchool,
    renameSchool,
    removeSchool,
    saveSchedule,
    addStaff,
    addStaffMany,
    addDepartment,
    saveAccessPolicy,
    assignClass,
    unassignClass,
  };
}
