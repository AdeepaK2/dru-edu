'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button, Input } from '../ui';
import { AdminData } from '@/models/adminSchema';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (adminData: AdminData) => Promise<void>;
  title: string;
  submitButtonText?: string;
  loading?: boolean;
  initialData?: Partial<AdminData>;
}

export default function AdminModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  submitButtonText = 'Save Admin',
  loading = false,
  initialData
}: AdminModalProps) {
  const [formData, setFormData] = useState<AdminData>({
    name: '',
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          email: initialData.email || '',
          password: '', // Never pre-fill password for security
        });
      } else {
        setFormData({
          name: '',
          email: '',
          password: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const handleInputChange = (field: keyof AdminData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Validate password (only for new admins or when explicitly provided)
    if (!initialData && !formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // If editing and no password provided, don't include password in submission
      const submitData = { ...formData };
      if (initialData && !formData.password.trim()) {
        delete (submitData as any).password;
      }
      
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={title}
      size="md"
      closeOnOverlayClick={!loading}
    >
      <form onSubmit={handleSubmit}>
        <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Input
                  label="Full Name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter admin's full name"
                  required
                  error={errors.name}
                />
              </div>
              
              <div>
                <Input
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="admin@example.com"
                  required
                  error={errors.email}
                />
              </div>

              <div>
                <Input
                  label={initialData ? "New Password (leave blank to keep current)" : "Password"}
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter secure password"
                  required={!initialData}
                  error={errors.password}
                />
                {initialData && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Leave blank to keep the current password
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200 dark:border-gray-700">
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            className="sm:ml-3 sm:w-auto"
          >
            {submitButtonText}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="mt-3 sm:mt-0 sm:w-auto"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
