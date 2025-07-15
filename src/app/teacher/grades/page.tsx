'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';
import TeacherLayout from '@/components/teacher/TeacherLayout';

export default function TeacherGrades() {
  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Grade Book
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            View and manage student grades
          </p>
          <div className="mt-6 p-8 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Grade book coming soon...
            </p>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}
