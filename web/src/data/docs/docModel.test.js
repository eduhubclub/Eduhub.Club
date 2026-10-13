import { describe, expect, it } from 'vitest';
import {
  addSection,
  createDoc,
  createDocFromTemplate,
  createTemplate,
  emptyDocContent,
  normalizeDoc,
  removeSection,
} from './docModel.js';
import {
  EDUDOC_MIME,
  edudocFileName,
  parseEdudoc,
  serializeEdudoc,
} from './edudocFormat.js';
import { docPreviewBlocks, docPreviewText } from './docPreview.js';

describe('docModel', () => {
  it('creates a blank doc', () => {
    const doc = createDoc({ title: 'Warm-up' });
    expect(doc.title).toBe('Warm-up');
    expect(doc.content).toEqual(emptyDocContent());
    expect(doc.trashedAt).toBeNull();
    expect(doc.cloud).toBeNull();
  });

  it('normalizes missing content', () => {
    const doc = normalizeDoc({ id: 'x', title: 'A', content: null });
    expect(doc.content.type).toBe('doc');
  });

  it('migrates legacy content into one section', () => {
    const doc = normalizeDoc({
      id: 'legacy',
      title: 'Essay',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Body' }],
          },
        ],
      },
    });
    expect(doc.sections).toHaveLength(1);
    expect(doc.sections[0].title).toBe('Section 1');
    expect(doc.content).toEqual(doc.sections[0].content);
  });

  it('adds and removes sections without splitting into multiple docs', () => {
    let doc = createDoc({ title: 'One card' });
    expect(doc.sections).toHaveLength(1);
    doc = addSection(doc, 'Part B');
    expect(doc.sections).toHaveLength(2);
    expect(doc.title).toBe('One card');
    const removeId = doc.sections[0].id;
    doc = removeSection(doc, removeId);
    expect(doc.sections).toHaveLength(1);
    expect(doc.sections[0].title).toBe('Part B');
    // Cannot remove the last section
    const same = removeSection(doc, doc.sections[0].id);
    expect(same.sections).toHaveLength(1);
  });
});

describe('edudocFormat', () => {
  it('round-trips without Word-friendly MIME', () => {
    const doc = createDoc({ title: 'Essay' });
    const text = serializeEdudoc(doc);
    const envelope = JSON.parse(text);
    expect(envelope.format).toBe('edudoc');
    expect(envelope.mime).toBe(EDUDOC_MIME);
    const back = parseEdudoc(text);
    expect(back.title).toBe('Essay');
    expect(back.content.type).toBe('doc');
  });

  it('builds .edudoc filenames', () => {
    expect(edudocFileName('My Essay')).toBe('My Essay.edudoc');
    expect(edudocFileName('bad/name?.txt')).toBe('badname.txt.edudoc');
  });
});

describe('templates', () => {
  it('creates a template kind and clones into a document', () => {
    const tmpl = createTemplate({
      title: 'Warm-up',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello' }],
          },
        ],
      },
    });
    expect(tmpl.kind).toBe('template');
    const doc = createDocFromTemplate(tmpl);
    expect(doc.kind).toBe('document');
    expect(doc.id).not.toBe(tmpl.id);
    expect(doc.content).toEqual(tmpl.content);
    expect(doc.sections).toHaveLength(tmpl.sections.length);
    expect(doc.title).toBe('Warm-up');
  });
});

describe('docPreviewText', () => {
  it('extracts text for thumbnails', () => {
    expect(
      docPreviewText({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello classroom' }],
          },
        ],
      }),
    ).toBe('Hello classroom');
  });

  it('includes images in preview blocks', () => {
    const blocks = docPreviewBlocks({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Before' }],
        },
        {
          type: 'image',
          attrs: { src: 'data:image/png;base64,abc', alt: 'chart' },
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'After' }],
        },
      ],
    });
    expect(blocks).toEqual([
      { type: 'text', text: 'Before' },
      { type: 'image', src: 'data:image/png;base64,abc', alt: 'chart' },
      { type: 'text', text: 'After' },
    ]);
  });
});
