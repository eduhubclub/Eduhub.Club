import { Backpack, School, Shield, Users } from 'lucide-react';
import { LogoHorizontal } from '../../shared/Logo';
import { GlyphScribble } from '../../shared/logoGlyphs';
import { ROLE_PRIMARY } from '../roleTheme';
import { NAV_HEIGHT, PRIMARY_SOLID_HEX } from '../../shared/theme';
import { TYPE } from '../../shared/typography';
import {
  LANDING_POPS,
  landingHandStyle,
  mutedInk,
  navLinkClass,
  paperCard,
  popFillStyle,
} from './landingStyle';

const ROLES = [
  { id: 'admin', label: 'Admin', Icon: Shield },
  { id: 'teacher', label: 'Teacher', Icon: School },
  { id: 'student', label: 'Student', Icon: Backpack },
  { id: 'parent', label: 'Parent', Icon: Users },
].map((role) => ({ ...role, pop: PRIMARY_SOLID_HEX[ROLE_PRIMARY[role.id]] }));

function jumpTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function NavJump({ away, id, className, children }) {
  if (away) {
    return (
      <a href={`/#${id}`} className={className}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={className} onClick={() => jumpTo(id)}>
      {children}
    </button>
  );
}

/**
 * Same pin as the teacher header: shrink-0 outside the scrolling main,
 * not position:sticky on the page.
 */
export function LandingNav({ theme, onSignIn, onSignUp, scrolled = false, away = false }) {
  return (
    <header
      aria-label="Landing"
      className={`grid grid-cols-3 items-center border-b-[1.5px] z-20 shrink-0 px-3 sm:px-4 transition-[border-color] duration-300 ease-in-out ${NAV_HEIGHT} ${theme.colorSurface}`}
      style={{ borderBottomColor: scrolled ? '#cbd5e1' : 'transparent' }}
    >
      <nav className="flex items-center justify-start gap-1 sm:gap-2" aria-label="Landing">
        <NavJump away={away} id="why" className={navLinkClass}>
          Why
        </NavJump>
        <NavJump away={away} id="apps" className={navLinkClass}>
          Apps
        </NavJump>
        <NavJump away={away} id="demo" className={navLinkClass}>
          Demo
        </NavJump>
      </nav>
      {away ? (
        <a href="/" aria-label="Edu.Hub home" className="justify-self-center">
          <LogoHorizontal className="h-7 w-auto" />
        </a>
      ) : (
        <LogoHorizontal className="h-7 w-auto justify-self-center" />
      )}
      <div className="flex items-center justify-end gap-1 sm:gap-2">
        {away ? (
          <a href="/#sign-in" className={navLinkClass}>
            Sign in
          </a>
        ) : (
          <button type="button" className={navLinkClass} onClick={onSignIn}>
            Sign in
          </button>
        )}
        {away ? (
          <a
            href="/#sign-up"
            className={`edu-control rounded-full px-4 py-2 ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
          >
            Sign up
          </a>
        ) : (
          <button
            type="button"
            className={`edu-control rounded-full px-4 py-2 ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
            onClick={onSignUp}
          >
            Sign up
          </button>
        )}
      </div>
    </header>
  );
}

/**
 * Handmade headline and the four sign-in cards.
 */
export function LandingHero({ onChooseRole }) {
  return (
    <div>
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-10 sm:px-8 sm:pt-16">
        <div className="relative flex flex-col items-start gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p
              className="inline-block -rotate-2 rounded-full px-4 py-1 text-2xl leading-none"
              style={{ ...landingHandStyle, ...popFillStyle(LANDING_POPS.rose) }}
            >
              Hi there!
            </p>
            <h1 className="mt-5 max-w-xl font-serif text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              Join the
              <span className="block">Eduhub Club</span>
              for all your school needs.
            </h1>
            <GlyphScribble className="mt-2 h-10 w-24 -rotate-6 text-sky-500" />
            <p className={`mt-4 max-w-md text-base leading-relaxed sm:text-lg ${mutedInk}`}>
              Sign in and keep those moments going — classes, tools, and the day, in one place.
            </p>
          </div>

          <div id="sign-in" className="w-full scroll-mt-6">
            <p className={`${TYPE.labelMicro} text-center ${mutedInk}`}>Choose how you are signing in</p>
            <div className="mt-3 flex flex-wrap justify-center gap-3 sm:flex-nowrap">
              {ROLES.map(({ id, label, Icon, pop }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onChooseRole(id)}
                  className={`edu-control flex aspect-square w-[7.25rem] shrink-0 flex-col items-center justify-center gap-2 rounded-3xl border-[1.5px] text-center shadow-sm ${paperCard}`}
                >
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full"
                    style={popFillStyle(pop)}
                  >
                    <Icon size={22} />
                  </span>
                  <span className={TYPE.titleSm}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
