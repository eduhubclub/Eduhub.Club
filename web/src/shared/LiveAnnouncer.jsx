import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const LiveAnnouncerContext = createContext(null);

/** Join names for spoken announcements: "A", "A and B", "A, B, and C". */
export function formatAnnounceList(items) {
  const names = (items || []).map((n) => String(n || '').trim()).filter(Boolean);
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

/**
 * Polite live region for teaching-state updates (winners, timer end, alerts).
 * Always on — not a Settings switch.
 *
 * Usage: const announce = useAnnounce(); announce('Harper was picked');
 */
export function LiveAnnouncerProvider({ children }) {
  const [message, setMessage] = useState('');
  const clearRef = useRef(null);
  const seqRef = useRef(0);
  const rafRef = useRef(0);

  const announce = useCallback((text) => {
    const next = typeof text === 'string' ? text.trim() : '';
    if (!next) return;
    const seq = ++seqRef.current;
    // Clear then set so identical consecutive messages are still announced.
    setMessage('');
    if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = 0;
      if (seq !== seqRef.current) return;
      setMessage(next);
    });
    if (clearRef.current) window.clearTimeout(clearRef.current);
    clearRef.current = window.setTimeout(() => {
      if (seq === seqRef.current) setMessage('');
    }, 4000);
  }, []);

  const value = useMemo(() => ({ announce }), [announce]);

  return (
    <LiveAnnouncerContext.Provider value={value}>
      {children}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {message}
      </div>
    </LiveAnnouncerContext.Provider>
  );
}

export function useAnnounce() {
  const ctx = useContext(LiveAnnouncerContext);
  if (!ctx) {
    return () => {};
  }
  return ctx.announce;
}
