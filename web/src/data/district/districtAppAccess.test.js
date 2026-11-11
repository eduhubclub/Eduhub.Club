import { describe, expect, it } from 'vitest';
import {
  APP_ROLE_FILTERS,
  audiencesForApp,
  appsForRoleFilter,
  isAppBlockedForStudents,
  isAppBlockedForTeachers,
  normalizeDistrictAppAccess,
  roleLabelForApp,
  withAppBlocked,
} from './districtAppAccess.js';

describe('district app access', () => {
  it('orders role filters Admin → Teachers → Students → Parents', () => {
    expect(APP_ROLE_FILTERS.map((row) => row.id)).toEqual([
      'admin',
      'teacher',
      'student',
      'parent',
    ]);
  });

  it('classifies teacher-only, shared, and admin apps', () => {
    expect(audiencesForApp('randomizer')).toEqual(['teacher']);
    expect(audiencesForApp('arcade')).toEqual(['teacher', 'student']);
    expect(audiencesForApp('district')).toEqual(['admin']);
    expect(audiencesForApp('pacing')).toEqual(['admin', 'teacher']);
    expect(roleLabelForApp('arcade')).toBe('Teachers · Students');
    expect(roleLabelForApp('classes')).toBe('Teachers');
  });

  it('filters Admin / Teachers / Students / Parents catalogs', () => {
    const teachers = appsForRoleFilter('teacher').map((row) => row.id);
    const students = appsForRoleFilter('student').map((row) => row.id);
    const admins = appsForRoleFilter('admin').map((row) => row.id);
    const parents = appsForRoleFilter('parent').map((row) => row.id);
    expect(teachers).toContain('randomizer');
    expect(teachers).not.toContain('district');
    expect(students).toContain('arcade');
    expect(students).not.toContain('randomizer');
    expect(admins).toContain('district');
    expect(admins).toContain('pacing');
    expect(admins).not.toContain('arcade');
    expect(teachers).toContain('pacing');
    expect(parents).toEqual([]);
  });

  it('blocks teachers and students independently', () => {
    let access = normalizeDistrictAppAccess(null);
    access = withAppBlocked(access, 'teacher', 'arcade', true);
    access = withAppBlocked(access, 'student', 'arcade', true);
    expect(isAppBlockedForTeachers('arcade', access)).toBe(true);
    expect(isAppBlockedForStudents('arcade', access)).toBe(true);

    access = withAppBlocked(access, 'teacher', 'arcade', false);
    expect(isAppBlockedForTeachers('arcade', access)).toBe(false);
    expect(isAppBlockedForStudents('arcade', access)).toBe(true);
  });

  it('ignores invalid block targets', () => {
    const access = withAppBlocked(null, 'student', 'randomizer', true);
    expect(access.blockedStudents).toEqual([]);
    const admin = withAppBlocked(null, 'teacher', 'district', true);
    expect(admin.blockedTeachers).toEqual([]);
  });
});
