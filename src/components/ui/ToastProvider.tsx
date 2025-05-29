'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast, { ToastProps } from './Toast';

interface ToastContextType {
  showToast: (message: string, type: ToastProps['type'], duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastItem extends ToastProps {
  id: string;
}

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
  position?: ToastProps['position'];
}

export function ToastProvider({ 
  children, 
  maxToasts = 5,
  position = 'top-right' 
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((
    message: string, 
    type: ToastProps['type'], 
    duration: number = 5000
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newToast: ToastItem = {
      id,
      message,
      type,
      duration,
      position,
      onClose: () => removeToast(id)
    };

    setToasts((prev) => {
      const updated = [...prev, newToast];
      // Keep only the latest toasts if we exceed maxToasts
      return updated.slice(-maxToasts);
    });
  }, [maxToasts, position, removeToast]);

  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message: string, duration?: number) => {
    showToast(message, 'error', duration);
  }, [showToast]);

  const showWarning = useCallback((message: string, duration?: number) => {
    showToast(message, 'warning', duration);
  }, [showToast]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  const value: ToastContextType = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Render toasts */}
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
