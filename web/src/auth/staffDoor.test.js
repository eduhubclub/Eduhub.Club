import { describe, expect, it } from 'vitest';
import { codeUnlocks } from './staffDoor';

describe('staff door', () => {
  it('accepts only the staff code', () => {
    expect(codeUnlocks('2069')).toBe(true);
    expect(codeUnlocks(' 2069 ')).toBe(true);
    expect(codeUnlocks('2068')).toBe(false);
    expect(codeUnlocks('')).toBe(false);
  });
});
