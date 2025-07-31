'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Loading component for dynamic imports
const DynamicPageLoader = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
      <p className="text-gray-600 dark:text-gray-300">Loading page...</p>
    </div>
  </div>
);

// Dynamic imports for heavy teacher pages
export const TeacherVideosPage = dynamic(
  () => import('@/app/teacher/videos/page'),
  { 
    loading: () => <DynamicPageLoader />,
    ssr: false // Client-side only for better performance
  }
);

export const TeacherTestsPage = dynamic(
  () => import('@/app/teacher/tests/page'),
  { 
    loading: () => <DynamicPageLoader />,
    ssr: false
  }
);

export const TeacherClassesPage = dynamic(
  () => import('@/app/teacher/classes/page'),
  { 
    loading: () => <DynamicPageLoader />,
    ssr: false
  }
);

export const TeacherQuestionsPage = dynamic(
  () => import('@/app/teacher/questions/page'),
  { 
    loading: () => <DynamicPageLoader />,
    ssr: false
  }
);

export const TeacherLessonsPage = dynamic(
  () => import('@/app/teacher/lessons/page'),
  { 
    loading: () => <DynamicPageLoader />,
    ssr: false
  }
);

export const TeacherSettingsPage = dynamic(
  () => import('@/app/teacher/settings/page'),
  { 
    loading: () => <DynamicPageLoader />,
    ssr: false
  }
);

export const TeacherGradesPage = dynamic(
  () => import('@/app/teacher/grades/page'),
  { 
    loading: () => <DynamicPageLoader />,
    ssr: false
  }
);
