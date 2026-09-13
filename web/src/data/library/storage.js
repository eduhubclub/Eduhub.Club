/**
 * Local-first teacher library: titles, copies, loans.
 */

import {
  buildLibraryLabelPayload,
  makeShortCode,
  normalizeIsbn,
  parseLibraryLabelPayload,
} from './labelPayload';
import { LIBRARY_UPDATED_EVENT } from './types';

const TITLES_KEY = 'eduHub.library.titles';
const COPIES_KEY = 'eduHub.library.copies';
const LOANS_KEY = 'eduHub.library.loans';

function readJson(key, fallback) {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || 'null');
    return raw == null ? fallback : raw;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LIBRARY_UPDATED_EVENT));
  }
}

function newId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** @returns {Array<object>} */
export function readTitles() {
  const list = readJson(TITLES_KEY, []);
  return Array.isArray(list) ? list : [];
}

/** @returns {Array<object>} */
export function readCopies() {
  const list = readJson(COPIES_KEY, []);
  return Array.isArray(list) ? list : [];
}

/** @returns {Array<object>} */
export function readLoans() {
  const list = readJson(LOANS_KEY, []);
  return Array.isArray(list) ? list : [];
}

function writeTitles(list) {
  writeJson(TITLES_KEY, list);
}

function writeCopies(list) {
  writeJson(COPIES_KEY, list);
}

function writeLoans(list) {
  writeJson(LOANS_KEY, list);
}

/**
 * @param {string} id
 */
export function getTitle(id) {
  return readTitles().find((t) => t.id === String(id)) || null;
}

/**
 * @param {string} isbn
 */
export function findTitleByIsbn(isbn) {
  const key = normalizeIsbn(isbn);
  if (!key) return null;
  return readTitles().find((t) => normalizeIsbn(t.isbn) === key) || null;
}

/**
 * @param {string} copyId
 */
export function getCopy(copyId) {
  return readCopies().find((c) => c.id === String(copyId)) || null;
}

/**
 * @param {string} titleId
 */
export function copiesForTitle(titleId) {
  return readCopies()
    .filter((c) => c.titleId === String(titleId))
    .sort((a, b) => a.copyNumber - b.copyNumber);
}

/**
 * Resolve a scanned string to a copy (label JSON or short code).
 * @param {string} raw
 */
export function findCopyByScan(raw) {
  const text = String(raw || '').trim();
  if (!text) return null;
  const parsed = parseLibraryLabelPayload(text);
  if (parsed?.copyId) return getCopy(parsed.copyId);
  const upper = text.toUpperCase();
  return (
    readCopies().find(
      (c) =>
        String(c.shortCode || '').toUpperCase() === upper ||
        String(c.labelCode || '') === text,
    ) || null
  );
}

/**
 * Add a new title (or return existing by ISBN).
 * @param {{ isbn?: string, title: string, author?: string, coverUrl?: string, pageCount?: number | null }} input
 */
export function addTitle(input) {
  const isbn = normalizeIsbn(input?.isbn || '');
  if (isbn) {
    const existing = findTitleByIsbn(isbn);
    if (existing) return existing;
  }
  const title = String(input?.title || '').trim();
  if (!title) return null;
  const row = {
    id: newId('title'),
    isbn: isbn || '',
    title,
    author: String(input?.author || 'Unknown author').trim() || 'Unknown author',
    coverUrl: String(input?.coverUrl || '').trim(),
    pageCount: input?.pageCount == null ? null : Number(input.pageCount) || null,
    createdAt: new Date().toISOString(),
  };
  writeTitles([row, ...readTitles()]);
  return row;
}

/**
 * Add a physical copy of a title. Creates unique label codes.
 * @param {string} titleId
 */
export function addCopy(titleId) {
  const title = getTitle(titleId);
  if (!title) return null;
  const siblings = copiesForTitle(titleId);
  const copyNumber = siblings.length + 1;
  const id = newId('copy');
  const shortCode = makeShortCode(id);
  const labelCode = buildLibraryLabelPayload(id, shortCode);
  const row = {
    id,
    titleId: String(titleId),
    copyNumber,
    shortCode,
    labelCode,
    status: 'in',
    labeledAt: null,
    createdAt: new Date().toISOString(),
  };
  writeCopies([row, ...readCopies()]);
  return row;
}

/**
 * @param {string} titleId
 * @param {{ title?: string, author?: string, isbn?: string, coverUrl?: string }} patch
 */
export function updateTitle(titleId, patch) {
  const id = String(titleId);
  const current = getTitle(id);
  if (!current) return null;
  const isbn =
    patch.isbn == null ? current.isbn : normalizeIsbn(patch.isbn) || String(patch.isbn || '').trim();
  const next = {
    ...current,
    title: patch.title != null ? String(patch.title).trim() || current.title : current.title,
    author: patch.author != null ? String(patch.author).trim() || current.author : current.author,
    isbn,
    coverUrl:
      patch.coverUrl != null ? String(patch.coverUrl).trim() : current.coverUrl,
  };
  writeTitles(readTitles().map((t) => (t.id === id ? next : t)));
  return next;
}

/**
 * Remove a copy that is not checked out.
 * @param {string} copyId
 */
export function deleteCopy(copyId) {
  const copy = getCopy(copyId);
  if (!copy) return { ok: false, error: 'Copy not found.' };
  if (copy.status === 'out' || activeLoanForCopy(copy.id)) {
    return { ok: false, error: 'Return this copy before deleting it.' };
  }
  writeCopies(readCopies().filter((c) => c.id !== copy.id));
  return { ok: true, copy };
}

/**
 * Remove a title and its in-shelf copies. Fails if any copy is out.
 * @param {string} titleId
 */
export function deleteTitle(titleId) {
  const title = getTitle(titleId);
  if (!title) return { ok: false, error: 'Title not found.' };
  const copies = copiesForTitle(title.id);
  if (copies.some((c) => c.status === 'out' || activeLoanForCopy(c.id))) {
    return { ok: false, error: 'Return all copies of this title before deleting it.' };
  }
  const ids = new Set(copies.map((c) => c.id));
  writeCopies(readCopies().filter((c) => !ids.has(c.id)));
  writeTitles(readTitles().filter((t) => t.id !== title.id));
  return { ok: true, title };
}

/**
 * @param {string[]} copyIds
 */
export function markCopiesLabeled(copyIds) {
  const set = new Set((copyIds || []).map(String));
  const now = new Date().toISOString();
  writeCopies(
    readCopies().map((c) => (set.has(c.id) ? { ...c, labeledAt: c.labeledAt || now } : c)),
  );
}

/**
 * Open (not returned) loan for a copy.
 * @param {string} copyId
 */
export function activeLoanForCopy(copyId) {
  return (
    readLoans().find((l) => l.copyId === String(copyId) && !l.inAt) || null
  );
}

/**
 * Open loans for a student.
 * @param {string} studentId
 */
export function activeLoansForStudent(studentId) {
  return readLoans().filter((l) => l.studentId === String(studentId) && !l.inAt);
}

/**
 * @param {string} copyId
 * @param {'in' | 'out'} status
 */
export function setCopyStatus(copyId, status) {
  writeCopies(
    readCopies().map((c) =>
      c.id === String(copyId) ? { ...c, status: status === 'out' ? 'out' : 'in' } : c,
    ),
  );
}

/**
 * @param {object} loan
 */
export function appendLoan(loan) {
  writeLoans([loan, ...readLoans()]);
  return loan;
}

/**
 * @param {string} loanId
 * @param {Partial<object>} patch
 */
export function updateLoan(loanId, patch) {
  writeLoans(
    readLoans().map((l) => (l.id === String(loanId) ? { ...l, ...patch } : l)),
  );
}

export function createLoanId() {
  return newId('loan');
}

/**
 * Shelf summary rows for UI.
 */
export function shelfSummaries() {
  const copies = readCopies();
  return readTitles().map((title) => {
    const mine = copies.filter((c) => c.titleId === title.id);
    const inCount = mine.filter((c) => c.status !== 'out').length;
    const outCount = mine.length - inCount;
    return {
      title,
      copies: mine.length,
      inCount,
      outCount,
      unlabeled: mine.filter((c) => !c.labeledAt).length,
    };
  });
}

/**
 * Active loans enriched for Out view.
 */
export function listActiveLoans() {
  const titles = readTitles();
  const copies = readCopies();
  const titleById = Object.fromEntries(titles.map((t) => [t.id, t]));
  const copyById = Object.fromEntries(copies.map((c) => [c.id, c]));
  const now = Date.now();
  return readLoans()
    .filter((l) => !l.inAt)
    .map((loan) => {
      const copy = copyById[loan.copyId] || null;
      const title = copy ? titleById[copy.titleId] || null : null;
      const dueMs = loan.dueAt ? Date.parse(loan.dueAt) : NaN;
      const overdue = Number.isFinite(dueMs) && dueMs < now;
      return { loan, copy, title, overdue };
    })
    .sort((a, b) => {
      if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
      return String(a.loan.dueAt || '').localeCompare(String(b.loan.dueAt || ''));
    });
}

export function copiesNeedingLabels() {
  return readCopies().filter((c) => !c.labeledAt);
}

const INVENTORY_KEY = 'eduHub.library.inventory';

/**
 * @returns {{ startedAt: string, foundIds: string[], leftover: string[] } | null}
 */
export function readInventory() {
  const row = readJson(INVENTORY_KEY, null);
  if (!row || typeof row !== 'object') return null;
  return {
    startedAt: String(row.startedAt || ''),
    foundIds: Array.isArray(row.foundIds) ? row.foundIds.map(String) : [],
    leftover: Array.isArray(row.leftover) ? row.leftover.map(String) : [],
  };
}

export function startInventory() {
  const row = {
    startedAt: new Date().toISOString(),
    foundIds: [],
    leftover: [],
  };
  writeJson(INVENTORY_KEY, row);
  return row;
}

export function clearInventory() {
  try {
    localStorage.removeItem(INVENTORY_KEY);
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LIBRARY_UPDATED_EVENT));
  }
}

function writeInventory(row) {
  writeJson(INVENTORY_KEY, row);
  return row;
}

/**
 * @param {string} copyId
 */
export function recordInventoryFound(copyId) {
  const session = readInventory() || startInventory();
  const id = String(copyId);
  if (!session.foundIds.includes(id)) session.foundIds.push(id);
  return writeInventory(session);
}

/**
 * @param {string} code
 */
export function recordInventoryLeftover(code) {
  const session = readInventory() || startInventory();
  const text = String(code || '').trim();
  if (text) session.leftover.push(text);
  return writeInventory(session);
}

/**
 * Year-end inventory: found vs missing (expected on shelf) vs still out vs extra unknown scans.
 * @param {{ startedAt: string, foundIds: string[], leftover: string[] } | null} [session]
 */
export function inventoryReport(session = readInventory()) {
  const foundIds = new Set(session?.foundIds || []);
  const titles = Object.fromEntries(readTitles().map((t) => [t.id, t]));
  const enrich = (copy) => ({ copy, title: titles[copy.titleId] || null });
  const copies = readCopies();
  return {
    found: copies.filter((c) => foundIds.has(c.id)).map(enrich),
    missing: copies.filter((c) => c.status !== 'out' && !foundIds.has(c.id)).map(enrich),
    out: copies.filter((c) => c.status === 'out').map(enrich),
    leftover: session?.leftover || [],
  };
}
