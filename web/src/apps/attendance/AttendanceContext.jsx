import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  dateKey,
  emptyDayRecord,
  formatCheckInNow,
  normalizeClassRecord,
  normalizeDayRecord,
  normalizeGoals,
  normalizeLunch,
  normalizeStatus,
  submitDay,
  syncDayWithRoster,
} from '../../data/attendance/attendanceModel';
import {
  ATTENDANCE_UPDATED_EVENT,
  dispatchAttendanceUpdated,
  getClassAttendanceRecord,
  writeClassAttendanceRecord,
} from '../../data/attendance/todayPresence';
import {
  DEMO_ATTENDANCE_CLASS_ID,
  ensureDemoAttendanceRecord,
} from '../../data/attendance/demoAttendanceSeed';
import {
  SCHOOL_START_UPDATED_EVENT,
  applySchoolStartTardy,
  readSchoolStartTime,
} from '../../data/attendance/schoolStartTime';
import {
  DATE_VIEW_UPDATED_EVENT,
  readDateView,
} from '../../data/attendance/dateView';
import { AttendanceContext } from './attendanceContextInstance';

export function AttendanceProvider({ roster, classId, children }) {
  const today = dateKey();
  const [record, setRecord] = useState(() =>
    getClassAttendanceRecord(classId),
  );
  const [seededClassId, setSeededClassId] = useState(classId);
  const [activeDate, setActiveDate] = useState(today);
  const [schoolStartTime, setSchoolStartTime] = useState(readSchoolStartTime);
  const [dateView, setDateView] = useState(readDateView);

  useEffect(() => {
    if (classId !== seededClassId) {
      setRecord(getClassAttendanceRecord(classId));
      setSeededClassId(classId);
      setActiveDate(dateKey());
    }
  }, [classId, seededClassId]);

  // Demo Class: roll sample history forward when the calendar day changes.
  useEffect(() => {
    if (String(classId) !== DEMO_ATTENDANCE_CLASS_ID) return undefined;
    const refresh = () => {
      setRecord((prev) => {
        const { record: next, didWrite } = ensureDemoAttendanceRecord(
          classId,
          prev,
        );
        return didWrite ? next : prev;
      });
    };
    refresh();
    const id = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(id);
  }, [classId]);

  useEffect(() => {
    const syncStart = (e) => {
      setSchoolStartTime(
        typeof e?.detail?.schoolStartTime === 'string' ||
          e?.detail?.schoolStartTime === null
          ? e.detail.schoolStartTime
          : readSchoolStartTime(),
      );
    };
    const syncDateView = (e) => {
      setDateView(
        typeof e?.detail?.dateView === 'string'
          ? e.detail.dateView
          : readDateView(),
      );
    };
    window.addEventListener(SCHOOL_START_UPDATED_EVENT, syncStart);
    window.addEventListener(DATE_VIEW_UPDATED_EVENT, syncDateView);
    return () => {
      window.removeEventListener(SCHOOL_START_UPDATED_EVENT, syncStart);
      window.removeEventListener(DATE_VIEW_UPDATED_EVENT, syncDateView);
    };
  }, []);

  // Keep day marks in sync when roster changes.
  useEffect(() => {
    setRecord((prev) => {
      const next = normalizeClassRecord(prev);
      const current = next.days[activeDate] || emptyDayRecord();
      const synced = syncDayWithRoster(current, roster);
      const sameMarks =
        Object.keys(synced.marks).length === Object.keys(current.marks).length &&
        Object.keys(synced.marks).every(
          (id) => synced.marks[id] === current.marks[id],
        );
      const sameLunch =
        Object.keys(synced.lunch).length === Object.keys(current.lunch).length &&
        Object.keys(synced.lunch).every(
          (id) => synced.lunch[id] === current.lunch[id],
        );
      if (sameMarks && sameLunch && synced.submitted === current.submitted) {
        return prev;
      }
      return {
        ...next,
        days: { ...next.days, [activeDate]: synced },
      };
    });
  }, [roster, activeDate]);

  // After school start, unmarked → tardy (today only, while not submitted).
  useEffect(() => {
    const apply = () => {
      const todayKey = dateKey();
      if (activeDate !== todayKey) return;
      setRecord((prev) => {
        const next = normalizeClassRecord(prev);
        const current = syncDayWithRoster(
          next.days[activeDate] || emptyDayRecord(),
          roster,
        );
        const updated = applySchoolStartTardy(current, roster, {
          startTime: schoolStartTime,
          now: new Date(),
          dayKey: activeDate,
          todayKey,
        });
        if (updated === current) return prev;
        return {
          ...next,
          days: {
            ...next.days,
            [activeDate]: normalizeDayRecord(updated),
          },
        };
      });
    };

    apply();
    const id = window.setInterval(apply, 30_000);
    return () => window.clearInterval(id);
  }, [activeDate, roster, schoolStartTime]);

  useEffect(() => {
    if (!classId) return;
    writeClassAttendanceRecord(classId, record);
    dispatchAttendanceUpdated(classId, activeDate);
  }, [record, classId, activeDate]);

  const day = useMemo(() => {
    const raw = record.days?.[activeDate];
    return syncDayWithRoster(raw || emptyDayRecord(), roster);
  }, [record.days, activeDate, roster]);

  const goals = record.goals;

  const patchDay = useCallback(
    (updater) => {
      setRecord((prev) => {
        const next = normalizeClassRecord(prev);
        const current = syncDayWithRoster(
          next.days[activeDate] || emptyDayRecord(),
          roster,
        );
        const updated =
          typeof updater === 'function' ? updater(current) : updater;
        return {
          ...next,
          days: {
            ...next.days,
            [activeDate]: normalizeDayRecord(updated),
          },
        };
      });
    },
    [activeDate, roster],
  );

  const setMark = useCallback(
    (studentId, status) => {
      const id = String(studentId);
      const nextStatus = status === null ? null : normalizeStatus(status);
      patchDay((d) => {
        const marks = { ...d.marks };
        const lunch = { ...d.lunch };
        const checkIns = { ...(d.checkIns || {}) };
        if (!nextStatus) {
          delete marks[id];
          delete checkIns[id];
        } else {
          marks[id] = nextStatus;
          if (nextStatus === 'present' || nextStatus === 'tardy') {
            if (!checkIns[id]) checkIns[id] = formatCheckInNow();
          } else {
            delete checkIns[id];
          }
        }
        // Absent students cannot have a lunch count.
        if (nextStatus === 'absent') delete lunch[id];
        return { ...d, marks, lunch, checkIns, submitted: false };
      });
    },
    [patchDay],
  );

  const setLunch = useCallback(
    (studentId, choice) => {
      const id = String(studentId);
      patchDay((d) => {
        if (d.marks[id] === 'absent') return d;
        const nextChoice = choice === null ? null : normalizeLunch(choice);
        const lunch = { ...d.lunch };
        if (!nextChoice) delete lunch[id];
        else lunch[id] = nextChoice;
        return { ...d, lunch };
      });
    },
    [patchDay],
  );

  const clearMark = useCallback(
    (studentId) => setMark(studentId, null),
    [setMark],
  );

  const submitAttendance = useCallback(() => {
    patchDay((d) => submitDay(d, roster));
  }, [patchDay, roster]);

  const setGoals = useCallback((patch) => {
    setRecord((prev) => {
      const next = normalizeClassRecord(prev);
      return {
        ...next,
        goals: normalizeGoals({ ...next.goals, ...patch }),
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      classId,
      roster,
      activeDate,
      setActiveDate,
      day,
      days: record.days,
      goals,
      setMark,
      clearMark,
      setLunch,
      submitAttendance,
      setGoals,
      schoolStartTime,
      dateView,
      today: dateKey(),
    }),
    [
      classId,
      roster,
      activeDate,
      day,
      record.days,
      goals,
      setMark,
      clearMark,
      setLunch,
      submitAttendance,
      setGoals,
      schoolStartTime,
      dateView,
    ],
  );

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const ctx = useContext(AttendanceContext);
  if (!ctx) {
    throw new Error('useAttendance must be used within AttendanceProvider');
  }
  return ctx;
}

export { ATTENDANCE_UPDATED_EVENT };
