'use client';

import React from 'react';
import Link from 'next/link';

export default function TestStudyPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Study Materials Test</h1>
      <p className="mb-4">
        The indexes have been deployed to Firebase. You can now test the study materials functionality.
      </p>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">For Teachers:</h2>
          <p>Visit any class page to see the study materials tab with the timeline view.</p>
          <Link 
            href="/teacher/classes" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Go to Teacher Classes
          </Link>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">For Students:</h2>
          <p>Visit the study materials page to see your enrolled classes' materials.</p>
          <Link 
            href="/student/study" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Go to Student Study Materials
          </Link>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-yellow-100 rounded-lg">
        <h3 className="font-semibold">Note:</h3>
        <p>The Firestore indexes may take a few minutes to build. If you see index errors initially, wait a few minutes and try again.</p>
      </div>
      
      <div className="mt-4 p-4 bg-blue-100 rounded-lg">
        <h3 className="font-semibold">Fallback Behavior:</h3>
        <p>The study materials service now includes fallback queries that work even if the optimal indexes aren't ready yet. This ensures the page remains functional.</p>
      </div>
    </div>
  );
}
