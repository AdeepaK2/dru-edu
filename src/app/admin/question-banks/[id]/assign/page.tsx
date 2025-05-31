'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QuestionBank, QuestionBankAssignment } from '@/models/questionBankSchema';
import { Button } from '@/components/ui';

// Mock timestamp for Firebase Timestamp
const mockTimestamp = {
  seconds: Math.floor(Date.now() / 1000),
  nanoseconds: 0,
  toDate: () => new Date()
};

// Class interface
interface Class {
  id: string;
  name: string;
  grade: string;
  subject: string;
  teacherName: string;
  studentCount: number;
}

interface AssignBankPageProps {
  params: {
    id: string;
  };
}

export default function AssignBankPage({ params }: AssignBankPageProps) {
  const router = useRouter();
  const bankId = params.id;
  
  const [questionBank, setQuestionBank] = useState<QuestionBank | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [assignments, setAssignments] = useState<QuestionBankAssignment[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [dueDate, setDueDate] = useState<string>('');
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load question bank and classes
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // Simulate API delay
    const timer = setTimeout(() => {
      try {
        // In a real app, fetch data from Firestore
        // const bank = await questionBankService.getQuestionBank(bankId);
        // const availableClasses = await classService.listClasses();
        // const existingAssignments = await questionBankAssignmentService.listAssignments({ bankId });
        
        // Mock bank data
        const mockBank: QuestionBank = {
          id: bankId,
          name: 'Algebra Basics',
          description: 'Fundamental concepts of algebra for 6th grade',
          subjectId: 'math-g6',
          subjectName: 'Mathematics',
          grade: 'Grade 6',
          questionIds: ['q1', 'q2', 'q3'],
          totalQuestions: 3,
          mcqCount: 2,
          essayCount: 1,
          createdAt: mockTimestamp as any,
          updatedAt: mockTimestamp as any
        };
        
        // Mock classes data
        const mockClasses: Class[] = [
          {
            id: 'class-001',
            name: 'Mathematics 6A',
            grade: 'Grade 6',
            subject: 'Mathematics',
            teacherName: 'John Smith',
            studentCount: 25
          },
          {
            id: 'class-002',
            name: 'Mathematics 6B',
            grade: 'Grade 6',
            subject: 'Mathematics',
            teacherName: 'Mary Johnson',
            studentCount: 28
          },
          {
            id: 'class-003',
            name: 'Mathematics 7A',
            grade: 'Grade 7',
            subject: 'Mathematics',
            teacherName: 'David Lee',
            studentCount: 24
          }
        ];
        
        // Mock assignments data
        const mockAssignments: QuestionBankAssignment[] = [
          {
            id: 'assign-001',
            bankId: bankId,
            bankName: 'Algebra Basics',
            classId: 'class-001',
            className: 'Mathematics 6A',
            assignedBy: 'Admin User',
            assignedAt: mockTimestamp as any,
            dueDate: {
              seconds: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 1 week from now
              toDate: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            } as any,
            status: 'active',
            isVisible: true
          }
        ];
        
        setQuestionBank(mockBank);
        setClasses(mockClasses);
        setAssignments(mockAssignments);
        setLoading(false);
      } catch (err: any) {
        console.error("Error loading data:", err);
        setError(`Error: ${err.message || 'Failed to load data'}`);
        setLoading(false);
      }
    }, 800);
    
    return () => clearTimeout(timer);
  }, [bankId]);

  // Check if a class is already assigned
  const isClassAssigned = (classId: string) => {
    return assignments.some(a => a.classId === classId);
  };

  // Handle class selection
  const handleClassSelect = (classId: string) => {
    if (isClassAssigned(classId)) {
      // Show error - class already assigned
      setError('This class already has this question bank assigned.');
      setSelectedClassId('');
    } else {
      setSelectedClassId(classId);
      setError(null);
    }
  };

  // Handle due date change
  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDueDate(e.target.value);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClassId) {
      setError('Please select a class.');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Find the selected class
      const selectedClass = classes.find(c => c.id === selectedClassId);
      if (!selectedClass || !questionBank) throw new Error('Invalid selection');
      
      // Create new assignment object
      const newAssignment: Omit<QuestionBankAssignment, 'id' | 'assignedAt'> = {
        bankId: bankId,
        bankName: questionBank.name,
        classId: selectedClass.id,
        className: selectedClass.name,
        assignedBy: 'Admin User',
        status: 'active',
        isVisible
      };
      
      // Add due date if provided
      if (dueDate) {
        newAssignment.dueDate = {
          seconds: Math.floor(new Date(dueDate).getTime() / 1000),
          toDate: () => new Date(dueDate)
        } as any;
      }
      
      // In a real app, save to Firestore
      // const assignmentId = await questionBankAssignmentService.assignBankToClass(newAssignment);
      
      // Mock assignment ID
      const assignmentId = `assign-${Date.now()}`;
      
      // Update local state
      setAssignments([
        ...assignments, 
        { 
          ...newAssignment, 
          id: assignmentId, 
          assignedAt: mockTimestamp as any
        } as QuestionBankAssignment
      ]);
      
      // Reset form
      setSelectedClassId('');
      setDueDate('');
      setIsVisible(true);
      
      // Show success message
      setSuccessMessage(`Successfully assigned "${questionBank.name}" to ${selectedClass.name}`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error("Error assigning question bank:", err);
      setError(`Error: ${err.message || 'Failed to assign question bank'}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle assignment deletion
  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) {
      return;
    }
    
    try {
      // In a real app, call API to delete
      // await questionBankAssignmentService.deleteAssignment(assignmentId);
      
      // Update state
      setAssignments(prev => prev.filter(a => a.id !== assignmentId));
      setSuccessMessage('Assignment removed successfully');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error("Error deleting assignment:", err);
      setError(`Error: ${err.message || 'Failed to delete assignment'}`);
    }
  };

  // Handle assignment visibility toggle
  const handleToggleVisibility = async (assignmentId: string, currentVisibility: boolean) => {
    try {
      // In a real app, call API to update
      // await questionBankAssignmentService.updateAssignment(assignmentId, { isVisible: !currentVisibility });
      
      // Update state
      setAssignments(prev => prev.map(a => 
        a.id === assignmentId 
          ? { ...a, isVisible: !currentVisibility } 
          : a
      ));
    } catch (err: any) {
      console.error("Error updating assignment:", err);
      setError(`Error: ${err.message || 'Failed to update assignment'}`);
    }
  };

  if (loading) {
    return (
      <div className="px-6 py-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!questionBank) {
    return (
      <div className="px-6 py-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
            <p>Question bank not found</p>
          </div>
          <div className="mt-6">
            <Link href="/admin/question-banks" className="text-blue-600 hover:text-blue-800 font-medium">
              &larr; Back to Question Banks
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center mb-2">
            <Link href={`/admin/question-banks/${bankId}`} className="text-blue-600 hover:text-blue-800 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Question Bank
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">Assign Question Bank to Classes</h1>
          <div className="mt-2">
            <h2 className="text-xl font-semibold text-gray-800">{questionBank.name}</h2>
            <div className="flex items-center mt-1">
              <span className="text-gray-600 mr-2">{questionBank.subjectName}</span>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {questionBank.grade}
              </span>
              <span className="ml-3 text-gray-500">
                {questionBank.totalQuestions} Questions ({questionBank.mcqCount} MCQ, {questionBank.essayCount} Essay)
              </span>
            </div>
          </div>
        </div>
        
        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-6">
            <p>{error}</p>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md mb-6">
            <p>{successMessage}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Assignment Form */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">New Assignment</h3>
              </div>
              
              <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Class*
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => handleClassSelect(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a class</option>
                    {classes.map((cls) => (
                      <option 
                        key={cls.id} 
                        value={cls.id}
                        disabled={isClassAssigned(cls.id)}
                      >
                        {cls.name} ({cls.grade}, {cls.studentCount} students)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={handleDueDateChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isVisible"
                    checked={isVisible}
                    onChange={() => setIsVisible(!isVisible)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isVisible" className="ml-2 block text-sm text-gray-700">
                    Visible to students
                  </label>
                </div>
                
                <div>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={submitting}
                    className="w-full"
                  >
                    Assign Question Bank
                  </Button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Current Assignments */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Current Assignments</h3>
              </div>
              
              {assignments.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  This question bank is not assigned to any classes yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Class
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assigned On
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {assignments.map((assignment) => (
                        <tr key={assignment.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {assignment.className}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {assignment.assignedAt.toDate().toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {assignment.dueDate ? 
                              assignment.dueDate.toDate().toLocaleDateString() : 
                              <span className="text-gray-400">No due date</span>
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              assignment.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : assignment.status === 'draft'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-4">
                              <button
                                onClick={() => handleToggleVisibility(assignment.id, assignment.isVisible)}
                                className={assignment.isVisible ? "text-gray-600" : "text-blue-600"}
                              >
                                {assignment.isVisible ? 'Hide' : 'Show'}
                              </button>
                              <button
                                onClick={() => handleDeleteAssignment(assignment.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
