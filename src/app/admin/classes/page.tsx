'use client';

import React, { useState, useEffect } from 'react';
import { ClassFirestoreService } from '@/apiservices/classFirestoreService';
import { CenterFirestoreService, CenterDocument } from '@/apiservices/centerFirestoreService';
import { ClassDocument, ClassDisplayData, classDocumentToDisplay, ClassData, formDataToClass } from '@/models/classSchema';
import { Plus, Search, Eye, Edit, Trash2, RefreshCw, X, UserPlus } from 'lucide-react';

export default function ClassManager() {
  const [classes, setClasses] = useState<ClassDisplayData[]>([]);
  const [centers, setCenters] = useState<CenterDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<ClassDisplayData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  
  // Subscribe to real-time center updates
  useEffect(() => {
    const unsubscribe = CenterFirestoreService.subscribeToCenters(
      (centerDocuments: CenterDocument[]) => {
        setCenters(centerDocuments);
      },
      (error: Error) => {
        console.error('Error loading centers:', error);
      }
    );

    return () => unsubscribe();
  }, []);
  
  // Subscribe to real-time class updates
  useEffect(() => {
    const unsubscribe = ClassFirestoreService.subscribeToClasses(
      (classDocuments: ClassDocument[]) => {
        const displayClasses = classDocuments.map(doc => {
          const center = centers.find(c => c.center.toString() === doc.centerId);
          return classDocumentToDisplay(doc, center?.location);
        });
        setClasses(displayClasses);
        setLoading(false);
        setError(null);
      },
      (error: Error) => {
        console.error('Error loading classes:', error);
        setError('Failed to load classes. Please try again.');
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [centers]); // Depend on centers to re-map when centers load// Filter classes based on search term and filters
  const filteredClasses = classes.filter(cls => {
    const matchesSearch = (
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.classId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchesSubject = !subjectFilter || cls.subject.toLowerCase() === subjectFilter.toLowerCase();
    const matchesYear = !yearFilter || cls.year === yearFilter;

    return matchesSearch && matchesSubject && matchesYear;
  });
  // Handle class creation/editing
  const handleSaveClass = async (formData: any) => {
    setActionLoading(editMode ? 'edit' : 'create');
    
    try {
      if (editMode && selectedClass) {
        // Update existing class
        const updateData = formDataToClass(formData);
        await ClassFirestoreService.updateClass(selectedClass.id, updateData);
        console.log('Class updated successfully!');
      } else {
        // Create new class
        const classData: ClassData = formDataToClass(formData);
        const newClassId = await ClassFirestoreService.createClass(classData);
        console.log('Class created successfully!', newClassId);
      }
      
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving class:', error);
      setError(`Error: ${error.message || 'An unexpected error occurred'}`);
    } finally {
      setActionLoading(null);
    }
  };
  // Handle class deletion
  const handleDeleteClass = async (classToDelete: ClassDisplayData) => {
    if (!confirm(`Are you sure you want to delete "${classToDelete.name}"? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(`delete-${classToDelete.id}`);
    
    try {
      await ClassFirestoreService.deleteClass(classToDelete.id);
      console.log('Class deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting class:', error);
      setError(`Error: ${error.message || 'An unexpected error occurred'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenModal = (cls: ClassDisplayData | null, isEdit = false) => {
    setSelectedClass(cls);
    setEditMode(isEdit);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedClass(null);
    setModalOpen(false);
    setEditMode(false);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Class Manager</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage classes, schedules, and teacher assignments
            </p>
          </div>          <div className="mt-4 md:mt-0">
            <button
              onClick={() => handleOpenModal(null, true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <span className="flex items-center">
                <Plus className="mr-1 h-4 w-4" />
                Add Class
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm"
              placeholder="Search classes by name, subject, or teacher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div><div className="flex flex-wrap gap-2">
            <select 
              className="border border-gray-300 rounded-md p-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            >
              <option value="">Filter by Subject</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Biology">Biology</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Methods">Methods</option>
              <option value="English">English</option>
              <option value="Science">Science</option>
            </select>            <select 
              className="border border-gray-300 rounded-md p-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option value="">Filter by Year</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* Classes List */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Class Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Subject
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Year
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Center
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Teacher
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Students
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Schedule
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredClasses.map((cls) => (
                <tr key={cls.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{cls.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {cls.subject}
                  </td>                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {cls.year}
                  </td>                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {cls.centerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {cls.teacher}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {cls.students}
                  </td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                    {cls.schedule}
                  </td>                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleOpenModal(cls)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenModal(cls, true)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        title="Edit Class"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClass(cls)}
                        disabled={actionLoading === `delete-${cls.id}`}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                        title="Remove Class"
                      >
                        {actionLoading === `delete-${cls.id}` ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredClasses.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">No classes found matching your search criteria.</p>
          </div>
        )}
      </div>

      {/* Class Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editMode ? (selectedClass ? 'Edit Class' : 'Add New Class') : 'Class Details'}
                </h3>                <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}              {editMode ? (
                <ClassForm 
                  selectedClass={selectedClass}
                  onSave={handleSaveClass}
                  onCancel={handleCloseModal}
                  actionLoading={actionLoading}
                />
              ) : selectedClass && (
                <ClassDetails 
                  selectedClass={selectedClass}
                  onClose={handleCloseModal}
                  onEdit={() => {
                    handleCloseModal();
                    handleOpenModal(selectedClass, true);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}    </div>
  );
}

// ClassForm Component
interface ClassFormProps {
  selectedClass: ClassDisplayData | null;
  onSave: (formData: any) => void;
  onCancel: () => void;
  actionLoading: string | null;
}

function ClassForm({ selectedClass, onSave, onCancel, actionLoading }: ClassFormProps) {
  const [centers, setCenters] = useState<CenterDocument[]>([]);
  const [timeSlots, setTimeSlots] = useState<Array<{day: string, startTime: string, endTime: string}>>([
    { day: 'Monday', startTime: '17:00', endTime: '19:00' }
  ]);

  // Load centers for the form
  useEffect(() => {
    CenterFirestoreService.getAllCenters()
      .then(setCenters)
      .catch(console.error);
  }, []);
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData.entries());
    
    // Add schedule data
    data.schedule = timeSlots;
    
    onSave(data);
  };

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { day: 'Monday', startTime: '17:00', endTime: '19:00' }]);
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const updateTimeSlot = (index: number, field: string, value: string) => {
    const updated = [...timeSlots];
    updated[index] = { ...updated[index], [field]: value };
    setTimeSlots(updated);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Class Name</label>
          <input
            type="text"
            id="name"
            name="name"
            required
            defaultValue={selectedClass?.name || ''}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
          <select
            id="subject"
            name="subject"
            required
            defaultValue={selectedClass?.subject || ''}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Select Subject</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Physics">Physics</option>
            <option value="Biology">Biology</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Methods">Methods</option>
            <option value="English">English</option>
            <option value="Science">Science</option>
          </select>
        </div>

        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Year</label>
          <select
            id="year"
            name="year"
            required
            defaultValue={selectedClass?.year || '2025'}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>        <div>
          <label htmlFor="centerId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Center</label>
          <select
            id="centerId"
            name="centerId"
            required
            defaultValue={selectedClass?.centerId || '1'}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {centers.length > 0 ? (
              centers.map(center => (
                <option key={center._id} value={center.center.toString()}>
                  {center.location}
                </option>
              ))
            ) : (
              <>
                <option value="1">Center 1</option>
                <option value="2">Center 2</option>
              </>
            )}
          </select>
        </div>

        <div>
          <label htmlFor="monthlyFee" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Fee ($)</label>
          <input
            type="number"
            id="monthlyFee"
            name="monthlyFee"
            required
            min="0"
            step="0.01"
            defaultValue={selectedClass?.monthlyFee || ''}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      {/* Schedule Management */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Schedule</label>
          <button
            type="button"
            onClick={addTimeSlot}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Time Slot
          </button>
        </div>
        
        <div className="space-y-3">
          {timeSlots.map((slot, index) => (
            <div key={index} className="flex gap-3 items-center p-3 border border-gray-200 rounded-lg">
              <select
                value={slot.day}
                onChange={(e) => updateTimeSlot(index, 'day', e.target.value)}
                className="border border-gray-300 rounded p-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
                <option value="Sunday">Sunday</option>
              </select>
              
              <input
                type="time"
                value={slot.startTime}
                onChange={(e) => updateTimeSlot(index, 'startTime', e.target.value)}
                className="border border-gray-300 rounded p-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              
              <span className="text-sm text-gray-500">to</span>
              
              <input
                type="time"
                value={slot.endTime}
                onChange={(e) => updateTimeSlot(index, 'endTime', e.target.value)}
                className="border border-gray-300 rounded p-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              
              {timeSlots.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTimeSlot(index)}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={selectedClass?.description || ''}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        ></textarea>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={actionLoading === 'create' || actionLoading === 'edit'}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
        >
          {actionLoading === 'create' || actionLoading === 'edit' ? (
            <span className="flex items-center">
              <RefreshCw className="animate-spin mr-1 h-4 w-4" />
              {selectedClass ? 'Updating...' : 'Creating...'}
            </span>
          ) : (
            selectedClass ? 'Update Class' : 'Add Class'
          )}
        </button>
      </div>
    </form>
  );
}

// ClassDetails Component
interface ClassDetailsProps {
  selectedClass: ClassDisplayData;
  onClose: () => void;
  onEdit: () => void;
}

function ClassDetails({ selectedClass, onClose, onEdit }: ClassDetailsProps) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedClass.name}</h4>
        <p className="text-blue-600 dark:text-blue-400">{selectedClass.subject} - {selectedClass.year}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 py-2">        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Center</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedClass.centerName}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Teacher</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedClass.teacher}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Students</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedClass.students}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedClass.status}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Fee</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">${selectedClass.monthlyFee}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Waiting List</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedClass.waitingList || 0}</p>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h5 className="font-medium text-gray-900 dark:text-white mb-2">Schedule</h5>
        <p className="text-gray-700 dark:text-gray-300">{selectedClass.schedule}</p>
      </div>

      {selectedClass.description && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h5 className="font-medium text-gray-900 dark:text-white mb-2">Description</h5>
          <p className="text-gray-700 dark:text-gray-300">{selectedClass.description}</p>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
        >
          Close
        </button>
        <button
          onClick={onEdit}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Edit
        </button>
      </div>
    </div>
  );
}
