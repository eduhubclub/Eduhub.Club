import { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { SEED_CLASSES, SEED_REVISION, findClassById, getStudentNames, getStudents } from './seed';
import { isDemoClassId, useDemoData } from '../settings/DemoDataContext';
import { assignClassJoinCodes } from './joinCode';
import { makeClassroomJoinCode, normalizeJoinCode } from '../auth/codes';

const ClassContext = createContext(null);

function withoutDemoClasses(list) {
  return list.filter((c) => !isDemoClassId(c.id));
}

function withDemoClasses(list) {
  const userClasses = withoutDemoClasses(list);
  return [...SEED_CLASSES, ...userClasses];
}

/**
 * Global class/student store. Wrap the shell once so every app can read
 * the same roster without owning a copy.
 */
export function ClassProvider({ children }) {
  const { showDemoData } = useDemoData();
  const [classes, setClasses] = useState(() =>
    assignClassJoinCodes(showDemoData ? [...SEED_CLASSES] : [])
  );
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  // Apply seed replacements (clears demo data after SEED_REVISION bumps)
  useEffect(() => {
    setClasses((prev) => {
      const userClasses = withoutDemoClasses(prev);
      return assignClassJoinCodes(
        showDemoData ? [...SEED_CLASSES, ...userClasses] : userClasses,
      );
    });
    setSelectedClassId(null);
    setSelectedStudentId(null);
    // showDemoData read intentionally from mount/revision; toggle handled below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [SEED_REVISION]);

  // Toggle demo class on/off without wiping teacher-created classes
  useEffect(() => {
    setClasses((prev) =>
      assignClassJoinCodes(showDemoData ? withDemoClasses(prev) : withoutDemoClasses(prev)),
    );
    setSelectedClassId((id) => (id && isDemoClassId(id) && !showDemoData ? null : id));
    setSelectedStudentId((id) => {
      if (showDemoData) return id;
      return id && String(id).startsWith('demo-') ? null : id;
    });
  }, [showDemoData]);

  useEffect(() => {
    setClasses((prev) => assignClassJoinCodes(prev));
  }, []);

  const selectedClass = useMemo(
    () => findClassById(classes, selectedClassId),
    [classes, selectedClassId]
  );

  const selectedStudent = useMemo(() => {
    if (!selectedClass || !selectedStudentId) return null;
    return selectedClass.studentList?.find((s) => s.id === selectedStudentId) || null;
  }, [selectedClass, selectedStudentId]);

  const selectClass = useCallback((clsOrId) => {
    const id = typeof clsOrId === 'object' ? clsOrId?.id : clsOrId;
    setSelectedClassId(id ?? null);
    setSelectedStudentId(null);
  }, []);

  const selectStudent = useCallback((studentOrId) => {
    const id = typeof studentOrId === 'object' ? studentOrId?.id : studentOrId;
    setSelectedStudentId(id ?? null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedClassId(null);
    setSelectedStudentId(null);
  }, []);

  const updateClass = useCallback((classId, patch) => {
    setClasses((prev) =>
      prev.map((c) => (c.id === classId ? { ...c, ...patch } : c))
    );
  }, []);

  const addClass = useCallback((cls) => {
    setClasses((prev) => {
      const used = new Set(
        prev.map((row) => normalizeJoinCode(row.joinCode)).filter(Boolean),
      );
      const requested = normalizeJoinCode(cls.joinCode);
      const joinCode =
        requested && !used.has(requested) ? requested : makeClassroomJoinCode(used);
      return [...prev, { ...cls, joinCode }];
    });
  }, []);

  const removeClass = useCallback((classId) => {
    setClasses((prev) => prev.filter((c) => c.id !== classId));
    setSelectedClassId((current) => (current === classId ? null : current));
  }, []);

  const reorderClasses = useCallback((fromId, toId) => {
    setClasses((prev) => {
      const oldIndex = prev.findIndex((c) => c.id === fromId);
      const newIndex = prev.findIndex((c) => c.id === toId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(oldIndex, 1);
      next.splice(newIndex, 0, moved);
      return next;
    });
  }, []);

  const updateStudent = useCallback((classId, studentId, patch) => {
    setClasses((prev) =>
      prev.map((cls) => {
        if (cls.id !== classId) return cls;
        return {
          ...cls,
          studentList: cls.studentList.map((s) =>
            s.id === studentId ? { ...s, ...patch } : s
          ),
        };
      })
    );
  }, []);

  /** Patch a student in every class roster they appear on (by id or name). */
  const updateStudentInAllClasses = useCallback((studentOrId, patch) => {
    const student = typeof studentOrId === 'object' && studentOrId ? studentOrId : null;
    const studentId = student ? student.id : studentOrId;
    const nameKey = (student?.name || patch?.name || '').trim().toLowerCase();

    setClasses((prev) =>
      prev.map((cls) => {
        const list = cls.studentList || [];
        const isMatch = (s) =>
          s.id === studentId ||
          (nameKey && (s.name || '').trim().toLowerCase() === nameKey);
        if (!list.some(isMatch)) return cls;
        return {
          ...cls,
          studentList: list.map((s) =>
            isMatch(s)
              ? {
                  ...s,
                  ...patch,
                  // Keep the roster entry's id so other class-linked data stays stable.
                  id: s.id,
                }
              : s
          ),
        };
      })
    );
  }, []);

  // Bridge for future non-React modules / iframes
  useEffect(() => {
    window.EduHubAPI = window.EduHubAPI || {};
    window.EduHubAPI.getClasses = () => classes;
    window.EduHubAPI.getSelectedClass = () => selectedClass;
    window.EduHubAPI.getSelectedStudent = () => selectedStudent;
    window.EduHubAPI.getStudentNames = (classId) => {
      const cls = classId ? findClassById(classes, classId) : selectedClass;
      return getStudentNames(cls);
    };
    window.EduHubAPI.getStudents = (classId) => {
      const cls = classId ? findClassById(classes, classId) : selectedClass;
      return getStudents(cls);
    };
  }, [classes, selectedClass, selectedStudent]);

  const value = useMemo(
    () => ({
      classes,
      setClasses,
      selectedClass,
      selectedStudent,
      selectClass,
      selectStudent,
      clearSelection,
      updateClass,
      addClass,
      removeClass,
      reorderClasses,
      updateStudent,
      updateStudentInAllClasses,
      // Field selectors for other apps
      getStudentNamesFor: (classId) =>
        getStudentNames(classId ? findClassById(classes, classId) : selectedClass),
      getStudentsFor: (classId) =>
        getStudents(classId ? findClassById(classes, classId) : selectedClass),
    }),
    [
      classes,
      selectedClass,
      selectedStudent,
      selectClass,
      selectStudent,
      clearSelection,
      updateClass,
      addClass,
      removeClass,
      reorderClasses,
      updateStudent,
      updateStudentInAllClasses,
    ]
  );

  return <ClassContext.Provider value={value}>{children}</ClassContext.Provider>;
}

export function useClasses() {
  const ctx = useContext(ClassContext);
  if (!ctx) {
    throw new Error('useClasses must be used within ClassProvider');
  }
  return ctx;
}
