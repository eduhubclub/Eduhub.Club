import { staffForSchool } from '../district/districtModel';

/** Schools that participate in elementary Class Creator placement. */
export function elementarySchools(org) {
  return (org?.schools || []).filter(
    (school) => !school.level || school.level === 'elementary',
  );
}

function isSchoolLeaderTitle(session) {
  const title = String(session?.staffRole || session?.title || '').toLowerCase();
  return (
    title.includes('assistant principal') ||
    title.includes('vice principal') ||
    title.includes('principal') ||
    title.includes('headmaster') ||
    title.includes('headmistress')
  );
}

/**
 * Schools the signed-in actor may open in Class Creator.
 * District admins see every elementary school; principals / APs see only theirs.
 */
export function schoolsForClassCreatorSession(session, org, contextSchoolId = '') {
  const schools = elementarySchools(org);
  if (!schools.length) return [];

  if (isSchoolLeaderTitle(session)) {
    const pinned = String(session?.schoolId || contextSchoolId || '').trim();
    if (pinned) {
      const match = schools.filter((school) => school.id === pinned);
      if (match.length) return match;
    }

    const email = String(session?.email || '').toLowerCase();
    if (email) {
      const matched = schools.filter((school) => {
        const staff = staffForSchool(org, school.id);
        return staff.some((member) => {
          const role = String(member.role || '').toLowerCase();
          const isLeader =
            role.includes('principal') ||
            role.includes('headmaster') ||
            role.includes('headmistress');
          return isLeader && String(member.email || '').toLowerCase() === email;
        });
      });
      if (matched.length) return matched;
    }

    return schools.slice(0, 1);
  }

  return schools;
}
