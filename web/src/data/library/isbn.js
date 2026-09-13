/**
 * ISBN → title metadata via Open Library (fail soft).
 */

import { normalizeIsbn } from './labelPayload';

/**
 * @typedef {{ isbn: string, title: string, author: string, coverUrl: string, pageCount: number | null }} IsbnLookup
 */

/**
 * @param {string} rawIsbn
 * @returns {Promise<IsbnLookup | null>}
 */
export async function lookupIsbn(rawIsbn) {
  const isbn = normalizeIsbn(rawIsbn);
  if (!isbn) return null;

  const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;

  try {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(
      isbn,
    )}&format=json&jscmd=data`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const row = data?.[`ISBN:${isbn}`];
      if (row?.title) {
        const authors = Array.isArray(row.authors)
          ? row.authors.map((a) => a?.name).filter(Boolean)
          : [];
        return {
          isbn,
          title: String(row.title).trim(),
          author: authors.join(', ') || 'Unknown author',
          coverUrl: row.cover?.medium || row.cover?.large || coverUrl,
          pageCount: Number(row.number_of_pages) || null,
        };
      }
    }
  } catch {
    /* fall through */
  }

  try {
    const res = await fetch(`https://openlibrary.org/isbn/${encodeURIComponent(isbn)}.json`);
    if (res.ok) {
      const row = await res.json();
      if (row?.title) {
        return {
          isbn,
          title: String(row.title).trim(),
          author: 'Unknown author',
          coverUrl,
          pageCount: Number(row.number_of_pages) || null,
        };
      }
    }
  } catch {
    /* fall through */
  }

  return {
    isbn,
    title: `ISBN ${isbn}`,
    author: 'Unknown author',
    coverUrl,
    pageCount: null,
  };
}
