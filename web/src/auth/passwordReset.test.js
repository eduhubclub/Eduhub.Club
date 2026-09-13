import { describe, expect, it } from 'vitest';
import { isPasswordResetArrival, passwordResetRedirect } from './passwordReset';

describe('password reset arrival', () => {
  it('opens the reset page only when the email link brought a grant', () => {
    expect(isPasswordResetArrival({
      pathname: '/reset-password',
      search: '?code=abc',
      hash: '',
    })).toBe(true);
    expect(isPasswordResetArrival({
      pathname: '/',
      search: '',
      hash: '#access_token=abc&type=recovery',
    })).toBe(true);
    expect(isPasswordResetArrival({
      pathname: '/reset-password',
      search: '',
      hash: '',
    })).toBe(false);
    expect(isPasswordResetArrival({
      pathname: '/',
      search: '?code=abc',
      hash: '',
    })).toBe(false);
  });

  it('keeps a local reset on this computer', () => {
    expect(passwordResetRedirect('http://localhost:5173')).toBe(
      'http://localhost:5173/reset-password',
    );
  });
});
