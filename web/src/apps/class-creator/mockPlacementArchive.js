import {
  gradesForBand,
  normalizeStudentSnapshot,
  placementArchiveFromRun,
} from '../../data/class-creator/classCreatorModel';
import { buildGradeRosterCards } from './rosterCards';

const MOCK_FIFTH_FIRST = [
  'Adrian', 'Brielle', 'Colton', 'Delilah', 'Elliot', 'Freya', 'Gavin', 'Hadley',
  'Ivan', 'Jada', 'Knox', 'Lila', 'Marcus', 'Noelle', 'Oscar', 'Piper',
  'Quincy', 'Rhea', 'Silas', 'Tessa', 'Uriel', 'Vera', 'Wes', 'Zara',
  'Amir', 'Blake', 'Celeste', 'Dante', 'Elise', 'Finn', 'Greta', 'Hugo',
];

const MOCK_FIFTH_LAST = [
  'Alvarez', 'Brennan', 'Copeland', 'Donovan', 'Eastwood', 'Fletcher', 'Gable',
  'Harrington', 'Inoue', 'Jennings', 'Kramer', 'Larsen', 'Maddox', 'Nash',
  'Oakley', 'Prescott', 'Qualls', 'Ransom', 'Shepherd', 'Tatum', 'Underwood',
  'Valentine', 'Wexler', 'Yamada',
];

/**
 * Invent students for archive 5th-grade rooms (those kids are in middle school now).
 */
function inventFifthGraders(roomIndex, count = 24) {
  const students = [];
  for (let i = 0; i < count; i += 1) {
    const firstName = MOCK_FIFTH_FIRST[(roomIndex * 7 + i) % MOCK_FIFTH_FIRST.length];
    const lastName =
      MOCK_FIFTH_LAST[(roomIndex * 11 + i * 3) % MOCK_FIFTH_LAST.length];
    students.push(
      normalizeStudentSnapshot({
        id: `archive-mock-5-${roomIndex}-${i + 1}`,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        gender: i % 2 === 0 ? 'Female' : 'Male',
        grade_level: '5th Grade',
        source: 'archive-mock',
      }),
    );
  }
  return students;
}

/**
 * Mock prior-year placement: each destination grade gets the students who are
 * currently one grade above (they have since moved up). 5th-grade rooms get
 * invented students who left for middle school.
 */
export function buildMockPriorYearArchive({
  classes,
  org,
  schoolId,
  schoolName = 'School',
  gradeBand = 'k5',
  yearLabel = '2025–26',
} = {}) {
  if (!schoolId) return null;
  const bandGrades = gradesForBand(gradeBand);
  if (!bandGrades.length) return null;

  const cards = buildGradeRosterCards(classes, org, schoolId, bandGrades);
  const roomsByGrade = new Map(cards.map((card) => [card.grade, card.rooms || []]));

  const destinationTeachers = [];
  const draftClasses = {};
  const students = {};

  for (let gi = 0; gi < bandGrades.length; gi += 1) {
    const destGrade = bandGrades[gi];
    const destRooms = roomsByGrade.get(destGrade) || [];
    const sourceGrade = bandGrades[gi + 1] || null;
    const sourceRooms = sourceGrade ? roomsByGrade.get(sourceGrade) || [] : null;

    destRooms.forEach((room, roomIndex) => {
      const teacherId = `arch-${room.classId || `${destGrade}-${roomIndex}`}`;
      destinationTeachers.push({
        id: teacherId,
        name: room.teacherName || 'Teacher',
        destinationGrade: destGrade,
      });

      let list = [];
      if (sourceRooms?.length) {
        const source =
          sourceRooms[roomIndex] ||
          sourceRooms[roomIndex % sourceRooms.length];
        list = (source?.students || []).map((student) =>
          normalizeStudentSnapshot({
            ...student,
            grade_level: destGrade,
          }),
        );
      } else {
        list = inventFifthGraders(roomIndex, Math.max(18, room.students?.length || 24));
      }

      draftClasses[teacherId] = list.map((student) => String(student.id));
      for (const student of list) {
        students[student.id] = student;
      }
    });
  }

  if (!destinationTeachers.length) return null;

  return placementArchiveFromRun({
    id: `archive-mock-${schoolId}`,
    yearLabel,
    schoolId,
    schoolName,
    gradeBand,
    archivedAt: '2025-06-12T17:00:00.000Z',
    destinationTeachers,
    draftClasses,
    unassigned: [],
    students,
  });
}
