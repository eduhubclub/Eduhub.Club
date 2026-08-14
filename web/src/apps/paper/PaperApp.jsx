import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AppPageShell } from '../../shared/AppPageShell';
import { TYPE } from '../../shared/typography';
import { PageHeader } from '../../shared/PageHeader';
import { buildPaperSheet } from '../../data/paper/paperGeometry';
import { PAPER_TYPES, normalizePaperSettings, paperSizeById } from '../../data/paper/paperModel';
import { downloadPaperPdf } from '../../data/paper/paperPdf';
import {
  readPaperPrefs,
  writePaperPrefs,
  readPaperPresets,
  upsertPaperPreset,
  removePaperPreset,
  readSkipPrintHint,
  writeSkipPrintHint,
} from '../../data/paper/paperStorage';
import { PaperFooter } from './PaperFooter';
import { PaperPrintPortal } from './PaperPrintPortal';
import { PaperSheet } from './PaperSheet';
import { PrintPaperModal } from './PrintPaperModal';
import { PdfPaperModal } from './PdfPaperModal';
import { SavePaperModal } from './SavePaperModal';
import { SavedPaperCard } from './SavedPaperCard';

function typeLabel(id) {
  return PAPER_TYPES.find((t) => t.id === id)?.label || id;
}

/**
 * Edu.Paper — custom printable ruling paper (Letter 8.5×11).
 */
export function PaperApp({
  activeTab,
  isDarkMode,
  theme,
  onSetActiveTab,
  onShellFooterActiveChange,
}) {
  const [settings, setSettings] = useState(() => readPaperPrefs());
  const [saveOpen, setSaveOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [printHintOpen, setPrintHintOpen] = useState(false);
  const [presets, setPresets] = useState(() => readPaperPresets());
  const [pdfError, setPdfError] = useState('');
  const [mainFooterSlot, setMainFooterSlot] = useState(null);
  const isSaved = activeTab === 'Saved';
  const useShellFooter =
    !isSaved && typeof onShellFooterActiveChange === 'function';

  const sheet = useMemo(() => buildPaperSheet(settings), [settings]);
  const landscape = settings.orientation === 'landscape';
  const pageSize = paperSizeById(settings.pageSize);
  const aspectW = landscape ? pageSize.heightIn : pageSize.widthIn;
  const aspectH = landscape ? pageSize.widthIn : pageSize.heightIn;
  const aspect = `${aspectW} / ${aspectH}`;

  const update = (next) => {
    const normalized = normalizePaperSettings(next);
    setSettings(normalized);
    writePaperPrefs(normalized);
  };

  const runPrint = () => {
    window.setTimeout(() => window.print(), 0);
  };

  const onPrint = () => {
    if (readSkipPrintHint()) {
      runPrint();
      return;
    }
    setPrintHintOpen(true);
  };

  const onConfirmPrint = (skipAgain) => {
    if (skipAgain) writeSkipPrintHint(true);
    setPrintHintOpen(false);
    runPrint();
  };

  const onPdf = () => {
    setPdfError('');
    setPdfOpen(true);
  };

  const onDownloadPdf = async (pageSize) => {
    setPdfError('');
    try {
      const next = { ...settings, pageSize };
      update(next);
      const slug = settings.type || 'paper';
      const sizeSlug = pageSize || 'letter';
      await downloadPaperPdf(next, `edu-paper-${slug}-${sizeSlug}.pdf`);
    } catch (err) {
      setPdfError(err?.message || 'Could not build that PDF.');
    }
  };

  const defaultPresetName = `${typeLabel(settings.type)} · ${
    settings.orientation === 'landscape' ? 'Horizontal' : 'Vertical'
  }`;

  const onSavePreset = (name) => {
    if (editingPreset) {
      upsertPaperPreset({
        id: editingPreset.id,
        name,
        settings: editingPreset.settings,
      });
      setEditingPreset(null);
    } else {
      upsertPaperPreset({ name, settings });
    }
    setPresets(readPaperPresets());
  };

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

  const footer = (
    <PaperFooter
      theme={theme}
      settings={settings}
      onChange={update}
      onPrint={onPrint}
      onPdf={onPdf}
      onSave={() => setSaveOpen(true)}
    />
  );

  if (isSaved) {
    return (
      <AppPageShell variant="scroll">
        <PageHeader
          title="Saved paper"
          description="Presets for ruling size, ink, and orientation."
          isDarkMode={isDarkMode}
        />
        {!presets.length ? (
          <p className={`${TYPE.bodyMd} ${theme.colorOnSurfaceVariant}`}>
            No presets yet. Save one from the Paper tab.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {presets.map((p) => (
              <SavedPaperCard
                key={p.id}
                preset={p}
                theme={theme}
                isDarkMode={isDarkMode}
                onLoad={(preset) => {
                  update(preset.settings);
                  onSetActiveTab?.('Paper');
                }}
                onEdit={(preset) => setEditingPreset(preset)}
                onDelete={(preset) => {
                  removePaperPreset(preset.id);
                  setPresets(readPaperPresets());
                }}
              />
            ))}
          </ul>
        )}
        <SavePaperModal
          isOpen={Boolean(editingPreset)}
          onClose={() => setEditingPreset(null)}
          theme={theme}
          isDarkMode={isDarkMode}
          title="Edit paper"
          confirmLabel="Save"
          defaultName={editingPreset?.name || ''}
          onSave={onSavePreset}
        />
      </AppPageShell>
    );
  }

  return (
    <AppPageShell variant="stage" className="h-full min-h-0">
      <div className="flex h-full min-h-0 flex-col">
        <div
          className="flex min-h-0 flex-1 items-center justify-center p-3 sm:p-4"
          style={{ containerType: 'size' }}
        >
          <div
            className={`overflow-hidden rounded-none border-[1.5px] bg-white ${theme.colorOutline}`}
            style={{
              aspectRatio: aspect,
              width: landscape
                ? `min(100cqw, calc(100cqh * ${aspectW} / ${aspectH}))`
                : `min(100cqw, calc(100cqh * ${aspectW} / ${aspectH}))`,
              height: 'auto',
            }}
          >
            <PaperSheet sheet={sheet} className="block h-full w-full" />
          </div>
        </div>
        {pdfError ? (
          <p className={`shrink-0 px-4 ${TYPE.bodySm} ${theme.colorOnErrorContainer}`}>
            {pdfError}
          </p>
        ) : null}
        {useShellFooter && mainFooterSlot
          ? createPortal(footer, mainFooterSlot)
          : footer}
      </div>
      <PaperPrintPortal
        sheet={sheet}
        orientation={settings.orientation}
        pageSizeId={settings.pageSize}
      />
      <PrintPaperModal
        isOpen={printHintOpen}
        onClose={() => setPrintHintOpen(false)}
        theme={theme}
        isDarkMode={isDarkMode}
        onPrint={onConfirmPrint}
      />
      <PdfPaperModal
        isOpen={pdfOpen}
        onClose={() => setPdfOpen(false)}
        theme={theme}
        isDarkMode={isDarkMode}
        defaultPageSize={settings.pageSize || 'letter'}
        onDownload={onDownloadPdf}
      />
      <SavePaperModal
        isOpen={saveOpen}
        onClose={() => setSaveOpen(false)}
        theme={theme}
        isDarkMode={isDarkMode}
        defaultName={defaultPresetName}
        onSave={onSavePreset}
      />
    </AppPageShell>
  );
}
