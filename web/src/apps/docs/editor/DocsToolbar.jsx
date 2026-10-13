import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Image as ImageIcon,
  Table as TableIcon,
  MessageSquarePlus,
  CloudUpload,
  Printer,
  RemoveFormatting,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { APP_SHELL_FOOTER_CHROME } from '../../../shared/layout';
import { TYPE } from '../../../shared/typography';
import { toolBtnClass } from '../../../shared/toolBtn';
import {
  DOCS_FONTS_UPDATED_EVENT,
  listCustomFonts,
  registerAllCustomFonts,
  uploadCustomFont,
} from '../../../data/docs/docsFonts';

const BUILTIN_FONTS = [
  { label: 'Sans', value: 'Inter, system-ui, sans-serif' },
  { label: 'Serif', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Mono', value: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
];

const UPLOAD_FONT_VALUE = '__upload_font__';

const SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '32px'];

export const DOCS_ZOOM_STEPS = [50, 75, 100, 125, 150, 200];

const Tool = forwardRef(function Tool(
  { active, onClick, title, children, toolBtn, disabled },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`edu-control shrink-0 ${toolBtn} ${
        active ? 'ring-2 ring-offset-1 ring-current' : ''
      }`}
    >
      {children}
    </button>
  );
});

/**
 * Docs formatting chrome — shell footer (same slot as Paper / Dashboard).
 */
export function DocsToolbar({
  editor,
  theme,
  isDarkMode,
  onAddComment,
  onSaveCloud,
  onPrint,
  cloudBusy,
  cloudLabel,
  zoomPercent = 100,
  onZoomChange,
}) {
  const toolBtn = toolBtnClass(isDarkMode);
  const [cloudMenu, setCloudMenu] = useState(false);
  const [cloudPos, setCloudPos] = useState({ right: 0, bottom: 0 });
  const [customFonts, setCustomFonts] = useState([]);
  const [fontNote, setFontNote] = useState('');
  const cloudTriggerRef = useRef(null);
  const cloudPanelRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const fonts = await registerAllCustomFonts();
        if (!cancelled) setCustomFonts(fonts);
      } catch {
        if (!cancelled) setCustomFonts([]);
      }
    };
    refresh();
    window.addEventListener(DOCS_FONTS_UPDATED_EVENT, refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(DOCS_FONTS_UPDATED_EVENT, refresh);
    };
  }, []);

  useLayoutEffect(() => {
    if (!cloudMenu) return undefined;
    const place = () => {
      const btn = cloudTriggerRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      setCloudPos({
        right: Math.max(8, window.innerWidth - rect.right),
        bottom: window.innerHeight - rect.top + 8,
      });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [cloudMenu]);

  useEffect(() => {
    if (!cloudMenu) return undefined;
    const onPointer = (event) => {
      const inTrigger = cloudTriggerRef.current?.contains(event.target);
      const inPanel = cloudPanelRef.current?.contains(event.target);
      if (!inTrigger && !inPanel) setCloudMenu(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setCloudMenu(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [cloudMenu]);

  if (!editor) return null;

  const fontOptions = [
    ...BUILTIN_FONTS,
    ...customFonts.map((f) => ({
      label: f.label,
      value: f.family,
    })),
  ];

  const pickFontFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setFontNote('');
      try {
        const row = await uploadCustomFont(file);
        const fonts = await listCustomFonts();
        setCustomFonts(fonts);
        const cssFamily =
          fonts.find((f) => f.id === row.id)?.family || `"${row.family}"`;
        editor.chain().focus().setFontFamily(cssFamily).run();
        setFontNote(`Loaded “${row.label}” on this device.`);
      } catch (e) {
        setFontNote(e?.message || 'Could not load that font.');
      }
    };
    input.click();
  };

  const zoomIdx = (() => {
    const exact = DOCS_ZOOM_STEPS.indexOf(zoomPercent);
    if (exact >= 0) return exact;
    let best = 0;
    for (let i = 1; i < DOCS_ZOOM_STEPS.length; i += 1) {
      if (
        Math.abs(DOCS_ZOOM_STEPS[i] - zoomPercent) <
        Math.abs(DOCS_ZOOM_STEPS[best] - zoomPercent)
      ) {
        best = i;
      }
    }
    return best;
  })();
  const canZoomOut = zoomIdx > 0;
  const canZoomIn = zoomIdx < DOCS_ZOOM_STEPS.length - 1;

  const stepZoom = (dir) => {
    if (!onZoomChange) return;
    const next = DOCS_ZOOM_STEPS[
      Math.min(DOCS_ZOOM_STEPS.length - 1, Math.max(0, zoomIdx + dir))
    ];
    onZoomChange(next);
  };

  const fieldClass = `edu-control h-9 shrink-0 rounded-xl border-[1.5px] px-2 ${TYPE.bodySm} ${theme.colorSurface} ${theme.colorOutline} ${theme.colorOnSurface}`;

  const insertImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const src = String(reader.result || '');
        if (src) editor.chain().focus().setImage({ src }).run();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  return (
    <div
      className={`${APP_SHELL_FOOTER_CHROME} overflow-visible ${theme.colorSurface} ${theme.colorOutline}`}
      role="toolbar"
      aria-label="Document tools"
    >
      <div className="flex w-full min-h-12 items-center justify-center gap-1.5 overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Tool
          toolBtn={toolBtn}
          title="Undo"
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="w-4 h-4" />
        </Tool>
        <Tool
          toolBtn={toolBtn}
          title="Redo"
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="w-4 h-4" />
        </Tool>

        <span
          className={`mx-1 h-6 w-px shrink-0 ${isDarkMode ? 'bg-slate-600' : 'bg-slate-300'}`}
        />

        <Tool
          toolBtn={toolBtn}
          title="Bold"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="w-4 h-4" />
        </Tool>
        <Tool
          toolBtn={toolBtn}
          title="Italic"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="w-4 h-4" />
        </Tool>
        <Tool
          toolBtn={toolBtn}
          title="Underline"
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="w-4 h-4" />
        </Tool>
        <Tool
          toolBtn={toolBtn}
          title="Clear formatting"
          onClick={() =>
            editor.chain().focus().unsetAllMarks().clearNodes().run()
          }
        >
          <RemoveFormatting className="w-4 h-4" />
        </Tool>

        <Tool
          toolBtn={toolBtn}
          title="Heading 1"
          active={editor.isActive('heading', { level: 1 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Heading1 className="w-4 h-4" />
        </Tool>
        <Tool
          toolBtn={toolBtn}
          title="Heading 2"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 className="w-4 h-4" />
        </Tool>
        <Tool
          toolBtn={toolBtn}
          title="Heading 3"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3 className="w-4 h-4" />
        </Tool>

        <Tool
          toolBtn={toolBtn}
          title="Bullet list"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="w-4 h-4" />
        </Tool>
        <Tool
          toolBtn={toolBtn}
          title="Numbered list"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="w-4 h-4" />
        </Tool>

        <select
          className={fieldClass}
          aria-label="Font"
          value={
            editor.getAttributes('textStyle').fontFamily ||
            BUILTIN_FONTS[0].value
          }
          onChange={(e) => {
            const value = e.target.value;
            if (value === UPLOAD_FONT_VALUE) {
              e.target.value =
                editor.getAttributes('textStyle').fontFamily ||
                BUILTIN_FONTS[0].value;
              pickFontFile();
              return;
            }
            editor.chain().focus().setFontFamily(value).run();
          }}
        >
          {fontOptions.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
          <option value={UPLOAD_FONT_VALUE}>Upload font…</option>
        </select>
        {fontNote ? (
          <span
            className={`${TYPE.labelMicro} shrink-0 max-w-[10rem] truncate ${theme.colorOnSurfaceVariant}`}
            title={fontNote}
          >
            {fontNote}
          </span>
        ) : null}

        <select
          className={fieldClass}
          aria-label="Size"
          value={editor.getAttributes('textStyle').fontSize || '16px'}
          onChange={(e) =>
            editor.chain().focus().setFontSize(e.target.value).run()
          }
        >
          {SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <label
          className="edu-control flex shrink-0 items-center gap-1"
          title="Text color"
        >
          <span className={`${TYPE.labelMicro} ${theme.colorOnSurfaceVariant}`}>
            Color
          </span>
          <input
            type="color"
            className="edu-control h-8 w-8 cursor-pointer rounded border-0 bg-transparent"
            value={editor.getAttributes('textStyle').color || '#0f172a'}
            onChange={(e) =>
              editor.chain().focus().setColor(e.target.value).run()
            }
          />
        </label>

        <span
          className={`mx-1 h-6 w-px shrink-0 ${isDarkMode ? 'bg-slate-600' : 'bg-slate-300'}`}
        />

        <Tool toolBtn={toolBtn} title="Insert image" onClick={insertImage}>
          <ImageIcon className="w-4 h-4" />
        </Tool>
        <Tool
          toolBtn={toolBtn}
          title="Insert table"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          <TableIcon className="w-4 h-4" />
        </Tool>
        <Tool toolBtn={toolBtn} title="Add comment" onClick={onAddComment}>
          <MessageSquarePlus className="w-4 h-4" />
        </Tool>

        <span
          className={`mx-1 h-6 w-px shrink-0 ${isDarkMode ? 'bg-slate-600' : 'bg-slate-300'}`}
        />

        <Tool
          toolBtn={toolBtn}
          title="Zoom out"
          disabled={!canZoomOut}
          onClick={() => stepZoom(-1)}
        >
          <ZoomOut className="w-4 h-4" />
        </Tool>
        <select
          className={fieldClass}
          aria-label="Zoom"
          value={
            DOCS_ZOOM_STEPS.includes(zoomPercent) ? String(zoomPercent) : '100'
          }
          onChange={(e) => onZoomChange?.(Number(e.target.value))}
        >
          {DOCS_ZOOM_STEPS.map((z) => (
            <option key={z} value={z}>
              {z}%
            </option>
          ))}
        </select>
        <Tool
          toolBtn={toolBtn}
          title="Zoom in"
          disabled={!canZoomIn}
          onClick={() => stepZoom(1)}
        >
          <ZoomIn className="w-4 h-4" />
        </Tool>

        <span
          className={`mx-1 h-6 w-px shrink-0 ${isDarkMode ? 'bg-slate-600' : 'bg-slate-300'}`}
        />

        <Tool toolBtn={toolBtn} title="Export PDF / print" onClick={onPrint}>
          <Printer className="w-4 h-4" />
        </Tool>
        <div className="relative shrink-0">
          <Tool
            ref={cloudTriggerRef}
            toolBtn={toolBtn}
            title="Save to cloud (.edudoc)"
            disabled={cloudBusy}
            onClick={() => setCloudMenu((v) => !v)}
          >
            <CloudUpload className="w-4 h-4" />
          </Tool>
          {cloudMenu
            ? createPortal(
                <div
                  ref={cloudPanelRef}
                  className={`fixed z-[300] min-w-[12rem] rounded-xl border-[1.5px] p-1 shadow-lg ${theme.colorSurface} ${theme.colorOutline}`}
                  style={{ right: cloudPos.right, bottom: cloudPos.bottom }}
                  role="menu"
                  aria-label="Save to cloud"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className={`edu-control w-full rounded-lg px-3 py-2 text-left ${TYPE.bodySm} ${theme.colorOnSurface} ${
                      isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => {
                      setCloudMenu(false);
                      onSaveCloud?.('google');
                    }}
                  >
                    Save to Google Drive
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className={`edu-control w-full rounded-lg px-3 py-2 text-left ${TYPE.bodySm} ${theme.colorOnSurface} ${
                      isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => {
                      setCloudMenu(false);
                      onSaveCloud?.('onedrive');
                    }}
                  >
                    Save to OneDrive
                  </button>
                </div>,
                document.body,
              )
            : null}
        </div>
        {cloudLabel ? (
          <span
            className={`${TYPE.labelMicro} shrink-0 ${theme.colorOnSurfaceVariant} ml-1`}
          >
            {cloudLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
