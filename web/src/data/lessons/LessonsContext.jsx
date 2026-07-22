import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { LESSONS_SEED_REVISION, SEED_LESSONS_BY_CLASS } from './seed';

const STORAGE_KEY = 'eduHub.lessonsByClass';
const REV_KEY = 'eduHub.lessonsSeedRevision';

const LessonsContext = createContext(null);

function loadLessons() {
  try {
    const rev = Number(localStorage.getItem(REV_KEY) || 0);
    if (rev !== LESSONS_SEED_REVISION) {
      localStorage.setItem(REV_KEY, String(LESSONS_SEED_REVISION));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_LESSONS_BY_CLASS));
      return structuredClone(SEED_LESSONS_BY_CLASS);
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_LESSONS_BY_CLASS));
      return structuredClone(SEED_LESSONS_BY_CLASS);
    }
    return JSON.parse(raw);
  } catch {
    return structuredClone(SEED_LESSONS_BY_CLASS);
  }
}

function persist(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
}

export function LessonsProvider({ children }) {
  const [lessonsByClassId, setLessonsByClassId] = useState(loadLessons);

  useEffect(() => {
    persist(lessonsByClassId);
  }, [lessonsByClassId]);

  const getLessons = useCallback(
    (classId) => {
      if (!classId) return [];
      return lessonsByClassId[classId] || [];
    },
    [lessonsByClassId]
  );

  const addLesson = useCallback((classId, lesson) => {
    if (!classId || !lesson) return;
    setLessonsByClassId((prev) => {
      const list = prev[classId] || [];
      return {
        ...prev,
        [classId]: [...list, lesson],
      };
    });
  }, []);

  const removeLesson = useCallback((classId, lessonId) => {
    if (!classId || !lessonId) return;
    setLessonsByClassId((prev) => {
      const list = prev[classId] || [];
      return {
        ...prev,
        [classId]: list.filter((item) => item.id !== lessonId),
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      lessonsByClassId,
      getLessons,
      addLesson,
      removeLesson,
    }),
    [lessonsByClassId, getLessons, addLesson, removeLesson]
  );

  return (
    <LessonsContext.Provider value={value}>{children}</LessonsContext.Provider>
  );
}

export function useLessons() {
  const ctx = useContext(LessonsContext);
  if (!ctx) {
    throw new Error('useLessons must be used within LessonsProvider');
  }
  return ctx;
}
