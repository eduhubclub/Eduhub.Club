import { describe, expect, it, beforeEach } from 'vitest';
import {
  buildLibraryLabelPayload,
  looksLikeIsbn,
  normalizeIsbn,
  parseLibraryLabelPayload,
} from './labelPayload';
import {
  addCopy,
  addTitle,
  deleteCopy,
  deleteTitle,
  findCopyByScan,
  findTitleByIsbn,
  inventoryReport,
  readCopies,
  recordInventoryFound,
  recordInventoryLeftover,
  shelfSummaries,
  startInventory,
  updateTitle,
} from './storage';
import { checkoutCopy, dueDateFrom, returnCopy } from './loans';
import { writeLibrarySettings } from './settings';

describe('library', () => {
  beforeEach(() => {
    const store = new Map();
    globalThis.localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    };
  });

  it('normalizes ISBN and builds parseable labels', () => {
    expect(normalizeIsbn('978-0-14-240387-7')).toBe('9780142403877');
    expect(normalizeIsbn('780142403877')).toBe('0780142403877');
    expect(looksLikeIsbn('9780142403877')).toBe(true);
    const payload = buildLibraryLabelPayload('copy-1', 'LIB-ABCD');
    expect(parseLibraryLabelPayload(payload)).toEqual({
      copyId: 'copy-1',
      code: 'LIB-ABCD',
      v: 1,
    });
  });

  it('adds a second copy for the same ISBN title', () => {
    const title = addTitle({
      isbn: '9780142403877',
      title: 'Frog and Toad Are Friends',
      author: 'Arnold Lobel',
    });
    expect(findTitleByIsbn('978-0-14-240387-7')?.id).toBe(title.id);
    const c1 = addCopy(title.id);
    const c2 = addCopy(title.id);
    expect(c1.copyNumber).toBe(1);
    expect(c2.copyNumber).toBe(2);
    expect(c1.shortCode).not.toBe(c2.shortCode);
    expect(readCopies()).toHaveLength(2);
    expect(shelfSummaries()[0].copies).toBe(2);
    expect(findCopyByScan(c2.labelCode)?.id).toBe(c2.id);
  });

  it('checks out and returns with due dates and max books', () => {
    writeLibrarySettings({ loanDays: 7, maxBooks: 1 });
    const title = addTitle({ title: 'The Day Jimmy’s Boa Ate the Wash', isbn: '9780140545333' });
    const a = addCopy(title.id);
    const b = addCopy(title.id);

    const first = checkoutCopy({
      copyId: a.id,
      studentId: 'stu-1',
      classId: 'class-1',
    });
    expect(first.ok).toBe(true);
    expect(first.loan.dueAt).toBeTruthy();

    const blocked = checkoutCopy({
      copyId: b.id,
      studentId: 'stu-1',
      classId: 'class-1',
    });
    expect(blocked.ok).toBe(false);

    const back = returnCopy(a.id);
    expect(back.ok).toBe(true);
    expect(findCopyByScan(a.labelCode)?.status).toBe('in');
  });

  it('computes due dates from loan days', () => {
    writeLibrarySettings({ loanDays: 14 });
    const due = dueDateFrom('2026-08-16T12:00:00.000Z');
    expect(due.startsWith('2026-08-30')).toBe(true);
  });

  it('updates titles and refuses delete while a copy is out', () => {
    const title = addTitle({ title: 'Frog and Toad', author: 'Lobel', isbn: '9780142403877' });
    const a = addCopy(title.id);
    addCopy(title.id);
    const renamed = updateTitle(title.id, {
      title: 'Frog and Toad Are Friends',
      coverUrl: 'https://covers.example/frog.jpg',
    });
    expect(renamed?.title).toBe('Frog and Toad Are Friends');
    expect(renamed?.coverUrl).toBe('https://covers.example/frog.jpg');
    checkoutCopy({ copyId: a.id, studentId: 'stu-1', classId: 'class-1' });
    expect(deleteCopy(a.id).ok).toBe(false);
    expect(deleteTitle(title.id).ok).toBe(false);
    expect(returnCopy(a.id).ok).toBe(true);
    expect(deleteCopy(a.id).ok).toBe(true);
    expect(deleteTitle(title.id).ok).toBe(true);
    expect(readCopies()).toHaveLength(0);
  });

  it('inventory reports missing, found, out, and leftover', () => {
    const title = addTitle({ title: 'Charlotte’s Web', isbn: '9780064400558' });
    const a = addCopy(title.id);
    const b = addCopy(title.id);
    checkoutCopy({ copyId: b.id, studentId: 'stu-1', classId: 'class-1' });
    startInventory();
    recordInventoryFound(a.id);
    recordInventoryLeftover('mystery-code');
    const report = inventoryReport();
    expect(report.found.map((r) => r.copy.id)).toEqual([a.id]);
    expect(report.missing).toEqual([]);
    expect(report.out.map((r) => r.copy.id)).toEqual([b.id]);
    expect(report.leftover).toEqual(['mystery-code']);
  });
});
