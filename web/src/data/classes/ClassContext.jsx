import { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  getSeedClasses,
  invalidateDemoRosterSeed,
  SEED_REVISION,
  findClassById,
  getStudentNames,
  getStudents,
} from './seed';
import { isDemoClassId, useDemoData } from '../settings/DemoDataContext';
import { assignClassJoinCodes } from './joinCode';
import { makeClassroomJoinCode, normalizeJoinCode } from '../auth/codes';
import {
  SHARED_DEMO_CLASS_ID,
  classesForAdminWorkspace,
  withClassOwner,
} from './classVisibility';

const ClassContext = createContext(null);

/** @typedef {'all' | 'adminWorkspace'} ClassVisibilityMode */

function withoutDemoClasses(list) {
  return list.filter((c) => !isDemoClassId(c.id));
}

function withDemoClasses(list) {
  const userClasses = withoutDemoClasses(list);
  return [...getSeedClasses(), ...userClasses];
}

/**
 * Global class/student store. Wrap the shell once so every app can read
 * the same roster without owning a copy.
 */
export function ClassProvider({ children }) {
  const { session } = useAuth();
  const { showDemoData } = useDemoData();
  const [classes, setClasses] = useState(() =>
    assignClassJoinCodes(showDemoData ? [...getSeedClasses()] : [])
  );
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [visibilityMode, setVisibilityMode] = useState(
    /** @type {ClassVisibilityMode} */ ('all'),
  );

  // Apply seed replacements (clears demo data after SEED_REVISION bumps)
  useEffect(() => {
    invalidateDemoRosterSeed();
    setClasses((prev) => {
      const userClasses = withoutDemoClasses(prev);
      return assignClassJoinCodes(
        showDemoData ? [...getSeedClasses(), ...userClasses] : userClasses,
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

  const setClassVisibility = useCallback((mode) => {
    setVisibilityMode(mode === 'adminWorkspace' ? 'adminWorkspace' : 'all');
  }, []);

  const visibleClasses = useMemo(() => {
    if (visibilityMode !== 'adminWorkspace') return classes;
    return classesForAdminWorkspace(classes, session?.userId);
  }, [classes, visibilityMode, session?.userId]);

  useEffect(() => {
    if (visibilityMode !== 'adminWorkspace') return;
    const allowed = new Set(visibleClasses.map((row) => row.id));
    if (selectedClassId && allowed.has(selectedClassId)) return;
    const fallback =
      visibleClasses.find((row) => row.id === SHARED_DEMO_CLASS_ID) || visibleClasses[0] || null;
    setSelectedClassId(fallback?.id ?? null);
    setSelectedStudentId(null);
  }, [visibilityMode, visibleClasses, selectedClassId]);

  const selectedClass = useMemo(
    () => findClassById(visibleClasses, selectedClassId),
    [visibleClasses, selectedClassId]
  );

  const selectedStudent = useMemo(() => {
    if (!selectedClass || !selectedStudentId) return null;
    return selectedClass.studentList?.find((s) => s.id === selectedStudentId) || null;
  }, [selectedClass, selectedStudentId]);

  const selectClass = useCallback(
    (clsOrId) => {
      const id = typeof clsOrId === 'object' ? clsOrId?.id : clsOrId;
      if (
        visibilityMode === 'adminWorkspace' &&
        id &&
        !visibleClasses.some((row) => row.id === id)
      ) {
        return;
      }
      setSelectedClassId(id ?? null);
      setSelectedStudentId(null);
    },
    [visibilityMode, visibleClasses],
  );

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

  const addClass = useCallback(
    (cls) => {
      setClasses((prev) => {
        const owned = withClassOwner(cls, session?.userId);
        const used = new Set(
          prev.map((row) => normalizeJoinCode(row.joinCode)).filter(Boolean),
        );
        const requested = normalizeJoinCode(owned.joinCode);
        const joinCode =
          requested && !used.has(requested) ? requested : makeClassroomJoinCode(used);
        return [...prev, { ...owned, joinCode }];
      });
    },
    [session?.userId],
  );

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
    window.EduHubAPI.getClasses = () => visibleClasses;
    window.EduHubAPI.getSelectedClass = () => selectedClass;
    window.EduHubAPI.getSelectedStudent = () => selectedStudent;
    window.EduHubAPI.getStudentNames = (classId) => {
      const cls = classId ? findClassById(visibleClasses, classId) : selectedClass;
      return getStudentNames(cls);
    };
    window.EduHubAPI.getStudents = (classId) => {
      const cls = classId ? findClassById(visibleClasses, classId) : selectedClass;
      return getStudents(cls);
    };
  }, [visibleClasses, selectedClass, selectedStudent]);

  const value = useMemo(
    () => ({
      // Scoped list — DistrictHub uses 'all'; admin tool apps use 'adminWorkspace'.
      classes: visibleClasses,
      allClasses: classes,
      classVisibility: visibilityMode,
      setClassVisibility,
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
        getStudentNames(classId ? findClassById(visibleClasses, classId) : selectedClass),
      getStudentsFor: (classId) =>
        getStudents(classId ? findClassById(visibleClasses, classId) : selectedClass),
    }),
    [
      visibleClasses,
      classes,
      visibilityMode,
      setClassVisibility,
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
