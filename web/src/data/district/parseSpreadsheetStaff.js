import { departmentForRole, STAFF_DEPARTMENTS } from './staffDepartments';

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else current += char;
  }
  result.push(current.trim());
  return result.map((value) => value.replace(/(^"|"$)/g, ''));
}

function findCol(headers, ...needles) {
  return headers.findIndex((header) => needles.some((needle) => header.includes(needle)));
}

function resolveDepartmentId(raw, catalog = STAFF_DEPARTMENTS) {
  const value = String(raw || '').trim();
  if (!value) return '';
  const lower = value.toLowerCase();
  const byId = catalog.find((row) => row.id === lower || row.id === value);
  if (byId) return byId.id;
  const byLabel = catalog.find((row) => row.label.toLowerCase() === lower);
  if (byLabel) return byLabel.id;
  return '';
}

/** CSV template header for mass staff import. */
export const STAFF_CSV_TEMPLATE =
  'name,role,department,room,extension,email\n' +
  'Ms. Example,3rd Grade Teacher,Teaching,Room 12,x1200,example@school.edu\n';

/**
 * Parse staff rows from CSV text.
 * Headers: name (or first/last), role, department, room, extension, email.
 */
export function parseSpreadsheetStaff(text, catalog = STAFF_DEPARTMENTS) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '');
  if (lines.length === 0) return [];

  const headers = parseCSVLine(lines[0]).map((header) => header.toLowerCase().trim());
  const nameCol = headers.findIndex(
    (h) => h === 'name' || h === 'staff name' || h === 'full name',
  );
  const firstCol = findCol(headers, 'first');
  const lastCol = findCol(headers, 'last');
  const roleCol = findCol(headers, 'role', 'title', 'position', 'job');
  const deptCol = findCol(headers, 'department', 'dept');
  const roomCol = findCol(headers, 'room');
  const extCol = findCol(headers, 'extension', 'ext');
  const emailCol = findCol(headers, 'email', 'mail');

  const hasHeader =
    nameCol >= 0 ||
    firstCol >= 0 ||
    lastCol >= 0 ||
    roleCol >= 0 ||
    deptCol >= 0 ||
    emailCol >= 0;
  const startIndex = hasHeader ? 1 : 0;
  const rows = [];

  for (let i = startIndex; i < lines.length; i += 1) {
    const cols = parseCSVLine(lines[i]);
    let name = '';
    if (firstCol >= 0 || lastCol >= 0) {
      name = `${cols[firstCol] || ''} ${cols[lastCol] || ''}`.replace(/\s+/g, ' ').trim();
    } else if (nameCol >= 0) {
      name = String(cols[nameCol] || '').trim();
    } else if (!hasHeader) {
      name = String(cols[0] || '').trim();
    }
    if (!name || name.toLowerCase() === 'name') continue;

    const role = roleCol >= 0 ? String(cols[roleCol] || '').trim() : !hasHeader ? String(cols[1] || '').trim() : '';
    const departmentRaw =
      deptCol >= 0 ? String(cols[deptCol] || '').trim() : !hasHeader ? String(cols[2] || '').trim() : '';
    const department =
      resolveDepartmentId(departmentRaw, catalog) || departmentForRole(role || 'Staff');

    rows.push({
      name,
      role: role || 'Staff',
      department,
      room: roomCol >= 0 ? String(cols[roomCol] || '').trim() : '',
      extension: extCol >= 0 ? String(cols[extCol] || '').trim() : '',
      email: emailCol >= 0 ? String(cols[emailCol] || '').trim() : '',
    });
  }

  return rows;
}
