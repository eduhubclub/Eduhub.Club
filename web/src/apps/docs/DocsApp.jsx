import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppPageShell } from '../../shared/AppPageShell';
import { createDoc } from '../../data/docs/docModel';
import {
  DOCS_UPDATED_EVENT,
  createBlankTemplate,
  emptyTrash,
  listActiveDocs,
  listRecentDocs,
  listSharedDocs,
  listTemplates,
  listTrashedDocs,
  purgeDoc,
  readDoc,
  restoreDoc,
  startDocFromTemplate,
  touchOpened,
  trashDoc,
  writeDoc,
} from '../../data/docs/docStorage';
import { DocsEditorView } from './editor/DocsEditorView';
import { DocListView } from './views/DocListView';
import { CloudOpenModal } from './views/CloudOpenModal';

/**
 * Edu.Docs — local-first word processor.
 */
export function DocsApp({
  activeTab,
  isDarkMode,
  theme,
  isLeft = true,
  onShellFooterActiveChange,
}) {
  const [tick, setTick] = useState(0);
  const [openDocId, setOpenDocId] = useState(null);
  const [cloudProvider, setCloudProvider] = useState(null);

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    const onAny = () => refresh();
    window.addEventListener(DOCS_UPDATED_EVENT, onAny);
    return () => window.removeEventListener(DOCS_UPDATED_EVENT, onAny);
  }, [refresh]);

  void tick;

  const openDoc = openDocId ? readDoc(openDocId) : null;

  const listDocs = useMemo(() => {
    if (activeTab === 'Trash') return listTrashedDocs();
    if (activeTab === 'Shared') return listSharedDocs();
    if (activeTab === 'Files') return listActiveDocs();
    if (activeTab === 'Templates') return listTemplates();
    return listRecentDocs(50);
  }, [activeTab, tick]);

  const handleOpen = (id) => {
    if (activeTab === 'Templates') {
      const doc = startDocFromTemplate(id);
      if (doc) setOpenDocId(doc.id);
      return;
    }
    touchOpened(id);
    setOpenDocId(id);
  };

  const handleEditTemplate = (id) => {
    touchOpened(id);
    setOpenDocId(id);
  };

  const handleCreate = () => {
    if (activeTab === 'Templates') {
      const tmpl = createBlankTemplate();
      setOpenDocId(tmpl.id);
      return;
    }
    const doc = writeDoc(createDoc());
    setOpenDocId(doc.id);
  };

  if (openDoc && openDocId) {
    const backLabel =
      openDoc.kind === 'template' || activeTab === 'Templates'
        ? 'Templates'
        : 'Documents';
    return (
      <AppPageShell variant="stage" className="h-full min-h-0">
        <DocsEditorView
          doc={openDoc}
          theme={theme}
          isDarkMode={isDarkMode}
          backLabel={backLabel}
          onShellFooterActiveChange={onShellFooterActiveChange}
          onBack={() => setOpenDocId(null)}
          onDocChange={(next) => {
            setOpenDocId(next.id);
            refresh();
          }}
        />
      </AppPageShell>
    );
  }

  const tabMeta = {
    Documents: {
      title: 'Documents',
      description:
        'Start from a recent preview or create a new doc. Cloud copies stay as .edudoc — Word won’t rewrite them.',
      mode: 'active',
    },
    Files: {
      title: 'Files',
      description: 'All documents on this device.',
      mode: 'files',
    },
    Templates: {
      title: 'Templates',
      description:
        'Build reusable layouts. Click a template to start a new document; use ⋮ to edit the template itself.',
      mode: 'templates',
    },
    Shared: {
      title: 'Shared',
      description: 'Docs mirrored to Drive or OneDrive under Edu.Hub/Docs.',
      mode: 'shared',
    },
    Trash: {
      title: 'Trash',
      description: 'Restore or permanently delete documents.',
      mode: 'trash',
    },
  };

  const meta = tabMeta[activeTab] || tabMeta.Documents;

  return (
    <AppPageShell variant="scroll">
      <DocListView
        theme={theme}
        isDarkMode={isDarkMode}
        isLeft={isLeft}
        title={meta.title}
        description={meta.description}
        docs={listDocs}
        mode={meta.mode}
        onOpen={handleOpen}
        onCreate={handleCreate}
        onEdit={handleEditTemplate}
        onTrash={(id) => {
          trashDoc(id);
          refresh();
        }}
        onRestore={(id) => {
          restoreDoc(id);
          refresh();
        }}
        onPurge={(id) => {
          purgeDoc(id);
          refresh();
        }}
        onEmptyTrash={() => {
          emptyTrash();
          refresh();
        }}
        onOpenFromCloud={(provider) => setCloudProvider(provider)}
      />
      <CloudOpenModal
        isOpen={Boolean(cloudProvider)}
        provider={cloudProvider}
        theme={theme}
        isDarkMode={isDarkMode}
        onClose={() => setCloudProvider(null)}
        onOpened={(doc) => {
          setOpenDocId(doc.id);
          refresh();
        }}
      />
    </AppPageShell>
  );
}
