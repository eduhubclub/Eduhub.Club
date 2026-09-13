import { beforeEach, describe, expect, it } from 'vitest';
import {
  cardTokenMatches,
  ensureCardToken,
  readCardToken,
  rotateCardToken,
} from './cardToken';
import { resolveStudentCardScan } from './cardScan';
import { buildStudentBankQrPayload, parseStudentBankQrPayload } from '../../shared/bankQrPayload';

describe('student card token', () => {
  beforeEach(() => {
    const store = new Map();
    globalThis.localStorage = {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
      clear: () => store.clear(),
    };
  });

  it('reprints the same secret until a teacher replaces it', () => {
    const first = ensureCardToken('student-1');
    const again = ensureCardToken('student-1');
    expect(again.token).toBe(first.token);
    expect(readCardToken('student-1').token).toBe(first.token);

    const replaced = rotateCardToken('student-1');
    expect(replaced.token).not.toBe(first.token);
    expect(ensureCardToken('student-1').token).toBe(replaced.token);
  });

  it('rejects a replaced card and waits for a PIN only when asked', () => {
    const current = ensureCardToken('student-1');
    const oldCard = buildStudentBankQrPayload(
      { id: 'student-1', name: 'Ada' },
      'old-token-that-is-long-enough',
    );
    rotateCardToken('student-1');
    expect(cardTokenMatches('student-1', current.token)).toBe(false);
    expect(resolveStudentCardScan({ raw: oldCard }).reason).toBe('replaced');

    const card = buildStudentBankQrPayload({ id: 'student-1', name: 'Ada' }, current.token);
    // The token on `card` is the pre-rotate token, which no longer matches.
    expect(resolveStudentCardScan({ raw: card, requirePin: true }).reason).toBe('replaced');

    const live = buildStudentBankQrPayload(
      { id: 'student-1', name: 'Ada' },
      ensureCardToken('student-1').token,
    );
    expect(resolveStudentCardScan({ raw: live }).ok).toBe(true);
    expect(resolveStudentCardScan({ raw: live, requirePin: true }).reason).toBe('pin-required');
    expect(resolveStudentCardScan({ raw: live, requirePin: true, pinOk: true }).ok).toBe(true);
    expect(parseStudentBankQrPayload(live).name).toBe('Ada');
  });
});
