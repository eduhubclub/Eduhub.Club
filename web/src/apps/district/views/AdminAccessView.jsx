import { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import {
  APP_ACCESS_ACTORS,
  APP_ACCESS_ROLE_FOCUS,
  adminAccessTableRowsForFocus,
  canConfigureAdminAccess,
  readDistrictAdminAccess,
  roleHasChangeCapability,
  roleHasSurface,
  roleHasToolApp,
  withChangeCapabilityToggle,
  withRoleSurface,
  withToolAppActorToggle,
  writeDistrictAdminAccess,
} from '../../../data/district/districtAdminAccess';
import { districtQuietButton } from '../fields';
import { AppBoard } from '../../../shared/AppBoard';
import { AppPageShell } from '../../../shared/AppPageShell';
import { PageHeader } from '../../../shared/PageHeader';
import { SegmentControl } from '../../../shared/SegmentControl';
import { TYPE } from '../../../shared/typography';

function CellToggle({ pressed, disabled, label, onToggle, theme }) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={pressed}
      aria-label={label}
      onClick={onToggle}
      className={`edu-control mx-auto flex h-9 w-9 items-center justify-center rounded-xl border-[1.5px] ${
        pressed
          ? `${theme.colorPrimary} ${theme.colorOnPrimary} border-transparent`
          : `${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurfaceVariant}`
      } ${disabled ? 'opacity-60' : ''}`}
    >
      {pressed ? <Check size={16} strokeWidth={2.5} aria-hidden /> : null}
    </button>
  );
}

/**
 * DistrictHub App Access — apps × roles matrix, filterable by role.
 */
export function AdminAccessView({ canEdit = true, session, isDarkMode, theme }) {
  const [access, setAccess] = useState(() => readDistrictAdminAccess());
  const [focusRole, setFocusRole] = useState('teacher');
  const [connectedOnly, setConnectedOnly] = useState(true);
  const canConfigure = canEdit && canConfigureAdminAccess(session);

  const actors =
    focusRole === 'all'
      ? APP_ACCESS_ACTORS
      : APP_ACCESS_ACTORS.filter((row) => row.id === focusRole);

  const rows = useMemo(
    () => adminAccessTableRowsForFocus(access, focusRole, focusRole !== 'all' && connectedOnly),
    [access, focusRole, connectedOnly],
  );

  const toggleCell = (row, actorId) => {
    if (!canConfigure) return;
    if (row.kind === 'surface') {
      const on = roleHasSurface(access, actorId, row.surfaceId);
      setAccess(writeDistrictAdminAccess(withRoleSurface(access, actorId, row.surfaceId, !on)));
      return;
    }
    if (row.kind === 'change' && row.capabilityId) {
      const on = roleHasChangeCapability(access, actorId, row.capabilityId);
      setAccess(
        writeDistrictAdminAccess(
          withChangeCapabilityToggle(access, row.capabilityId, actorId, !on),
        ),
      );
      return;
    }
    if (row.kind === 'app' && row.toolAppId) {
      const on = roleHasToolApp(access, actorId, row.toolAppId, row.surfaceId);
      setAccess(
        writeDistrictAdminAccess(
          withToolAppActorToggle(access, row.toolAppId, actorId, !on, row.surfaceId),
        ),
      );
    }
  };

  const cellOn = (row, actorId) => {
    if (row.kind === 'surface') return roleHasSurface(access, actorId, row.surfaceId);
    if (row.kind === 'change') return roleHasChangeCapability(access, actorId, row.capabilityId);
    if (row.kind === 'app') return roleHasToolApp(access, actorId, row.toolAppId, row.surfaceId);
    return false;
  };

  return (
    <AppPageShell variant="scroll">
      <PageHeader
        title="App Access"
        description={
          canConfigure
            ? 'Pick a role to see the apps connected to that user. Turn off Connected only to add more apps from the full list.'
            : 'Apps and tasks across roles. Only principal, assistant principal, and district admin can change this matrix.'
        }
        isDarkMode={isDarkMode}
        actions={
          focusRole !== 'all' ? (
            <button
              type="button"
              className={districtQuietButton(theme)}
              aria-pressed={connectedOnly}
              onClick={() => setConnectedOnly((value) => !value)}
            >
              {connectedOnly ? 'Connected only' : 'All apps'}
            </button>
          ) : null
        }
      />

      <div className="mb-4 overflow-x-auto">
        <SegmentControl
          isDarkMode={isDarkMode}
          theme={theme}
          value={focusRole}
          onChange={(id) => {
            setFocusRole(id);
            if (id !== 'all') setConnectedOnly(true);
          }}
          options={APP_ACCESS_ROLE_FOCUS}
        />
      </div>

      {!canConfigure ? (
        <AppBoard mode="static" theme={theme} className="mb-4">
          <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
            You’re viewing district access. Ask a principal or district admin if something should
            change.
          </p>
        </AppBoard>
      ) : null}

      {rows.length === 0 ? (
        <AppBoard mode="static" theme={theme}>
          <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
            No apps connected to this role yet. Switch to All apps to attach tools.
          </p>
        </AppBoard>
      ) : (
        <AppBoard mode="static" pad="none" theme={theme} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className={theme.colorSurfaceVariant || theme.colorSurface}>
                  <th
                    scope="col"
                    className={`sticky left-0 z-20 min-w-[14rem] border-b-[1.5px] px-4 py-3 text-left ${TYPE.labelMd} ${theme.colorOutline} ${theme.colorSurface} ${theme.colorOnSurface}`}
                  >
                    App / task
                  </th>
                  {actors.map((actor) => (
                    <th
                      key={actor.id}
                      scope="col"
                      className={`min-w-[7.5rem] border-b-[1.5px] px-2 py-3 text-center ${TYPE.labelMd} ${theme.colorOutline} ${theme.colorOnSurface}`}
                    >
                      {actor.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isApp = row.depth === 0;
                  return (
                    <tr key={row.id}>
                      <th
                        scope="row"
                        className={`sticky left-0 z-10 border-b-[1.5px] px-4 py-3 text-left ${theme.colorOutline} ${theme.colorSurface} ${
                          isApp ? TYPE.titleSm : TYPE.bodySm
                        } ${theme.colorOnSurface} ${row.depth === 1 ? 'pl-8 font-normal' : ''}`}
                      >
                        <span className="block">{row.label}</span>
                        {row.description && isApp ? (
                          <span
                            className={`mt-0.5 block font-normal ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
                          >
                            {row.description}
                          </span>
                        ) : null}
                        {row.description && !isApp ? (
                          <span className="sr-only">{row.description}</span>
                        ) : null}
                      </th>
                      {actors.map((actor) => {
                        const on = cellOn(row, actor.id);
                        return (
                          <td
                            key={actor.id}
                            className={`border-b-[1.5px] px-2 py-2 text-center ${theme.colorOutline}`}
                          >
                            <CellToggle
                              pressed={on}
                              disabled={!canConfigure}
                              label={`${on ? 'Disable' : 'Enable'} ${row.label} for ${actor.label}`}
                              theme={theme}
                              onToggle={() => toggleCell(row, actor.id)}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AppBoard>
      )}
    </AppPageShell>
  );
}
