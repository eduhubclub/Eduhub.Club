import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  MoreVertical,
  Archive,
  Trash2,
  ArrowLeft,
  ArrowUpDown,
  BookOpen,
  Pencil,
} from 'lucide-react';
import { useClasses } from '../../data/classes/ClassContext';
import { useStudents } from '../../data/students/StudentContext';
import {
  parseManualStudentLines,
  sortStudentsByLastName,
} from '../../data/classes/seed';
import { CLASS_ICONS, CLASS_ICON_OPTIONS } from './icons';
import { GRADE_OPTIONS } from './gradeOptions';
import { PageHeader } from '../../shared/PageHeader';
import { PageBackLink } from '../../shared/PageBackLink';
import { EmptyState } from '../../shared/EmptyState';
import { Modal } from '../../shared/Modal';
import { ModalPrimaryButton } from '../../shared/ModalPrimaryButton';
import { ModalIconPicker } from '../../shared/ModalIconOption';
import { StudentAvatar } from '../../shared/StudentAvatar';
import { classesEmptyStates } from './emptyState';
import { StudentImportPanel } from './StudentImportPanel';
import { ClassRosterEditor } from './ClassRosterEditor';
import { StudentProfileCard } from './StudentProfileCard';
import { StudentLibraryCard } from '../library/StudentLibraryCard';
import { ClassJoinCode } from './ClassJoinCode';
import { AppPageShell } from '../../shared/AppPageShell';
import { appFabClass, APP_GRID_CARD } from '../../shared/layout';
import { TYPE } from '../../shared/typography';
import {
  studentAlternateName,
  studentDisplayName,
} from '../../data/students/displayName';

export function ClassesApp({ activeTab, isDarkMode, theme, isLeft }) {
  const {
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
  } = useClasses();
  const { upsertStudents, students: directoryStudents, updateStudent: updateDirectoryStudent, addStudent } =
    useStudents();

  const [rosterSortOrder, setRosterSortOrder] = useState('asc');
  const [openCardMenu, setOpenCardMenu] = useState(null);
  const [draggedClassId, setDraggedClassId] = useState(null);
  const [dragOverClassId, setDragOverClassId] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditingRoster, setIsEditingRoster] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [newClassForm, setNewClassForm] = useState({
    name: '',
    subject: '',
    grade: '',
    icon: 'BookOpen',
  });
  const [studentAddMethod, setStudentAddMethod] = useState(null);
  const [manualStudents, setManualStudents] = useState('');
  const [csvFileName, setCsvFileName] = useState('');
  const [importedStudents, setImportedStudents] = useState([]);

  // Leaving class detail when switching to Archive (or back) clears drill-down
  useEffect(() => {
    clearSelection();
    setIsEditingRoster(false);
  }, [activeTab, clearSelection]);

  // Keep Edu.Students directory in sync with class rosters
  useEffect(() => {
    const roster = classes.flatMap((c) =>
      (c.studentList || []).map((s) => ({
        ...s,
        grade_level: s.grade_level || c.grade || '',
      }))
    );
    upsertStudents(roster);
  }, [classes, upsertStudents]);

  // Exit editor when leaving the selected class
  useEffect(() => {
    if (!selectedClass) setIsEditingRoster(false);
  }, [selectedClass]);

  useEffect(() => {
    const close = () => setOpenCardMenu(null);
    if (openCardMenu !== null) document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openCardMenu]);

  const sortedStudents = useMemo(
    () => sortStudentsByLastName(selectedClass?.studentList || [], rosterSortOrder),
    [selectedClass?.studentList, rosterSortOrder]
  );

  const visibleClasses = classes.filter((c) =>
    activeTab === 'Archive' ? c.isArchived : !c.isArchived
  );

  const resetAddModal = () => {
    setIsAddOpen(false);
    setModalStep(1);
    setNewClassForm({ name: '', subject: '', grade: '', icon: 'BookOpen' });
    setStudentAddMethod(null);
    setManualStudents('');
    setCsvFileName('');
    setImportedStudents([]);
  };

  const resolveStudentList = () => {
    if (studentAddMethod === 'spreadsheet') return importedStudents;
    if (studentAddMethod === 'manual') return parseManualStudentLines(manualStudents);
    return [];
  };

  const handleCreateClass = () => {
    if (!newClassForm.name.trim()) return;
    const studentList = resolveStudentList();
    addClass({
      id: Date.now(),
      ...newClassForm,
      name: newClassForm.name.trim(),
      isArchived: false,
      appCodes: {},
      studentList,
    });
    resetAddModal();
  };

  const handleDragEnd = () => {
    if (draggedClassId != null && dragOverClassId != null && draggedClassId !== dragOverClassId) {
      reorderClasses(draggedClassId, dragOverClassId);
    }
    setDraggedClassId(null);
    setDragOverClassId(null);
  };

  // —— Student profile ——
  if (selectedStudent && selectedClass) {
    return (
      <AppPageShell variant="page">
        <PageBackLink
          label={`Back to ${selectedClass.name}`}
          isDarkMode={isDarkMode}
          onClick={() => selectStudent(null)}
        />

        <PageHeader
          title={studentDisplayName(selectedStudent)}
          description="Student details for this class."
          isDarkMode={isDarkMode}
        />

        <StudentProfileCard
          student={selectedStudent}
          theme={theme}
          isDarkMode={isDarkMode}
          allStudents={directoryStudents}
          onSave={(patch) => {
            updateStudent(selectedClass.id, selectedStudent.id, patch);
            updateDirectoryStudent(selectedStudent.id, patch);
          }}
        />

        <div className="mt-6">
          <h2
            className={`${TYPE.titleSm} mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
          >
            Library
          </h2>
          <StudentLibraryCard student={selectedStudent} theme={theme} />
        </div>
      </AppPageShell>
    );
  }

  // —— Class roster ——
  if (selectedClass) {
    const ClassIcon = CLASS_ICONS[selectedClass.icon] || BookOpen;
    return (
      <AppPageShell variant="scroll">
        <PageBackLink
          label={
            isEditingRoster
              ? `Back to ${selectedClass.name}`
              : `Back to ${activeTab === 'Archive' ? 'Archive' : 'Classes'}`
          }
          isDarkMode={isDarkMode}
          onClick={() => {
            if (isEditingRoster) {
              setIsEditingRoster(false);
              return;
            }
            selectClass(null);
          }}
        />

        <PageHeader
          title={selectedClass.name}
          description={
            isEditingRoster
              ? 'Edit student details for this class.'
              : 'View and manage this class roster.'
          }
          isDarkMode={isDarkMode}
          leading={
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme.colorPrimary}`}>
              <ClassIcon size={24} className={theme.colorOnPrimary} />
            </div>
          }
          actions={
            !isEditingRoster ? (
              <button
                type="button"
                onClick={() => setIsEditingRoster(true)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl ${TYPE.labelLg} ${theme.colorOnPrimary} shadow-sm transition-all hover:-translate-y-0.5 ${theme.colorPrimary}`}
              >
                <Pencil size={16} strokeWidth={2.5} />
                Edit
              </button>
            ) : null
          }
        />

        {!isEditingRoster && (
          <>
            <div className="mb-4 -mt-1 max-w-xs">
              <ClassJoinCode joinCode={selectedClass.joinCode} theme={theme} />
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedClass.subject && (
                <span
                  className={`px-2.5 py-1 ${TYPE.labelMd} rounded-md ${
                    isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {selectedClass.subject}
                </span>
              )}
              {selectedClass.grade && (
                <span
                  className={`px-2.5 py-1 ${TYPE.labelMd} rounded-md ${
                    isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {selectedClass.grade}
                </span>
              )}
            </div>
          </>
        )}

        {isEditingRoster ? (
          <ClassRosterEditor
            students={selectedClass.studentList || []}
            theme={theme}
            isDarkMode={isDarkMode}
            defaultGrade={selectedClass.grade || ''}
            onCancel={() => setIsEditingRoster(false)}
            onStudentAdded={(student) => {
              const withGrade = {
                ...student,
                grade_level: student.grade_level || selectedClass.grade || '',
              };
              updateClass(selectedClass.id, {
                studentList: [...(selectedClass.studentList || []), withGrade],
              });
              addStudent(withGrade);
            }}
            onSave={(nextStudents) => {
              updateClass(selectedClass.id, { studentList: nextStudents });
              setIsEditingRoster(false);
            }}
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`${TYPE.titleMd} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Roster
                <span className={`ml-3 px-2.5 py-1 rounded-full ${TYPE.labelMd} ${theme.colorPrimary} ${theme.colorOnPrimary}`}>
                  {selectedClass.studentList?.length || 0} Students
                </span>
              </h2>
              <button
                onClick={() => setRosterSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
                className={`inline-flex items-center gap-2 px-3 py-2 ${TYPE.labelMd} rounded-lg transition-colors ${
                  isDarkMode
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <ArrowUpDown size={14} />
                {rosterSortOrder === 'asc' ? 'A–Z' : 'Z–A'}
              </button>
            </div>

            <div
              className={`${APP_GRID_CARD} overflow-hidden ${theme.colorSurface} ${theme.colorOutline}`}
            >
              {sortedStudents.length === 0 ? (
                <div
                  className={`p-8 text-center ${TYPE.bodyMd} ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-500'
                  }`}
                >
                  No students have been added to this roster yet.
                </div>
              ) : (
                sortedStudents.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => selectStudent(student)}
                    className={`w-full flex items-center p-4 border-b last:border-b-0 text-left transition-colors ${
                      isDarkMode
                        ? 'border-slate-700 hover:bg-slate-800/50'
                        : 'border-slate-200 hover:bg-slate-50/80'
                    }`}
                  >
                    <StudentAvatar student={student} theme={theme} size="sm" className="mr-4" />
                    <div className="flex-1 min-w-0">
                      <h4
                        className={`${TYPE.titleSm} ${
                          isDarkMode ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {studentDisplayName(student)}
                        {studentAlternateName(student) ? (
                          <span
                            className={`ml-2 font-medium ${
                              isDarkMode ? 'text-slate-500' : 'text-slate-400'
                            }`}
                          >
                            “{studentAlternateName(student)}”
                          </span>
                        ) : null}
                      </h4>
                      <p
                        className={`${TYPE.bodySm} mt-0.5 ${
                          isDarkMode ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        ID: {student.studentId || student.id}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </AppPageShell>
    );
  }

  // —— Class grid ——
  return (
    <AppPageShell variant="scroll">
      <PageHeader
        title={activeTab === 'Archive' ? 'Archived Classes' : 'My Classes'}
        description={
          activeTab === 'Archive'
            ? 'View and restore archived classes.'
            : 'Create and manage classes here.'
        }
        isDarkMode={isDarkMode}
      />

      {visibleClasses.length === 0 ? (
          <EmptyState
            isDarkMode={isDarkMode}
            message={
              activeTab === 'Archive'
                ? classesEmptyStates.archive.message
                : classesEmptyStates.list.message
            }
            illustration={
              activeTab === 'Archive'
                ? classesEmptyStates.archive.illustration
                : classesEmptyStates.list.illustration
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {visibleClasses.map((cls) => {
              const CardIcon = CLASS_ICONS[cls.icon] || BookOpen;
              return (
                <div
                  key={cls.id}
                  draggable={activeTab !== 'Archive'}
                  onDragStart={(e) => {
                    setDraggedClassId(cls.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    if (draggedClassId != null && draggedClassId !== cls.id) {
                      setDragOverClassId(cls.id);
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnd={handleDragEnd}
                  onClick={() => selectClass(cls)}
                  className={`group relative p-4 ${APP_GRID_CARD} transition-all duration-300 cursor-pointer ${
                    isDarkMode
                      ? 'bg-slate-900 border-slate-700 hover:border-slate-600'
                      : 'bg-white border-slate-300 hover:border-slate-300'
                  } ${
                    draggedClassId === cls.id
                      ? 'opacity-40 scale-95 z-10'
                      : 'hover:-translate-y-1'
                  } ${
                    dragOverClassId === cls.id && draggedClassId !== cls.id
                      ? `ring-2 ring-offset-2 ${theme.ring} scale-105 z-20 ${
                          isDarkMode ? 'ring-offset-slate-950' : 'ring-offset-slate-50'
                        }`
                      : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme.colorPrimary}`}
                    >
                      <CardIcon size={24} className={theme.colorOnPrimary} />
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenCardMenu(openCardMenu === cls.id ? null : cls.id);
                        }}
                        className={`p-1.5 rounded-md transition-colors ${
                          isDarkMode
                            ? 'hover:bg-slate-800 text-slate-400'
                            : 'hover:bg-slate-100 text-slate-500'
                        }`}
                      >
                        <MoreVertical size={20} />
                      </button>
                      {openCardMenu === cls.id && (
                        <div
                          className={`absolute right-0 top-full mt-1 w-40 z-50 rounded-xl shadow-lg border overflow-hidden ${
                            isDarkMode
                              ? 'bg-slate-800 border-slate-600'
                              : 'bg-white border-slate-300'
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="p-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateClass(cls.id, { isArchived: !cls.isArchived });
                                setOpenCardMenu(null);
                              }}
                              className={`w-full text-left px-3 py-2 ${TYPE.titleSm} rounded-lg flex items-center transition-colors ${
                                isDarkMode
                                  ? 'hover:bg-slate-700 text-slate-300'
                                  : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <Archive size={16} className="mr-2" />
                              {cls.isArchived ? 'Unarchive' : 'Archive'}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeClass(cls.id);
                                setOpenCardMenu(null);
                              }}
                              className={`w-full text-left px-3 py-2 ${TYPE.titleSm} rounded-lg flex items-center transition-colors mt-1 text-rose-500 ${
                                isDarkMode ? 'hover:bg-rose-500/10' : 'hover:bg-rose-50'
                              }`}
                            >
                              <Trash2 size={16} className="mr-2" />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <h3
                    className={`${TYPE.titleMd} mb-2 truncate ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {cls.name}
                  </h3>
                  <div
                    className="mb-3"
                    onClick={(event) => event.stopPropagation()}
                    onMouseDown={(event) => event.stopPropagation()}
                  >
                    <ClassJoinCode joinCode={cls.joinCode} theme={theme} />
                  </div>
                  <p className={`${TYPE.bodySm} mb-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    {cls.studentList?.length || 0} students
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {cls.subject && (
                      <span
                        className={`px-2.5 py-1 ${TYPE.labelMd} rounded-md ${
                          isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {cls.subject}
                      </span>
                    )}
                    {cls.grade && (
                      <span
                        className={`px-2.5 py-1 ${TYPE.labelMd} rounded-md ${
                          isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {cls.grade}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {activeTab !== 'Archive' && (
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className={`${appFabClass(isLeft)} ${theme.colorPrimary} ${theme.colorOnPrimary}`}
          title="Add class"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      )}

      {isAddOpen && (
        <Modal
          isOpen={isAddOpen}
          title={modalStep === 1 ? 'Create New Class' : 'Add Students'}
          theme={theme}
          isDarkMode={isDarkMode}
          onClose={resetAddModal}
          zIndex="z-[100]"
          headerStart={
            modalStep === 2 ? (
              <button
                type="button"
                onClick={() => setModalStep(1)}
                className="p-1.5 rounded-lg text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                aria-label="Back"
              >
                <ArrowLeft size={16} strokeWidth={3} />
              </button>
            ) : null
          }
          footer={
            modalStep === 1 ? (
              <>
                <button
                  type="button"
                  onClick={resetAddModal}
                  className={`px-4 py-2 rounded-xl ${TYPE.labelLg} ${
                    isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Cancel
                </button>
                <ModalPrimaryButton
                  theme={theme}
                  disabled={!newClassForm.name.trim()}
                  onClick={() => setModalStep(2)}
                >
                  Next
                </ModalPrimaryButton>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCreateClass}
                  className={`px-4 py-2 rounded-xl ${TYPE.labelLg} ${
                    isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Skip
                </button>
                <ModalPrimaryButton theme={theme} onClick={handleCreateClass}>
                  Create Class
                </ModalPrimaryButton>
              </>
            )
          }
        >
          {modalStep === 1 ? (
            <div className="p-6 space-y-4">
              <div>
                <label
                  className={`block ${TYPE.titleSm} mb-2 ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Class Icon
                </label>
                <ModalIconPicker
                  options={CLASS_ICON_OPTIONS}
                  value={newClassForm.icon}
                  onChange={(icon) => setNewClassForm((f) => ({ ...f, icon }))}
                  theme={theme}
                  isDarkMode={isDarkMode}
                />
              </div>
              <div>
                <label
                  className={`block ${TYPE.titleSm} mb-2 ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Class Name
                </label>
                <input
                  autoFocus
                  value={newClassForm.name}
                  onChange={(e) => setNewClassForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Period 3 Biology"
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none ${
                    isDarkMode
                      ? 'bg-slate-800 border-slate-600 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className={`block ${TYPE.titleSm} mb-2 ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    Subject
                  </label>
                  <input
                    value={newClassForm.subject}
                    onChange={(e) => setNewClassForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder="Optional"
                    className={`w-full px-4 py-2.5 rounded-xl border outline-none ${
                      isDarkMode
                        ? 'bg-slate-800 border-slate-600 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label
                    className={`block ${TYPE.titleSm} mb-2 ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    Grade
                  </label>
                  <select
                    value={newClassForm.grade}
                    onChange={(e) => setNewClassForm((f) => ({ ...f, grade: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-xl border outline-none appearance-none ${
                      isDarkMode
                        ? 'bg-slate-800 border-slate-600 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    } ${!newClassForm.grade ? (isDarkMode ? 'text-slate-500' : 'text-slate-400') : ''}`}
                  >
                    <option value="">Select Grade</option>
                    {GRADE_OPTIONS.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <StudentImportPanel
              theme={theme}
              isDarkMode={isDarkMode}
              studentAddMethod={studentAddMethod}
              onMethodChange={(id) => {
                setStudentAddMethod(id);
                setImportedStudents([]);
                setCsvFileName('');
              }}
              manualStudents={manualStudents}
              onManualStudentsChange={setManualStudents}
              csvFileName={csvFileName}
              onCsvFileNameChange={setCsvFileName}
              importedStudents={importedStudents}
              onImportedStudentsChange={setImportedStudents}
            />
          )}
        </Modal>
      )}
    </AppPageShell>
  );
}
