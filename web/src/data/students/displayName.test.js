import { describe, expect, it } from 'vitest';
import {
  APP_DISPLAY_NAME,
  normalizeAppDisplayName,
  resolveAppDisplayName,
  studentAlternateName,
  studentDisplayName,
  studentNameWithLastInitial,
  studentShortName,
} from './displayName';

describe('student display name', () => {
  it('defaults to nickname when one exists and preference is unset', () => {
    const s = { name: 'Kong Qiu', nickname: 'Confucius' };
    expect(resolveAppDisplayName(s)).toBe(APP_DISPLAY_NAME.nickname);
    expect(studentDisplayName(s)).toBe('Confucius');
    expect(studentAlternateName(s)).toBe('Kong Qiu');
  });

  it('uses full name when preference is legal', () => {
    const s = {
      name: 'Kong Qiu',
      nickname: 'Confucius',
      appDisplayName: APP_DISPLAY_NAME.legal,
    };
    expect(studentDisplayName(s)).toBe('Kong Qiu');
    expect(studentAlternateName(s)).toBe('Confucius');
  });

  it('falls back to legal name when nickname preference has no nickname', () => {
    const s = {
      name: 'Harriet Tubman',
      nickname: '',
      appDisplayName: APP_DISPLAY_NAME.nickname,
    };
    expect(studentDisplayName(s)).toBe('Harriet Tubman');
    expect(studentShortName(s)).toBe('Harriet');
  });

  it('formats name with last initial for compact chips', () => {
    expect(
      studentNameWithLastInitial({
        name: 'Frederick Douglass',
        firstName: 'Frederick',
        lastName: 'Douglass',
      }),
    ).toBe('Frederick D.');
    expect(
      studentNameWithLastInitial({
        name: 'Booker T. Washington',
        firstName: 'Booker T.',
        lastName: 'Washington',
        nickname: 'Booker',
      }),
    ).toBe('Booker W.');
  });

  it('normalizes preference when nickname is cleared', () => {
    expect(normalizeAppDisplayName(APP_DISPLAY_NAME.nickname, '')).toBe(
      APP_DISPLAY_NAME.legal,
    );
  });
});
