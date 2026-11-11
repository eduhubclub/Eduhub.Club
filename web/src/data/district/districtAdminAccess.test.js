import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ROLE_SURFACES,
  adminAccessTableRows,
  adminAccessTableRowsForFocus,
  canConfigureAdminAccess,
  normalizeDistrictAdminAccess,
  roleHasSurface,
  withChangeCapabilityActors,
  withRoleSurface,
} from './districtAdminAccess.js';

describe('district admin access', () => {
  it('keeps teacher apps off the registrar by default', () => {
    const access = normalizeDistrictAdminAccess(null);
    expect(roleHasSurface(access, 'registrar', 'teacherApps')).toBe(false);
    expect(roleHasSurface(access, 'registrar', 'schoolWorkspace')).toBe(true);
    expect(roleHasSurface(access, 'teacher', 'teacherApps')).toBe(true);
    expect(DEFAULT_ROLE_SURFACES.districtAdmin).toContain('insights');
  });

  it('toggles role surfaces and keeps a minimum package', () => {
    let access = normalizeDistrictAdminAccess(null);
    access = withRoleSurface(access, 'registrar', 'insights', true);
    expect(roleHasSurface(access, 'registrar', 'insights')).toBe(true);
    access = withRoleSurface(access, 'registrar', 'districtHub', false);
    access = withRoleSurface(access, 'registrar', 'schoolWorkspace', false);
    access = withRoleSurface(access, 'registrar', 'insights', false);
    expect(access.roleSurfaces.registrar.length).toBeGreaterThan(0);
  });

  it('updates district change policy actors', () => {
    let access = normalizeDistrictAdminAccess(null);
    access = withChangeCapabilityActors(access, 'addStudents', [
      'districtAdmin',
      'registrar',
    ]);
    expect(access.changePolicy.addStudents).toEqual(['districtAdmin', 'registrar']);
  });

  it('builds app rows with school tasks and teacher tool apps', () => {
    const rows = adminAccessTableRows();
    expect(rows.some((row) => row.id === 'app:schoolWorkspace' && row.depth === 0)).toBe(true);
    expect(rows.some((row) => row.capabilityId === 'addStudents' && row.depth === 1)).toBe(true);
    expect(rows.some((row) => row.toolAppId === 'groups' && row.kind === 'app')).toBe(true);
    expect(rows.some((row) => row.toolAppId === 'arcade' && row.kind === 'app')).toBe(true);
    expect(rows.some((row) => row.toolAppId === 'district')).toBe(false);
  });

  it('limits editors to principal and above', () => {
    expect(canConfigureAdminAccess({ role: 'admin' })).toBe(true);
    expect(canConfigureAdminAccess({ role: 'teacher', title: 'Principal' })).toBe(true);
    expect(canConfigureAdminAccess({ role: 'teacher', title: 'Registrar' })).toBe(false);
  });

  it('shortens the table to apps connected to a role', () => {
    const access = normalizeDistrictAdminAccess(null);
    const focused = adminAccessTableRowsForFocus(access, 'registrar', true);
    expect(focused.some((row) => row.surfaceId === 'schoolWorkspace')).toBe(true);
    expect(focused.some((row) => row.toolAppId === 'groups')).toBe(false);
    expect(adminAccessTableRowsForFocus(access, 'all', true).length).toBe(
      adminAccessTableRows().length,
    );
  });

  it('includes a student role focused on student apps', () => {
    const access = normalizeDistrictAdminAccess(null);
    expect(access.roleSurfaces.student).toEqual(['studentApps']);
    expect(access.appActors.arcade).toContain('student');
    expect(access.appActors.groups || []).not.toContain('student');
    const focused = adminAccessTableRowsForFocus(access, 'student', true);
    expect(focused.some((row) => row.surfaceId === 'studentApps')).toBe(true);
    expect(focused.some((row) => row.toolAppId === 'arcade')).toBe(true);
  });

  it('includes a parent role focused on parent apps', () => {
    const access = normalizeDistrictAdminAccess(null);
    expect(access.roleSurfaces.parent).toEqual(['parentApps']);
    const focused = adminAccessTableRowsForFocus(access, 'parent', true);
    expect(focused.some((row) => row.surfaceId === 'parentApps')).toBe(true);
    expect(focused.some((row) => row.kind === 'change')).toBe(false);
  });
});
