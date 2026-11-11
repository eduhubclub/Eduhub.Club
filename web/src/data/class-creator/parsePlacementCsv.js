/**
 * Skyward-friendly student CSV for Class Creator intake (K + transfers).
 */

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
  return headers.findIndex((header) =>
    needles.some((needle) => header === needle || header.includes(needle)),
  );
}

function splitLastFirst(raw) {
  const value = String(raw || '').trim();
  if (!value.includes(',')) return { firstName: '', lastName: '', name: value };
  const [last, ...rest] = value.split(',');
  const firstName = rest.join(',').trim();
  const lastName = last.trim();
  return {
    firstName,
    lastName,
    name: [firstName, lastName].filter(Boolean).join(' '),
  };
}

/** Downloadable template matching common Skyward export fields. */
export const PLACEMENT_CSV_TEMPLATE =
  'student_id,first_name,last_name,gender,grade,school\n' +
  '10001,Ada,Lovelace,F,Kindergarten,Storywell Elementary\n' +
  '10002,Alan,Turing,M,Kindergarten,Storywell Elementary\n';

/**
 * Parse placement intake rows from CSV text.
 * @returns {{ students: object[], errors: string[] }}
 */
export function parsePlacementCsv(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '');
  if (lines.length === 0) return { students: [], errors: ['File is empty.'] };

  const headers = parseCSVLine(lines[0]).map((header) => header.toLowerCase().trim());
  const nameCol = headers.findIndex(
    (h) => h === 'name' || h === 'student name' || h === 'student',
  );
  const firstCol = findCol(headers, 'first_name', 'firstname', 'first name', 'first');
  const lastCol = findCol(headers, 'last_name', 'lastname', 'last name', 'last');
  const genderCol = findCol(headers, 'gender', 'sex');
  const gradeCol = findCol(headers, 'grade_level', 'grade level', 'grade');
  const schoolCol = findCol(headers, 'school', 'building', 'campus');
  const idCol = findCol(
    headers,
    'student_id',
    'student id',
    'sis_id',
    'sis id',
    'other id',
    'id',
  );

  const hasHeader =
    nameCol >= 0 ||
    firstCol >= 0 ||
    lastCol >= 0 ||
    genderCol >= 0 ||
    gradeCol >= 0 ||
    idCol >= 0;
  if (!hasHeader) {
    return {
      students: [],
      errors: ['Could not find name or student id columns in the header row.'],
    };
  }

  const students = [];
  const errors = [];
  const baseId = Date.now();

  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCSVLine(lines[i]);
    let firstName = firstCol >= 0 ? String(cols[firstCol] || '').trim() : '';
    let lastName = lastCol >= 0 ? String(cols[lastCol] || '').trim() : '';
    let name = '';

    if (firstName || lastName) {
      name = `${firstName} ${lastName}`.replace(/\s+/g, ' ').trim();
    } else if (nameCol >= 0) {
      const parsed = splitLastFirst(cols[nameCol]);
      firstName = parsed.firstName;
      lastName = parsed.lastName;
      name = parsed.name;
    }

    if (!name) {
      errors.push(`Row ${i + 1}: missing name.`);
      continue;
    }

    const studentId = idCol >= 0 ? String(cols[idCol] || '').trim() : '';
    students.push({
      id: studentId ? `sis-${studentId}` : `csv-${baseId}-${i}`,
      name,
      firstName,
      lastName,
      gender: genderCol >= 0 ? String(cols[genderCol] || '').trim() : '',
      grade_level: gradeCol >= 0 ? String(cols[gradeCol] || '').trim() : '',
      studentId,
      school: schoolCol >= 0 ? String(cols[schoolCol] || '').trim() : '',
      source: 'external',
      services: [],
    });
  }

  return { students, errors };
}
