import { useEffect, useState } from 'react';
import { useClasses } from '../../data/classes/ClassContext';
import { TYPE } from '../../shared/typography';
import {
  readDistrictPlanDefaults,
  writeDistrictPlanDefaults,
  resetPlanToDistrict,
  readPlan,
  PLAN_UPDATED_EVENT,
} from '../../data/plan/planStorage';
import {
  readCloudOauthSettings,
  writeCloudOauthSettings,
} from '../../data/resources/oneDrivePicker';

/**
 * Planner controls on the shell Settings page.
 */
export function PlannerSettingsCards({ theme, isDarkMode, Card }) {
  const { selectedClass } = useClasses();
  const classId = selectedClass?.id;
  const [cloud, setCloud] = useState(readCloudOauthSettings);
  const [planCount, setPlanCount] = useState(
    () => readPlan(classId).items?.length || 0,
  );
  const [districtPlanCount, setDistrictPlanCount] = useState(
    () => readDistrictPlanDefaults()?.items?.length || 0,
  );

  useEffect(() => {
    const refresh = () => {
      setCloud(readCloudOauthSettings());
      setPlanCount(readPlan(classId).items?.length || 0);
      setDistrictPlanCount(readDistrictPlanDefaults()?.items?.length || 0);
    };
    refresh();
    window.addEventListener(PLAN_UPDATED_EVENT, refresh);
    window.addEventListener('eduHub.cloud.oauth.updated', refresh);
    return () => {
      window.removeEventListener(PLAN_UPDATED_EVENT, refresh);
      window.removeEventListener('eduHub.cloud.oauth.updated', refresh);
    };
  }, [classId]);

  const fieldClass = `edu-control w-full max-w-sm rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;
  const classLabel = selectedClass?.name || 'No class selected';

  return (
    <>
      <Card
        title="Cloud OAuth (picker only)"
        description="Short-lived sign-in to search Drive / OneDrive. We never store file bytes."
        isDarkMode={isDarkMode}
      >
        <div className="px-5 sm:px-6 py-5 sm:py-6 space-y-4">
          <label className="block space-y-1">
            <span className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
              Google OAuth client ID
            </span>
            <input
              className={fieldClass}
              value={cloud.googleClientId}
              placeholder="….apps.googleusercontent.com"
              onChange={(e) =>
                setCloud(writeCloudOauthSettings({ googleClientId: e.target.value }))
              }
            />
          </label>
          <label className="block space-y-1">
            <span className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
              Microsoft app (client) ID
            </span>
            <input
              className={fieldClass}
              value={cloud.microsoftClientId}
              placeholder="Azure app registration GUID"
              onChange={(e) =>
                setCloud(
                  writeCloudOauthSettings({ microsoftClientId: e.target.value }),
                )
              }
            />
          </label>
        </div>
      </Card>

      <Card
        title="District plan defaults"
        description={`${classLabel} · Publish this class’s curriculum queue as a district template.`}
        isDarkMode={isDarkMode}
      >
        <div className="px-5 sm:px-6 py-5 sm:py-6 space-y-3">
          <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            {districtPlanCount
              ? `District plan has ${districtPlanCount} item(s).`
              : 'No district plan defaults yet.'}
            {classId ? ` This class has ${planCount} planned item(s).` : ''}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
              disabled={!classId}
              onClick={() => {
                writeDistrictPlanDefaults(readPlan(classId));
                setDistrictPlanCount(
                  readDistrictPlanDefaults()?.items?.length || 0,
                );
              }}
            >
              Publish class plan → district
            </button>
            <button
              type="button"
              className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
              disabled={!classId}
              onClick={() => {
                resetPlanToDistrict(classId);
                setPlanCount(readPlan(classId).items?.length || 0);
              }}
            >
              Reset class plan to district
            </button>
            <button
              type="button"
              className={`edu-control rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
              onClick={() => {
                writeDistrictPlanDefaults(null);
                setDistrictPlanCount(0);
              }}
            >
              Clear district plan
            </button>
          </div>
        </div>
      </Card>
    </>
  );
}
