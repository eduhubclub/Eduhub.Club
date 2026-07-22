import { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { SEED_STUDENTS, SEED_REVISION, mergeDirectoryStudents } from './seed';
import { isDemoStudentId, useDemoData } from '../settings/DemoDataContext';

const StudentContext = createContext(null);

function withoutDemoStudents(list) {
  return list.filter((s) => !isDemoStudentId(s.id));
}

function withDemoStudents(list) {
  const userStudents = withoutDemoStudents(list);
  return mergeDirectoryStudents([...SEED_STUDENTS], userStudents);
}

/**
 * Global student directory. Classes and other apps upsert into this store
 * so profiles stay consistent across Edu.Hub.
 */
export function StudentProvider({ children }) {
  const { showDemoData } = useDemoData();
  const [students, setStudents] = useState(() =>
    showDemoData ? [...SEED_STUDENTS] : []
  );

  useEffect(() => {
    setStudents((prev) => {
      const userStudents = withoutDemoStudents(prev);
      return showDemoData ? mergeDirectoryStudents([...SEED_STUDENTS], userStudents) : userStudents;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [SEED_REVISION]);

  useEffect(() => {
    setStudents((prev) => (showDemoData ? withDemoStudents(prev) : withoutDemoStudents(prev)));
  }, [showDemoData]);

  const addStudent = useCallback((student) => {
    setStudents((prev) => mergeDirectoryStudents(prev, [student]));
  }, []);

  const upsertStudents = useCallback((incoming, extras = {}) => {
    if (!incoming?.length) return;
    setStudents((prev) => mergeDirectoryStudents(prev, incoming, extras));
  }, []);

  const updateStudent = useCallback((studentId, patch) => {
    setStudents((prev) => {
      const next = prev.map((s) => (s.id === studentId ? { ...s, ...patch } : s));

      // Keep sibling links bidirectional when siblingIds change
      if (Array.isArray(patch.siblingIds)) {
        const id = studentId;
        return next.map((s) => {
          if (s.id === id) return s;
          const shouldLink = patch.siblingIds.includes(s.id);
          const hasLink = (s.siblingIds || []).includes(id);
          if (shouldLink && !hasLink) {
            return { ...s, siblingIds: [...(s.siblingIds || []), id] };
          }
          if (!shouldLink && hasLink) {
            return { ...s, siblingIds: (s.siblingIds || []).filter((x) => x !== id) };
          }
          return s;
        });
      }
      return next;
    });
  }, []);

  const removeStudent = useCallback((studentId) => {
    setStudents((prev) =>
      prev
        .filter((s) => s.id !== studentId)
        .map((s) => ({
          ...s,
          siblingIds: (s.siblingIds || []).filter((id) => id !== studentId),
        }))
    );
  }, []);

  const value = useMemo(
    () => ({
      students,
      setStudents,
      addStudent,
      upsertStudents,
      updateStudent,
      removeStudent,
    }),
    [students, addStudent, upsertStudents, updateStudent, removeStudent]
  );

  return <StudentContext.Provider value={value}>{children}</StudentContext.Provider>;
}

export function useStudents() {
  const ctx = useContext(StudentContext);
  if (!ctx) {
    throw new Error('useStudents must be used within StudentProvider');
  }
  return ctx;
}
