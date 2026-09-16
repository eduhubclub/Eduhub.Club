import { useEffect, useState, Suspense, lazy } from 'react';
import { ComingSoonHome } from './auth/ComingSoonHome';
import { isInviteArrival } from './auth/inviteArrival';
import { notePasswordResetArrival } from './auth/passwordReset';
import { isStaffDoorOpen, openStaffDoor } from './auth/staffDoor';
import { getSupabase } from './data/auth/supabaseClient';

const WorkspaceApp = lazy(() => import('./WorkspaceApp'));

function shouldOpenWorkspace() {
  return import.meta.env.DEV || isStaffDoorOpen() || notePasswordResetArrival() || isInviteArrival();
}

/**
 * Public visitors see Coming soon until the product is ready.
 * Localhost, the staff door, a password-reset return, an invite link, or an
 * existing signed-in session open the working app.
 */
export default function App() {
  const [unlocked, setUnlocked] = useState(shouldOpenWorkspace);

  useEffect(() => {
    if (unlocked) return undefined;
    const supabase = getSupabase();
    if (!supabase) return undefined;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) setUnlocked(true);
    });
    return () => {
      active = false;
    };
  }, [unlocked]);

  if (!unlocked) {
    return (
      <ComingSoonHome
        onUnlock={() => {
          openStaffDoor();
          setUnlocked(true);
        }}
      />
    );
  }

  return (
    <Suspense fallback={null}>
      <WorkspaceApp />
    </Suspense>
  );
}
