'use client';

import React from 'react';
import StudentLayout from '@/components/student/StudentLayout';

export default function StudentRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudentLayout>
      {children}
    </StudentLayout>
  );
}
