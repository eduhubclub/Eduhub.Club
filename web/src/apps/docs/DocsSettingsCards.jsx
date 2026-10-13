import { useEffect, useState } from 'react';
import { TYPE } from '../../shared/typography';
import {
  readCloudOauthSettings,
  writeCloudOauthSettings,
} from '../../data/resources/oneDrivePicker';

/**
 * Docs cloud OAuth (shared with Planner picker settings).
 */
export function DocsSettingsCards({ theme, isDarkMode, Card }) {
  const [cloud, setCloud] = useState(readCloudOauthSettings);

  useEffect(() => {
    const refresh = () => setCloud(readCloudOauthSettings());
    window.addEventListener('eduHub.cloud.oauth.updated', refresh);
    return () => window.removeEventListener('eduHub.cloud.oauth.updated', refresh);
  }, []);

  const fieldClass = `edu-control w-full max-w-sm rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;

  return (
    <Card
      title="Cloud OAuth (Docs)"
      description="Save and open .edudoc files under Edu.Hub/Docs. Same client IDs as Planner. Cloud copies stay in Edu.Hub format so Word won’t rewrite them."
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
  );
}
