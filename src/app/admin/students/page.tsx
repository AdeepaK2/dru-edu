'use client';

import React, { useState } from 'react';
import { UserPlus, Users, CheckCircle, XCircle, BookOpen, Search } from 'lucide-react';
import { Student, ParentInfo, PaymentInfo } from '@/models/studentSchema';

export default function StudentsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
    // New state for form inputs
  const [newStudent, setNewStudent] = useState<Omit<Student, 'id'>>({
    name: '',
    email: '',
    phone: '',
    status: 'Active',
    coursesEnrolled: 0,
    enrollmentDate: new Date().toISOString().split('T')[0],
    avatar: '',
    parent: {
      name: '',
      email: '',
      phone: ''
    },
    payment: {
      status: 'Pending',
      method: '',
      lastPayment: 'N/A'
    }
  });

  // Form input change handlers
  const handleStudentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewStudent({
      ...newStudent,
      [name]: value
    });
  };

  const handleParentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewStudent({
      ...newStudent,
      parent: {
        ...newStudent.parent,
        [name]: value
      }
    });
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewStudent({
      ...newStudent,
      payment: {
        ...newStudent.payment,
        [name]: value
      }
    });
  };  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const studentData = {
      name: newStudent.name,
      email: newStudent.email,
      phone: newStudent.phone,
      status: newStudent.status,
      coursesEnrolled: newStudent.coursesEnrolled,
      enrollmentDate: newStudent.enrollmentDate,
      parent: newStudent.parent,
      payment: newStudent.payment
    };
    
    try {
      const response = await fetch('/api/student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create student');
      }
      
      const savedStudent = await response.json();
      console.log('Student created successfully:', savedStudent);
      
      // Close the modal
      setShowAddModal(false);
      
      // Reset the form
      setNewStudent({
        name: '',
        email: '',
        phone: '',
        status: 'Active',
        coursesEnrolled: 0,
        enrollmentDate: new Date().toISOString().split('T')[0],
        avatar: '',
        parent: {
          name: '',
          email: '',
          phone: ''
        },
        payment: {
          status: 'Pending',
          method: '',
          lastPayment: 'N/A'
        }
      });
        // Show success message
      alert(`Student "${savedStudent.name}" has been created successfully! A welcome email with login credentials has been sent to ${savedStudent.email}.`);
      
      // Optionally, refresh the page or update the students list
      window.location.reload();
      
    } catch (error: any) {
      console.error('Error saving student data:', error);
      alert(`Error: ${error.message || 'An unexpected error occurred'}`);
    }
  };

  // Dummy student data
  const students = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+1 234 567 8900',
      enrollmentDate: '2024-01-15',
      status: 'Active',
      coursesEnrolled: 5,
      avatar: 'JD',
      // Added parent information
      parent: {
        name: 'Robert Doe',
        email: 'robert.doe@email.com',
        phone: '+1 234 567 8910'
      },
      // Added payment information
      payment: {
        status: 'Paid',
        method: 'Credit Card',
        lastPayment: '2024-05-01'
      }
    },    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@email.com',
      phone: '+1 234 567 8901',
      enrollmentDate: '2024-02-20',
      status: 'Active',
      coursesEnrolled: 3,
      avatar: 'JS',
      parent: {
        name: 'Mary Smith',
        email: 'mary.smith@email.com',
        phone: '+1 234 567 8931'
      },
      payment: {
        status: 'Paid',
        method: 'Bank Transfer',
        lastPayment: '2024-04-25'
      }
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike.johnson@email.com',
      phone: '+1 234 567 8902',
      enrollmentDate: '2024-03-10',
      status: 'Suspended',
      coursesEnrolled: 2,
      avatar: 'MJ',
      parent: {
        name: 'Thomas Johnson',
        email: 'thomas.johnson@email.com',
        phone: '+1 234 567 8922'
      },
      payment: {
        status: 'Overdue',
        method: 'Credit Card',
        lastPayment: '2024-01-15'
      }
    },
    {
      id: 4,
      name: 'Sarah Wilson',
      email: 'sarah.wilson@email.com',
      phone: '+1 234 567 8903',
      enrollmentDate: '2024-01-25',
      status: 'Active',
      coursesEnrolled: 7,
      avatar: 'SW',
      parent: {
        name: 'James Wilson',
        email: 'james.wilson@email.com',
        phone: '+1 234 567 8943'
      },
      payment: {
        status: 'Paid',
        method: 'PayPal',
        lastPayment: '2024-05-10'
      }
    },
    {
      id: 5,
      name: 'David Brown',
      email: 'david.brown@email.com',
      phone: '+1 234 567 8904',
      enrollmentDate: '2024-04-05',
      status: 'Active',
      coursesEnrolled: 1,
      avatar: 'DB',
      parent: {
        name: 'Linda Brown',
        email: 'linda.brown@email.com',
        phone: '+1 234 567 8954'
      },
      payment: {
        status: 'Pending',
        method: 'Not Selected',
        lastPayment: 'N/A'
      }
    }
  ];

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Management</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your students, their enrollments, and account status
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="mt-4 sm:mt-0 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Add Student
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{students.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Students</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {students.filter(s => s.status === 'Active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Suspended</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {students.filter(s => s.status === 'Suspended').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Enrollments</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(students.reduce((acc, s) => acc + s.coursesEnrolled, 0) / students.length)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">Search students</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="search"
                type="text"
                placeholder="Search by name or email..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <select className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option>All Status</option>
              <option>Active</option>
              <option>Suspended</option>
            </select>
            <button className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors">
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Parent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Enrollment Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Courses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                          {student.avatar}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {student.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {student.id}
                        </div>
                      </div>
                    </div>
                  </td>                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{student.email}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{student.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{student.parent.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{student.parent.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(student.enrollmentDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {student.coursesEnrolled}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      student.status === 'Active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      student.payment.status === 'Paid' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : student.payment.status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {student.payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300">
                        View
                      </button>
                      <button className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                        {student.status === 'Active' ? 'Suspend' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowAddModal(false)}></div>
            </div>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add New Student</h3>
                  <div className="space-y-4">
                    {/* Student Information */}
                    <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">Student Information</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={newStudent.name}
                        onChange={handleStudentChange}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter student full name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={newStudent.email}
                        onChange={handleStudentChange}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter student email address"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={newStudent.phone}
                        onChange={handleStudentChange}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter student phone number"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <select
                        name="status"
                        value={newStudent.status}
                        onChange={handleStudentChange}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="Active">Active</option>
                        <option value="Suspended">Suspended</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>

                    {/* Parent Information */}
                    <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 pt-4">Parent Information</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Parent Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={newStudent.parent.name}
                        onChange={handleParentChange}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter parent's full name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Parent Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={newStudent.parent.email}
                        onChange={handleParentChange}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter parent's email address"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Parent Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={newStudent.parent.phone}
                        onChange={handleParentChange}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter parent's phone number"
                        required
                      />
                    </div>

                    {/* Payment Information */}
                    <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 pt-4">Payment Information</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Payment Status
                      </label>
                      <select
                        name="status"
                        value={newStudent.payment.status}
                        onChange={handlePaymentChange}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Payment Method
                      </label>
                      <select
                        name="method"
                        value={newStudent.payment.method}
                        onChange={handlePaymentChange}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Select Payment Method</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="PayPal">PayPal</option>
                        <option value="Cash">Cash</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button 
                    type="submit"
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Add Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
