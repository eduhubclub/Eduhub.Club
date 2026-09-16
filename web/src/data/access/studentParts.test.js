import { describe, expect, it } from 'vitest';
import { partByTab, partEnabled, withPart } from './studentApps';

describe('student app parts', () => {
  it('treats a missing part as on', () => {
    expect(partEnabled({}, 'snake')).toBe(true);
    expect(partEnabled({ snake: false }, 'snake')).toBe(false);
    expect(partEnabled({ snake: false }, 'arkanoid')).toBe(true);
  });

  it('stores only turned-off parts', () => {
    expect(withPart({ snake: false }, 'snake', true)).toEqual({});
    expect(withPart({}, 'clock', false)).toEqual({ clock: false });
  });

  it('matches a game tab to its part', () => {
    expect(partByTab('arcade', 'Go Fish')?.id).toBe('go-fish');
    expect(partByTab('mathTools', 'Clock')?.id).toBe('clock');
    expect(partByTab('arcade', 'Card Games')).toBeNull();
  });
});
