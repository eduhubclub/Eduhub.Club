import { describe, expect, it } from 'vitest';
import {
  resourceFromUrl,
  resourceToLesson,
  toEmbedUrl,
} from './resourceModel.js';

describe('resourceFromUrl', () => {
  it('detects Google Drive', () => {
    const r = resourceFromUrl(
      'https://drive.google.com/file/d/abc123/view?usp=sharing',
    );
    expect(r.source).toBe('google_drive');
    expect(r.embedUrl).toContain('/preview');
  });

  it('detects web curriculum links', () => {
    const r = resourceFromUrl('https://www.khanacademy.org/math');
    expect(r.source).toBe('web');
    expect(r.title).toContain('khanacademy');
  });
});

describe('toEmbedUrl', () => {
  it('converts Google Slides edit links', () => {
    const url =
      'https://docs.google.com/presentation/d/xyz/edit#slide=id.p';
    expect(toEmbedUrl(url)).toContain('/embed');
  });
});

describe('resourceToLesson', () => {
  it('maps to Dashboard lesson shape', () => {
    const r = resourceFromUrl('https://example.com/lesson');
    const lesson = resourceToLesson(r);
    expect(lesson.label).toBeTruthy();
    expect(lesson.link).toBeTruthy();
  });
});
