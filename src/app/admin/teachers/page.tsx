'use client';

import React, { useState } from 'react';

// Dummy data for teachers
const teachersData = [
  {
    id: 1,
    name: 'Dr. Jane Smith',
    email: 'jane.smith@druedu.com',
    subject: 'Mathematics',
    students: 45,
    classes: 4,
    joined: '2023-04-15',
    status: 'Active',
    imageUrl: 'https://randomuser.me/api/portraits/women/22.jpg',
    qualifications: 'Ph.D. in Mathematics, Stanford University',
    bio: 'Dr. Smith specializes in advanced calculus and has 10 years of teaching experience.'
  },
  {
    id: 2,
    name: 'Prof. John Wilson',
    email: 'john.wilson@druedu.com',
    subject: 'Physics',
    students: 38,
    classes: 3,
    joined: '2023-06-22',
    status: 'Active',
    imageUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
    qualifications: 'Ph.D. in Physics, MIT',
    bio: 'Prof. Wilson is a theoretical physicist with expertise in quantum mechanics.'
  },
  {
    id: 3,
    name: 'Dr. Emily Johnson',
    email: 'emily.johnson@druedu.com',
    subject: 'Biology',
    students: 52,
    classes: 5,
    joined: '2023-03-10',
    status: 'On Leave',
    imageUrl: 'https://randomuser.me/api/portraits/women/45.jpg',
    qualifications: 'Ph.D. in Molecular Biology, Harvard',
    bio: 'Dr. Johnson focuses on genetics and cellular biology research and education.'
  },
  {
    id: 4,
    name: 'Prof. Michael Lee',
    email: 'michael.lee@druedu.com',
    subject: 'Chemistry',
    students: 41,
    classes: 4,
    joined: '2023-08-05',
    status: 'Active',
    imageUrl: 'https://randomuser.me/api/portraits/men/52.jpg',
    qualifications: 'Ph.D. in Chemistry, UC Berkeley',
    bio: 'Prof. Lee specializes in organic chemistry and has published numerous research papers.'
  },
  {
    id: 5,
    name: 'Dr. Sarah Parker',
    email: 'sarah.parker@druedu.com',
    subject: 'Computer Science',
    students: 60,
    classes: 6,
    joined: '2023-01-18',
    status: 'Active',
    imageUrl: 'https://randomuser.me/api/portraits/women/67.jpg',
    qualifications: 'Ph.D. in Computer Science, Carnegie Mellon',
    bio: 'Dr. Parker is an expert in artificial intelligence and machine learning.'
  }
];

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState(teachersData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<typeof teachersData[0] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const filteredTeachers = teachers.filter(teacher => {
    return (
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleOpenModal = (teacher: typeof teachersData[0] | null, isEdit = false) => {
    setSelectedTeacher(teacher);
    setEditMode(isEdit);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedTeacher(null);
    setModalOpen(false);
    setEditMode(false);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'On Leave':
        return 'bg-yellow-100 text-yellow-800';
      case 'Inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teacher Management</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage faculty members, assign classes, and track performance
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <button
              onClick={() => handleOpenModal(null, true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <span className="flex items-center">
                <span className="material-symbols-outlined mr-1 text-sm">add</span>
                Add Teacher
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
              placeholder="Search teachers by name, email, or subject..."
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
              <option value="">Filter by Status</option>
              <option value="active">Active</option>
              <option value="on-leave">On Leave</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Teacher List */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Teacher
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Subject
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Students
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Classes
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTeachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img className="h-10 w-10 rounded-full object-cover" src={teacher.imageUrl} alt={teacher.name} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{teacher.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{teacher.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {teacher.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {teacher.students}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {teacher.classes}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(teacher.status)}`}>
                      {teacher.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleOpenModal(teacher)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="View Details"
                      >
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                      <button
                        onClick={() => handleOpenModal(teacher, true)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        title="Edit Teacher"
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Remove Teacher"
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
        {filteredTeachers.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">No teachers found matching your search criteria.</p>
          </div>
        )}
      </div>

      {/* Teacher Modal */}
      {modalOpen && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editMode ? (selectedTeacher ? 'Edit Teacher' : 'Add New Teacher') : 'Teacher Details'}
                </h3>
                <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {editMode ? (
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        defaultValue={selectedTeacher?.name || ''}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        defaultValue={selectedTeacher?.email || ''}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        defaultValue={selectedTeacher?.subject || ''}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                      <select
                        id="status"
                        name="status"
                        defaultValue={selectedTeacher?.status || 'Active'}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="Active">Active</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="qualifications" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Qualifications</label>
                      <input
                        type="text"
                        id="qualifications"
                        name="qualifications"
                        defaultValue={selectedTeacher?.qualifications || ''}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile Image URL</label>
                      <input
                        type="text"
                        id="imageUrl"
                        name="imageUrl"
                        defaultValue={selectedTeacher?.imageUrl || ''}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
                    <textarea
                      id="bio"
                      name="bio"
                      rows={3}
                      defaultValue={selectedTeacher?.bio || ''}
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
                      {selectedTeacher ? 'Update Teacher' : 'Add Teacher'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={selectedTeacher.imageUrl} 
                      alt={selectedTeacher.name}
                      className="h-24 w-24 rounded-full object-cover border-4 border-blue-100" 
                    />
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedTeacher.name}</h4>
                      <p className="text-blue-600 dark:text-blue-400">{selectedTeacher.subject} Instructor</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{selectedTeacher.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-2">
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Students</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">{selectedTeacher.students}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Classes</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">{selectedTeacher.classes}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">{selectedTeacher.status}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Joined</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">{new Date(selectedTeacher.joined).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">Qualifications</h5>
                    <p className="text-gray-700 dark:text-gray-300">{selectedTeacher.qualifications}</p>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">Bio</h5>
                    <p className="text-gray-700 dark:text-gray-300">{selectedTeacher.bio}</p>
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
                        handleOpenModal(selectedTeacher, true);
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