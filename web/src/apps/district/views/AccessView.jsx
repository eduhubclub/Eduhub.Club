import { useEffect, useMemo, useState } from 'react';
import { AppPageShell } from '../../../shared/AppPageShell';
import { AppBoard } from '../../../shared/AppBoard';
import { EmptyState } from '../../../shared/EmptyState';
import { PageHeader } from '../../../shared/PageHeader';
import { TYPE } from '../../../shared/typography';
import {
  ACCESS_ACTORS,
  ACCESS_CAPABILITIES,
  accessPolicyForSchool,
  canUseCapability,
  sessionAccessActor,
  withAccessCapabilityActors,
} from '../../../data/district/districtModel';

/**
 * School access settings — who may add students, staff, classes, etc.
 */
export function AccessView({
  org,
  school,
  session,
  access = 'edit',
  onSavePolicy,
  isDarkMode,
  theme,
}) {
  const actor = sessionAccessActor(session);
  const stored = useMemo(
    () => (school ? accessPolicyForSchool(org, school.id) : null),
    [org, school],
  );
  const [draft, setDraft] = useState(stored);
  const canConfigure =
    access === 'edit' && canUseCapability(stored, 'editAccess', actor);

  useEffect(() => {
    setDraft(stored);
  }, [stored, school?.id]);

  if (!school) {
    return (
      <AppPageShell variant="page">
        <PageHeader
          title="Access"
          description="Control who can change this building."
          isDarkMode={isDarkMode}
        />
        <EmptyState isDarkMode={isDarkMode} message="Open a school to manage access." />
      </AppPageShell>
    );
  }

  const toggleActor = (capabilityId, actorId) => {
    if (!canConfigure || !draft) return;
    const current = draft[capabilityId] || [];
    const next = current.includes(actorId)
      ? current.filter((id) => id !== actorId)
      : [...current, actorId];
    // Keep at least one actor so a capability never goes orphaned.
    if (next.length === 0) return;
    const policy = withAccessCapabilityActors(draft, capabilityId, next);
    setDraft(policy);
    onSavePolicy?.(school.id, policy);
  };

  return (
    <AppPageShell variant="scroll">
      <PageHeader
        title="Access"
        description={
          canConfigure
            ? `Building permissions for ${school.name}. District defaults live under DistrictHub → App Access; refine who can change this school here.`
            : `Permissions for ${school.name}. Only district admins and principals can change these settings.`
        }
        isDarkMode={isDarkMode}
      />

      {!canConfigure ? (
        <AppBoard mode="static" theme={theme} className="mb-4">
          <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
            You’re viewing access rules. Ask a principal or district admin if something should
            change.
          </p>
        </AppBoard>
      ) : null}

      <ul className="flex flex-col gap-3">
        {ACCESS_CAPABILITIES.map((capability) => {
          const selected = draft?.[capability.id] || [];
          return (
            <li key={capability.id}>
              <AppBoard mode="static" theme={theme}>
                <div className="mb-3">
                  <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>{capability.label}</h2>
                  <p className={`mt-1 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                    {capability.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label={capability.label}>
                  {ACCESS_ACTORS.map((row) => {
                    const active = selected.includes(row.id);
                    return (
                      <button
                        key={row.id}
                        type="button"
                        disabled={!canConfigure}
                        aria-pressed={active}
                        onClick={() => toggleActor(capability.id, row.id)}
                        className={`edu-control rounded-full border-[1.5px] px-3 py-1.5 ${TYPE.labelMd} ${
                          active
                            ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
                            : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`
                        } ${canConfigure ? '' : 'opacity-80'}`}
                      >
                        {row.label}
                      </button>
                    );
                  })}
                </div>
              </AppBoard>
            </li>
          );
        })}
      </ul>
    </AppPageShell>
  );
}
