import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SCHOOL_ACCESS,
  canUseCapability,
  normalizeSchoolAccess,
  sessionAccessActor,
  withAccessCapabilityActors,
} from './schoolAccess.js';
import { accessPolicyForSchool, seedDistrictOrg } from './districtModel.js';

describe('school access policy', () => {
  it('defaults keep add students off teachers and on registrar', () => {
    const policy = normalizeSchoolAccess(null);
    expect(policy.addStudents).toEqual(DEFAULT_SCHOOL_ACCESS.addStudents);
    expect(canUseCapability(policy, 'addStudents', 'registrar')).toBe(true);
    expect(canUseCapability(policy, 'addStudents', 'teacher')).toBe(false);
    expect(canUseCapability(policy, 'editAccess', 'principal')).toBe(true);
    expect(canUseCapability(policy, 'editAccess', 'teacher')).toBe(false);
  });

  it('lets Access toggle teachers onto add students', () => {
    const base = normalizeSchoolAccess(null);
    const next = withAccessCapabilityActors(base, 'addStudents', [
      ...base.addStudents,
      'teacher',
    ]);
    expect(canUseCapability(next, 'addStudents', 'teacher')).toBe(true);
  });

  it('maps session titles onto actors', () => {
    expect(sessionAccessActor({ role: 'admin' })).toBe('districtAdmin');
    expect(sessionAccessActor({ role: 'teacher', staffRole: 'Registrar' })).toBe('registrar');
    expect(sessionAccessActor({ role: 'teacher', title: 'Assistant Principal' })).toBe(
      'assistantPrincipal',
    );
    expect(sessionAccessActor({ role: 'teacher', title: 'Principal' })).toBe('principal');
    expect(sessionAccessActor({ role: 'teacher' })).toBe('teacher');
  });

  it('seeds every school with a normalized access policy', () => {
    const org = seedDistrictOrg();
    for (const school of org.schools) {
      const policy = accessPolicyForSchool(org, school.id);
      expect(policy.addStudents).toContain('registrar');
      expect(policy.addStudents).not.toContain('teacher');
    }
  });
});
