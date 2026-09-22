import { describe, expect, it } from 'vitest';
import {
  applySpecialtyKey,
  specialtiesInText,
  specialtyForChar,
} from './specialtyPunctuation';

describe('specialtyPunctuation', () => {
  it('maps em dash to --', () => {
    expect(specialtyForChar('—')?.shortcut).toBe('--');
    expect(applySpecialtyKey('—', '', '-')).toEqual({
      pending: '-',
      insert: null,
      correct: false,
      error: false,
    });
    expect(applySpecialtyKey('—', '-', '-')).toEqual({
      pending: '',
      insert: '—',
      correct: true,
      error: false,
    });
  });

  it('maps en dash to single hyphen', () => {
    expect(applySpecialtyKey('–', '', '-')).toEqual({
      pending: '',
      insert: '–',
      correct: true,
      error: false,
    });
  });

  it('lists specialties found in text', () => {
    const rows = specialtiesInText('lippity—lippity— and en–dash');
    expect(rows.map((r) => r.char).sort()).toEqual(['–', '—'].sort());
  });

  it('rejects wrong key mid-shortcut', () => {
    expect(applySpecialtyKey('—', '-', 'x')).toEqual({
      pending: '',
      insert: null,
      correct: false,
      error: true,
    });
  });
});
