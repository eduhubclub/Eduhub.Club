import { forwardRef, useLayoutEffect, useRef } from 'react';

/**
 * Keeps an absolutely positioned popout inside the viewport (horizontal clamp).
 * Attach the returned ref to the popout root. Pass `open` while it is mounted/visible.
 * Set `centerX` when the popout is meant to be centered on its trigger
 * (replaces Tailwind `-translate-x-1/2` — transform is owned by this hook).
 */
export function usePopoutFit(open, { centerX = false, padding = 8 } = {}) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !open) return undefined;

    const fit = () => {
      el.style.transform = centerX ? 'translateX(-50%)' : 'translateX(0px)';
      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth;
      let dx = 0;
      if (rect.left < padding) dx = padding - rect.left;
      if (rect.right + dx > vw - padding) {
        dx -= rect.right + dx - (vw - padding);
      }
      el.style.transform = centerX
        ? `translateX(calc(-50% + ${Math.round(dx)}px))`
        : `translateX(${Math.round(dx)}px)`;
    };

    fit();
    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    ro?.observe(el);
    window.addEventListener('resize', fit);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', fit);
      el.style.transform = '';
    };
  }, [open, centerX, padding]);

  return ref;
}

function assignRef(ref, value) {
  if (!ref) return;
  if (typeof ref === 'function') ref(value);
  else ref.current = value;
}

/**
 * Drop-in wrapper: same as a popout `div`, but slides horizontally to stay on-screen.
 */
export const FitPopout = forwardRef(function FitPopout(
  {
    open = true,
    centerX = false,
    padding = 8,
    className = '',
    children,
    ...rest
  },
  forwardedRef,
) {
  const fitRef = usePopoutFit(open, { centerX, padding });

  return (
    <div
      ref={(node) => {
        fitRef.current = node;
        assignRef(forwardedRef, node);
      }}
      className={className}
      {...rest}
    >
      {children}
    </div>
  );
});
