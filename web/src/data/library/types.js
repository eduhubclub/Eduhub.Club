/**
 * Edu.Library — teacher-scoped classroom bookshelf + checkout.
 */

export const LIBRARY_UPDATED_EVENT = 'eduHub.library.updated';

export const DEFAULT_LIBRARY_SETTINGS = {
  loanDays: 14,
  /** 0 = unlimited */
  maxBooks: 3,
  studentSelfCheckout: false,
};

/**
 * @param {unknown} raw
 */
export function normalizeLibrarySettings(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const loanDays = Math.max(1, Math.min(90, Number(src.loanDays) || DEFAULT_LIBRARY_SETTINGS.loanDays));
  const maxRaw = Number(src.maxBooks);
  const maxBooks =
    Number.isFinite(maxRaw) && maxRaw >= 0
      ? Math.min(50, Math.floor(maxRaw))
      : DEFAULT_LIBRARY_SETTINGS.maxBooks;
  return {
    loanDays,
    maxBooks,
    studentSelfCheckout: Boolean(src.studentSelfCheckout),
  };
}
