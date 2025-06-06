'use client';

import { useState, useEffect } from 'react';
import { Modal, Button } from '@/components/ui';
import { QuestionBank } from '@/models/questionBankSchema';
import { SubjectDocument } from '@/models/subjectSchema';
import { Teacher } from '@/models/teacherSchema';
import { ClassDocument } from '@/models/classSchema';
import { SubjectFirestoreService } from '@/apiservices/subjectFirestoreService';
import { ClassFirestoreService } from '@/apiservices/classFirestoreService';
import { TeacherFirestoreService } from '@/apiservices/teacherFirestoreService';

interface QuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<QuestionBank, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  title: string;
  submitButtonText?: string;
  loading?: boolean;
  initialData?: Partial<QuestionBank>;
}

export default function QuestionBankModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  submitButtonText = 'Save Question Bank',
  loading = false,
  initialData
}: QuestionBankModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subjectId: '',
    subjectName: '',
    grade: '',
    questionIds: [] as string[],
    totalQuestions: 0,
    mcqCount: 0,
    essayCount: 0,
    assignedTeacherIds: [] as string[],
    assignedClassIds: [] as string[]
  });

  const [subjects, setSubjects] = useState<SubjectDocument[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassDocument[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Fetch subjects, teachers, and classes when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSubjects();
      fetchTeachers();
      fetchClasses();
    }
  }, [isOpen]);

  const fetchSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const subjectList = await SubjectFirestoreService.getAllSubjects();
      setSubjects(subjectList);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoadingSubjects(false);
    }
  };
  const fetchTeachers = async () => {
    setLoadingTeachers(true);
    try {
      const teacherList = await TeacherFirestoreService.getAllTeachers();
      setTeachers(teacherList);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const fetchClasses = async () => {
    setLoadingClasses(true);
    try {
      const classList = await ClassFirestoreService.getAllClasses();
      setClasses(classList);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoadingClasses(false);
    }
  };

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        subjectId: initialData.subjectId || '',
        subjectName: initialData.subjectName || '',
        grade: initialData.grade || '',
        questionIds: initialData.questionIds || [],
        totalQuestions: initialData.totalQuestions || 0,
        mcqCount: initialData.mcqCount || 0,
        essayCount: initialData.essayCount || 0,
        assignedTeacherIds: initialData.assignedTeacherIds || [],
        assignedClassIds: initialData.assignedClassIds || []
      });
    } else if (isOpen) {
      // Reset form for new question bank
      setFormData({
        name: '',
        description: '',
        subjectId: '',
        subjectName: '',
        grade: '',
        questionIds: [],
        totalQuestions: 0,
        mcqCount: 0,
        essayCount: 0,
        assignedTeacherIds: [],
        assignedClassIds: []
      });
    }
  }, [isOpen, initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSubjectId = e.target.value;
    const selectedSubject = subjects.find(subject => subject.id === selectedSubjectId);
    
    setFormData(prev => ({
      ...prev,
      subjectId: selectedSubjectId,
      subjectName: selectedSubject?.name || '',
      grade: selectedSubject?.grade || ''
    }));
  };

  const handleTeacherAssignment = (teacherId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedTeacherIds: prev.assignedTeacherIds.includes(teacherId)
        ? prev.assignedTeacherIds.filter(id => id !== teacherId)
        : [...prev.assignedTeacherIds, teacherId]
    }));
  };
  
  const handleClassAssignment = (classId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedClassIds: prev.assignedClassIds.includes(classId)
        ? prev.assignedClassIds.filter(id => id !== classId)
        : [...prev.assignedClassIds, classId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question Bank Name*
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter a name for this question bank"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe this question bank"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject*
              </label>
              <select
                name="subjectId"
                value={formData.subjectId}
                onChange={handleSubjectChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={loadingSubjects}
              >
                <option value="">
                  {loadingSubjects ? 'Loading subjects...' : 'Select a subject'}
                </option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} - {subject.grade}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade
              </label>
              <input
                type="text"
                name="grade"
                value={formData.grade}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                placeholder="Auto-filled from subject"
                readOnly
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Assign Teachers
            </label>
            {loadingTeachers ? (
              <div className="text-sm text-gray-500">Loading teachers...</div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
                {teachers.length === 0 ? (
                  <div className="text-sm text-gray-500">No teachers available</div>
                ) : (
                  teachers.map((teacher) => (
                    <label key={teacher.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={formData.assignedTeacherIds.includes(teacher.id)}
                        onChange={() => handleTeacherAssignment(teacher.id)}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                        <div className="text-xs text-gray-500">{teacher.email} • {teacher.subject}</div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Assign to Classes (Optional)
            </label>
            {loadingClasses ? (
              <div className="text-sm text-gray-500">Loading classes...</div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
                {classes.length === 0 ? (
                  <div className="text-sm text-gray-500">No classes available</div>
                ) : (
                  classes.map((classItem) => (
                    <label key={classItem.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={formData.assignedClassIds.includes(classItem.id)}
                        onChange={() => handleClassAssignment(classItem.id)}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{classItem.name}</div>
                        <div className="text-xs text-gray-500">{classItem.subject} • Year: {classItem.year || 'N/A'}</div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
          >
            {submitButtonText}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
