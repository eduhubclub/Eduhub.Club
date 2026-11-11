import { describe, expect, it } from 'vitest';
import { schoolsForClassCreatorSession } from './placementSchools.js';

const org = {
  schools: [
    { id: 'sch-wayside', name: 'Wayside Elementary', level: 'elementary' },
    { id: 'sch-crunchem', name: 'Crunchem Hall Elementary', level: 'elementary' },
    { id: 'sch-hogwarts', name: 'Hogwarts High', level: 'high' },
  ],
  staff: {
    'sch-wayside': [
      {
        id: 'p1',
        name: 'Mr. Kidswatter',
        role: 'Principal',
        email: 'kidswatter@storywell.edu',
      },
    ],
    'sch-crunchem': [],
    'sch-hogwarts': [],
  },
};

describe('schoolsForClassCreatorSession', () => {
  it('lists elementary schools for district admins', () => {
    const schools = schoolsForClassCreatorSession({ role: 'admin' }, org);
    expect(schools.map((row) => row.id)).toEqual(['sch-wayside', 'sch-crunchem']);
  });

  it('limits principals to their school', () => {
    const schools = schoolsForClassCreatorSession(
      {
        role: 'admin',
        title: 'Principal',
        email: 'kidswatter@storywell.edu',
      },
      org,
    );
    expect(schools.map((row) => row.id)).toEqual(['sch-wayside']);
  });

  it('uses context schoolId for school leaders', () => {
    const schools = schoolsForClassCreatorSession(
      { role: 'admin', title: 'Principal' },
      org,
      'sch-crunchem',
    );
    expect(schools.map((row) => row.id)).toEqual(['sch-crunchem']);
  });
});
