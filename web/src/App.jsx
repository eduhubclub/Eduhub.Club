import { useState, Suspense, lazy } from 'react';
import { ComingSoonHome } from './auth/ComingSoonHome';
import { notePasswordResetArrival } from './auth/passwordReset';
import { isStaffDoorOpen, openStaffDoor } from './auth/staffDoor';

const WorkspaceApp = lazy(() => import('./WorkspaceApp'));

/**
 * GitHub Pages stays on coming soon until the staff door is opened.
 * `npm run dev` opens the working app and never publishes it.
 */
export default function App() {
  const [unlocked, setUnlocked] = useState(
    () => import.meta.env.DEV || isStaffDoorOpen() || notePasswordResetArrival(),
  );

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
