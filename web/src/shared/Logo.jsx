export const LogoHorizontal = ({ className = 'h-8 w-auto' }) => (
  <svg viewBox="0 0 100 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="9.5" className="text-rose-500" />
    <path d="M37 3 L46 19 H28 L37 3 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className="text-amber-500" />
    <rect x="53" y="2.5" width="19" height="19" rx="3" className="text-emerald-500" />
    <path d="M88 4 C 96 4, 98 12, 94 18 C 88 24, 78 18, 80 10 C 82 4, 94 8, 92 14 C 90 20, 82 18, 84 12 C 86 6, 92 10, 88 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-sky-500" />
  </svg>
);

export const LogoIcon2x2 = ({ className = 'w-16 h-16', monochrome = false }) => (
  <svg viewBox="0 0 44 44" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="10" cy="10" r="8" className={monochrome ? undefined : 'text-rose-500'} />
    <path
      d="M34 2 L42 18 H26 L34 2 Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      className={monochrome ? undefined : 'text-amber-500'}
    />
    <rect x="2" y="26" width="16" height="16" rx="3" className={monochrome ? undefined : 'text-emerald-500'} />
    <path
      d="M34 26 C 40 26, 42 32, 39 36 C 34 41, 27 37, 28 31 C 29 27, 38 30, 37 34 C 36 38, 30 37, 31 32 C 32 28, 37 31, 34 35"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={monochrome ? undefined : 'text-sky-500'}
    />
  </svg>
);
