import { useEffect, useState } from 'react';
import {
  declineRequest,
  getPet,
  getRequest,
  HEADSPACE_UPDATED_EVENT,
  listEntries,
  savePet,
  submitEntry,
} from '../../../data/headspace/headspaceStorage';
import { TYPE } from '../../../shared/typography';
import { StudentPicker } from '../StudentPicker';
import { PetRockHome } from './PetRockHome';
import { PetRockSetup } from './PetRockSetup';
import { PetRockWrite } from './PetRockWrite';

/**
 * Pet Rock Pen Pal — setup, home, and daily letter for one student.
 */
export function PetRockView({
  theme,
  isDarkMode,
  classId,
  roster = [],
  studentId,
  onStudentIdChange,
  hideStudentPicker = false,
}) {
  const [mode, setMode] = useState('home'); // home | setup | write
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onUpdate = () => setTick((n) => n + 1);
    window.addEventListener(HEADSPACE_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(HEADSPACE_UPDATED_EVENT, onUpdate);
  }, []);

  useEffect(() => {
    setMode('home');
  }, [studentId, classId]);

  const pet = studentId ? getPet(classId, studentId) : null;
  const entries = studentId ? listEntries(classId, studentId) : [];
  const pendingRequest = studentId ? getRequest(classId, studentId) : null;
  // tick forces re-read after storage events
  void tick;

  if (!studentId) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4 p-1">
        {!hideStudentPicker ? (
          <StudentPicker
            roster={roster}
            selectedId={studentId}
            onSelect={onStudentIdChange}
            theme={theme}
            label="Whose rock?"
          />
        ) : null}
        <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
          {hideStudentPicker
            ? 'Your class roster isn’t ready yet.'
            : 'Pick a student to set up or open their pet rock pen pal.'}
        </p>
      </div>
    );
  }

  const showSetup = mode === 'setup' || !pet;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {!hideStudentPicker && roster.length > 1 ? (
        <StudentPicker
          roster={roster}
          selectedId={studentId}
          onSelect={onStudentIdChange}
          theme={theme}
          label="Whose rock?"
        />
      ) : null}

      {showSetup ? (
        <div className="min-h-0 flex-1">
          <PetRockSetup
            theme={theme}
            isDarkMode={isDarkMode}
            initialPet={pet}
            onCancel={pet ? () => setMode('home') : undefined}
            onSave={(next) => {
              savePet(classId, studentId, next);
              setMode('home');
            }}
          />
        </div>
      ) : mode === 'write' ? (
        <div className="min-h-0 flex-1">
          <PetRockWrite
            theme={theme}
            isDarkMode={isDarkMode}
            pet={pet}
            pendingRequest={pendingRequest}
            onCancel={() => setMode('home')}
            onSubmit={({ mood, body, share }) => {
              submitEntry(classId, studentId, { mood, body, share });
              setMode('home');
            }}
          />
        </div>
      ) : (
        <div className="min-h-0 flex-1">
          <PetRockHome
            theme={theme}
            isDarkMode={isDarkMode}
            pet={pet}
            entries={entries}
            pendingRequest={pendingRequest}
            onWrite={() => setMode('write')}
            onEdit={() => setMode('setup')}
            onDeclineRequest={() => {
              declineRequest(classId, studentId);
              setTick((n) => n + 1);
            }}
          />
        </div>
      )}
    </div>
  );
}
