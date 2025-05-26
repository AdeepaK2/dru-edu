'use client';

import React, { useState } from 'react';

// Dummy data for classes
const classesData = [
  {
    id: 1,
    name: 'Advanced Mathematics',
    subject: 'Mathematics',
    grade: '12th',
    teacher: 'Dr. Jane Smith',
    schedule: 'Mon, Wed, Fri - 10:00 AM to 11:30 AM',
    students: 45,
    room: 'Room 101',
    status: 'Active',
    startDate: '2024-09-01',
    endDate: '2025-05-15',
    description: 'Advanced calculus, linear algebra, and mathematical analysis for college preparation.'
  },
  {
    id: 2,
    name: 'Physics Fundamentals',
    subject: 'Physics',
    grade: '11th',
    teacher: 'Prof. John Wilson',
    schedule: 'Tue, Thu - 09:00 AM to 11:00 AM',
    students: 38,
    room: 'Lab 203',
    status: 'Active',
    startDate: '2024-09-01',
    endDate: '2025-05-15',
    description: 'Basic mechanics, thermodynamics, and introduction to quantum physics.'
  },
  {
    id: 3,
    name: 'Molecular Biology',
    subject: 'Biology',
    grade: '12th',
    teacher: 'Dr. Emily Johnson',
    schedule: 'Mon, Wed - 01:00 PM to 03:00 PM',
    students: 32,
    room: 'Lab 105',
    status: 'Active',
    startDate: '2024-09-01',
    endDate: '2025-05-15',
    description: 'Study of cellular structures, DNA, and genetic engineering principles.'
  },
  {
    id: 4,
    name: 'Organic Chemistry',
    subject: 'Chemistry',
    grade: '12th',
    teacher: 'Prof. Michael Lee',
    schedule: 'Tue, Thu - 01:30 PM to 03:30 PM',
    students: 28,
    room: 'Lab 302',
    status: 'Active',
    startDate: '2024-09-01',
    endDate: '2025-05-15',
    description: 'Study of carbon compounds, functional groups, and reaction mechanisms.'
  },
  {
    id: 5,
    name: 'Computer Programming',
    subject: 'Computer Science',
    grade: '11th',
    teacher: 'Dr. Sarah Parker',
    schedule: 'Mon, Wed, Fri - 09:00 AM to 10:30 AM',
    students: 35,
    room: 'Computer Lab 201',
    status: 'Active',
    startDate: '2024-09-01',
    endDate: '2025-05-15',
    description: 'Introduction to algorithms, data structures, and programming languages.'
  }
];

export default function ClassManager() {
  const [classes, setClasses] = useState(classesData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<typeof classesData[0] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const filteredClasses = classes.filter(cls => {
    return (
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.teacher.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleOpenModal = (cls: typeof classesData[0] | null, isEdit = false) => {
    setSelectedClass(cls);
    setEditMode(isEdit);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedClass(null);
    setModalOpen(false);
    setEditMode(false);
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
          </div>
          <div className="mt-4 md:mt-0">
            <button
              onClick={() => handleOpenModal(null, true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <span className="flex items-center">
                <span className="material-symbols-outlined mr-1 text-sm">add</span>
                Add Class
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-gray-400">search</span>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm"
              placeholder="Search classes by name, subject, or teacher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select className="border border-gray-300 rounded-md p-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option value="">Filter by Subject</option>
              <option value="mathematics">Mathematics</option>
              <option value="physics">Physics</option>
              <option value="biology">Biology</option>
              <option value="chemistry">Chemistry</option>
              <option value="computer-science">Computer Science</option>
            </select>
            <select className="border border-gray-300 rounded-md p-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option value="">Filter by Grade</option>
              <option value="10th">10th Grade</option>
              <option value="11th">11th Grade</option>
              <option value="12th">12th Grade</option>
            </select>
          </div>
        </div>
      </div>

      {/* Classes List */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Class Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Subject
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Grade
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
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {cls.grade}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {cls.teacher}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {cls.students}
                  </td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                    {cls.schedule}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleOpenModal(cls)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="View Details"
                      >
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                      <button
                        onClick={() => handleOpenModal(cls, true)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        title="Edit Class"
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Remove Class"
                      >
                        <span className="material-symbols-outlined">delete</span>
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
                </h3>
                <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {editMode ? (
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Class Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        defaultValue={selectedClass?.name || ''}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        defaultValue={selectedClass?.subject || ''}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="grade" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Grade</label>
                      <select
                        id="grade"
                        name="grade"
                        defaultValue={selectedClass?.grade || '12th'}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="10th">10th Grade</option>
                        <option value="11th">11th Grade</option>
                        <option value="12th">12th Grade</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="teacher" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teacher</label>
                      <input
                        type="text"
                        id="teacher"
                        name="teacher"
                        defaultValue={selectedClass?.teacher || ''}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="room" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Room</label>
                      <input
                        type="text"
                        id="room"
                        name="room"
                        defaultValue={selectedClass?.room || ''}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="schedule" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Schedule</label>
                      <input
                        type="text"
                        id="schedule"
                        name="schedule"
                        defaultValue={selectedClass?.schedule || ''}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                      <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        defaultValue={selectedClass?.startDate || ''}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                      <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        defaultValue={selectedClass?.endDate || ''}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
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
                      onClick={handleCloseModal}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      {selectedClass ? 'Update Class' : 'Add Class'}
                    </button>
                  </div>
                </form>
              ) : selectedClass && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedClass.name}</h4>
                    <p className="text-blue-600 dark:text-blue-400">{selectedClass.subject} - {selectedClass.grade} Grade</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-2">
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Teacher</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedClass.teacher}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Students</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedClass.students}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Room</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedClass.room}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedClass.status}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">Schedule</h5>
                    <p className="text-gray-700 dark:text-gray-300">{selectedClass.schedule}</p>
                    <div className="mt-2 flex space-x-4">
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Start:</span> {new Date(selectedClass.startDate).toLocaleDateString()}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium">End:</span> {new Date(selectedClass.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">Description</h5>
                    <p className="text-gray-700 dark:text-gray-300">{selectedClass.description}</p>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <button
                      onClick={handleCloseModal}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        handleCloseModal();
                        handleOpenModal(selectedClass, true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
