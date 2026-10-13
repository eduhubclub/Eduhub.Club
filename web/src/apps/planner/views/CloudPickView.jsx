import { useState } from 'react';
import { Folder, File, Plus } from 'lucide-react';
import { APP_GRID_CARD } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';
import { toolBtnClass } from '../../../shared/toolBtn';
import {
  listGoogleDriveFolder,
  parseGoogleDriveFolderId,
  searchGoogleDrive,
} from '../../../data/resources/googleDrivePicker';
import {
  listOneDriveChildren,
  searchOneDrive,
} from '../../../data/resources/oneDrivePicker';
import { addResource } from '../../../data/resources/resourceStorage';
import { newPlanId } from '../../../data/plan/planModel';
import { upsertPlanItem } from '../../../data/plan/planStorage';
import { resourceFromUrl } from '../../../data/resources/resourceModel';

/**
 * Search Google Drive / OneDrive and add link metadata (optional Day # assign).
 */
export function CloudPickView({
  theme,
  isDarkMode,
  classId,
  refresh,
}) {
  const toolBtn = toolBtnClass(isDarkMode);
  const fieldClass = `edu-control w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;
  const [provider, setProvider] = useState('google');
  const [query, setQuery] = useState('');
  const [folderUrl, setFolderUrl] = useState('');
  const [dayNumber, setDayNumber] = useState('');
  const [results, setResults] = useState([]);
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const runSearch = async () => {
    setBusy(true);
    setError('');
    setStatus('');
    try {
      let files = [];
      if (provider === 'google') {
        const listed = await searchGoogleDrive(query);
        setToken(listed.token);
        files = listed.files;
      } else {
        const listed = await searchOneDrive(query);
        setToken(listed.token);
        files = listed.files;
      }
      setResults(files);
      setStatus(
        `${files.length} ${provider === 'google' ? 'Drive' : 'OneDrive'} result${files.length === 1 ? '' : 's'}.`,
      );
    } catch (e) {
      setError(e?.message || 'Search failed.');
      setResults([]);
    } finally {
      setBusy(false);
    }
  };

  const linkFolderToDay = async () => {
    setBusy(true);
    setError('');
    setStatus('');
    const day = Math.round(Number(dayNumber));
    if (!Number.isFinite(day) || day < 1) {
      setError('Enter a Day # to bulk-link a folder.');
      setBusy(false);
      return;
    }
    try {
      let files = [];
      if (provider === 'google') {
        const folderId = parseGoogleDriveFolderId(folderUrl);
        if (!folderId) {
          setError('Paste a Google Drive folder URL.');
          setBusy(false);
          return;
        }
        const listed = await listGoogleDriveFolder(folderId, { token });
        setToken(listed.token);
        files = listed.files.filter((f) => !f.isFolder);
      } else {
        if (!folderUrl.trim()) {
          setError('Paste a OneDrive item id or open a folder from search first.');
          setBusy(false);
          return;
        }
        const listed = await listOneDriveChildren(folderUrl.trim(), { token });
        setToken(listed.token);
        files = listed.files.filter((f) => !f.isFolder);
      }
      let added = 0;
      for (const f of files) {
        const res = resourceFromUrl(f.url, {
          title: f.name,
          source: provider === 'google' ? 'google_drive' : 'onedrive',
          externalId: f.id,
          mimeType: f.mimeType,
        });
        if (!res) continue;
        addResource(classId, res);
        upsertPlanItem(classId, {
          id: newPlanId(),
          dayNumber: day,
          resourceIds: [res.id],
          title: f.name,
          status: 'planned',
          source: 'teacher',
        });
        added += 1;
      }
      setStatus(`Linked ${added} file(s) to Day #${day}.`);
      refresh();
    } catch (e) {
      setError(e?.message || 'Could not list folder.');
    } finally {
      setBusy(false);
    }
  };

  const addPick = (file) => {
    if (file.isFolder) {
      setFolderUrl(
        provider === 'google' ? file.url : file.id,
      );
      setStatus(`Folder selected: ${file.name}. Set Day # and Link folder.`);
      return;
    }
    const res = resourceFromUrl(file.url, {
      title: file.name,
      source: provider === 'google' ? 'google_drive' : 'onedrive',
      externalId: file.id,
      mimeType: file.mimeType,
    });
    if (!res) return;
    addResource(classId, res);
    const day = Math.round(Number(dayNumber));
    if (Number.isFinite(day) && day >= 1) {
      upsertPlanItem(classId, {
        id: newPlanId(),
        dayNumber: day,
        resourceIds: [res.id],
        title: file.name,
        status: 'planned',
        source: 'teacher',
      });
    }
    setStatus(
      Number.isFinite(day) && day >= 1
        ? `Added “${file.name}” to library and Day #${day}.`
        : `Added “${file.name}” to library.`,
    );
    refresh();
  };

  return (
    <div className="space-y-4">
      <div
        className={`${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} p-4 sm:p-5 space-y-3`}
      >
        <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>
          Search cloud files
        </p>
        <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
          Sign-in is only for picking files. We save the link, not the file.
          Add OAuth client IDs in Planner settings.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`edu-control ${toolBtn}`}
            onClick={() => setProvider('google')}
          >
            Google Drive{provider === 'google' ? ' ✓' : ''}
          </button>
          <button
            type="button"
            className={`edu-control ${toolBtn}`}
            onClick={() => setProvider('onedrive')}
          >
            OneDrive{provider === 'onedrive' ? ' ✓' : ''}
          </button>
        </div>
        <label className="block space-y-1">
          <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            Search
          </span>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className={fieldClass}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Week 6, Day 23…"
            />
            <button
              type="button"
              className={`edu-control ${toolBtn} shrink-0`}
              disabled={busy}
              onClick={runSearch}
            >
              {busy ? 'Working…' : 'Search'}
            </button>
          </div>
        </label>
        <label className="block space-y-1">
          <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            Optional Day # (assign on add)
          </span>
          <input
            type="number"
            min={1}
            className={fieldClass}
            value={dayNumber}
            onChange={(e) => setDayNumber(e.target.value)}
            placeholder="23"
          />
        </label>
        <label className="block space-y-1">
          <span className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
            Folder URL / id (bulk link)
          </span>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className={fieldClass}
              value={folderUrl}
              onChange={(e) => setFolderUrl(e.target.value)}
              placeholder={
                provider === 'google'
                  ? 'https://drive.google.com/drive/folders/…'
                  : 'OneDrive item id'
              }
            />
            <button
              type="button"
              className={`edu-control ${toolBtn} shrink-0`}
              disabled={busy}
              onClick={linkFolderToDay}
            >
              Link folder
            </button>
          </div>
        </label>
        {error ? (
          <p className={`${TYPE.bodySm} text-red-600`}>{error}</p>
        ) : null}
        {status ? (
          <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>{status}</p>
        ) : null}
      </div>

      {results.length ? (
        <ul className="space-y-2">
          {results.map((f) => (
            <li
              key={f.id}
              className={`${APP_GRID_CARD} ${theme.colorSurface} ${theme.colorOutline} p-3 flex items-center justify-between gap-3`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {f.isFolder ? (
                  <Folder className={`w-4 h-4 shrink-0 ${theme.colorPrimary}`} />
                ) : (
                  <File className={`w-4 h-4 shrink-0 ${theme.colorOnSurfaceVariant}`} />
                )}
                <div className="min-w-0">
                  <p className={`${TYPE.titleSm} ${theme.colorOnSurface} truncate`}>
                    {f.name}
                  </p>
                  <p className={`${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
                    {f.isFolder ? 'Folder' : f.mimeType || 'File'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={`edu-control ${toolBtn} shrink-0`}
                onClick={() => addPick(f)}
              >
                <Plus className="w-4 h-4" aria-hidden />
                {f.isFolder ? 'Use folder' : 'Add'}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
