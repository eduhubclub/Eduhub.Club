import { useEffect, useMemo, useRef, useState } from 'react';
import { Lock, Search, Unlock, X } from 'lucide-react';
import { apps } from '../../index';
import { useAppThemePreferences } from '../../../data/settings/AppThemePreferencesContext';
import {
  APP_ROLE_FILTERS,
  appsForRoleFilter,
  audiencesForApp,
  isAppBlockedForParents,
  isAppBlockedForStudents,
  isAppBlockedForTeachers,
  readDistrictAppAccess,
  roleLabelForApp,
  withAppBlocked,
  writeDistrictAppAccess,
} from '../../../data/district/districtAppAccess';
import { districtQuietButton } from '../fields';
import { AppBoard } from '../../../shared/AppBoard';
import { AppPageShell } from '../../../shared/AppPageShell';
import { ContentCardGrid } from '../../../shared/ContentCardGrid';
import { EmptyState } from '../../../shared/EmptyState';
import { PageHeader } from '../../../shared/PageHeader';
import { SegmentControl } from '../../../shared/SegmentControl';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';

function audienceBlocked(appId, audience, access) {
  if (audience === 'teacher') return isAppBlockedForTeachers(appId, access);
  if (audience === 'student') return isAppBlockedForStudents(appId, access);
  if (audience === 'parent') return isAppBlockedForParents(appId, access);
  return false;
}

function audienceLabel(audience) {
  if (audience === 'teacher') return 'teachers';
  if (audience === 'student') return 'students';
  if (audience === 'parent') return 'parents';
  return audience;
}

/**
 * DistrictHub Apps — browse by role; Manage reveals block controls for that role.
 */
export function AppsView({ canEdit = true, onOpenApp, isDarkMode, theme }) {
  const { getLauncherColor } = useAppThemePreferences();
  const [roleFilter, setRoleFilter] = useState('admin');
  const [managing, setManaging] = useState(false);
  const [access, setAccess] = useState(() => readDistrictAppAccess());
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const manageAudience =
    roleFilter === 'teacher' || roleFilter === 'student' || roleFilter === 'parent'
      ? roleFilter
      : null;

  const visible = useMemo(() => {
    let list = appsForRoleFilter(roleFilter);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((app) => {
      const hay = [app.name, app.description, roleLabelForApp(app.id)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [roleFilter, searchQuery]);

  const setBlocked = (audience, appId, blocked) => {
    if (!canEdit || !managing) return;
    setAccess(writeDistrictAppAccess(withAppBlocked(access, audience, appId, blocked)));
  };

  const toolBtn = toolBtnClass(isDarkMode);

  return (
    <AppPageShell variant="scroll">
      <PageHeader
        title="Apps"
        description={
          managing && canEdit
            ? manageAudience
              ? `Managing ${audienceLabel(manageAudience)} — turn apps on or off for that role.`
              : 'Admin apps stay with DistrictHub. Switch to Teachers, Students, or Parents to manage access.'
            : canEdit
              ? 'Browse Edu.Hub apps by role. Use Manage to block tools for teachers, students, or parents.'
              : 'Edu.Hub apps available in this district, organized by role.'
        }
        isDarkMode={isDarkMode}
        actions={
          <div className="flex flex-nowrap items-center justify-end gap-2">
            {canEdit ? (
              <button
                type="button"
                className={districtQuietButton(theme)}
                aria-pressed={managing}
                onClick={() => setManaging((value) => !value)}
              >
                {managing ? 'Done' : 'Manage'}
              </button>
            ) : null}
            <div className="relative shrink-0">
              <button
                type="button"
                className={`${toolBtn}${searchOpen ? ' invisible' : ''}`}
                onClick={() => setSearchOpen(true)}
                aria-label="Search apps"
                tabIndex={searchOpen ? -1 : undefined}
                aria-hidden={searchOpen || undefined}
              >
                <Search size={16} />
                Search
              </button>
              {searchOpen ? (
                <div
                  className={`absolute right-0 top-0 z-20 flex h-9 w-[min(70vw,16rem)] items-center overflow-hidden rounded-xl border-[1.5px] shadow-sm ${
                    isDarkMode ? 'border-slate-600 bg-slate-900' : 'border-slate-300 bg-white'
                  }`}
                >
                  <Search size={16} className={`ml-3 shrink-0 ${theme.text}`} />
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search apps..."
                    className={`h-full min-w-0 flex-1 appearance-none bg-transparent px-2 text-sm outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none ${
                      isDarkMode
                        ? 'text-white placeholder-slate-500'
                        : 'text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <button
                    type="button"
                    className={`edu-control p-2 ${theme.colorOnSurfaceVariant}`}
                    aria-label="Close search"
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        }
      />

      <div className="mb-4 overflow-x-auto">
        <SegmentControl
          isDarkMode={isDarkMode}
          theme={theme}
          value={roleFilter}
          onChange={setRoleFilter}
          options={APP_ROLE_FILTERS}
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState
          isDarkMode={isDarkMode}
          message={
            searchQuery.trim()
              ? 'No apps match that search.'
              : roleFilter === 'parent'
                ? 'Parent apps will show here as they are added.'
                : 'No apps in this role filter.'
          }
        />
      ) : (
        <ContentCardGrid>
          {visible.map((app) => {
            const Icon = app.icon;
            const available = Boolean(apps[app.id]);
            const color = getLauncherColor?.(app) || app.color || 'bg-slate-500';
            const blockedForRole = manageAudience
              ? audienceBlocked(app.id, manageAudience, access)
              : false;
            const canManageThis =
              managing &&
              canEdit &&
              manageAudience &&
              audiencesForApp(app.id).includes(manageAudience);
            const canOpen = available && !managing && typeof onOpenApp === 'function';

            const openApp = () => {
              if (!canOpen) return;
              onOpenApp(app.id);
            };

            return (
              <AppBoard
                key={app.id}
                mode="grid"
                pad="stage"
                theme={theme}
                role={canOpen ? 'button' : undefined}
                tabIndex={canOpen ? 0 : undefined}
                aria-label={canOpen ? `Open ${app.name}` : undefined}
                onClick={canOpen ? openApp : undefined}
                onKeyDown={
                  canOpen
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openApp();
                        }
                      }
                    : undefined
                }
                className={`relative ${blockedForRole ? 'opacity-90' : ''} ${
                  canOpen
                    ? `edu-control cursor-pointer ${theme.hoverBg || ''}`
                    : ''
                }`}
              >
                {canManageThis ? (
                  <button
                    type="button"
                    aria-pressed={blockedForRole}
                    aria-label={
                      blockedForRole
                        ? `Unlock ${app.name} for ${audienceLabel(manageAudience)}`
                        : `Lock ${app.name} for ${audienceLabel(manageAudience)}`
                    }
                    onClick={(event) => {
                      event.stopPropagation();
                      setBlocked(manageAudience, app.id, !blockedForRole);
                    }}
                    className={`edu-control absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-xl border-[1.5px] ${
                      blockedForRole
                        ? `${theme.colorError} ${theme.colorOnError} border-transparent`
                        : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`
                    }`}
                  >
                    {blockedForRole ? (
                      <Lock size={16} strokeWidth={2.25} aria-hidden />
                    ) : (
                      <Unlock size={16} strokeWidth={2.25} aria-hidden />
                    )}
                  </button>
                ) : !managing && manageAudience && blockedForRole ? (
                  <span
                    className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-xl ${theme.colorOnSurfaceVariant}`}
                    title={`Blocked for ${audienceLabel(manageAudience)}`}
                    aria-label={`Blocked for ${audienceLabel(manageAudience)}`}
                  >
                    <Lock size={16} strokeWidth={2.25} aria-hidden />
                  </span>
                ) : null}
                <div className={`flex items-start gap-3 ${canManageThis || blockedForRole ? 'pr-10' : ''}`}>
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white ${color}`}
                    aria-hidden
                  >
                    {Icon ? <Icon size={22} strokeWidth={2} /> : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>{app.name}</h2>
                    <p className={`mt-1 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                      {app.description}
                    </p>
                    {managing && roleFilter === 'admin' ? (
                      <p className={`mt-3 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                        Admin-only — not shown to teachers, students, or parents.
                      </p>
                    ) : null}
                  </div>
                </div>
              </AppBoard>
            );
          })}
        </ContentCardGrid>
      )}
    </AppPageShell>
  );
}
