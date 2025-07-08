'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button, Input } from '../ui';
import { Student, StudentDocument } from '@/models/studentSchema';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (studentData: Omit<Student, 'id'>) => void;
  title: string;
  submitButtonText?: string;
  loading?: boolean;
  initialData?: StudentDocument;
}

export default function StudentModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  submitButtonText = 'Save Student',
  loading = false,
  initialData
}: StudentModalProps) {
  const [formData, setFormData] = useState<Omit<Student, 'id'>>({
    name: '',
    email: '',
    phone: '',
    status: 'Active',
    coursesEnrolled: 0,
    enrollmentDate: new Date().toISOString().split('T')[0],
    avatar: '',
    parent: {
      name: '',
      email: '',
      phone: ''
    },
    payment: {
      status: 'Pending',
      method: '',
      lastPayment: 'N/A'
    }
  });

  // Initialize form data when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name,
          email: initialData.email,
          phone: initialData.phone,
          status: initialData.status,
          coursesEnrolled: initialData.coursesEnrolled,
          enrollmentDate: initialData.enrollmentDate,
          avatar: initialData.avatar,
          parent: initialData.parent,
          payment: initialData.payment
        });
      } else {
        setFormData({
          name: '',
          email: '',
          phone: '',
          status: 'Active',
          coursesEnrolled: 0,
          enrollmentDate: new Date().toISOString().split('T')[0],
          avatar: '',
          parent: {
            name: '',
            email: '',
            phone: ''
          },
          payment: {
            status: 'Pending',
            method: '',
            lastPayment: 'N/A'
          }
        });
      }
    }
  }, [isOpen, initialData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleParentChange = (field: keyof typeof formData.parent, value: string) => {
    setFormData(prev => ({
      ...prev,
      parent: {
        ...prev.parent,
        [field]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      status: 'Active',
      coursesEnrolled: 0,
      enrollmentDate: new Date().toISOString().split('T')[0],
      avatar: '',
      parent: {
        name: '',
        email: '',
        phone: ''
      },
      payment: {
        status: 'Pending',
        method: '',
        lastPayment: 'N/A'
      }
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={title}
      size="lg"
      closeOnOverlayClick={!loading}
    >
      <form onSubmit={handleSubmit}>
        <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Information */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                Student Information
              </h4>
              
              <Input
                label="Full Name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter student's full name"
                required
              />

              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter student's email address"
                required
              />

              <Input
                label="Phone Number"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter student's phone number"
                required
              />

              <Input
                label="Enrollment Date"
                type="date"
                value={formData.enrollmentDate}
                onChange={(e) => handleInputChange('enrollmentDate', e.target.value)}
                required
              />
            </div>

            {/* Parent Information */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                Parent/Guardian Information
              </h4>
              
              <Input
                label="Parent/Guardian Name"
                type="text"
                value={formData.parent.name}
                onChange={(e) => handleParentChange('name', e.target.value)}
                placeholder="Enter parent's full name"
                required
              />

              <Input
                label="Parent/Guardian Email"
                type="email"
                value={formData.parent.email}
                onChange={(e) => handleParentChange('email', e.target.value)}
                placeholder="Enter parent's email address"
                required
              />

              <Input
                label="Parent/Guardian Phone"
                type="tel"
                value={formData.parent.phone}
                onChange={(e) => handleParentChange('phone', e.target.value)}
                placeholder="Enter parent's phone number"
                required
              />
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
