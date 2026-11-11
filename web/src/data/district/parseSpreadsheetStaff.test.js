import { describe, expect, it } from 'vitest';
import { parseSpreadsheetStaff, STAFF_CSV_TEMPLATE } from './parseSpreadsheetStaff.js';

describe('parseSpreadsheetStaff', () => {
  it('parses the template header and example row', () => {
    const rows = parseSpreadsheetStaff(STAFF_CSV_TEMPLATE);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      name: 'Ms. Example',
      role: '3rd Grade Teacher',
      department: 'teaching',
      room: 'Room 12',
      extension: 'x1200',
      email: 'example@school.edu',
    });
  });

  it('accepts first/last name columns and department labels', () => {
    const csv = [
      'first name,last name,role,department,email',
      'Ada,Lovelace,Librarian,Library,ada@school.edu',
      'Grace,Hopper,Coach,Athletics,grace@school.edu',
    ].join('\n');
    const rows = parseSpreadsheetStaff(csv);
    expect(rows).toEqual([
      {
        name: 'Ada Lovelace',
        role: 'Librarian',
        department: 'library',
        room: '',
        extension: '',
        email: 'ada@school.edu',
      },
      {
        name: 'Grace Hopper',
        role: 'Coach',
        department: 'athletics',
        room: '',
        extension: '',
        email: 'grace@school.edu',
      },
    ]);
  });
});
