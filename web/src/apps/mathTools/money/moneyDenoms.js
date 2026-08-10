/**
 * Coin / bill denominations for Bank Learning (values in minor units:
 * US/CA cents, MX centavos).
 */

export const MONEY_CURRENCIES = [
  {
    id: 'us',
    label: 'United States',
    short: 'US',
    code: 'USD',
    symbol: '$',
    centSymbol: '¢',
    denoms: [
      {
        id: 'us-penny',
        label: '1¢',
        name: 'Penny',
        cents: 1,
        kind: 'coin',
        fill: '#b45309',
        ink: '#fff7ed',
        size: 44,
      },
      {
        id: 'us-nickel',
        label: '5¢',
        name: 'Nickel',
        cents: 5,
        kind: 'coin',
        fill: '#94a3b8',
        ink: '#0f172a',
        size: 52,
      },
      {
        id: 'us-dime',
        label: '10¢',
        name: 'Dime',
        cents: 10,
        kind: 'coin',
        fill: '#cbd5e1',
        ink: '#0f172a',
        size: 40,
      },
      {
        id: 'us-quarter',
        label: '25¢',
        name: 'Quarter',
        cents: 25,
        kind: 'coin',
        fill: '#94a3b8',
        ink: '#0f172a',
        size: 58,
      },
      {
        id: 'us-half',
        label: '50¢',
        name: 'Half dollar',
        cents: 50,
        kind: 'coin',
        fill: '#64748b',
        ink: '#f8fafc',
        size: 64,
      },
      {
        id: 'us-1',
        label: '$1',
        name: 'Dollar bill',
        cents: 100,
        kind: 'bill',
        fill: '#166534',
        ink: '#ecfdf5',
        w: 96,
        h: 48,
      },
      {
        id: 'us-5',
        label: '$5',
        name: 'Five dollar bill',
        cents: 500,
        kind: 'bill',
        fill: '#1e3a8a',
        ink: '#eff6ff',
        w: 104,
        h: 48,
      },
      {
        id: 'us-10',
        label: '$10',
        name: 'Ten dollar bill',
        cents: 1000,
        kind: 'bill',
        fill: '#9f1239',
        ink: '#fff1f2',
        w: 112,
        h: 48,
      },
      {
        id: 'us-20',
        label: '$20',
        name: 'Twenty dollar bill',
        cents: 2000,
        kind: 'bill',
        fill: '#0f766e',
        ink: '#f0fdfa',
        w: 120,
        h: 48,
      },
      {
        id: 'us-50',
        label: '$50',
        name: 'Fifty dollar bill',
        cents: 5000,
        kind: 'bill',
        fill: '#c2410c',
        ink: '#fff7ed',
        w: 128,
        h: 48,
      },
      {
        id: 'us-100',
        label: '$100',
        name: 'One hundred dollar bill',
        cents: 10000,
        kind: 'bill',
        fill: '#15803d',
        ink: '#f0fdf4',
        w: 136,
        h: 48,
      },
    ],
  },
  {
    id: 'ca',
    label: 'Canada',
    short: 'CA',
    code: 'CAD',
    symbol: '$',
    centSymbol: '¢',
    denoms: [
      {
        id: 'ca-nickel',
        label: '5¢',
        name: 'Nickel',
        cents: 5,
        kind: 'coin',
        fill: '#94a3b8',
        ink: '#0f172a',
        size: 52,
      },
      {
        id: 'ca-dime',
        label: '10¢',
        name: 'Dime',
        cents: 10,
        kind: 'coin',
        fill: '#cbd5e1',
        ink: '#0f172a',
        size: 40,
      },
      {
        id: 'ca-quarter',
        label: '25¢',
        name: 'Quarter',
        cents: 25,
        kind: 'coin',
        fill: '#94a3b8',
        ink: '#0f172a',
        size: 58,
      },
      {
        id: 'ca-loonie',
        label: '$1',
        name: 'Loonie',
        cents: 100,
        kind: 'coin',
        fill: '#ca8a04',
        ink: '#422006',
        size: 60,
      },
      {
        id: 'ca-toonie',
        label: '$2',
        name: 'Toonie',
        cents: 200,
        kind: 'coin',
        fill: '#a16207',
        ink: '#fefce8',
        size: 66,
      },
      {
        id: 'ca-5',
        label: '$5',
        name: 'Five dollar bill',
        cents: 500,
        kind: 'bill',
        fill: '#0e7490',
        ink: '#ecfeff',
        w: 104,
        h: 48,
      },
      {
        id: 'ca-10',
        label: '$10',
        name: 'Ten dollar bill',
        cents: 1000,
        kind: 'bill',
        fill: '#7e22ce',
        ink: '#faf5ff',
        w: 112,
        h: 48,
      },
      {
        id: 'ca-20',
        label: '$20',
        name: 'Twenty dollar bill',
        cents: 2000,
        kind: 'bill',
        fill: '#15803d',
        ink: '#f0fdf4',
        w: 120,
        h: 48,
      },
      {
        id: 'ca-50',
        label: '$50',
        name: 'Fifty dollar bill',
        cents: 5000,
        kind: 'bill',
        fill: '#c2410c',
        ink: '#fff7ed',
        w: 128,
        h: 48,
      },
      {
        id: 'ca-100',
        label: '$100',
        name: 'One hundred dollar bill',
        cents: 10000,
        kind: 'bill',
        fill: '#a16207',
        ink: '#fefce8',
        w: 136,
        h: 48,
      },
    ],
  },
  {
    id: 'mx',
    label: 'Mexico',
    short: 'MX',
    code: 'MXN',
    symbol: '$',
    centSymbol: '¢',
    denoms: [
      {
        id: 'mx-1',
        label: '$1',
        name: 'One peso coin',
        cents: 100,
        kind: 'coin',
        fill: '#a8a29e',
        ink: '#1c1917',
        size: 48,
      },
      {
        id: 'mx-2',
        label: '$2',
        name: 'Two peso coin',
        cents: 200,
        kind: 'coin',
        fill: '#78716c',
        ink: '#fafaf9',
        size: 52,
      },
      {
        id: 'mx-5',
        label: '$5',
        name: 'Five peso coin',
        cents: 500,
        kind: 'coin',
        fill: '#b45309',
        ink: '#fffbeb',
        size: 56,
      },
      {
        id: 'mx-10',
        label: '$10',
        name: 'Ten peso coin',
        cents: 1000,
        kind: 'coin',
        fill: '#a16207',
        ink: '#fefce8',
        size: 60,
      },
      {
        id: 'mx-20',
        label: '$20',
        name: 'Twenty peso bill',
        cents: 2000,
        kind: 'bill',
        fill: '#1d4ed8',
        ink: '#eff6ff',
        w: 100,
        h: 48,
      },
      {
        id: 'mx-50',
        label: '$50',
        name: 'Fifty peso bill',
        cents: 5000,
        kind: 'bill',
        fill: '#be185d',
        ink: '#fdf2f8',
        w: 108,
        h: 48,
      },
      {
        id: 'mx-100',
        label: '$100',
        name: 'One hundred peso bill',
        cents: 10000,
        kind: 'bill',
        fill: '#b91c1c',
        ink: '#fef2f2',
        w: 116,
        h: 48,
      },
      {
        id: 'mx-200',
        label: '$200',
        name: 'Two hundred peso bill',
        cents: 20000,
        kind: 'bill',
        fill: '#15803d',
        ink: '#f0fdf4',
        w: 124,
        h: 48,
      },
      {
        id: 'mx-500',
        label: '$500',
        name: 'Five hundred peso bill',
        cents: 50000,
        kind: 'bill',
        fill: '#6d28d9',
        ink: '#f5f3ff',
        w: 132,
        h: 48,
      },
    ],
  },
];

export const DEFAULT_CURRENCY_ID = 'us';

export function getCurrency(currencyId = DEFAULT_CURRENCY_ID) {
  return (
    MONEY_CURRENCIES.find((c) => c.id === currencyId) || MONEY_CURRENCIES[0]
  );
}

export function denomsFor(currencyId = DEFAULT_CURRENCY_ID) {
  return getCurrency(currencyId).denoms;
}

/** @deprecated Prefer denomsFor(currencyId) — kept as US default for callers. */
export const MONEY_DENOMS = denomsFor('us');

export function denomById(id, currencyId) {
  if (currencyId) {
    return denomsFor(currencyId).find((d) => d.id === id) || null;
  }
  for (const currency of MONEY_CURRENCIES) {
    const hit = currency.denoms.find((d) => d.id === id);
    if (hit) return hit;
  }
  return null;
}

export function formatCents(cents, currencyId = DEFAULT_CURRENCY_ID) {
  const currency = getCurrency(currencyId);
  const n = Number(cents) || 0;
  const major = Math.floor(n / 100);
  const rem = Math.abs(n % 100);
  if (n < 100 && n >= 0 && rem === n) {
    // Sub-unit only (US/CA coins). Mexico tray has no centavos under $1.
    if (currency.id === 'mx') {
      return `${currency.symbol}${major.toLocaleString()}`;
    }
    return `${n}${currency.centSymbol}`;
  }
  if (rem === 0) {
    return `${currency.symbol}${major.toLocaleString()}`;
  }
  return `${currency.symbol}${major.toLocaleString()}.${String(rem).padStart(2, '0')}`;
}

export function sumDeskCents(pieces = []) {
  return pieces.reduce((sum, p) => {
    const d = denomById(p.denomId);
    return sum + (d?.cents || 0);
  }, 0);
}
