import { TYPE } from '../../shared/typography';
import { mutedInk } from './landingStyle';

/**
 * Official platform colors — do not theme these marks.
 * Drop real profile URLs into `href` when the accounts exist.
 */
const LINK_GROUPS = [
  {
    title: 'Help',
    links: [
      { label: 'Help Center', href: '/help' },
      { label: 'Contact', href: '/contact' },
      { label: 'Guides', href: '/guides' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', id: '' },
      { label: 'Careers', id: '' },
      { label: 'Press', id: '' },
    ],
  },
  {
    title: 'Blog',
    links: [
      { label: 'Stories', id: '' },
      { label: 'Classroom ideas', id: '' },
      { label: "What's new", id: '' },
    ],
  },
  {
    title: 'Product',
    links: [
      { label: 'Why', id: 'why' },
      { label: 'Apps', id: 'apps' },
      { label: 'Demo', id: 'demo' },
      { label: 'Sign in', id: 'sign-in' },
    ],
  },
];

const SOCIAL = [
  { id: 'instagram', label: 'Instagram', href: '', Mark: InstagramMark, color: '#E4405F' },
  { id: 'youtube', label: 'YouTube', href: '', Mark: YouTubeMark, color: '#FF0000' },
  { id: 'facebook', label: 'Facebook', href: '', Mark: FacebookMark, color: '#1877F2' },
];

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t-[1.5px] border-slate-300 bg-white">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-4 py-10 sm:grid-cols-4 sm:px-8 sm:py-12">
        {LINK_GROUPS.map((group) => (
          <div key={group.title}>
            <p className={`${TYPE.titleSm} text-stone-900`}>{group.title}</p>
            <ul className="mt-3 space-y-2">
              {group.links.map((link) => (
                <li key={link.label}>
                  {link.href ? (
                    <a href={link.href} className={`edu-control ${TYPE.bodyMd} ${mutedInk}`}>
                      {link.label}
                    </a>
                  ) : (
                    <button
                      type="button"
                      className={`edu-control ${TYPE.bodyMd} ${mutedInk}`}
                      onClick={() => {
                        if (!link.id) return;
                        document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    >
                      {link.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t-[1.5px] border-slate-300">
      <div className="relative mx-auto flex max-w-5xl items-center justify-end px-4 py-8 sm:px-8">
        <p className={`absolute left-1/2 -translate-x-1/2 text-center ${TYPE.bodySm} ${mutedInk}`}>
          © {year} Edu.Hub. All rights reserved.
        </p>
        <ul className="ml-auto flex items-center justify-end gap-2">
          {SOCIAL.map(({ id, label, href, Mark, color }) => (
            <li key={id}>
              <SocialLink href={href} label={label} color={color}>
                <Mark />
              </SocialLink>
            </li>
          ))}
        </ul>
      </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, label, color, children }) {
  const className = 'edu-control inline-flex h-10 w-10 items-center justify-center rounded-full text-white';
  const style = { backgroundColor: color };
  if (!href) {
    return (
      <span className={className} style={style} role="img" aria-label={label} title={label}>
        {children}
      </span>
    );
  }
  return (
    <a href={href} className={className} style={style} aria-label={label} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

function InstagramMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="#ffffff" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="#ffffff" strokeWidth="2" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="#ffffff" />
    </svg>
  );
}

function YouTubeMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#ffffff" d="M10 8.2v7.6l6.4-3.8L10 8.2z" />
    </svg>
  );
}

function FacebookMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        fill="#ffffff"
        d="M14.5 8.5V6.8c0-.7.5-1 1.2-1H17V3h-2.1C12.4 3 11 4.4 11 6.6v1.9H9v2.7h2V21h3.5v-9.8h2.3l.4-2.7h-2.7z"
      />
    </svg>
  );
}
