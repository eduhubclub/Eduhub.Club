import { describe, expect, it } from 'vitest';
import { JOIN_ALPHABET } from '../auth/codes';
import { assignClassJoinCodes } from './joinCode';

describe('assignClassJoinCodes', () => {
  it('keeps an existing code and fills missing ones', () => {
    const [kept, filled] = assignClassJoinCodes([
      { id: 'a', name: 'Test', joinCode: 'K7M2PQ' },
      { id: 'b', name: 'Art' },
    ]);
    expect(kept.joinCode).toBe('K7M2PQ');
    expect(filled.joinCode).toHaveLength(6);
    expect([...filled.joinCode].every((ch) => JOIN_ALPHABET.includes(ch))).toBe(true);
    expect(filled.joinCode).not.toBe(kept.joinCode);
  });

  it('returns the same list when every class already has a unique code', () => {
    const list = [
      { id: 'a', joinCode: 'ABCDEF' },
      { id: 'b', joinCode: 'GHJKL2' },
    ];
    expect(assignClassJoinCodes(list)).toBe(list);
  });
});
