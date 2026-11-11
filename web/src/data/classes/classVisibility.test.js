import { describe, expect, it } from 'vitest';
import {
  SHARED_DEMO_CLASS_ID,
  classesForAdminWorkspace,
  isSharedDemoClass,
  withClassOwner,
} from './classVisibility.js';

describe('admin class visibility', () => {
  it('treats demo-3rd-grade as the shared demo class', () => {
    expect(isSharedDemoClass(SHARED_DEMO_CLASS_ID)).toBe(true);
    expect(isSharedDemoClass({ id: 'demo-k-a' })).toBe(false);
  });

  it('stamps ownerId on user-created classes only', () => {
    expect(withClassOwner({ id: 'cls-1', name: 'Staff PLCs' }, 'user-a').ownerId).toBe('user-a');
    expect(withClassOwner({ id: SHARED_DEMO_CLASS_ID, name: 'Demo' }, 'user-a').ownerId).toBeUndefined();
  });

  it('lets admins see only the shared demo class and their own classes', () => {
    const list = [
      { id: SHARED_DEMO_CLASS_ID, name: 'Demo Class' },
      { id: 'demo-k-a', name: 'Other demo room' },
      { id: 'cls-mine', name: 'My staff group', ownerId: 'admin-1' },
      { id: 'cls-theirs', name: 'Teacher room', ownerId: 'teacher-9' },
    ];
    const visible = classesForAdminWorkspace(list, 'admin-1').map((row) => row.id);
    expect(visible).toEqual([SHARED_DEMO_CLASS_ID, 'cls-mine']);
  });
});
