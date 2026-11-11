import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CLASS_CREATOR_UPDATED_EVENT,
  archiveActiveRun,
  createPlacementRun,
  getActiveRun,
  readClassCreatorStore,
  setActiveRunId,
  upsertActiveRun,
} from './classCreatorStorage';

export function useClassCreatorStore() {
  const [store, setStore] = useState(() => readClassCreatorStore());

  const refresh = useCallback(() => {
    setStore(readClassCreatorStore());
  }, []);

  useEffect(() => {
    refresh();
    const onAny = () => refresh();
    window.addEventListener(CLASS_CREATOR_UPDATED_EVENT, onAny);
    return () => window.removeEventListener(CLASS_CREATOR_UPDATED_EVENT, onAny);
  }, [refresh]);

  const run = useMemo(() => getActiveRun(store), [store]);

  return {
    store,
    run,
    refresh,
    createPlacementRun,
    setActiveRunId: (runId) => {
      setActiveRunId(runId);
      refresh();
    },
    upsertActiveRun,
    archiveActiveRun,
  };
}
