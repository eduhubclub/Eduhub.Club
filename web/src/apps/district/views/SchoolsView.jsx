import { useEffect, useRef, useState } from 'react';
import { ImagePlus, MapPin, MoreVertical, Pencil, Phone, Plus, School, Trash2, X } from 'lucide-react';
import { AppPageShell } from '../../../shared/AppPageShell';
import { AppBoard } from '../../../shared/AppBoard';
import { ContentCardGrid } from '../../../shared/ContentCardGrid';
import { EmptyState } from '../../../shared/EmptyState';
import { PageHeader } from '../../../shared/PageHeader';
import { Modal } from '../../../shared/Modal';
import { ModalPrimaryButton } from '../../../shared/ModalPrimaryButton';
import { APP_BOARD_PAD, appFabClass } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';
import { districtFieldClass, districtQuietButton } from '../fields';

const EMPTY_DRAFT = { name: '', address: '', phone: '', bannerUrl: '' };

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

function SchoolContactLines({ school, theme }) {
  const address = school.address?.trim();
  const phone = school.phone?.trim();
  if (!address && !phone) {
    return (
      <span className={`mt-1 block ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
        No address or phone yet
      </span>
    );
  }
  return (
    <span className={`mt-2 flex flex-col gap-1 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
      {address ? (
        <span className="inline-flex items-start gap-1.5">
          <MapPin size={14} className="mt-0.5 shrink-0" aria-hidden />
          <span>{address}</span>
        </span>
      ) : null}
      {phone ? (
        <span className="inline-flex items-center gap-1.5">
          <Phone size={14} className="shrink-0" aria-hidden />
          <span>{phone}</span>
        </span>
      ) : null}
    </span>
  );
}

export function SchoolsView({
  org,
  schoolId,
  mySchoolIds = [],
  canEdit = false,
  onSelectSchool,
  onOpenSchool,
  addSchool,
  updateSchool,
  renameSchool,
  removeSchool,
  isDarkMode,
  theme,
  isLeft,
}) {
  const openSchool = (id) => {
    onSelectSchool?.(id);
    onOpenSchool?.(id);
  };
  const [editor, setEditor] = useState(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [pendingRemove, setPendingRemove] = useState(null);
  const [bannerError, setBannerError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [bannerTargetId, setBannerTargetId] = useState(null);
  const bannerInputRef = useRef(null);
  const menuRef = useRef(null);

  const patchDraft = (patch) => setDraft((current) => ({ ...current, ...patch }));

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

  const openCreate = () => {
    setDraft(EMPTY_DRAFT);
    setBannerError('');
    setOpenMenuId(null);
    setEditor({ mode: 'create' });
  };

  const openEdit = (school) => {
    setDraft({
      name: school.name || '',
      address: school.address || '',
      phone: school.phone || '',
      bannerUrl: school.bannerUrl || '',
    });
    setBannerError('');
    setOpenMenuId(null);
    setEditor({ mode: 'edit', school });
  };

  const saveSchool = () => {
    const name = draft.name.trim();
    if (!name || !editor || !canEdit) return;
    const payload = {
      name,
      address: draft.address.trim(),
      phone: draft.phone.trim(),
      bannerUrl: draft.bannerUrl.trim(),
    };
    if (editor.mode === 'create') {
      const created = addSchool?.(payload);
      if (created) onSelectSchool?.(created.id);
    } else if (updateSchool) {
      updateSchool(editor.school.id, payload);
    } else {
      renameSchool?.(editor.school.id, name);
    }
    setEditor(null);
  };

  const confirmRemove = () => {
    if (!pendingRemove || !canEdit) return;
    removeSchool?.(pendingRemove.id);
    setPendingRemove(null);
  };

  const startBannerPick = (schoolIdForBanner) => {
    setOpenMenuId(null);
    setBannerTargetId(schoolIdForBanner);
    setBannerError('');
    requestAnimationFrame(() => bannerInputRef.current?.click());
  };

  const onPickBanner = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      setBannerTargetId(null);
      return;
    }
    try {
      const bannerUrl = await readImageAsDataUrl(file);
      if (bannerTargetId && updateSchool && !editor) {
        updateSchool(bannerTargetId, { bannerUrl });
      } else {
        patchDraft({ bannerUrl });
      }
      setBannerError('');
    } catch (error) {
      setBannerError(error?.message || 'Could not read image');
    } finally {
      setBannerTargetId(null);
    }
  };

  return (
    <AppPageShell variant="scroll">
      <PageHeader
        title={org.name || 'Schools'}
        description={
          canEdit
            ? 'Open a school to work in its own space — schedule, students, and staff.'
            : 'Browse every school. Open yours for the full day; others stay a summary.'
        }
        isDarkMode={isDarkMode}
      />

      <input
        ref={bannerInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onPickBanner}
      />

      {org.schools.length === 0 ? (
        <EmptyState
          isDarkMode={isDarkMode}
          message={
            canEdit
              ? 'Add a school to set its day and connect classes.'
              : 'No schools are set up yet. Ask your district admin.'
          }
        />
      ) : (
        <ContentCardGrid>
          {org.schools.map((school) => {
            const selected = school.id === schoolId;
            const mine = mySchoolIds.includes(school.id);
            const hasBanner = Boolean(school.bannerUrl);
            const menuOpen = openMenuId === school.id;
            return (
              <AppBoard
                key={school.id}
                mode="grid"
                pad="none"
                theme={theme}
                className={`relative overflow-hidden ${
                  selected
                    ? `ring-2 ring-offset-2 ${theme.ring} ${
                        isDarkMode ? 'ring-offset-slate-950' : 'ring-offset-slate-50'
                      }`
                    : ''
                }`}
              >
                {canEdit ? (
                  <div
                    ref={menuOpen ? menuRef : null}
                    className="absolute right-2 top-2 z-20"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <button
                      type="button"
                      className={`edu-control rounded-lg p-1.5 ${
                        isDarkMode
                          ? 'bg-slate-900/80 text-slate-200 hover:bg-slate-900'
                          : 'bg-white/90 text-slate-600 hover:bg-white shadow-sm border border-slate-200'
                      }`}
                      aria-label={`More actions for ${school.name}`}
                      aria-haspopup="menu"
                      aria-expanded={menuOpen}
                      title="More actions"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenMenuId(menuOpen ? null : school.id);
                      }}
                    >
                      <MoreVertical size={16} strokeWidth={2.5} />
                    </button>
                    {menuOpen ? (
                      <div
                        role="menu"
                        aria-label={`${school.name} actions`}
                        className={`absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-xl border-[1.5px] p-1 shadow-lg ${theme.colorSurface} ${theme.colorOutline}`}
                      >
                        <button
                          type="button"
                          role="menuitem"
                          className={`edu-control flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left ${TYPE.bodySm} ${theme.colorOnSurface}`}
                          onClick={() => startBannerPick(school.id)}
                        >
                          <ImagePlus size={14} strokeWidth={2.5} className="shrink-0" />
                          {hasBanner ? 'Change image' : 'Add image'}
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className={`edu-control flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left ${TYPE.bodySm} ${theme.colorOnSurface}`}
                          onClick={() => openEdit(school)}
                        >
                          <Pencil size={14} strokeWidth={2.5} className="shrink-0" />
                          Edit
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className={`edu-control flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left ${TYPE.bodySm} text-rose-500`}
                          onClick={() => {
                            setOpenMenuId(null);
                            setPendingRemove(school);
                          }}
                        >
                          <Trash2 size={14} strokeWidth={2.5} className="shrink-0" />
                          Remove
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => openSchool(school.id)}
                  className="edu-control w-full text-left"
                  aria-pressed={selected}
                >
                  {hasBanner ? (
                    <span className="block aspect-[2.4/1] w-full overflow-hidden">
                      <img
                        src={school.bannerUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </span>
                  ) : (
                    <span
                      className={`flex aspect-[2.4/1] w-full items-center justify-center ${theme.colorSurfaceVariant || theme.colorPrimary}`}
                    >
                      <School
                        size={28}
                        className={theme.colorOnSurfaceVariant || theme.colorOnPrimary}
                        aria-hidden
                      />
                    </span>
                  )}
                  <span className={`block ${APP_BOARD_PAD} pt-4`}>
                    <span className={`block ${TYPE.titleMd} ${theme.colorOnSurface}`}>
                      {school.name}
                    </span>
                    {!canEdit && mine ? (
                      <span className={`mt-1 inline-block ${TYPE.labelSm} ${theme.colorPrimary}`}>
                        Your school
                      </span>
                    ) : null}
                    <SchoolContactLines school={school} theme={theme} />
                  </span>
                </button>
              </AppBoard>
            );
          })}
        </ContentCardGrid>
      )}

      {canEdit ? (
        <button
          type="button"
          onClick={openCreate}
          className={`${appFabClass(isLeft)} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
          aria-label="Add school"
          title="Add school"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      ) : null}

      <Modal
        isOpen={Boolean(editor)}
        title={editor?.mode === 'edit' ? 'Edit school' : 'Add school'}
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setEditor(null)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditor(null)}
              className={`edu-control px-4 py-2.5 rounded-xl ${TYPE.labelLg} ${theme.colorOnSurfaceVariant} ${theme.hoverBg}`}
            >
              Cancel
            </button>
            <ModalPrimaryButton theme={theme} disabled={!draft.name.trim()} onClick={saveSchool}>
              Save
            </ModalPrimaryButton>
          </div>
        }
      >
        <form
          className="flex flex-col gap-4 p-5 sm:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            saveSchool();
          }}
        >
          <div>
            <label className={`block ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`} htmlFor="school-name">
              School name
            </label>
            <input
              id="school-name"
              className={`mt-2 ${districtFieldClass(theme)}`}
              value={draft.name}
              onChange={(event) => patchDraft({ name: event.target.value })}
              placeholder="Cedar Elementary"
              autoFocus
            />
          </div>
          <div>
            <label
              className={`block ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}
              htmlFor="school-address"
            >
              Address
            </label>
            <input
              id="school-address"
              className={`mt-2 ${districtFieldClass(theme)}`}
              value={draft.address}
              onChange={(event) => patchDraft({ address: event.target.value })}
              placeholder="100 Main St, Anytown, ST 00000"
            />
          </div>
          <div>
            <label className={`block ${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`} htmlFor="school-phone">
              Phone
            </label>
            <input
              id="school-phone"
              className={`mt-2 ${districtFieldClass(theme)}`}
              value={draft.phone}
              onChange={(event) => patchDraft({ phone: event.target.value })}
              placeholder="(555) 010-0000"
              inputMode="tel"
            />
          </div>
          <div>
            <p className={`${TYPE.labelMd} ${theme.colorOnSurfaceVariant}`}>Banner image</p>
            <p className={`mt-1 ${TYPE.bodySm} ${theme.colorOnSurfaceVariant}`}>
              Optional photo across the top of the school card.
            </p>
            {draft.bannerUrl ? (
              <div className="relative mt-3 overflow-hidden rounded-xl border-[1.5px] border-inherit">
                <img
                  src={draft.bannerUrl}
                  alt=""
                  className="aspect-[2.4/1] w-full object-cover"
                />
                <button
                  type="button"
                  className={`absolute right-2 top-2 ${districtQuietButton(theme)}`}
                  onClick={() => patchDraft({ bannerUrl: '' })}
                  aria-label="Remove banner"
                >
                  <X size={14} />
                  Remove
                </button>
              </div>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className={districtQuietButton(theme)}
                onClick={() => {
                  setBannerTargetId(null);
                  bannerInputRef.current?.click();
                }}
              >
                <ImagePlus size={14} />
                {draft.bannerUrl ? 'Replace image' : 'Upload image'}
              </button>
            </div>
            {bannerError && editor ? (
              <p className={`mt-2 ${TYPE.bodySm} text-rose-600`}>{bannerError}</p>
            ) : null}
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(pendingRemove)}
        title="Remove school"
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setPendingRemove(null)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPendingRemove(null)}
              className={`edu-control px-4 py-2.5 rounded-xl ${TYPE.labelLg} ${theme.colorOnSurfaceVariant} ${theme.hoverBg}`}
            >
              Cancel
            </button>
            <ModalPrimaryButton theme={theme} onClick={confirmRemove}>
              Remove
            </ModalPrimaryButton>
          </div>
        }
      >
        <p className={`p-5 sm:p-6 ${TYPE.bodyMd} ${theme.colorOnSurface}`}>
          {pendingRemove
            ? `${pendingRemove.name}’s schedule is deleted. Classes linked to it stay in Edu.Hub and move off this school.`
            : ''}
        </p>
      </Modal>
    </AppPageShell>
  );
}
