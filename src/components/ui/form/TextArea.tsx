import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  className?: string;
}

const TextArea: React.FC<TextAreaProps> = ({ 
  label, 
  error, 
  className = '', 
  id,
  ...props 
}) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`
          w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
          rounded-md shadow-sm placeholder-gray-400 
          focus:outline-none focus:ring-blue-500 focus:border-blue-500
          dark:bg-gray-700 dark:text-white dark:placeholder-gray-400
          disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
          resize-vertical min-h-[80px]
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};

export default TextArea;
