import { useEffect, useRef, useState } from 'react';
import { getTheme } from '../shared/theme';
import { RoleLoginModal } from './RoleLoginModal';
import { ComingSoonPage } from './landing/ComingSoonPage';
import { comingSoonPage } from './landing/comingSoonPages';
import { LandingFooter } from './landing/LandingFooter';
import { LandingHero, LandingNav } from './landing/LandingHero';
import { LandingSections } from './landing/LandingSections';
import { DemoSection } from './landing/DemoSection';
import { ensureLandingHandFont, paperCanvas } from './landing/landingStyle';
import { readSignInRole, rememberSignInRole } from './signinPreference';
import { DEMO_EMAIL, DEMO_PASSWORD } from './demoAccount';
import { parseInviteToken } from './inviteArrival';
import { peekAccountInvite } from '../data/auth/inviteApi';

export function LandingPage() {
  const page = comingSoonPage(window.location.pathname);
  const [role, setRole] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [demoPrefill, setDemoPrefill] = useState(false);
  const [inviteToken, setInviteToken] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const mainRef = useRef(null);
  const theme = getTheme('Blue', false);

  useEffect(() => {
    const onScroll = () => {
      const mainTop = mainRef.current?.scrollTop || 0;
      const pageTop = window.scrollY || document.documentElement.scrollTop || 0;
      setScrolled(mainTop > 0 || pageTop > 0);
    };
    onScroll();
    document.addEventListener('scroll', onScroll, { passive: true, capture: true });
    return () => document.removeEventListener('scroll', onScroll, { capture: true });
  }, []);

  useEffect(() => {
    ensureLandingHandFont();
  }, []);

  useEffect(() => {
    const token = parseInviteToken();
    if (!token) return undefined;
    let cancelled = false;
    peekAccountInvite(token)
      .then((invite) => {
        if (cancelled || !invite?.role) return;
        rememberSignInRole(invite.role);
        setInviteToken(token);
        setInviteEmail(invite.email || '');
        setInviteRole(invite.role);
        setAuthMode('signup');
        setDemoPrefill(false);
        setRole(invite.role);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (page) {
      document.title = `${page.title} · Edu.Hub`;
      return undefined;
    }
    document.title = 'Edu.Hub';
    if (parseInviteToken()) return undefined;
    const hash = window.location.hash.replace('#', '');
    if (hash === 'sign-up') setAuthMode('signup');
    const id = hash === 'sign-up' ? 'sign-in' : hash;
    if (!id) return undefined;
    const frame = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [page]);

  function chooseRole(next) {
    rememberSignInRole(next);
    setAuthMode('login');
    setDemoPrefill(false);
    setRole(next);
  }

  function chooseDemo(next) {
    rememberSignInRole(next);
    setAuthMode('login');
    setDemoPrefill(true);
    setRole(next);
  }

  function openSignIn(mode) {
    setAuthMode(mode);
    setDemoPrefill(false);
    const saved = readSignInRole();
    if (saved) {
      setRole(saved);
      return;
    }
    document.getElementById('sign-in')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className={`flex h-dvh flex-col overflow-hidden [color-scheme:light] ${paperCanvas}`}>
      <LandingNav
        theme={theme}
        away={Boolean(page)}
        onSignIn={() => openSignIn('login')}
        onSignUp={() => openSignIn('signup')}
        scrolled={scrolled}
      />
      <main
        ref={mainRef}
        className="relative z-0 min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
      >
        {page ? (
          <ComingSoonPage title={page.title} theme={theme} />
        ) : (
          <>
            <LandingHero onChooseRole={chooseRole} />
            <DemoSection onChooseRole={chooseDemo} />
            <LandingSections />
          </>
        )}
        <LandingFooter />
      </main>

      {role ? (
        <RoleLoginModal
          key={`${role}-${demoPrefill ? 'demo' : inviteToken || 'account'}`}
          role={role}
          isDarkMode={false}
          initialMode={authMode}
          initialEmail={demoPrefill ? DEMO_EMAIL : role === inviteRole ? inviteEmail : ''}
          initialPassword={demoPrefill ? DEMO_PASSWORD : ''}
          inviteToken={role === inviteRole ? inviteToken : ''}
          onClose={() => {
            setDemoPrefill(false);
            setRole(null);
          }}
        />
      ) : null}
    </div>
  );
}
