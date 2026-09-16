import { describe, expect, it } from 'vitest';
import { inviteSignupPath, isInviteArrival, parseInviteToken } from './inviteArrival';

describe('invite arrival', () => {
  it('reads an invite from the query string', () => {
    expect(parseInviteToken({ search: '?invite=abc123', hash: '' })).toBe('abc123');
    expect(isInviteArrival({ search: '?invite=abc123', hash: '' })).toBe(true);
  });

  it('reads an invite from the hash so GitHub Pages can keep the token', () => {
    expect(parseInviteToken({ search: '', hash: '#invite=from-hash' })).toBe('from-hash');
  });

  it('ignores a plain visit', () => {
    expect(parseInviteToken({ search: '', hash: '#sign-in' })).toBe('');
    expect(isInviteArrival({ search: '', hash: '' })).toBe(false);
  });

  it('builds a signup link', () => {
    expect(inviteSignupPath('https://eduhub.club', 'tok')).toBe('https://eduhub.club/?invite=tok');
  });
});
