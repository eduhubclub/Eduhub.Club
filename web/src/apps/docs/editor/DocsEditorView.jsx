import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import { ArrowLeft } from 'lucide-react';
import { TYPE } from '../../../shared/typography';
import { toolBtnClass } from '../../../shared/toolBtn';
import {
  addSection,
  getSection,
  newCommentId,
  normalizeDoc,
  removeSection,
  withSyncedLegacyFields,
} from '../../../data/docs/docModel';
import { upsertDoc } from '../../../data/docs/docStorage';
import { saveDocToCloud } from '../../../data/docs/docsCloud';
import { registerAllCustomFonts } from '../../../data/docs/docsFonts';
import { createDocsExtensions } from './editorExtensions';
import { DocsToolbar } from './DocsToolbar';
import { DocTabsBar } from '../views/DocTabsBar';

const PAGE_WIDTH_IN = 8.5;
const PAGE_MIN_HEIGHT_IN = 11;

/**
 * Full-stage TipTap editor on a Letter page.
 * Left rail lists sections of this one document (not separate library docs).
 */
export function DocsEditorView({
  doc,
  theme,
  isDarkMode,
  onBack,
  onDocChange,
  onShellFooterActiveChange,
  backLabel = 'Documents',
}) {
  const toolBtn = toolBtnClass(isDarkMode);
  const initial = normalizeDoc(doc);
  const [docTitle, setDocTitle] = useState(initial.title);
  const [sections, setSections] = useState(initial.sections);
  const [activeSectionId, setActiveSectionId] = useState(initial.activeSectionId);
  const active =
    sections.find((s) => s.id === activeSectionId) || sections[0] || null;
  const [sectionTitle, setSectionTitle] = useState(active?.title || 'Section 1');
  const [comments, setComments] = useState(active?.comments || []);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [cloudNote, setCloudNote] = useState('');
  const [commentDraft, setCommentDraft] = useState('');
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [mainFooterSlot, setMainFooterSlot] = useState(null);
  const [zoomPercent, setZoomPercent] = useState(100);
  const saveTimer = useRef(null);
  const pageRef = useRef(null);
  const liveRef = useRef({});
  const useShellFooter = typeof onShellFooterActiveChange === 'function';
  const zoom = zoomPercent / 100;

  liveRef.current = {
    doc,
    docTitle,
    sections,
    activeSectionId,
    sectionTitle,
    comments,
    onDocChange,
  };

  const writeDocState = useCallback((nextDoc) => {
    const normalized = normalizeDoc(nextDoc);
    setDocTitle(normalized.title);
    setSections(normalized.sections);
    setActiveSectionId(normalized.activeSectionId);
    const sec = getSection(normalized, normalized.activeSectionId);
    setSectionTitle(sec?.title || 'Section 1');
    setComments(sec?.comments || []);
    onDocChange?.(normalized);
    return normalized;
  }, [onDocChange]);

  const persistActive = useCallback(
    (patch = {}) => {
      const {
        doc: base,
        docTitle: title,
        sections: secs,
        activeSectionId: sid,
        sectionTitle: sTitle,
        comments: cmts,
      } = liveRef.current;
      const content = patch.content;
      const nextComments = patch.comments ?? cmts;
      const nextSectionTitle = patch.sectionTitle ?? sTitle;
      const nextDocTitle = patch.docTitle ?? title;
      const nextActiveId = patch.activeSectionId ?? sid;

      let next = withSyncedLegacyFields({
        ...normalizeDoc(base),
        title: nextDocTitle,
        sections: secs.map((s) =>
          s.id === sid
            ? {
                ...s,
                title: nextSectionTitle,
                content: content ?? s.content,
                comments: nextComments,
              }
            : s,
        ),
        activeSectionId: nextActiveId,
      });

      if (patch.sections) {
        next = withSyncedLegacyFields({
          ...next,
          sections: patch.sections,
          activeSectionId: nextActiveId,
        });
      }

      const saved = upsertDoc(next);
      setDocTitle(saved.title);
      setSections(saved.sections);
      setActiveSectionId(saved.activeSectionId);
      liveRef.current.onDocChange?.(saved);
      return saved;
    },
    [],
  );

  const editor = useEditor({
    extensions: createDocsExtensions(),
    content: active?.content,
    autofocus: 'end',
    editorProps: {
      attributes: {
        class:
          'edu-docs-prose tiptap outline-none prose prose-slate max-w-none focus:outline-none cursor-text',
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        persistActive({ content: ed.getJSON() });
      }, 400);
    },
  });

  // Reload when opening a different document from the library.
  useEffect(() => {
    const normalized = normalizeDoc(doc);
    setDocTitle(normalized.title);
    setSections(normalized.sections);
    setActiveSectionId(normalized.activeSectionId);
    const sec = getSection(normalized, normalized.activeSectionId);
    setSectionTitle(sec?.title || 'Section 1');
    setComments(sec?.comments || []);
    if (editor && sec?.content) {
      editor.commands.setContent(sec.content, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only remount content on doc switch
  }, [doc.id]);

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    [],
  );

  const flushSave = useCallback(() => {
    if (!editor) return;
    persistActive({ content: editor.getJSON() });
  }, [editor, persistActive]);

  const switchSection = (sectionId) => {
    if (!editor || sectionId === activeSectionId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const flushed = persistActive({
      content: editor.getJSON(),
      activeSectionId: sectionId,
    });
    const sec = getSection(flushed, sectionId);
    setActiveSectionId(sectionId);
    setSectionTitle(sec?.title || 'Section 1');
    setComments(sec?.comments || []);
    if (sec?.content) {
      editor.commands.setContent(sec.content, { emitUpdate: false });
    }
  };

  const handleAddSection = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const base = persistActive({ content: editor?.getJSON() });
    const next = addSection(base);
    const saved = upsertDoc(next);
    writeDocState(saved);
    const sec = getSection(saved, saved.activeSectionId);
    if (editor && sec?.content) {
      editor.commands.setContent(sec.content, { emitUpdate: false });
    }
  };

  const handleRemoveSection = (sectionId) => {
    if (sections.length <= 1) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const base =
      sectionId === activeSectionId
        ? persistActive({ content: editor?.getJSON() })
        : persistActive({ content: editor?.getJSON() });
    const next = removeSection(base, sectionId);
    const saved = upsertDoc(next);
    writeDocState(saved);
    const sec = getSection(saved, saved.activeSectionId);
    if (editor && sec?.content) {
      editor.commands.setContent(sec.content, { emitUpdate: false });
    }
  };

  const onAddComment = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) {
      setCloudNote('Select text to comment on.');
      return;
    }
    setShowCommentBox(true);
    setCommentDraft('');
  };

  const commitComment = () => {
    if (!editor || !commentDraft.trim()) return;
    const { from, to } = editor.state.selection;
    const id = newCommentId();
    editor.chain().focus().setCommentMark(id).run();
    const nextComments = [
      ...comments,
      {
        id,
        body: commentDraft.trim(),
        from,
        to,
        createdAt: new Date().toISOString(),
        resolved: false,
      },
    ];
    setComments(nextComments);
    setShowCommentBox(false);
    setCommentDraft('');
    persistActive({
      content: editor.getJSON(),
      comments: nextComments,
    });
  };

  const onPrint = () => {
    flushSave();
    window.setTimeout(() => window.print(), 50);
  };

  const onSaveCloud = async (provider) => {
    setCloudBusy(true);
    setCloudNote('');
    try {
      const latest = persistActive({ content: editor?.getJSON() });
      const saved = await saveDocToCloud(latest, provider);
      writeDocState(saved);
      setCloudNote(
        `Saved as .edudoc to ${provider === 'google' ? 'Google Drive' : 'OneDrive'} (Edu.Hub/Docs). Word won’t rewrite it.`,
      );
    } catch (e) {
      setCloudNote(e?.message || 'Cloud save failed.');
    } finally {
      setCloudBusy(false);
    }
  };

  useEffect(() => {
    registerAllCustomFonts().catch(() => {});
  }, []);

  useEffect(() => {
    if (!useShellFooter) return undefined;
    onShellFooterActiveChange(true);
    return () => onShellFooterActiveChange(false);
  }, [useShellFooter, onShellFooterActiveChange]);

  useLayoutEffect(() => {
    if (!useShellFooter) {
      setMainFooterSlot(null);
      return;
    }
    setMainFooterSlot(document.getElementById('edu-main-footer'));
  }, [useShellFooter]);

  const cloudLabel = doc.cloud?.syncedAt
    ? `Synced ${new Date(doc.cloud.syncedAt).toLocaleString()}`
    : '';

  const footerBar = (
    <DocsToolbar
      editor={editor}
      theme={theme}
      isDarkMode={isDarkMode}
      onAddComment={onAddComment}
      onSaveCloud={onSaveCloud}
      onPrint={onPrint}
      cloudBusy={cloudBusy}
      cloudLabel={cloudLabel}
      zoomPercent={zoomPercent}
      onZoomChange={setZoomPercent}
    />
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 edu-docs-editor-root">
      {cloudNote ? (
        <p className={`${TYPE.bodySm} shrink-0 ${theme.colorOnSurfaceVariant}`}>{cloudNote}</p>
      ) : null}

      {showCommentBox ? (
        <div
          className={`rounded-2xl border-[1.5px] p-3 space-y-2 ${theme.colorSurface} ${theme.colorOutline}`}
        >
          <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>New comment</p>
          <textarea
            className={`edu-control w-full rounded-xl border-[1.5px] px-3 py-2 min-h-[4rem] ${TYPE.bodyMd} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            placeholder="Note for yourself…"
          />
          <div className="flex gap-2">
            <button
              type="button"
              className={`edu-control rounded-xl px-3 py-2 ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
              onClick={commitComment}
            >
              Add
            </button>
            <button
              type="button"
              className={`edu-control ${toolBtn}`}
              onClick={() => setShowCommentBox(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row gap-3 items-stretch">
        <aside
          className={`flex w-full lg:w-56 xl:w-64 shrink-0 flex-col gap-2 rounded-2xl border-[1.5px] p-2 min-h-0 max-h-56 lg:max-h-none ${theme.colorSurface} ${theme.colorOutline}`}
        >
          <button
            type="button"
            className={`edu-control shrink-0 w-full justify-start ${toolBtn}`}
            onClick={() => {
              flushSave();
              onBack?.();
            }}
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            {backLabel}
          </button>
          <input
            className={`edu-control w-full shrink-0 rounded-xl border-[1.5px] px-2.5 h-9 text-sm font-bold leading-normal ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`}
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            onBlur={() => persistActive({ docTitle, content: editor?.getJSON() })}
            aria-label="Document title"
            placeholder="Document title"
          />
          <DocTabsBar
            sections={sections}
            activeId={activeSectionId}
            theme={theme}
            isDarkMode={isDarkMode}
            onSelect={switchSection}
            onClose={handleRemoveSection}
            onCreate={handleAddSection}
            titleValue={sectionTitle}
            onTitleChange={setSectionTitle}
            onTitleBlur={() =>
              persistActive({
                sectionTitle,
                content: editor?.getJSON(),
              })
            }
          />
        </aside>

        <div className="flex-1 w-full min-h-0 overflow-auto">
          <div
            className="edu-docs-zoom-shell mx-auto"
            style={{
              width: `${PAGE_WIDTH_IN * zoom}in`,
              minHeight: `${PAGE_MIN_HEIGHT_IN * zoom}in`,
            }}
          >
            <div
              ref={pageRef}
              className="edu-docs-page bg-white text-slate-900 shadow-md border border-slate-200"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
              }}
              onMouseDown={(e) => {
                if (!editor) return;
                if (e.target.closest?.('.ProseMirror')) return;
                e.preventDefault();
                editor.chain().focus('end').run();
              }}
            >
              <EditorContent
                editor={editor}
                className="edu-docs-editor-host block h-full min-h-[11in]"
              />
            </div>
          </div>
        </div>

        {comments.filter((c) => !c.resolved).length ? (
          <aside
            className={`w-full lg:w-72 shrink-0 rounded-2xl border-[1.5px] p-3 space-y-2 ${theme.colorSurface} ${theme.colorOutline}`}
          >
            <p className={`${TYPE.titleSm} ${theme.colorOnSurface}`}>Comments</p>
            <ul className="space-y-2">
              {comments
                .filter((c) => !c.resolved)
                .map((c) => (
                  <li
                    key={c.id}
                    className={`rounded-xl border-[1.5px] p-2 ${theme.colorOutline}`}
                  >
                    <p className={`${TYPE.bodySm} ${theme.colorOnSurface}`}>{c.body}</p>
                    <button
                      type="button"
                      className={`edu-control mt-2 ${toolBtn}`}
                      onClick={() => {
                        const next = comments.map((x) =>
                          x.id === c.id ? { ...x, resolved: true } : x,
                        );
                        setComments(next);
                        persistActive({
                          content: editor?.getJSON(),
                          comments: next,
                        });
                      }}
                    >
                      Resolve
                    </button>
                  </li>
                ))}
            </ul>
          </aside>
        ) : null}
      </div>

      {useShellFooter && mainFooterSlot
        ? createPortal(footerBar, mainFooterSlot)
        : footerBar}

      <style>{`
        .edu-docs-page {
          width: 8.5in;
          min-height: 11in;
          box-sizing: border-box;
          cursor: text;
        }
        .edu-docs-editor-host {
          display: block;
          min-height: 11in;
        }
        .edu-docs-editor-host .tiptap,
        .edu-docs-prose {
          min-height: 11in;
          box-sizing: border-box;
          padding: 0.5in;
          outline: none;
          cursor: text;
        }
        .edu-docs-prose h1 { font-size: 1.75rem; font-weight: 700; margin: 0.6em 0 0.35em; }
        .edu-docs-prose h2 { font-size: 1.4rem; font-weight: 700; margin: 0.55em 0 0.3em; }
        .edu-docs-prose h3 { font-size: 1.15rem; font-weight: 600; margin: 0.5em 0 0.25em; }
        .edu-docs-prose p { margin: 0.35em 0; line-height: 1.6; }
        .edu-docs-prose ul { list-style: disc; padding-left: 1.4em; margin: 0.4em 0; }
        .edu-docs-prose ol { list-style: decimal; padding-left: 1.4em; margin: 0.4em 0; }
        .edu-docs-prose img { max-width: 100%; height: auto; margin: 0.5em 0; }
        .edu-docs-prose table { border-collapse: collapse; width: 100%; margin: 0.6em 0; }
        .edu-docs-prose th, .edu-docs-prose td {
          border: 1px solid #cbd5e1;
          padding: 0.35em 0.5em;
          vertical-align: top;
        }
        .edu-docs-prose th { background: #f8fafc; font-weight: 600; }
        @media print {
          body * { visibility: hidden !important; }
          .edu-docs-page, .edu-docs-page * { visibility: visible !important; }
          .edu-docs-zoom-shell {
            width: 8.5in !important;
            min-height: 11in !important;
          }
          .edu-docs-page {
            position: absolute;
            left: 0;
            top: 0;
            transform: none !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}
