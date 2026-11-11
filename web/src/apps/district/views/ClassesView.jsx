import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpDown, BookOpen, ImagePlus, LayoutGrid, List, MoreVertical, Plus, Search, Trash2, X } from 'lucide-react';
import { AppPageShell } from '../../../shared/AppPageShell';
import { AppBoard } from '../../../shared/AppBoard';
import { AppFab } from '../../../shared/AppFab';
import { ContentCardGrid } from '../../../shared/ContentCardGrid';
import { EmptyState } from '../../../shared/EmptyState';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { PageHeader } from '../../../shared/PageHeader';
import { SegmentControl } from '../../../shared/SegmentControl';
import { APP_BOARD_PAD } from '../../../shared/layout';
import { toolBtnClass } from '../../../shared/toolBtn';
import { TYPE } from '../../../shared/typography';
import { GRADE_OPTIONS } from '../../classes/gradeOptions';
import { normalizeBannerUrl, classesAtSchool } from '../../../data/district/districtModel';
import { districtFieldClass } from '../fields';

const EMPTY_CLASS = {
  name: '',
  grade: 'Kindergarten',
  subject: 'Homeroom',
  teacherName: '',
  room: '',
};

const GRADE_ORDER = [
  'Kindergarten',
  '1st Grade',
  '2nd Grade',
  '3rd Grade',
  '4th Grade',
  '5th Grade',
  '6th Grade',
  '7th Grade',
  '8th Grade',
  '9th Grade',
  '10th Grade',
  '11th Grade',
  '12th Grade',
];

function gradeRank(grade) {
  const index = GRADE_ORDER.indexOf(String(grade || ''));
  return index >= 0 ? index : 100;
}

function sortClasses(list, sortMode) {
  const next = [...list];
  next.sort((a, b) => {
    if (sortMode === 'grade') {
      const gradeCmp = gradeRank(a.grade) - gradeRank(b.grade);
      if (gradeCmp !== 0) return gradeCmp;
      return String(a.name || '').localeCompare(String(b.name || ''), undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    }
    const teacherCmp = String(a.teacherName || a.name || '').localeCompare(
      String(b.teacherName || b.name || ''),
      undefined,
      { sensitivity: 'base' },
    );
    return sortMode === 'za' ? -teacherCmp : teacherCmp;
  });
  return next;
}

function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file || !String(file.type || '').startsWith('image/')) {
      reject(new Error('Choose an image file'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.readAsDataURL(file);
  });
}

function classMeta(cls) {
  const count = cls.studentList?.length || 0;
  return {
    count,
    teacherName: cls.teacherName || '',
    detailLine:
      [cls.subject, cls.room, `${count} ${count === 1 ? 'student' : 'students'}`]
        .filter(Boolean)
        .join(' · ') || 'Class',
  };
}

function ClassListItem({ cls, theme }) {
  const { teacherName, detailLine } = classMeta(cls);
  const coverUrl = normalizeBannerUrl(cls.coverUrl);
  return (
    <li
      className={`flex items-center gap-3 rounded-xl border-[1.5px] px-3 py-3 ${theme.colorSurface} ${theme.colorOutline}`}
    >
      {coverUrl ? (
        <img src={coverUrl} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
      ) : (
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${theme.colorSurfaceVariant}`}
        >
          <BookOpen size={20} className={theme.colorOnSurfaceVariant} aria-hidden />
        </span>
      )}
      <div className="min-w-0 flex-1">
        {teacherName ? (
          <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>{teacherName}</p>
        ) : null}
        <p
          className={`${teacherName ? 'mt-0.5 ' : ''}${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
        >
          {cls.name || 'Class'}
        </p>
        <p className={`mt-1 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>{detailLine}</p>
      </div>
    </li>
  );
}

function ClassTile({
  cls,
  theme,
  isDarkMode,
  canEditCover,
  menuOpen,
  onToggleMenu,
  menuRef,
  onAddImage,
  onRemoveImage,
}) {
  const { teacherName, detailLine } = classMeta(cls);
  const coverUrl = normalizeBannerUrl(cls.coverUrl);

  return (
    <AppBoard mode="grid" pad="none" theme={theme} className="relative overflow-hidden">
      {canEditCover ? (
        <div
          ref={menuOpen ? menuRef : null}
          className="absolute right-2 top-2 z-20"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className={`edu-control rounded-lg p-1.5 ${
              isDarkMode
                ? 'bg-slate-900/80 text-slate-200 hover:bg-slate-900'
                : 'bg-white/90 text-slate-600 hover:bg-white shadow-sm border border-slate-200'
            }`}
            aria-label={`More actions for ${cls.name}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            title="More actions"
            onClick={onToggleMenu}
          >
            <MoreVertical size={16} strokeWidth={2.5} />
          </button>
          {menuOpen ? (
            <div
              role="menu"
              aria-label={`${cls.name} actions`}
              className={`absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-xl border-[1.5px] p-1 shadow-lg ${theme.colorSurface} ${theme.colorOutline}`}
            >
              <button
                type="button"
                role="menuitem"
                className={`edu-control flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left ${TYPE.bodySm} ${theme.colorOnSurface}`}
                onClick={onAddImage}
              >
                <ImagePlus size={14} strokeWidth={2.5} className="shrink-0" />
                {coverUrl ? 'Change image' : 'Add image'}
              </button>
              {coverUrl ? (
                <button
                  type="button"
                  role="menuitem"
                  className={`edu-control flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left ${TYPE.bodySm} text-rose-500`}
                  onClick={onRemoveImage}
                >
                  <Trash2 size={14} strokeWidth={2.5} className="shrink-0" />
                  Remove image
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {coverUrl ? (
        <div className="aspect-[2.4/1] w-full overflow-hidden">
          <img src={coverUrl} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className={`aspect-[2.4/1] w-full ${theme.colorSurfaceVariant}`} aria-hidden />
      )}
      <div className={`${APP_BOARD_PAD} pt-4`}>
        <div className="flex items-center gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${theme.colorPrimary}`}
          >
            <BookOpen size={22} className={theme.colorOnPrimary} aria-hidden />
          </span>
          <div className="min-w-0">
            {teacherName ? (
              <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>{teacherName}</p>
            ) : null}
            <p
              className={`${teacherName ? 'mt-0.5 ' : ''}${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}
            >
              {cls.name || 'Class'}
            </p>
          </div>
        </div>
        <p className={`mt-3 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>{detailLine}</p>
      </div>
    </AppBoard>
  );
}

export function ClassesView({
  org,
  school,
  classes,
  access = 'edit',
  onUpdateClass,
  onAddClass,
  isDarkMode,
  theme,
  isLeft = true,
}) {
  const [viewMode, setViewMode] = useState('list');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState('grade');
  const [sortOpen, setSortOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [coverTargetId, setCoverTargetId] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [classDraft, setClassDraft] = useState(EMPTY_CLASS);
  const menuRef = useRef(null);
  const sortRef = useRef(null);
  const coverInputRef = useRef(null);
  const searchInputRef = useRef(null);
  const canEdit = access === 'edit';
  const canAddClass = canEdit && Boolean(onAddClass);
  const canEditCover = Boolean(onUpdateClass) && access !== 'surface';

  const atSchool = useMemo(
    () => (school ? classesAtSchool(classes, school, org) : []),
    [classes, school, org],
  );

  const visibleClasses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = !q
      ? atSchool
      : atSchool.filter((cls) => {
          const hay = [cls.name, cls.grade, cls.subject, cls.teacherName, cls.room, cls.joinCode]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return hay.includes(q);
        });
    return sortClasses(filtered, sortMode);
  }, [atSchool, searchQuery, sortMode]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!openMenuId) return undefined;
    const onPointerDown = (event) => {
      if (menuRef.current?.contains(event.target)) return;
      setOpenMenuId(null);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpenMenuId(null);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openMenuId]);

  useEffect(() => {
    if (!sortOpen) return undefined;
    const onPointerDown = (event) => {
      if (sortRef.current?.contains(event.target)) return;
      setSortOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setSortOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [sortOpen]);

  useEffect(() => {
    setOpenMenuId(null);
    setSearchQuery('');
    setSearchOpen(false);
    setSortMode('grade');
    setSortOpen(false);
    setEditorOpen(false);
  }, [school?.id]);

  const openAddClass = () => {
    setClassDraft(EMPTY_CLASS);
    setEditorOpen(true);
  };

  const saveClass = () => {
    const name = classDraft.name.trim();
    if (!name || !school || !canEdit) return;
    onAddClass?.({
      name,
      grade: classDraft.grade,
      subject: classDraft.subject.trim() || 'Homeroom',
      teacherName: classDraft.teacherName.trim(),
      room: classDraft.room.trim(),
    });
    setEditorOpen(false);
  };

  useEffect(() => {
    setOpenMenuId(null);
  }, [viewMode]);

  const startCoverPick = (classId) => {
    setOpenMenuId(null);
    setCoverTargetId(classId);
    requestAnimationFrame(() => coverInputRef.current?.click());
  };

  const onPickCover = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    const classId = coverTargetId;
    setCoverTargetId(null);
    if (!file || !classId || !onUpdateClass) return;
    try {
      const coverUrl = await readImageAsDataUrl(file);
      onUpdateClass(classId, { coverUrl });
    } catch {
      /* ignore invalid files */
    }
  };

  if (!school) {
    return (
      <AppPageShell variant="page">
        <PageHeader title="Classes" description="Homerooms and sections in this building." isDarkMode={isDarkMode} />
        <EmptyState isDarkMode={isDarkMode} message="Open a school to see its classes." />
      </AppPageShell>
    );
  }

  const toolBtn = toolBtnClass(isDarkMode);

  return (
    <AppPageShell variant="scroll">
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onPickCover}
      />

      <PageHeader
        title="Classes"
        description={
          access === 'surface'
            ? `Classes at ${school.name}.`
            : `Homerooms and sections at ${school.name}.`
        }
        isDarkMode={isDarkMode}
        actions={
          atSchool.length > 0 ? (
            <div className="flex flex-nowrap items-center justify-end gap-2">
              <div className="relative shrink-0">
                <button
                  type="button"
                  className={`${toolBtn}${searchOpen ? ' invisible' : ''}`}
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search classes"
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
                      placeholder="Search classes..."
                      className={`h-full min-w-0 flex-1 appearance-none bg-transparent px-2 text-sm outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none ${
                        isDarkMode
                          ? 'text-white placeholder-slate-500'
                          : 'text-slate-900 placeholder-slate-400'
                      }`}
                    />
                    <button
                      type="button"
                      className="edu-control p-2 text-slate-400 hover:text-slate-600"
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

              <div className="relative" ref={sortRef}>
                <button
                  type="button"
                  className={`${toolBtn} ${sortMode !== 'grade' ? theme.text : ''}`}
                  onClick={() => setSortOpen((value) => !value)}
                  aria-expanded={sortOpen}
                  aria-label="Sort classes"
                >
                  <ArrowUpDown size={16} />
                  Sort
                  {sortMode !== 'grade' ? (
                    <span className={`h-1.5 w-1.5 rounded-full ${theme.colorPrimary}`} />
                  ) : null}
                </button>
                {sortOpen ? (
                  <div
                    role="menu"
                    className={`absolute right-0 top-full z-30 mt-2 w-44 overflow-hidden rounded-2xl border-[1.5px] p-1 shadow-xl ${
                      isDarkMode ? 'border-slate-600 bg-slate-900' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {[
                      { id: 'az', label: 'A–Z' },
                      { id: 'grade', label: 'Grade' },
                      { id: 'za', label: 'Z–A' },
                    ].map((option) => {
                      const active = sortMode === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          role="menuitemradio"
                          aria-checked={active}
                          className={`edu-control flex w-full items-center rounded-xl px-3 py-2 text-left ${TYPE.bodySm} ${
                            active
                              ? `${theme.colorPrimaryContainer} ${theme.colorOnPrimaryContainer}`
                              : theme.colorOnSurface
                          }`}
                          onClick={() => {
                            setSortMode(option.id);
                            setSortOpen(false);
                          }}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <SegmentControl
                isDarkMode={isDarkMode}
                theme={theme}
                value={viewMode}
                onChange={setViewMode}
                options={[
                  { id: 'list', label: 'List', icon: List },
                  { id: 'tiles', label: 'Tiles', icon: LayoutGrid },
                ]}
              />
            </div>
          ) : null
        }
      />

      {atSchool.length === 0 ? (
        <EmptyState
          isDarkMode={isDarkMode}
          message={canEdit ? 'No classes at this school yet. Use + to add one.' : 'No classes at this school yet.'}
        />
      ) : visibleClasses.length === 0 ? (
        <EmptyState isDarkMode={isDarkMode} message="No classes match this search." />
      ) : viewMode === 'tiles' ? (
        <ContentCardGrid>
          {visibleClasses.map((cls) => (
            <ClassTile
              key={cls.id}
              cls={cls}
              theme={theme}
              isDarkMode={isDarkMode}
              canEditCover={canEditCover}
              menuOpen={openMenuId === cls.id}
              menuRef={menuRef}
              onToggleMenu={() =>
                setOpenMenuId((current) => (current === cls.id ? null : cls.id))
              }
              onAddImage={() => startCoverPick(cls.id)}
              onRemoveImage={() => {
                setOpenMenuId(null);
                onUpdateClass?.(cls.id, { coverUrl: '' });
              }}
            />
          ))}
        </ContentCardGrid>
      ) : (
        <ul className="flex flex-col gap-2">
          {visibleClasses.map((cls) => (
            <ClassListItem key={cls.id} cls={cls} theme={theme} />
          ))}
        </ul>
      )}

      {canAddClass ? (
        <>
          <AppFab isLeft={isLeft} theme={theme} aria-label="Add class" onClick={openAddClass}>
            <Plus size={28} strokeWidth={2.5} />
          </AppFab>
          <Modal
            isOpen={editorOpen}
            title="Add class"
            theme={theme}
            isDarkMode={isDarkMode}
            onClose={() => setEditorOpen(false)}
            footer={
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className={`edu-control rounded-xl px-4 py-2.5 ${TYPE.labelLg} ${theme.colorOnSurfaceVariant} ${theme.hoverBg}`}
                >
                  Cancel
                </button>
                <ModalPrimaryButton
                  theme={theme}
                  onClick={saveClass}
                  disabled={!classDraft.name.trim()}
                >
                  Add class
                </ModalPrimaryButton>
              </div>
            }
          >
            <form
              className="flex flex-col gap-4 p-5 sm:p-6"
              onSubmit={(event) => {
                event.preventDefault();
                saveClass();
              }}
            >
              <div>
                <label
                  className={`block ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                  htmlFor="class-name"
                >
                  Class name
                </label>
                <input
                  id="class-name"
                  className={`mt-2 ${districtFieldClass(theme)}`}
                  value={classDraft.name}
                  onChange={(event) =>
                    setClassDraft((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="e.g. 3rd Grade A"
                  autoFocus
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    className={`block ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                    htmlFor="class-grade"
                  >
                    Grade
                  </label>
                  <select
                    id="class-grade"
                    className={`mt-2 ${districtFieldClass(theme)}`}
                    value={classDraft.grade}
                    onChange={(event) =>
                      setClassDraft((current) => ({ ...current, grade: event.target.value }))
                    }
                  >
                    {GRADE_OPTIONS.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className={`block ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                    htmlFor="class-subject"
                  >
                    Subject
                  </label>
                  <input
                    id="class-subject"
                    className={`mt-2 ${districtFieldClass(theme)}`}
                    value={classDraft.subject}
                    onChange={(event) =>
                      setClassDraft((current) => ({ ...current, subject: event.target.value }))
                    }
                    placeholder="Homeroom"
                  />
                </div>
              </div>
              <div>
                <label
                  className={`block ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                  htmlFor="class-teacher"
                >
                  Teacher
                </label>
                <input
                  id="class-teacher"
                  className={`mt-2 ${districtFieldClass(theme)}`}
                  value={classDraft.teacherName}
                  onChange={(event) =>
                    setClassDraft((current) => ({ ...current, teacherName: event.target.value }))
                  }
                  placeholder="Optional"
                />
              </div>
              <div>
                <label
                  className={`block ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
                  htmlFor="class-room"
                >
                  Room
                </label>
                <input
                  id="class-room"
                  className={`mt-2 ${districtFieldClass(theme)}`}
                  value={classDraft.room}
                  onChange={(event) =>
                    setClassDraft((current) => ({ ...current, room: event.target.value }))
                  }
                  placeholder="Optional"
                />
              </div>
            </form>
          </Modal>
        </>
      ) : null}
    </AppPageShell>
  );
}
