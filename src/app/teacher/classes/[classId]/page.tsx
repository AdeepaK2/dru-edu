'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import TeacherLayout from '@/components/teacher/TeacherLayout';

export default function ClassDetails() {
  const params = useParams();
  const classId = params.classId as string;

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Class Details
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Class ID: {classId}
          </p>
          <div className="mt-6 p-8 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Class details page coming soon...
            </p>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}
