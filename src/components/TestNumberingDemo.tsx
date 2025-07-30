'use client';

import React, { useState, useEffect } from 'react';
import { Clock, BookOpen, Users, Target } from 'lucide-react';

// Demo component to showcase the enhanced test numbering UI
export default function TestNumberingDemo() {
  const [suggestedNumber, setSuggestedNumber] = useState(4);
  const [usedNumbers] = useState([1, 2, 3]);
  const [testNumber, setTestNumber] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
      setTestNumber(suggestedNumber.toString());
    }, 1000);
  }, [suggestedNumber]);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Create New Test - Step 1 of 4
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Enhanced test creation with automatic test numbering
        </p>
      </div>

      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Test Basic Information
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Enter the basic details and type for your test
          </p>
        </div>

        {/* Test Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Test Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value="Mathematics Mid-term Exam"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Enter test title (e.g., Mid-term Math Quiz)"
          />
        </div>

        {/* Enhanced Test Number Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Test Number (Optional)
          </label>
          
          {/* Suggested Number Display */}
          {!loading && (
            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Suggested:
                    </span>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-sm font-medium">
                      {suggestedNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTestNumber(suggestedNumber.toString())}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline"
                  >
                    Use this number
                  </button>
                </div>
                
                {usedNumbers.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Used:</span>
                    <div className="flex flex-wrap gap-1">
                      {usedNumbers.slice(0, 5).map(num => (
                        <span 
                          key={num}
                          className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                        >
                          {num}
                        </span>
                      ))}
                      {usedNumbers.length > 5 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{usedNumbers.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Input Field */}
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={testNumber}
              onChange={(e) => setTestNumber(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder={loading ? "Loading..." : suggestedNumber.toString()}
            />
            
            {loading ? (
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span>Loading...</span>
              </div>
            ) : usedNumbers.length === 0 ? (
              <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                First test! 🎉
              </div>
            ) : (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {usedNumbers.length} test{usedNumbers.length !== 1 ? 's' : ''} created
              </div>
            )}
          </div>
          
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Choose a unique number for this test. Numbers are automatically suggested based on existing tests.
          </p>
        </div>

        {/* Test Type Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Test Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Flexible Test */}
            <div className="cursor-pointer p-4 border border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-lg ring-2 ring-blue-500">
              <div className="flex items-start space-x-3">
                <div className="mt-1 w-4 h-4 rounded-full border-2 border-blue-500 bg-blue-500 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Flexible Test
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Students can take the test anytime within a specified period.
                  </p>
                </div>
              </div>
            </div>

            {/* Live Test */}
            <div className="cursor-pointer p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400">
              <div className="flex items-start space-x-3">
                <div className="mt-1 w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600"></div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="h-5 w-5 text-red-600" />
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Live Test
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Synchronized test where all students start at the same time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Preview */}
        <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            disabled
            className="px-4 py-2 text-gray-400 dark:text-gray-600 cursor-not-allowed"
          >
            Previous
          </button>
          <button
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Next: Timing & Duration
          </button>
        </div>
      </div>
    </div>
  );
}
