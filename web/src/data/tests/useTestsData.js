import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { hydrateStore, readStore, TESTS_STORE_EVENT } from './storage';

/** Local record first, then the signed-in cloud copy when this account has one. */
export function useTestsData() {
  const { session } = useAuth();
  const ownerId = session?.userId || '';
  const [store, setStore] = useState(() => readStore());

  useEffect(() => {
    let cancelled = false;
    hydrateStore(ownerId).then((next) => {
      if (!cancelled) setStore(next);
    });
    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  useEffect(() => {
    const onChange = () => setStore(readStore());
    window.addEventListener(TESTS_STORE_EVENT, onChange);
    return () => window.removeEventListener(TESTS_STORE_EVENT, onChange);
  }, []);

  return { store, ownerId };
}
