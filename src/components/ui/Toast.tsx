'use client';

import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  id?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const Toast: React.FC<ToastProps> = ({
  message,
  type,
  duration = 5000,
  onClose,
  position = 'top-right'
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeStyles = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700',
      text: 'text-green-800 dark:text-green-200',
      icon: CheckCircle,
      iconColor: 'text-green-600 dark:text-green-400'
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700',
      text: 'text-red-800 dark:text-red-200',
      icon: XCircle,
      iconColor: 'text-red-600 dark:text-red-400'
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-700',
      text: 'text-yellow-800 dark:text-yellow-200',
      icon: AlertCircle,
      iconColor: 'text-yellow-600 dark:text-yellow-400'
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700',
      text: 'text-blue-800 dark:text-blue-200',
      icon: Info,
      iconColor: 'text-blue-600 dark:text-blue-400'
    }
  };

  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  const currentStyle = typeStyles[type];
  const IconComponent = currentStyle.icon;

  return (
    <div className={`fixed z-50 ${positionStyles[position]} animate-in slide-in-from-top-2 duration-300`}>
      <div className={`p-4 rounded-lg shadow-lg border max-w-md ${currentStyle.bg}`}>
        <div className="flex items-start">
          <IconComponent className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${currentStyle.iconColor}`} />
          <div className="flex-1">
            <p className={`text-sm font-medium ${currentStyle.text}`}>
              {message}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className={`ml-3 flex-shrink-0 ${currentStyle.text} hover:opacity-70 transition-opacity`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Toast;
