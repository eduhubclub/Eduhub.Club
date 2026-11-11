/**
 * District org localStorage. Reseeded when DISTRICT_ORG_SEED_REVISION bumps
 * so the literary demo roster (4 elementary, 1 middle, 1 high) stays current.
 */

import { normalizeDistrict, seedDistrictOrg } from './districtModel';

const KEY = 'eduHub.district.org';
const REV_KEY = 'eduHub.district.org.rev';

/** Bump when demo schools / district name should replace local org. */
export const DISTRICT_ORG_SEED_REVISION = 15;

export const DISTRICT_UPDATED_EVENT = 'eduHub.district.updated';

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function notify() {
  try {
    window.dispatchEvent(new CustomEvent(DISTRICT_UPDATED_EVENT));
  } catch {
    /* ignore */
  }
}

function writeSeedRevision() {
  try {
    localStorage.setItem(REV_KEY, String(DISTRICT_ORG_SEED_REVISION));
  } catch {
    /* ignore */
  }
}

export function writeDistrictOrg(org) {
  const next = normalizeDistrict(org);
  writeJson(KEY, next);
  writeSeedRevision();
  notify();
  return next;
}

export function readDistrictOrg() {
  let rev = 0;
  try {
    rev = Number(localStorage.getItem(REV_KEY) || 0);
  } catch {
    rev = 0;
  }
  if (rev !== DISTRICT_ORG_SEED_REVISION) {
    return writeDistrictOrg(seedDistrictOrg());
  }
  const raw = readJson(KEY);
  if (!raw) return writeDistrictOrg(seedDistrictOrg());
  return normalizeDistrict(raw);
}

export function updateDistrictOrg(mutator) {
  const current = readDistrictOrg();
  const draft = typeof mutator === 'function' ? mutator(current) : mutator;
  return writeDistrictOrg(draft);
}

export function clearDistrictOrg() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(REV_KEY);
  } catch {
    /* ignore */
  }
  notify();
}
