import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  LayoutGrid,
  Search,
  ListFilter,
  Plus,
  X,
  FolderPlus,
  Folder,
  Check,
  MoreVertical,
  EyeOff,
  Eye,
  Info,
  ChevronLeft,
  Pencil,
  Trash2,
  Heart,
} from 'lucide-react';
import { launcherApps } from '../launcher';
import { PageHeader } from '../../shared/PageHeader';
import { AppPageShell } from '../../shared/AppPageShell';
import { EmptyState } from '../../shared/EmptyState';
import { Modal } from '../../shared/Modal';
import { ModalPrimaryButton } from '../../shared/ModalPrimaryButton';
import { ButtonRow } from '../../shared/ButtonRow';
import { toolBtnClass } from '../../shared/toolBtn';
import { appFabEdgeClass } from '../../shared/layout';
import { useAppThemePreferences } from '../../data/settings/AppThemePreferencesContext';
import { useAuth } from '../../data/auth/AuthContext';
import { StudentAppsCard } from '../../shell/StudentAppsCard';
import { TYPE } from '../../shared/typography';
import { ClassesApp } from '../classes/ClassesApp';
import { HubMiniCalendar } from './HubMiniCalendar';

const FOLDERS_KEY = 'eduHub.appFolders';
const HIDDEN_KEY = 'eduHub.hiddenApps';
const FAVORITES_KEY = 'eduHub.favoriteApps';

const FOLDER_COLORS = [
  { id: 'red', text: 'text-red-500/50', swatch: 'bg-red-500/50' },
  { id: 'amber', text: 'text-amber-500/50', swatch: 'bg-amber-500/50' },
  { id: 'orange', text: 'text-orange-500/50', swatch: 'bg-orange-500/50' },
  { id: 'green', text: 'text-green-500/50', swatch: 'bg-green-500/50' },
  { id: 'blue', text: 'text-blue-400/50', swatch: 'bg-blue-400/50' },
  { id: 'indigo', text: 'text-indigo-500/50', swatch: 'bg-indigo-500/50' },
  { id: 'purple', text: 'text-purple-500/50', swatch: 'bg-purple-500/50' },
  { id: 'pink', text: 'text-pink-500/50', swatch: 'bg-pink-500/50' },
  { id: 'black', text: 'text-black/50', swatch: 'bg-black/50' },
  { id: 'white', text: 'text-slate-400/50', swatch: 'bg-white/50 border border-slate-300' },
  { id: 'brown', text: 'text-amber-800/50', swatch: 'bg-amber-800/50' },
];

const DEFAULT_FOLDER_COLOR = 'blue';

function folderColorClass(colorId) {
  return (
    FOLDER_COLORS.find((c) => c.id === colorId)?.text ||
    FOLDER_COLORS.find((c) => c.id === DEFAULT_FOLDER_COLOR).text
  );
}

function loadFolders() {
  try {
    const raw = JSON.parse(localStorage.getItem(FOLDERS_KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    const validColors = new Set(FOLDER_COLORS.map((c) => c.id));
    return raw
      .filter((f) => f && typeof f.name === 'string')
      .map((f) => ({
        id: String(f.id || `folder-${Date.now()}`),
        name: f.name,
        color: validColors.has(f.color) ? f.color : DEFAULT_FOLDER_COLOR,
        appIds: Array.isArray(f.appIds) ? f.appIds.map(String) : [],
      }));
  } catch {
    return [];
  }
}

function saveFolders(folders) {
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

function loadHiddenApps() {
  try {
    const raw = JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]');
    return Array.isArray(raw) ? raw.map(String) : [];
  } catch {
    return [];
  }
}

function saveHiddenApps(ids) {
  localStorage.setItem(HIDDEN_KEY, JSON.stringify(ids));
}

function loadFavoriteApps() {
  try {
    const raw = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    return Array.isArray(raw) ? raw.map(String) : [];
  } catch {
    return [];
  }
}

function saveFavoriteApps(ids) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}

function FolderColorPicker({ value, onChange, isDarkMode }) {
  return (
    <div>
      <label
        className={`block ${TYPE.labelMd} mb-2 ${
          isDarkMode ? 'text-slate-400' : 'text-slate-500'
        }`}
      >
        Icon color
      </label>
      <div className="flex flex-wrap items-center gap-2.5">
        {FOLDER_COLORS.map((c) => {
          const selected = value === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(c.id)}
              className={`w-8 h-8 rounded-full ${c.swatch} shrink-0 transition-transform ${
                selected
                  ? isDarkMode
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-105'
                    : 'ring-2 ring-slate-800 ring-offset-2 ring-offset-white scale-105'
                  : 'hover:scale-105'
              }`}
              aria-label={`${c.id} folder color`}
              aria-pressed={selected}
              title={c.id}
            />
          );
        })}
      </div>
    </div>
  );
}

function AppTile({
  app,
  isAvailable,
  isDarkMode,
  theme,
  onOpen,
  draggable = false,
  onDragStart,
  onDragEnd,
  onHide,
  onShow,
  isHidden = false,
  isFavorite = false,
  onToggleFavorite,
  onDescribe,
  menuOpen,
  onMenuToggle,
  menuRef,
}) {
  const { getLauncherColor } = useAppThemePreferences();
  const Icon = app.icon;
  const triggerRef = useRef(null);
  const [menuPos, setMenuPos] = useState(null);

  useLayoutEffect(() => {
    if (!menuOpen || !triggerRef.current) {
      setMenuPos(null);
      return;
    }
    const update = () => {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuWidth = 160;
      const left = Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8);
      setMenuPos({
        top: rect.bottom + 4,
        left: Math.max(8, left),
      });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [menuOpen]);

  return (
    <div
      className={`group relative flex flex-col items-center justify-center text-center p-2 rounded-xl border transition-all aspect-square ${
        draggable ? 'cursor-grab active:cursor-grabbing' : ''
      } ${
        isAvailable
          ? isDarkMode
            ? 'bg-slate-900 border-slate-700 hover:border-slate-600'
            : 'bg-white border-slate-300 hover:border-slate-300 hover:shadow-sm'
          : isDarkMode
            ? 'bg-slate-900/50 border-slate-700/60 opacity-70'
            : 'bg-slate-50 border-slate-300/80 opacity-70'
      }`}
      draggable={draggable}
      onDragStart={(e) => {
        if (!draggable) return;
        e.dataTransfer.setData('text/app-id', String(app.id));
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.(app.id);
      }}
      onDragEnd={() => onDragEnd?.()}
      title={
        draggable
          ? `${app.name} — drag into a folder`
          : isAvailable
            ? `Open ${app.name}`
            : `${app.name} — coming soon`
      }
    >
      <div className="absolute top-0.5 right-0.5 z-10">
        <button
          ref={triggerRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMenuToggle?.(app.id);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
            isDarkMode
              ? 'text-slate-500 hover:text-white hover:bg-slate-800'
              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
          }`}
          aria-label={`${app.name} options`}
          aria-expanded={menuOpen}
        >
          <MoreVertical size={14} />
        </button>
      </div>

      {menuOpen && menuPos
        ? createPortal(
            <div
              ref={menuRef}
              className={`fixed w-40 rounded-xl border shadow-xl overflow-hidden z-[120] ${
                isDarkMode ? 'bg-slate-900 border-slate-600' : 'bg-white border-slate-300'
              }`}
              style={{ top: menuPos.top, left: menuPos.left }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  onToggleFavorite?.(app.id);
                  onMenuToggle?.(null);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left ${TYPE.labelMd} transition-colors ${
                  isDarkMode ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Heart
                  size={14}
                  className={isFavorite ? 'text-rose-500' : undefined}
                  fill={isFavorite ? 'currentColor' : 'none'}
                />
                {isFavorite ? 'Unfavorite' : 'Favorite'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isHidden) onShow?.(app.id);
                  else onHide?.(app.id);
                  onMenuToggle?.(null);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left ${TYPE.labelMd} transition-colors border-t ${
                  isDarkMode
                    ? 'hover:bg-slate-800 text-slate-200 border-slate-700'
                    : 'hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                {isHidden ? 'Show' : 'Hide'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDescribe?.(app);
                  onMenuToggle?.(null);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left ${TYPE.labelMd} transition-colors border-t ${
                  isDarkMode
                    ? 'hover:bg-slate-800 text-slate-200 border-slate-700'
                    : 'hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <Info size={14} />
                Description
              </button>
            </div>,
            document.body
          )
        : null}

      <button
        type="button"
        onClick={() => {
          if (!isAvailable) return;
          onOpen?.(app.id);
        }}
        className="flex flex-col items-center w-full h-full min-h-0 pt-1 pb-0.5"
      >
        <span className="flex-1 min-h-0 flex items-center justify-center">
          <span
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm ${getLauncherColor(
              app
            )}`}
          >
            <Icon size={20} strokeWidth={2.25} />
          </span>
        </span>
        <span
          className={`mt-auto text-[12.5px] font-bold truncate w-full px-0.5 leading-tight ${
            isDarkMode ? 'text-slate-100' : 'text-slate-900'
          }`}
        >
          {app.name}
        </span>
        {!isAvailable ? (
          <span className={`mt-0.5 ${TYPE.labelMicro} text-slate-400`}>
            Soon
          </span>
        ) : null}
      </button>
    </div>
  );
}

function FolderCard({
  folder,
  isDarkMode,
  theme,
  isDropTarget,
  onOpen,
  onRename,
  onDelete,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  menuOpen,
  onMenuToggle,
  menuRef,
}) {
  const triggerRef = useRef(null);
  const [menuPos, setMenuPos] = useState(null);

  useLayoutEffect(() => {
    if (!menuOpen || !triggerRef.current) {
      setMenuPos(null);
      return;
    }
    const update = () => {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuWidth = 160;
      const left = Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8);
      setMenuPos({
        top: rect.bottom + 4,
        left: Math.max(8, left),
      });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [menuOpen]);

  return (
    <div
      className={`relative flex items-center gap-2 h-14 w-full rounded-2xl border-[1.5px] pl-3 pr-1.5 transition-colors ${
        isDropTarget
          ? `${theme.border} ${theme.colorPrimaryContainer}`
          : isDarkMode
            ? 'border-slate-600 bg-slate-900 hover:bg-slate-800'
            : 'border-slate-300 bg-white hover:bg-slate-50'
      }`}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex-1 min-w-0 flex items-center gap-2.5 text-left h-full"
        title={`Open ${folder.name}`}
      >
        <Folder
          size={18}
          className={`${folderColorClass(folder.color)} shrink-0`}
          fill="currentColor"
          strokeWidth={1.75}
        />
        <span
          className={`${TYPE.labelMicro} truncate ${
            isDarkMode ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          {isDropTarget ? 'Drop to add' : folder.name}
        </span>
      </button>

      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onMenuToggle?.(menuOpen ? null : `folder:${folder.id}`);
        }}
        onMouseDown={(e) => e.stopPropagation()}
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
          isDarkMode
            ? 'text-slate-500 hover:text-white hover:bg-slate-800'
            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/70'
        }`}
        aria-label={`${folder.name} options`}
        aria-expanded={menuOpen}
      >
        <MoreVertical size={16} />
      </button>

      {menuOpen && menuPos
        ? createPortal(
            <div
              ref={menuRef}
              className={`fixed w-40 rounded-xl border shadow-xl overflow-hidden z-[120] ${
                isDarkMode ? 'bg-slate-900 border-slate-600' : 'bg-white border-slate-300'
              }`}
              style={{ top: menuPos.top, left: menuPos.left }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  onRename?.(folder);
                  onMenuToggle?.(null);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left ${TYPE.labelMd} transition-colors ${
                  isDarkMode ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Pencil size={14} />
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete?.(folder.id);
                  onMenuToggle?.(null);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left ${TYPE.labelMd} transition-colors border-t ${
                  isDarkMode
                    ? 'hover:bg-slate-800 text-rose-300 border-slate-700'
                    : 'hover:bg-slate-50 text-rose-600 border-slate-200'
                }`}
              >
                <Trash2 size={14} />
                Delete folder
              </button>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

function AppsPage({ isDarkMode, theme, onOpenApp, isAppAvailable, isLeft, isSidebarOpen = true }) {
  const { session } = useAuth();
  const canSetStudentAccess = session?.role === 'teacher' || session?.owner;
  const { getLauncherColor } = useAppThemePreferences();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [availabilityFilter, setAvailabilityFilter] = useState('all'); // all | available | soon
  const [folderFilter, setFolderFilter] = useState(''); // '' | folder id | '__unfiled'
  const [folders, setFolders] = useState(loadFolders);
  const [plusOpen, setPlusOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [addToFolderOpen, setAddToFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(DEFAULT_FOLDER_COLOR);
  const [addFolderId, setAddFolderId] = useState('');
  const [pickedAppIds, setPickedAppIds] = useState([]);
  const [modalAppSearch, setModalAppSearch] = useState('');
  const [dragOverFolderId, setDragOverFolderId] = useState(null);
  const [draggingAppId, setDraggingAppId] = useState(null);
  const [hiddenAppIds, setHiddenAppIds] = useState(loadHiddenApps);
  const [favoriteAppIds, setFavoriteAppIds] = useState(loadFavoriteApps);
  const [showHidden, setShowHidden] = useState(false);
  const [tileMenuId, setTileMenuId] = useState(null);
  const [describeApp, setDescribeApp] = useState(null);
  const [renameFolder, setRenameFolder] = useState(null); // { id, name, color } | null
  const [renameFolderName, setRenameFolderName] = useState('');
  const [renameFolderColor, setRenameFolderColor] = useState(DEFAULT_FOLDER_COLOR);

  const searchInputRef = useRef(null);
  const filterRef = useRef(null);
  const plusRef = useRef(null);
  const tileMenuRef = useRef(null);

  useEffect(() => {
    saveFolders(folders);
  }, [folders]);

  useEffect(() => {
    saveHiddenApps(hiddenAppIds);
  }, [hiddenAppIds]);

  useEffect(() => {
    saveFavoriteApps(favoriteAppIds);
  }, [favoriteAppIds]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const onDoc = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
      if (plusRef.current && !plusRef.current.contains(e.target)) setPlusOpen(false);
      if (tileMenuRef.current && !tileMenuRef.current.contains(e.target)) setTileMenuId(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const hiddenSet = useMemo(() => new Set(hiddenAppIds.map(String)), [hiddenAppIds]);
  const favoriteSet = useMemo(() => new Set(favoriteAppIds.map(String)), [favoriteAppIds]);

  const filedAppIds = useMemo(() => {
    const ids = new Set();
    folders.forEach((f) => f.appIds.forEach((id) => ids.add(String(id))));
    return ids;
  }, [folders]);

  const filteredApps = useMemo(() => {
    let list = [...launcherApps];
    const q = searchQuery.trim().toLowerCase();
    if (q) list = list.filter((a) => a.name.toLowerCase().includes(q));

    if (!showHidden) {
      list = list.filter((a) => !hiddenSet.has(String(a.id)));
    } else {
      list = list.filter((a) => hiddenSet.has(String(a.id)));
    }

    if (availabilityFilter === 'available') {
      list = list.filter((a) => isAppAvailable?.(a.id));
    } else if (availabilityFilter === 'soon') {
      list = list.filter((a) => !isAppAvailable?.(a.id));
    }

    if (folderFilter === '__unfiled') {
      list = list.filter((a) => !filedAppIds.has(String(a.id)));
    } else if (folderFilter) {
      const folder = folders.find((f) => f.id === folderFilter);
      const ids = new Set(folder?.appIds || []);
      list = list.filter((a) => ids.has(String(a.id)));
    }

    return list;
  }, [
    searchQuery,
    availabilityFilter,
    folderFilter,
    folders,
    filedAppIds,
    isAppAvailable,
    hiddenSet,
    showHidden,
  ]);

  const filtersActive =
    availabilityFilter !== 'all' || Boolean(folderFilter) || showHidden;

  const hideApp = (appId) => {
    setHiddenAppIds((prev) =>
      prev.map(String).includes(String(appId)) ? prev : [...prev, appId]
    );
  };

  const showApp = (appId) => {
    setHiddenAppIds((prev) => prev.filter((id) => String(id) !== String(appId)));
  };

  const toggleFavorite = (appId) => {
    const id = String(appId);
    setFavoriteAppIds((prev) => {
      const list = prev.map(String);
      return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
    });
  };

  const favoriteApps = useMemo(() => {
    const byId = Object.fromEntries(filteredApps.map((a) => [String(a.id), a]));
    return favoriteAppIds.map(String).map((id) => byId[id]).filter(Boolean);
  }, [favoriteAppIds, filteredApps]);

  const tileProps = (app) => ({
    app,
    isAvailable: isAppAvailable?.(app.id),
    isDarkMode,
    theme,
    onOpen: onOpenApp,
    onHide: hideApp,
    onShow: showApp,
    isHidden: hiddenSet.has(String(app.id)),
    isFavorite: favoriteSet.has(String(app.id)),
    onToggleFavorite: toggleFavorite,
    onDescribe: setDescribeApp,
    menuOpen: tileMenuId === app.id,
    onMenuToggle: (id) => setTileMenuId(id),
    menuRef: tileMenuRef,
  });

  const toolBtn = toolBtnClass(isDarkMode);

  const createFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    const folder = {
      id: `folder-${Date.now()}`,
      name,
      color: newFolderColor || DEFAULT_FOLDER_COLOR,
      appIds: [],
    };
    setFolders((prev) => [...prev, folder]);
    setNewFolderName('');
    setNewFolderColor(DEFAULT_FOLDER_COLOR);
    setCreateFolderOpen(false);
    setAddFolderId(folder.id);
    setPickedAppIds([]);
    setModalAppSearch('');
    setAddToFolderOpen(true);
  };

  const saveRenameFolder = () => {
    const name = renameFolderName.trim();
    if (!renameFolder || !name) return;
    setFolders((prev) =>
      prev.map((f) =>
        f.id === renameFolder.id
          ? { ...f, name, color: renameFolderColor || DEFAULT_FOLDER_COLOR }
          : f
      )
    );
    setRenameFolder(null);
    setRenameFolderName('');
    setRenameFolderColor(DEFAULT_FOLDER_COLOR);
  };

  const deleteFolder = (folderId) => {
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    if (folderFilter === folderId) setFolderFilter('');
    setTileMenuId(null);
  };

  const saveAppsToFolder = () => {
    if (!addFolderId) return;
    setFolders((prev) =>
      prev.map((f) =>
        f.id === addFolderId
          ? { ...f, appIds: [...new Set(pickedAppIds.map(String))] }
          : f
      )
    );
    setAddToFolderOpen(false);
    setPickedAppIds([]);
  };

  const addAppToFolder = (folderId, appId) => {
    if (!folderId || !appId) return;
    setFolders((prev) =>
      prev.map((f) => {
        if (f.id === folderId) {
          if (f.appIds.map(String).includes(String(appId))) return f;
          return { ...f, appIds: [...f.appIds, appId] };
        }
        return {
          ...f,
          appIds: f.appIds.filter((id) => String(id) !== String(appId)),
        };
      })
    );
  };

  const openAddToFolder = (folderId) => {
    const folder = folders.find((f) => f.id === folderId) || folders[0];
    if (!folder) {
      setCreateFolderOpen(true);
      return;
    }
    setAddFolderId(folder.id);
    setPickedAppIds([...(folder.appIds || [])]);
    setModalAppSearch('');
    setAddToFolderOpen(true);
    setPlusOpen(false);
  };

  const showFolderCards = !folderFilter;
  const showUnfiledGrid = !folderFilter || folderFilter === '__unfiled';
  const openFolder =
    folderFilter && folderFilter !== '__unfiled'
      ? folders.find((f) => f.id === folderFilter)
      : null;

  return (
    <AppPageShell variant="scroll">
      <PageHeader
        title="Apps"
        description="Open any Edu.Hub app from here — same tools as the header launcher."
        isDarkMode={isDarkMode}
      />

      {canSetStudentAccess ? (
        <section className={`mb-6 rounded-2xl border-[1.5px] ${theme.colorSurface} ${theme.colorOutline}`}>
          <div className={`border-b-[1.5px] px-5 py-5 sm:px-6 ${theme.colorOutline}`}>
            <h2 className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>Student access</h2>
            <p className={`${TYPE.bodySm} mt-0.5 ${theme.colorOnSurfaceVariant}`}>
              Turn apps and their parts on or off for this class. Days, the clock window, and the
              daily limit stay on each app. An individual app&apos;s settings only control that app.
            </p>
          </div>
          <StudentAppsCard theme={theme} />
        </section>
      ) : null}

      <ButtonRow>
        {searchOpen ? (
          <div
            className={`flex items-center h-9 rounded-xl border overflow-hidden flex-1 min-w-[180px] max-w-sm ${
              isDarkMode ? 'bg-slate-900 border-slate-600' : 'bg-white border-slate-300'
            }`}
          >
            <Search size={16} className={`ml-3 shrink-0 ${theme.text}`} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search apps..."
              className={`flex-1 h-full px-2 bg-transparent outline-none text-sm ${
                isDarkMode ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
              }`}
            />
            <button
              type="button"
              className="p-2 text-slate-400 hover:text-slate-600"
              aria-label="Close search"
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
              }}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={toolBtn}
            onClick={() => setSearchOpen(true)}
            aria-label="Search apps"
          >
            <Search size={16} />
            Search
          </button>
        )}

        <div className="relative" ref={filterRef}>
          <button
            type="button"
            className={`${toolBtn} ${filtersActive ? theme.text : ''}`}
            onClick={() => {
              setFilterOpen((v) => !v);
              setPlusOpen(false);
            }}
            aria-expanded={filterOpen}
            aria-label="Filter apps"
          >
            <ListFilter size={16} />
            Filter
            {filtersActive ? <span className={`w-1.5 h-1.5 rounded-full ${theme.colorPrimary}`} /> : null}
          </button>

          {filterOpen ? (
            <div
              className={`absolute right-0 top-full mt-2 w-64 rounded-2xl border shadow-xl z-30 p-3 space-y-3 ${
                isDarkMode ? 'bg-slate-900 border-slate-600' : 'bg-white border-slate-300'
              }`}
            >
              <div>
                <label
                  className={`block ${TYPE.labelMicro} mb-1.5 ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Availability
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'available', label: 'Open' },
                    { id: 'soon', label: 'Soon' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAvailabilityFilter(opt.id)}
                      className={`px-2 py-2 rounded-xl ${TYPE.labelMd} border transition-colors ${
                        availabilityFilter === opt.id
                          ? `${theme.border} ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`
                          : isDarkMode
                            ? 'border-slate-600 text-slate-300 hover:bg-slate-800'
                            : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  className={`block ${TYPE.labelMicro} mb-1.5 ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Folder
                </label>
                <select
                  value={folderFilter}
                  onChange={(e) => setFolderFilter(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm outline-none ${
                    isDarkMode
                      ? 'bg-slate-800 border-slate-600 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="">All folders</option>
                  <option value="__unfiled">Unfiled</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className={`block ${TYPE.labelMicro} mb-1.5 ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Visibility
                </label>
                <button
                  type="button"
                  onClick={() => setShowHidden((v) => !v)}
                  className={`w-full px-3 py-2 rounded-xl ${TYPE.labelMd} border transition-colors ${
                    showHidden
                      ? `${theme.border} ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`
                      : isDarkMode
                        ? 'border-slate-600 text-slate-300 hover:bg-slate-800'
                        : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {showHidden ? 'Showing hidden apps' : 'Show hidden apps'}
                </button>
              </div>

              {filtersActive ? (
                <button
                  type="button"
                  onClick={() => {
                    setAvailabilityFilter('all');
                    setFolderFilter('');
                    setShowHidden(false);
                  }}
                  className={`w-full ${TYPE.labelMd} py-2 ${theme.text}`}
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </ButtonRow>

      <div
        className={`fixed bottom-5 sm:bottom-8 z-50 ${appFabEdgeClass(isLeft)}`}
        ref={plusRef}
      >
        {plusOpen ? (
          <div
            className={`absolute bottom-full mb-3 w-56 rounded-2xl border shadow-xl overflow-hidden ${
              isLeft ? 'right-0' : 'left-0'
            } ${isDarkMode ? 'bg-slate-900 border-slate-600' : 'bg-white border-slate-300'}`}
          >
            <button
              type="button"
              onClick={() => {
                setPlusOpen(false);
                setCreateFolderOpen(true);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left ${TYPE.titleSm} transition-colors ${
                isDarkMode ? 'hover:bg-slate-800 text-slate-100' : 'hover:bg-slate-50 text-slate-800'
              }`}
            >
              <FolderPlus size={16} className={theme.text} />
              Create folder
            </button>
            <button
              type="button"
              onClick={() => openAddToFolder(folders[0]?.id)}
              disabled={folders.length === 0}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left ${TYPE.titleSm} transition-colors border-t disabled:opacity-40 disabled:pointer-events-none ${
                isDarkMode
                  ? 'hover:bg-slate-800 text-slate-100 border-slate-700'
                  : 'hover:bg-slate-50 text-slate-800 border-slate-200'
              }`}
            >
              <Folder size={16} className={theme.text} />
              Add apps to folder
            </button>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => {
            setPlusOpen((v) => !v);
            setFilterOpen(false);
          }}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-95 ${theme.colorOnPrimary} ${theme.colorPrimary}`}
          title="New folder or add apps"
          aria-label="Create folder or add apps"
          aria-expanded={plusOpen}
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      </div>

      {showFolderCards && folders.length > 0 ? (
        <section className="mb-6">
          <h2
            className={`${TYPE.labelMicro} mb-3 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Folders
          </h2>
          <div
            className={`grid gap-2 grid-cols-1 md:grid-cols-2 ${
              isSidebarOpen ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
            }`}
          >
            {folders.map((folder) => {
              const matchCount = searchQuery.trim()
                ? filteredApps.filter((a) => folder.appIds.map(String).includes(String(a.id)))
                    .length
                : folder.appIds.length;
              if (searchQuery.trim() && matchCount === 0 && !draggingAppId) return null;
              const isDropTarget = dragOverFolderId === folder.id;
              return (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  isDarkMode={isDarkMode}
                  theme={theme}
                  isDropTarget={isDropTarget}
                  onOpen={() => setFolderFilter(folder.id)}
                  onRename={(f) => {
                    setRenameFolder(f);
                    setRenameFolderName(f.name);
                    setRenameFolderColor(f.color || DEFAULT_FOLDER_COLOR);
                  }}
                  onDelete={deleteFolder}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    setDragOverFolderId(folder.id);
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setDragOverFolderId(folder.id);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      setDragOverFolderId((id) => (id === folder.id ? null : id));
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const appId = e.dataTransfer.getData('text/app-id') || draggingAppId;
                    setDragOverFolderId(null);
                    setDraggingAppId(null);
                    if (appId) addAppToFolder(folder.id, appId);
                  }}
                  menuOpen={tileMenuId === `folder:${folder.id}`}
                  onMenuToggle={setTileMenuId}
                  menuRef={tileMenuRef}
                />
              );
            })}
          </div>
        </section>
      ) : null}

      {openFolder ? (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => setFolderFilter('')}
              className={`inline-flex items-center gap-1 ${TYPE.labelLg} ${
                isDarkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ChevronLeft size={18} />
              Back
            </button>
            <h2
              className={`${TYPE.labelMicro} truncate flex-1 min-w-0 ${
                isDarkMode ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {openFolder.name}
            </h2>
            <button
              type="button"
              onClick={() => openAddToFolder(openFolder.id)}
              className={`${TYPE.labelMd} shrink-0 ${theme.text} hover:underline`}
            >
              Edit
            </button>
          </div>

          {filteredApps.length === 0 ? (
            <EmptyState
              isDarkMode={isDarkMode}
              message={
                searchQuery.trim() || filtersActive
                  ? 'No apps match your search or filters.'
                  : 'This folder is empty. Drag apps here from Apps, or use Edit.'
              }
            />
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(5.9375rem,1fr))] gap-2">
              {filteredApps.map((app) => (
                <AppTile
                  key={app.id}
                  {...tileProps(app)}
                  draggable={folders.length > 0}
                  onDragStart={setDraggingAppId}
                  onDragEnd={() => {
                    setDraggingAppId(null);
                    setDragOverFolderId(null);
                  }}
                />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {showUnfiledGrid ? (
        <>
          {favoriteApps.length > 0 && folderFilter !== '__unfiled' ? (
            <section className="mb-6">
              <h2
                className={`${TYPE.labelMicro} mb-3 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Favorites
              </h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(5.9375rem,1fr))] gap-2">
                {favoriteApps.map((app) => (
                  <AppTile
                    key={`fav-${app.id}`}
                    {...tileProps(app)}
                    menuOpen={tileMenuId === `fav:${app.id}`}
                    onMenuToggle={(id) =>
                      setTileMenuId(id == null ? null : id.startsWith('fav:') ? id : `fav:${id}`)
                    }
                    draggable={folders.length > 0}
                    onDragStart={setDraggingAppId}
                    onDragEnd={() => {
                      setDraggingAppId(null);
                      setDragOverFolderId(null);
                    }}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section>
          {(folders.length > 0 && !folderFilter) || folderFilter === '__unfiled' || favoriteApps.length > 0 ? (
            <h2
              className={`${TYPE.labelMicro} mb-3 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {folderFilter === '__unfiled' ? 'Unfiled' : 'All apps'}
            </h2>
          ) : null}

          {(() => {
            const gridApps =
              folderFilter === '__unfiled'
                ? filteredApps
                : folders.length > 0 && !folderFilter
                  ? filteredApps.filter((a) => !filedAppIds.has(String(a.id)))
                  : filteredApps;

            if (gridApps.length === 0) {
              if (folders.length > 0 && !folderFilter && !searchQuery.trim() && !filtersActive) {
                return null;
              }
              return (
                <EmptyState
                  isDarkMode={isDarkMode}
                  message={
                    searchQuery.trim() || filtersActive
                      ? 'No apps match your search or filters.'
                      : 'No apps to show yet.'
                  }
                />
              );
            }

            return (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(5.9375rem,1fr))] gap-2">
                {gridApps.map((app) => (
                  <AppTile
                    key={app.id}
                    {...tileProps(app)}
                    draggable={folders.length > 0}
                    onDragStart={setDraggingAppId}
                    onDragEnd={() => {
                      setDraggingAppId(null);
                      setDragOverFolderId(null);
                    }}
                  />
                ))}
              </div>
            );
          })()}
        </section>
        </>
      ) : null}

      <Modal
        isOpen={createFolderOpen}
        title="Create folder"
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => {
          setCreateFolderOpen(false);
          setNewFolderName('');
          setNewFolderColor(DEFAULT_FOLDER_COLOR);
        }}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setCreateFolderOpen(false);
                setNewFolderName('');
                setNewFolderColor(DEFAULT_FOLDER_COLOR);
              }}
              className={`px-4 py-2 rounded-xl ${TYPE.labelLg} ${
                isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>
            <ModalPrimaryButton
              theme={theme}
              disabled={!newFolderName.trim()}
              onClick={createFolder}
            >
              Create
            </ModalPrimaryButton>
          </div>
        }
      >
        <div className="p-6 space-y-4">
          <div>
            <label
              className={`block ${TYPE.labelMd} mb-1.5 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Folder name
            </label>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') createFolder();
              }}
              placeholder="e.g. Daily tools"
              className={`w-full px-4 py-2.5 rounded-xl border outline-none text-sm ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>
          <FolderColorPicker
            value={newFolderColor}
            onChange={setNewFolderColor}
            isDarkMode={isDarkMode}
          />
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(renameFolder)}
        title="Rename folder"
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => {
          setRenameFolder(null);
          setRenameFolderName('');
          setRenameFolderColor(DEFAULT_FOLDER_COLOR);
        }}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setRenameFolder(null);
                setRenameFolderName('');
                setRenameFolderColor(DEFAULT_FOLDER_COLOR);
              }}
              className={`px-4 py-2 rounded-xl ${TYPE.labelLg} ${
                isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>
            <ModalPrimaryButton
              theme={theme}
              disabled={!renameFolderName.trim()}
              onClick={saveRenameFolder}
            >
              Save
            </ModalPrimaryButton>
          </div>
        }
      >
        <div className="p-6 space-y-4">
          <div>
            <label
              className={`block ${TYPE.labelMd} mb-1.5 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Folder name
            </label>
            <input
              type="text"
              value={renameFolderName}
              onChange={(e) => setRenameFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveRenameFolder();
              }}
              className={`w-full px-4 py-2.5 rounded-xl border outline-none text-sm ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>
          <FolderColorPicker
            value={renameFolderColor}
            onChange={setRenameFolderColor}
            isDarkMode={isDarkMode}
          />
        </div>
      </Modal>

      <Modal
        isOpen={addToFolderOpen}
        title="Add apps to folder"
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => {
          setAddToFolderOpen(false);
          setModalAppSearch('');
        }}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setAddToFolderOpen(false);
                setModalAppSearch('');
              }}
              className={`px-4 py-2 rounded-xl ${TYPE.labelLg} ${
                isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>
            <ModalPrimaryButton theme={theme} onClick={saveAppsToFolder}>
              Save
            </ModalPrimaryButton>
          </div>
        }
      >
        <div className="p-6 space-y-4">
          <div>
            <label
              className={`block ${TYPE.labelMd} mb-1.5 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Folder
            </label>
            <select
              value={addFolderId}
              onChange={(e) => {
                const id = e.target.value;
                setAddFolderId(id);
                const folder = folders.find((f) => f.id === id);
                setPickedAppIds([...(folder?.appIds || [])]);
              }}
              className={`w-full px-4 py-2.5 rounded-xl border outline-none text-sm ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-600 text-white'
                  : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="search"
              value={modalAppSearch}
              onChange={(e) => setModalAppSearch(e.target.value)}
              placeholder="Search apps..."
              className={`w-full h-10 pl-9 pr-3 rounded-xl ${TYPE.bodyMd} outline-none border ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          <div
            className={`max-h-64 overflow-y-auto rounded-xl border divide-y ${
              isDarkMode ? 'border-slate-600 divide-slate-800' : 'border-slate-300 divide-slate-100'
            }`}
          >
            {launcherApps
              .filter((app) => {
                const q = modalAppSearch.trim().toLowerCase();
                if (!q) return true;
                return app.name.toLowerCase().includes(q);
              })
              .map((app) => {
              const checked = pickedAppIds.map(String).includes(String(app.id));
              const Icon = app.icon;
              return (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => {
                    setPickedAppIds((prev) =>
                      checked
                        ? prev.filter((id) => String(id) !== String(app.id))
                        : [...prev, app.id]
                    );
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left ${
                    isDarkMode ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                      checked
                        ? `${theme.colorPrimary} border-transparent ${theme.colorOnPrimary}`
                        : isDarkMode
                          ? 'border-slate-600'
                          : 'border-slate-300'
                    }`}
                  >
                    {checked ? <Check size={12} strokeWidth={3} /> : null}
                  </span>
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${getLauncherColor(
                      app
                    )}`}
                  >
                    <Icon size={16} />
                  </span>
                  <span
                    className={`${TYPE.titleSm} ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {app.name}
                  </span>
                </button>
              );
            })}
            {launcherApps.filter((app) => {
              const q = modalAppSearch.trim().toLowerCase();
              if (!q) return true;
              return app.name.toLowerCase().includes(q);
            }).length === 0 ? (
              <p
                className={`${TYPE.bodySm} text-center py-6 ${
                  isDarkMode ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                No apps match “{modalAppSearch.trim()}”.
              </p>
            ) : null}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(describeApp)}
        title={describeApp?.name || 'App'}
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setDescribeApp(null)}
      >
        <div className="p-6">
          {describeApp ? (
            (() => {
              const DescIcon = describeApp.icon;
              return (
                <div className="flex items-start gap-4">
                  <span
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 ${describeApp.color}`}
                  >
                    <DescIcon size={22} strokeWidth={2.25} />
                  </span>
                  <div className="min-w-0">
                    <p
                      className={`${TYPE.bodyMd} ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {describeApp.description || 'No description available yet.'}
                    </p>
                    {!isAppAvailable?.(describeApp.id) ? (
                      <p className={`${TYPE.labelMicro} mt-3 ${theme.text}`}>
                        Coming soon
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })()
          ) : null}
        </div>
      </Modal>
    </AppPageShell>
  );
}

/**
 * Edu.Hub home — dashboard chrome + full Apps directory.
 */
export function HubApp({
  activeTab,
  isDarkMode,
  theme,
  onOpenApp,
  isAppAvailable,
  isLeft,
  isSidebarOpen,
}) {
  if (activeTab === 'Apps') {
    return (
      <AppsPage
        isDarkMode={isDarkMode}
        theme={theme}
        onOpenApp={onOpenApp}
        isAppAvailable={isAppAvailable}
        isLeft={isLeft}
        isSidebarOpen={isSidebarOpen}
      />
    );
  }

  if (activeTab === 'Dashboard') {
    return (
      <AppPageShell variant="page">
        <PageHeader
          title="Dashboard"
          description="Your teaching home base. Jump into Apps anytime from the sidebar."
          isDarkMode={isDarkMode}
        />
        <div className="flex flex-wrap gap-4 sm:gap-6">
          <HubMiniCalendar
            isDarkMode={isDarkMode}
            theme={theme}
            onOpenCalendar={() => onOpenApp?.('calendar')}
          />
        </div>
      </AppPageShell>
    );
  }

  if (activeTab === 'Classrooms') {
    return (
      <ClassesApp
        activeTab="Classes"
        isDarkMode={isDarkMode}
        theme={theme}
        isLeft={isLeft}
      />
    );
  }

  return (
    <AppPageShell variant="page">
      <PageHeader
        title={activeTab || 'Hub'}
        description="This Hub section is still being built out."
        isDarkMode={isDarkMode}
        leading={
          <div className={`p-2.5 rounded-xl ${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`}>
            <LayoutGrid size={20} />
          </div>
        }
      />
      <EmptyState isDarkMode={isDarkMode} message={`${activeTab} is coming soon.`} />
    </AppPageShell>
  );
}
