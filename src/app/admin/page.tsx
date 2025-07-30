'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  GraduationCap, 
  Building2, 
  Video, 
  FileQuestion, 
  Activity,
  Zap,
  UserPlus,
  PlusCircle,
  Upload,
  Shield,
  RefreshCw
} from 'lucide-react';
import { NavigationLoader } from '@/utils/performance';
import { useNavigationLoading } from '@/hooks/useNavigationLoading';
import AdminModal from '@/components/modals/AdminModal';
import { AdminData } from '@/models/adminSchema';
import { CenterFirestoreService } from '@/apiservices/centerFirestoreService';
import { ClassFirestoreService } from '@/apiservices/classFirestoreService';
import { SubjectFirestoreService } from '@/apiservices/subjectFirestoreService';
import { TeacherFirestoreService } from '@/apiservices/teacherFirestoreService';
import { StudentFirestoreService } from '@/apiservices/studentFirestoreService';
import { VideoFirestoreService } from '@/apiservices/videoFirestoreService';

export default function AdminDashboard() {
  const { setLoading: setNavLoading } = useNavigationLoading();
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [centersInitialized, setCentersInitialized] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalVideos: 0,
    totalSubjects: 0,
    activeClasses: 0,
    totalQuestions: 0,
    pendingTransactions: 0,
    systemStatus: 'Loading...'
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      
      // Fetch data from all services in parallel
      const [
        studentsData,
        teachersData,
        classesData,
        videosData,
        subjectsData
      ] = await Promise.all([
        StudentFirestoreService.getAllStudents().catch(() => []),
        TeacherFirestoreService.getAllTeachers().catch(() => []),
        ClassFirestoreService.getAllClasses().catch(() => []),
        VideoFirestoreService.getAllVideos().catch(() => []),
        SubjectFirestoreService.getAllSubjects().catch(() => [])
      ]);

      // Calculate statistics
      const activeClasses = classesData.filter(cls => cls.status === 'Active').length;
      const activeSubjects = subjectsData.filter(sub => sub.isActive).length;
      
      setStats({
        totalStudents: studentsData.length,
        totalTeachers: teachersData.length,
        totalClasses: classesData.length,
        totalVideos: videosData.length,
        totalSubjects: subjectsData.length,
        activeClasses: activeClasses,
        totalQuestions: 0, // Will need QuestionBankFirestoreService for this
        pendingTransactions: 0, // Will need TransactionFirestoreService for this
        systemStatus: 'Healthy'
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setStats(prev => ({
        ...prev,
        systemStatus: 'Error'
      }));
    } finally {
      setStatsLoading(false);
    }
  };

  // Clear loading state when dashboard loads and fetch stats
  useEffect(() => {
    setNavLoading(false);
    fetchDashboardStats();
  }, [setNavLoading]);

  // Handle admin creation
  const handleAdminCreate = async (adminData: AdminData) => {
    setAdminLoading(true);
    
    try {
      const response = await fetch('/api/admin-side/admin-manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adminData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create admin');
      }

      const result = await response.json();
      console.log('Admin created successfully:', result);
      alert(`Admin "${adminData.name}" created successfully!`);
      setShowAdminModal(false);
    } catch (error) {
      console.error('Error creating admin:', error);
      alert(`Failed to create admin: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAdminLoading(false);
    }
  };

  // Initialize centers in database
  const initializeCenters = async () => {
    try {
      // Check if centers already exist
      const existingCenters = await CenterFirestoreService.getAllCenters();
      if (existingCenters.length > 0) {
        alert('Centers already exist in database');
        setCentersInitialized(true);
        return;
      }

      // Add the two centers to Firestore
      const centersData = [
        { center: 1, location: 'Glen Waverley' },
        { center: 2, location: 'Cranbourne' }
      ];

      // Note: You'll need to add a createCenter method to CenterFirestoreService
      // For now, let's add them directly to Firestore
      const { collection, addDoc } = await import('firebase/firestore');
      const { firestore } = await import('@/utils/firebase-client');
      
      for (const centerData of centersData) {
        await addDoc(collection(firestore, 'center'), centerData);
      }

      alert('Centers initialized successfully!');
      setCentersInitialized(true);
    } catch (error) {
      console.error('Error initializing centers:', error);
      alert('Failed to initialize centers: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const recentActivities = [
    { id: 1, action: 'New student enrolled', user: 'John Doe', time: '2 minutes ago' },
    { id: 2, action: 'Video uploaded', user: 'Prof. Smith', time: '15 minutes ago' },
    { id: 3, action: 'Payment received', user: 'Jane Wilson', time: '1 hour ago' },
    { id: 4, action: 'Class created', user: 'Dr. Johnson', time: '2 hours ago' },
    { id: 5, action: 'Question added', user: 'Admin', time: '3 hours ago' }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Dashboard Overview
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome back! Here's what's happening with your platform today.
            </p>
          </div>
          <button
            onClick={fetchDashboardStats}
            disabled={statsLoading}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} />
            Refresh Stats
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">        {/* Students Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {statsLoading ? 'Loading...' : stats.totalStudents.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Teachers Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <GraduationCap className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Teachers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {statsLoading ? 'Loading...' : stats.totalTeachers}
              </p>
            </div>
          </div>
        </div>

        {/* Classes Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Classes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {statsLoading ? 'Loading...' : stats.activeClasses}
              </p>
            </div>
          </div>
        </div>

        {/* Videos Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
              <Video className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Videos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {statsLoading ? 'Loading...' : stats.totalVideos}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">        {/* Subjects */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <FileQuestion className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Subjects</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {statsLoading ? 'Loading...' : stats.totalSubjects}
              </p>
            </div>
          </div>
        </div>

        {/* Total Classes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
              <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Classes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {statsLoading ? 'Loading...' : stats.totalClasses}
              </p>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${
              stats.systemStatus === 'Healthy' 
                ? 'bg-green-100 dark:bg-green-900' 
                : stats.systemStatus === 'Error' 
                ? 'bg-red-100 dark:bg-red-900' 
                : 'bg-gray-100 dark:bg-gray-900'
            }`}>
              <Activity className={`w-6 h-6 ${
                stats.systemStatus === 'Healthy' 
                  ? 'text-green-600 dark:text-green-400' 
                  : stats.systemStatus === 'Error' 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-gray-600 dark:text-gray-400'
              }`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System Status</p>
              <p className={`text-2xl font-bold ${
                stats.systemStatus === 'Healthy' 
                  ? 'text-green-600 dark:text-green-400' 
                  : stats.systemStatus === 'Error' 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {stats.systemStatus}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <Zap className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.action}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      by {activity.user} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <button 
                onClick={() => setShowAdminModal(true)}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
              >
                <Shield className="w-5 h-5 mr-2" />
                Add New Admin
              </button>
              <button className="w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
                <UserPlus className="w-5 h-5 mr-2" />
                Add New Student
              </button>              <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
                <GraduationCap className="w-5 h-5 mr-2" />
                Add New Teacher
              </button>              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
                <Building2 className="w-5 h-5 mr-2" />
                Create New Class
              </button>              <button className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
                <Upload className="w-5 h-5 mr-2" />
                Upload Video
              </button>              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
                <FileQuestion className="w-5 h-5 mr-2" />
                Add Question
              </button>
              
              <button 
                onClick={initializeCenters}
                disabled={centersInitialized}
                className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                  centersInitialized 
                    ? 'bg-gray-400 cursor-not-allowed text-gray-200' 
                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                }`}
              >
                <Building2 className="w-5 h-5 mr-2" />
                {centersInitialized ? 'Centers Initialized' : 'Initialize Centers'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Creation Modal */}
      {showAdminModal && (
        <AdminModal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
          onSubmit={handleAdminCreate}
          loading={adminLoading}
          title="Add New Admin"
          submitButtonText="Create Admin"
        />
      )}
    </div>
  );
}