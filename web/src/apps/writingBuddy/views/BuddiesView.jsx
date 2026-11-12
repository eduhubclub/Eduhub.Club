import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import {
  BUDDY_PORTRAITS,
  CUSTOM_PORTRAIT_ID,
} from '../../../data/writingBuddy/constants';
import {
  readProfiles,
  removeProfile,
  upsertProfile,
} from '../../../data/writingBuddy/storage';
import { AppBoard } from '../../../shared/AppBoard';
import { ContentCardGrid } from '../../../shared/ContentCardGrid';
import { EmptyState } from '../../../shared/EmptyState';
import { TYPE } from '../../../shared/typography';
import { BuddyPortrait } from '../components/BuddyPortrait';
import { BuddyPhotoActions } from '../components/BuddyPhotoActions';

function blankForm() {
  return {
    id: '',
    name: '',
    portraitId: BUDDY_PORTRAITS[0].id,
    portraitImage: '',
  };
}

/**
 * Teacher CRUD for Buddy characters (portrait + name). Writing prompts live in Templates.
 */
export function BuddiesView({ theme, isDarkMode }) {
  const [profiles, setProfiles] = useState(() => readProfiles());
  const [form, setForm] = useState(null);

  function refresh() {
    setProfiles(readProfiles());
  }

  function openNew() {
    setForm(blankForm());
  }

  function openEdit(profile) {
    setForm({
      id: profile.id,
      name: profile.name,
      portraitId: profile.portraitImage
        ? CUSTOM_PORTRAIT_ID
        : profile.portraitId,
      portraitImage: profile.portraitImage || '',
    });
  }

  function saveForm() {
    if (!String(form.name || '').trim()) return;
    const custom = String(form.portraitImage || '').trim();
    upsertProfile({
      id: form.id || undefined,
      name: form.name,
      portraitId: custom ? CUSTOM_PORTRAIT_ID : form.portraitId,
      portraitImage: custom || null,
    });
    setForm(null);
    refresh();
  }

  function onDelete(id) {
    removeProfile(id);
    if (form?.id === id) setForm(null);
    refresh();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      {!form ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            className={`edu-control rounded-xl px-4 py-2 ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
            onClick={openNew}
          >
            New Buddy
          </button>
        </div>
      ) : null}

      {form ? (
        <AppBoard mode="scroll" pad="board" theme={theme} className="min-h-0">
          <BuddyForm
            theme={theme}
            isDarkMode={isDarkMode}
            form={form}
            setForm={setForm}
            onSave={saveForm}
            onCancel={() => setForm(null)}
          />
        </AppBoard>
      ) : null}

      {!profiles.length && !form ? (
        <EmptyState
          isDarkMode={isDarkMode}
          message="No Buddy characters yet. Create one kids can pick — pair it with any writing template."
          illustration={<Sparkles size={36} className="text-slate-400" />}
        />
      ) : !form ? (
        <ContentCardGrid>
          {profiles.map((p) => (
            <AppBoard key={p.id} mode="grid" pad="board" theme={theme}>
              <div className="flex items-start gap-3">
                <BuddyPortrait
                  theme={theme}
                  portraitId={p.portraitId}
                  imageUrl={p.portraitImage || ''}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>{p.name}</p>
                  <p className={`${TYPE.bodySm} mt-1 ${theme.colorOnSurfaceVariant}`}>
                    Character only — writing prompts come from Templates.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={`edu-control rounded-xl border-[1.5px] px-3 py-1.5 ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
                      onClick={() => openEdit(p)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={`edu-control rounded-xl border-[1.5px] px-3 py-1.5 ${TYPE.labelMd} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
                      onClick={() => onDelete(p.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </AppBoard>
          ))}
        </ContentCardGrid>
      ) : null}
    </div>
  );
}

function BuddyForm({ theme, isDarkMode = false, form, setForm, onSave, onCancel }) {
  const customOn = Boolean(form.portraitImage);
  const fieldClass = `edu-control w-full rounded-xl border-[1.5px] px-3 py-2 ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;
  const chipClass = (on) =>
    `edu-control rounded-2xl border-[1.5px] p-2.5 ${
      on
        ? `${theme.colorPrimary} ${theme.colorOutline}`
        : `${theme.colorSurface} ${theme.colorOutline}`
    }`;

  return (
    <div className="space-y-5">
      <h2 className={`${TYPE.titleMd} ${theme.colorOnSurface}`}>
        {form.id ? 'Edit Buddy' : 'New Buddy'}
      </h2>

      <label className="block max-w-md space-y-1.5">
        <span className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>Name</span>
        <input
          className={fieldClass}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </label>

      <div className="space-y-1.5">
        <p className={`${TYPE.labelMd} ${theme.colorOnSurface}`}>Portrait</p>
        <div className="flex flex-wrap items-end gap-3">
          {BUDDY_PORTRAITS.map((p) => {
            const on = !customOn && form.portraitId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={on}
                className={chipClass(on)}
                onClick={() =>
                  setForm({
                    ...form,
                    portraitId: p.id,
                    portraitImage: '',
                  })
                }
              >
                <BuddyPortrait theme={theme} portraitId={p.id} name={p.label} size="sm" />
              </button>
            );
          })}
          <BuddyPhotoActions
            theme={theme}
            isDarkMode={isDarkMode}
            active={customOn}
            imageUrl={form.portraitImage}
            name={form.name || 'Custom'}
            onApplyImage={(dataUrl) =>
              setForm({
                ...form,
                portraitId: CUSTOM_PORTRAIT_ID,
                portraitImage: dataUrl,
              })
            }
            onActivateExisting={() =>
              setForm({
                ...form,
                portraitId: CUSTOM_PORTRAIT_ID,
              })
            }
          />
        </div>
      </div>

      <div
        className={`flex flex-wrap gap-2 border-t-[1.5px] pt-4 ${theme.colorOutline}`}
      >
        <button
          type="button"
          className={`edu-control rounded-xl border-[1.5px] px-4 py-2 ${TYPE.labelLg} ${theme.colorSurface} ${theme.colorOnSurface} ${theme.colorOutline}`}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className={`edu-control rounded-xl px-4 py-2 ${TYPE.labelLg} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
          onClick={onSave}
        >
          Save Buddy
        </button>
      </div>
    </div>
  );
}
