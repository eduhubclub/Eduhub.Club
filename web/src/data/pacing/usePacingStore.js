import { useCallback, useEffect, useState } from 'react';
import {
  PACING_UPDATED_EVENT,
  readPacingStore,
} from './pacingStorage';
import {
  getGradeSchedule,
  getSchool,
} from './schoolSeed';

export function usePacingStore() {
  const [store, setStore] = useState(() => readPacingStore());

  const refresh = useCallback(() => {
    setStore(readPacingStore());
  }, []);

  useEffect(() => {
    refresh();
    const onAny = () => refresh();
    window.addEventListener(PACING_UPDATED_EVENT, onAny);
    return () => window.removeEventListener(PACING_UPDATED_EVENT, onAny);
  }, [refresh]);

  const school = getSchool(store.schoolId);
  const grade = getGradeSchedule(store.schoolId, store.gradeId);

  return { store, refresh, school, grade };
}
