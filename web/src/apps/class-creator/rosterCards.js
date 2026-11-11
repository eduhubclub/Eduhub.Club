import { staffForSchool } from '../../data/district/districtModel';

function gradeSortKey(grade) {
  if (!grade) return 99;
  if (grade === 'Pre-K') return -1;
  if (grade === 'Kindergarten') return 0;
  const n = Number(String(grade).match(/\d+/)?.[0]);
  return Number.isFinite(n) ? n : 50;
}

function classMatchesSchool(cls, org, schoolId) {
  if (!schoolId) return true;
  const linked = org?.classSchools?.[cls.id];
  if (linked && linked !== schoolId) return false;
  if (cls.schoolId && cls.schoolId !== schoolId) return false;
  return true;
}

/**
 * Build grade → [{ teacherName, className, classId, students }] from live classes + staff.
 */
export function buildGradeRosterCards(classes, org, schoolId, bandGrades) {
  const staff = staffForSchool(org, schoolId);
  const teacherByClassId = {};
  for (const member of staff) {
    if (member.classId) teacherByClassId[String(member.classId)] = member.name;
  }

  const byGrade = new Map();
  for (const grade of bandGrades) byGrade.set(grade, []);

  for (const cls of classes || []) {
    if (cls.isArchived) continue;
    const grade = String(cls.grade || '');
    if (!byGrade.has(grade)) continue;
    if (!classMatchesSchool(cls, org, schoolId)) continue;
    byGrade.get(grade).push({
      classId: cls.id,
      className: cls.name || grade,
      teacherName:
        teacherByClassId[String(cls.id)] ||
        cls.teacherName ||
        'Teacher unset',
      students: [...(cls.studentList || [])].sort((a, b) =>
        String(a.lastName || a.name || '').localeCompare(
          String(b.lastName || b.name || ''),
          undefined,
          { sensitivity: 'base' },
        ),
      ),
    });
  }

  return [...byGrade.entries()]
    .map(([grade, rooms]) => ({
      grade,
      rooms: rooms.sort((a, b) =>
        String(a.teacherName).localeCompare(String(b.teacherName), undefined, {
          sensitivity: 'base',
        }),
      ),
    }))
    .sort((a, b) => gradeSortKey(a.grade) - gradeSortKey(b.grade));
}
