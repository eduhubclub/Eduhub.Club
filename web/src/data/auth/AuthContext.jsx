import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clearPendingRole, consumePendingRole, isValidRole, passwordError, rememberPendingRole } from './codes';
import { applyDemoRole, DEMO_EMAIL, DEMO_PASSWORD, localDemoSession } from '../../auth/demoAccount';
import { applyOwnerView, isAccountView } from './ownerView';
import {
  finishPasswordResetArrival,
  passwordResetRedirect,
  passwordResetWasRequested,
} from '../../auth/passwordReset';
import { sessionForShell, sessionFromUser, shellForRole } from './session';
import { getSupabase, invokeFunction, isAuthConfigured, isCleverConfigured } from './supabaseClient';

const AuthContext = createContext(null);

function notConnected() {
  const error = new Error('Sign-in is not connected yet.');
  error.code = 'not_configured';
  return error;
}

async function readProfile(supabase, user) {
  const { data } = await supabase
    .from('profiles')
    .select('role, display_name, age_band')
    .eq('id', user.id)
    .maybeSingle();
  return data;
}

let pendingRoleTask = null;
const DEMO_VIEW_KEY = 'edu.auth.demoView';

function readStoredDemoView() {
  try {
    const role = sessionStorage.getItem(DEMO_VIEW_KEY);
    return isValidRole(role) ? role : '';
  } catch {
    return '';
  }
}

let demoViewRole = readStoredDemoView();
const OWNER_VIEW_KEY = 'edu.auth.ownerView';

function readStoredOwnerView() {
  try {
    const role = sessionStorage.getItem(OWNER_VIEW_KEY);
    return isAccountView(role) ? role : '';
  } catch {
    return '';
  }
}

let ownerViewRole = readStoredOwnerView();

function setOwnerView(role) {
  ownerViewRole = isAccountView(role) ? role : '';
  try {
    if (ownerViewRole) sessionStorage.setItem(OWNER_VIEW_KEY, ownerViewRole);
    else sessionStorage.removeItem(OWNER_VIEW_KEY);
  } catch {
    /* private mode */
  }
}

function setDemoView(role) {
  demoViewRole = role && isValidRole(role) ? role : '';
  try {
    if (demoViewRole) sessionStorage.setItem(DEMO_VIEW_KEY, demoViewRole);
    else sessionStorage.removeItem(DEMO_VIEW_KEY);
  } catch {
    /* private mode */
  }
}

async function applyStudentRoleIfPending(supabase, user) {
  if (!user) {
    pendingRoleTask = null;
    return;
  }
  if (!pendingRoleTask) {
    pendingRoleTask = (async () => {
      const pending = consumePendingRole();
      if (pending !== 'student') return;
      const created = new Date(user.created_at || 0).getTime();
      if (Date.now() - created > 15 * 60 * 1000) return;
      await supabase.rpc('apply_pending_role', { next_role: 'student' });
    })();
  }
  await pendingRoleTask;
}

async function loadSession(supabase, user) {
  if (!user) return null;
  await applyStudentRoleIfPending(supabase, user);
  let profile = await readProfile(supabase, user);
  if (!profile) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    profile = await readProfile(supabase, user);
  }
  return sessionFromUser(user, profile);
}

function sessionForCurrentView(session) {
    if (demoViewRole) {
    if (!session) return localDemoSession(demoViewRole);
    return applyDemoRole(session, demoViewRole);
  }
  return sessionForShell(session, ownerViewRole);
}

function sessionNeedsPasswordReset(user) {
  return Boolean(user) && passwordResetWasRequested();
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [recovery, setRecovery] = useState(passwordResetWasRequested);
  const [ready, setReady] = useState(!isAuthConfigured());

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return undefined;

    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      const next = await loadSession(supabase, data.session?.user);
      if (active) {
        setSession(sessionForCurrentView(next));
        setReady(true);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY' || sessionNeedsPasswordReset(nextSession?.user)) {
        setRecovery(true);
      }
      if (!nextSession?.user && demoViewRole) {
        if (active) setSession(localDemoSession(demoViewRole));
        return;
      }
      // Wait until the auth callback finishes. A profile read inside it can miss the session.
      setTimeout(() => {
        loadSession(supabase, nextSession?.user).then((next) => {
          if (!active) return;
          setSession((current) => {
            const resolved = sessionForCurrentView(next);
            if (
              current?.userId
              && current.userId === resolved?.userId
              && shellForRole(current.role)
              && !shellForRole(resolved?.role)
            ) {
              return current;
            }
            return resolved;
          });
        });
      }, 0);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async ({ email, password, viewRole }) => {
    const supabase = getSupabase();
    if (!supabase) throw notConnected();
    setDemoView('');
    if (isAccountView(viewRole)) setOwnerView(viewRole);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(email || '').trim(),
      password,
    });
    if (error) throw new Error(error.message || 'That email or password is not right.');
    const next = await loadSession(supabase, data.session?.user || data.user);
    setSession(sessionForCurrentView(next));
  }, []);

  const requestPasswordReset = useCallback(async (email) => {
    const supabase = getSupabase();
    if (!supabase) throw notConnected();
    const address = String(email || '').trim();
    if (!address.includes('@')) throw new Error('Enter the email on the account.');
    const { error } = await supabase.auth.resetPasswordForEmail(address, {
      redirectTo: passwordResetRedirect(),
    });
    if (!error) return;
    const message = error.message || '';
    if (/rate|too many/i.test(message)) throw new Error('Wait a minute, then try again.');
    if (/redirect/i.test(message)) {
      throw new Error('Password reset is not allowed for this site yet.');
    }
    if (/not found|signups not allowed/i.test(message)) return;
    throw new Error(message || 'Could not send that email.');
  }, []);

  const updatePassword = useCallback(async (password) => {
    const supabase = getSupabase();
    if (!supabase) throw notConnected();
    const issue = passwordError(password);
    if (issue) throw new Error(issue);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message || 'Could not save that password.');
    finishPasswordResetArrival();
    setRecovery(false);
  }, []);

  const signUp = useCallback(async ({ email, password, displayName, role }) => {
    const supabase = getSupabase();
    if (!supabase) throw notConnected();
    if (!isValidRole(role)) throw new Error('Choose a role to create an account.');
    const { data, error } = await supabase.auth.signUp({
      email: String(email || '').trim(),
      password,
      options: {
        data: { role, display_name: String(displayName || '').trim() },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw new Error(error.message || 'Could not create that account.');
    if (!data.session) {
      const pending = new Error('Check your email to confirm, then sign in.');
      pending.code = 'confirm_email';
      throw pending;
    }
  }, []);

  const finishClassroomLogin = useCallback(async (payload) => {
    const supabase = getSupabase();
    if (!supabase) throw notConnected();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: payload.tokenHash,
      type: payload.verificationType || 'magiclink',
    });
    if (!error) return;
    const retry = await supabase.auth.verifyOtp({
      token_hash: payload.tokenHash,
      type: 'email',
    });
    if (retry.error) throw new Error('That sign-in did not finish. Try again.');
  }, []);

  const signInWithClassCode = useCallback(async ({ joinCode, pin }) => {
    const payload = await invokeFunction('classroom-login', { joinCode, pin });
    await finishClassroomLogin(payload);
  }, [finishClassroomLogin]);

  const signInWithQr = useCallback(async (token) => {
    const payload = await invokeFunction('classroom-login', { token });
    await finishClassroomLogin(payload);
  }, [finishClassroomLogin]);

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) throw notConnected();
    rememberPendingRole('student');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      clearPendingRole();
      throw new Error(error.message || 'Google sign-in is not connected yet.');
    }
  }, []);

  const signInWithClever = useCallback(async () => {
    if (!isCleverConfigured()) {
      throw new Error('Clever is not connected yet.');
    }
    const supabase = getSupabase();
    if (!supabase) throw notConnected();
    rememberPendingRole('student');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'custom:clever',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      clearPendingRole();
      throw new Error(error.message || 'Clever is not connected yet.');
    }
  }, []);

  const signInWithMicrosoft = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) throw notConnected();
    rememberPendingRole('student');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      clearPendingRole();
      throw new Error(error.message || 'Microsoft 365 is not connected yet.');
    }
  }, []);

  const enterDemo = useCallback(async (role) => {
    if (!isValidRole(role)) throw new Error('Choose a view to open.');
    setDemoView(role);
    const supabase = getSupabase();
    if (!supabase) {
      setSession(localDemoSession(role));
      setReady(true);
      return;
    }
    const signedIn = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
    if (signedIn.error) {
      const created = await supabase.auth.signUp({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        options: {
          data: { role, display_name: 'Demo' },
          emailRedirectTo: window.location.origin,
        },
      });
      if (created.error || !created.data.session) {
        setSession(localDemoSession(role));
        setReady(true);
        return;
      }
    }
    const { data } = await supabase.auth.getSession();
    const next = await loadSession(supabase, data.session?.user);
    setSession(sessionForCurrentView(next));
    setReady(true);
  }, []);

  const switchView = useCallback((role) => {
    if (!isAccountView(role)) return;
    setOwnerView(role);
    setSession((current) => (current?.owner ? applyOwnerView(current, role) : current));
  }, []);

  const signOut = useCallback(async () => {
    setDemoView('');
    setOwnerView('');
    finishPasswordResetArrival();
    setRecovery(false);
    const supabase = getSupabase();
    setSession(null);
    if (supabase) await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      ready,
      configured: isAuthConfigured(),
      session,
      recovery,
      requestPasswordReset,
      updatePassword,
      signIn,
      signUp,
      signInWithClassCode,
      signInWithQr,
      signInWithGoogle,
      signInWithClever,
      signInWithMicrosoft,
      enterDemo,
      switchView,
      signOut,
    }),
    [
      ready,
      session,
      recovery,
      requestPasswordReset,
      updatePassword,
      signIn,
      signUp,
      signInWithClassCode,
      signInWithQr,
      signInWithGoogle,
      signInWithClever,
      signInWithMicrosoft,
      enterDemo,
      switchView,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
