'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { QuestionBank } from '@/models/questionBankSchema';
import { questionBankService } from '@/apiservices/questionBankFirestoreService';
import { SubjectFirestoreService } from '@/apiservices/subjectFirestoreService';
import { SubjectDocument } from '@/models/subjectSchema';
import QuestionBankModal from '@/components/modals/QuestionBankModal';
import { Button } from '@/components/ui';
import { getAuth } from 'firebase/auth';
import { serverTimestamp, Timestamp } from 'firebase/firestore';

// Interface for teachers to display in assignment dropdown
interface Teacher {
  id: string;
  name: string;
  email: string;
}

export default function QuestionBanksPage() {
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [editingBank, setEditingBank] = useState<QuestionBank | null>(null);
  const [filter, setFilter] = useState({
    subject: '',
    grade: ''
  });
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<SubjectDocument[]>([]);
  const [assigningTeachers, setAssigningTeachers] = useState<{
    bankId: string, 
    showing: boolean, 
    selectedTeachers: string[]
  }>({
    bankId: '',
    showing: false,
    selectedTeachers: []  });

  // Grades list
  const grades = [
    'Grade 1',
    'Grade 2',
    'Grade 3',
    'Grade 4', 
    'Grade 5',
    'Grade 6',
    'Grade 7',
    'Grade 8',
    'Grade 9',
    'Grade 10',
    'Grade 11',
    'Grade 12',
  ];

  // Fetch subjects and teachers
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const subjectList = await SubjectFirestoreService.getAllSubjects();
        setSubjects(subjectList);
      } catch (err) {
        console.error('Error fetching subjects:', err);
      }
    };

    fetchSubjects();
  }, []);

  // Fetch teachers
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await fetch('/api/teacher');
        if (response.ok) {
          const teacherData = await response.json();
          setTeachers(teacherData.map((teacher: any) => ({
            id: teacher.id,
            name: teacher.name,
            email: teacher.email
          })));
        } else {
          console.error('Failed to fetch teachers');
        }
      } catch (err) {
        console.error('Error fetching teachers:', err);
      }
    };
    
    fetchTeachers();
  }, []);

  // Load question banks with filters
  useEffect(() => {
    const fetchQuestionBanks = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Build filter object
        const filterOptions: { subjectId?: string, grade?: string } = {};
        
        if (filter.subject) {
          filterOptions.subjectId = filter.subject;
        }
        
        if (filter.grade) {
          filterOptions.grade = filter.grade;
        }
        
        // Fetch question banks from Firebase
        const banks = await questionBankService.listQuestionBanks(filterOptions);
        setQuestionBanks(banks);
      } catch (err: any) {
        console.error("Error fetching question banks:", err);
        setError(`Error: ${err.message || 'Failed to load question banks'}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestionBanks();
  }, [filter]);

  // Toggle add question bank modal
  const toggleAddBankModal = () => {
    setShowAddBankModal(!showAddBankModal);
    if (editingBank) {
      setEditingBank(null);
    }
  };

  // Handle edit bank click
  const handleEditBank = (bank: QuestionBank) => {
    setEditingBank(bank);
    setShowAddBankModal(true);
  };

  // Handle delete bank click
  const handleDeleteBank = async (bankId: string) => {
    if (!window.confirm('Are you sure you want to delete this question bank?')) {
      return;
    }
    
    try {
      await questionBankService.deleteQuestionBank(bankId);
      
      // Update state after successful deletion
      setQuestionBanks(prev => prev.filter(bank => bank.id !== bankId));
    } catch (err: any) {
      console.error("Error deleting question bank:", err);
      setError(`Error: ${err.message || 'Failed to delete question bank'}`);
    }
  };

  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  // Handle assign teachers toggle
  const toggleAssignTeachers = (bank: QuestionBank) => {
    setAssigningTeachers({
      bankId: bank.id,
      showing: bank.id !== assigningTeachers.bankId || !assigningTeachers.showing,
      selectedTeachers: bank.assignedTeacherIds || []
    });
  };

  // Handle teacher selection changes
  const handleTeacherSelectionChange = (teacherId: string, isChecked: boolean) => {
    setAssigningTeachers(prev => {
      const newSelectedTeachers = isChecked 
        ? [...prev.selectedTeachers, teacherId]
        : prev.selectedTeachers.filter(id => id !== teacherId);
        
      return {
        ...prev,
        selectedTeachers: newSelectedTeachers
      };
    });
  };

  // Save teacher assignments
  const handleSaveTeacherAssignments = async () => {
    try {
      const bank = questionBanks.find(b => b.id === assigningTeachers.bankId);
      if (!bank) return;
      
      await questionBankService.updateQuestionBank(assigningTeachers.bankId, {
        assignedTeacherIds: assigningTeachers.selectedTeachers
      });
      
      // Update local state
      setQuestionBanks(prev => prev.map(b => 
        b.id === assigningTeachers.bankId
          ? { ...b, assignedTeacherIds: assigningTeachers.selectedTeachers }
          : b
      ));
      
      // Close the assignment panel
      setAssigningTeachers(prev => ({ ...prev, showing: false }));
      
    } catch (err: any) {
      console.error("Error assigning teachers:", err);
      setError(`Error: ${err.message || 'Failed to assign teachers'}`);
    }
  };

  // Handle form submission
  const handleSubmitBank = async (bankData: Omit<QuestionBank, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingBank) {
        // Update existing bank
        await questionBankService.updateQuestionBank(editingBank.id, bankData);
        
        // Update state after successful update
        setQuestionBanks(prev => prev.map(bank => 
          bank.id === editingBank.id 
            ? { ...bank, ...bankData, updatedAt: Timestamp.now() } 
            : bank
        ));
      } else {
        // Create new bank
        const newBankId = await questionBankService.createQuestionBank(bankData);
        
        // Get the newly created bank to add to state
        const newBank = await questionBankService.getQuestionBank(newBankId);
        
        if (newBank) {
          setQuestionBanks(prev => [...prev, newBank]);
        }
      }
      
      toggleAddBankModal();
    } catch (err: any) {
      console.error("Error saving question bank:", err);
      setError(`Error: ${err.message || 'Failed to save question bank'}`);
    }
  };

  // Get assigned teacher names for a bank
  const getAssignedTeacherNames = (bank: QuestionBank): string => {
    if (!bank.assignedTeacherIds || bank.assignedTeacherIds.length === 0) {
      return 'No teachers assigned';
    }
    
    const assignedTeachers = teachers.filter(t => 
      bank.assignedTeacherIds?.includes(t.id)
    );
    
    if (assignedTeachers.length === 0) {
      return 'Unknown teachers';
    }
    
    if (assignedTeachers.length === 1) {
      return assignedTeachers[0].name;
    }
    
    if (assignedTeachers.length === 2) {
      return `${assignedTeachers[0].name} and ${assignedTeachers[1].name}`;
    }
    
    return `${assignedTeachers[0].name} and ${assignedTeachers.length - 1} others`;
  };

  return (
    <div className="px-6 py-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Question Banks</h1>
            <p className="text-sm text-gray-500 mt-1">
              Create and manage question banks for your classes
            </p>
          </div>
          
          <Button 
            variant="primary"
            onClick={toggleAddBankModal}
          >
            Create Question Bank
          </Button>
        </div>
        
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Subject
              </label>
              <select
                name="subject"
                value={filter.subject}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Grade
              </label>
              <select
                name="grade"
                value={filter.grade}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Grades</option>
                {grades.map(grade => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Loading state */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
            </div>
            <p className="mt-2 text-gray-600">Loading question banks...</p>
          </div>
        )}
        
        {/* Error state */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4">
            <p>{error}</p>
          </div>
        )}
        
        {/* Question banks list */}
        {!loading && !error && questionBanks.length === 0 && (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">No question banks found. Create your first question bank to get started!</p>
          </div>
        )}
        
        {!loading && !error && questionBanks.length > 0 && (
          <div className="grid grid-cols-1 gap-6">
            {questionBanks.map(bank => (
              <div key={bank.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">{bank.name}</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {bank.subjectName} • {bank.grade || 'No grade assigned'}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">{bank.description || 'No description provided'}</p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditBank(bank)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteBank(bank.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-4">
                    <div className="bg-blue-50 rounded-md px-3 py-1 text-sm text-blue-800">
                      {bank.totalQuestions} Questions
                    </div>
                    <div className="bg-green-50 rounded-md px-3 py-1 text-sm text-green-800">
                      {bank.mcqCount} MCQ
                    </div>
                    <div className="bg-purple-50 rounded-md px-3 py-1 text-sm text-purple-800">
                      {bank.essayCount} Essay
                    </div>
                  </div>
                  
                  {/* Teacher assignment section */}
                  <div className="mt-6 border-t pt-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700">Assigned Teachers</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {getAssignedTeacherNames(bank)}
                        </p>
                      </div>
                      
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => toggleAssignTeachers(bank)}
                      >
                        {assigningTeachers.bankId === bank.id && assigningTeachers.showing 
                          ? 'Cancel' 
                          : 'Assign Teachers'}
                      </Button>
                    </div>
                    
                    {/* Teacher assignment interface */}
                    {assigningTeachers.bankId === bank.id && assigningTeachers.showing && (
                      <div className="mt-4 border border-gray-200 rounded-md p-4 bg-gray-50">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Select Teachers</h4>
                        
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {teachers.map(teacher => (
                            <div key={teacher.id} className="flex items-center">
                              <input
                                type="checkbox"
                                id={`teacher-${bank.id}-${teacher.id}`}
                                checked={assigningTeachers.selectedTeachers.includes(teacher.id)}
                                onChange={(e) => handleTeacherSelectionChange(teacher.id, e.target.checked)}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <label 
                                htmlFor={`teacher-${bank.id}-${teacher.id}`}
                                className="ml-2 text-sm text-gray-700"
                              >
                                {teacher.name} ({teacher.email})
                              </label>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4 flex justify-end">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleSaveTeacherAssignments}
                          >
                            Save Assignments
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6 flex justify-between">
                    <Link 
                      href={`/admin/question-banks/${bank.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                    >
                      View Questions →
                    </Link>
                    
                    <p className="text-xs text-gray-500">
                      Created: {bank.createdAt.toDate().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Question bank modal */}
        <QuestionBankModal
          isOpen={showAddBankModal}
          onClose={toggleAddBankModal}
          onSubmit={handleSubmitBank}
          title={editingBank ? 'Edit Question Bank' : 'Create Question Bank'}
          submitButtonText={editingBank ? 'Update Question Bank' : 'Create Question Bank'}
          initialData={editingBank || undefined}
        />
      </div>
    </div>
  );
}
