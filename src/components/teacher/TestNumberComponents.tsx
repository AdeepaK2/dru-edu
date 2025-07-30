// Test Number Display Component
// Shows the test number in various UI contexts

import React from 'react';
import { Hash, Trophy, Calendar, Users } from 'lucide-react';

interface TestNumberDisplayProps {
  testNumber?: number;
  displayNumber?: string;
  variant?: 'badge' | 'inline' | 'header' | 'card';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

export const TestNumberDisplay: React.FC<TestNumberDisplayProps> = ({
  testNumber,
  displayNumber,
  variant = 'badge',
  size = 'md',
  className = '',
  showIcon = true
}) => {
  if (!testNumber && !displayNumber) {
    return null;
  }

  const numberText = displayNumber || `Test #${testNumber}`;

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  // Variant styles
  const variantClasses = {
    badge: `inline-flex items-center rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 font-medium ${sizeClasses[size]}`,
    inline: `inline-flex items-center text-gray-600 dark:text-gray-400 ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`,
    header: `inline-flex items-center text-blue-600 dark:text-blue-400 font-semibold ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-lg'}`,
    card: `inline-flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm ${sizeClasses[size]}`
  };

  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  return (
    <span className={`${variantClasses[variant]} ${className}`}>
      {showIcon && <Hash className={`${iconSize} mr-1 flex-shrink-0`} />}
      {numberText}
    </span>
  );
};

// Test Number Statistics Component
interface TestNumberStatsProps {
  totalTests: number;
  testsThisMonth: number;
  activeClasses: number;
  className?: string;
}

export const TestNumberStats: React.FC<TestNumberStatsProps> = ({
  totalTests,
  testsThisMonth,
  activeClasses,
  className = ''
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <div className="flex items-center">
          <Trophy className="h-5 w-5 text-blue-500 mr-2" />
          <div>
            <div className="text-sm text-blue-600 dark:text-blue-400">Total Tests</div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {totalTests}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <div className="flex items-center">
          <Calendar className="h-5 w-5 text-green-500 mr-2" />
          <div>
            <div className="text-sm text-green-600 dark:text-green-400">This Month</div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {testsThisMonth}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
        <div className="flex items-center">
          <Users className="h-5 w-5 text-purple-500 mr-2" />
          <div>
            <div className="text-sm text-purple-600 dark:text-purple-400">Active Classes</div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {activeClasses}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Recent Test Numbers List Component
interface RecentTestNumbersProps {
  recentTests: Array<{
    className: string;
    subjectName?: string;
    testNumber: number;
    displayNumber: string;
    testTitle?: string;
    createdAt: any;
  }>;
  className?: string;
}

export const RecentTestNumbers: React.FC<RecentTestNumbersProps> = ({
  recentTests,
  className = ''
}) => {
  const formatDate = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-AU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Recent Test Numbers
      </h3>
      
      {recentTests.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Hash className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No tests created yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recentTests.map((test, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <TestNumberDisplay
                  displayNumber={test.displayNumber}
                  variant="badge"
                  size="sm"
                  showIcon={false}
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {test.testTitle || 'Untitled Test'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {test.className}
                    {test.subjectName && ` • ${test.subjectName}`}
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(test.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Test Number Input Component (for manual number assignment)
interface TestNumberInputProps {
  value?: number;
  suggestedNumber?: number;
  onChange: (number: number) => void;
  className?: string;
  disabled?: boolean;
}

export const TestNumberInput: React.FC<TestNumberInputProps> = ({
  value,
  suggestedNumber,
  onChange,
  className = '',
  disabled = false
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Test Number
      </label>
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="number"
            min="1"
            value={value || suggestedNumber || ''}
            onChange={(e) => onChange(parseInt(e.target.value) || 1)}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={disabled}
            placeholder="Auto"
          />
        </div>
        
        {suggestedNumber && value !== suggestedNumber && (
          <button
            onClick={() => onChange(suggestedNumber)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            disabled={disabled}
          >
            Use suggested #{suggestedNumber}
          </button>
        )}
      </div>
      
      {suggestedNumber && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Suggested: #{suggestedNumber} (next in sequence)
        </p>
      )}
    </div>
  );
};
