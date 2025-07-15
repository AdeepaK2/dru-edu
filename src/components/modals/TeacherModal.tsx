'use client';

import { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/form/Input';
import PhoneInput from '../ui/form/PhoneInput';
import Select from '../ui/form/Select';
import { TeacherData, TeacherDocument } from '@/models/teacherSchema';
import { SubjectFirestoreService } from '@/apiservices/subjectFirestoreService';
import { SubjectDocument } from '@/models/subjectSchema';

interface TeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TeacherData) => Promise<void>;
  title: string;
  submitButtonText: string;
  loading?: boolean;
  initialData?: TeacherDocument;
}

export function TeacherModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  submitButtonText,
  loading = false,
  initialData
}: TeacherModalProps) {
  const [formData, setFormData] = useState<TeacherData>({
    name: '',
    email: '',
    phone: '',
    countryCode: '+61',
    subjects: [],
    qualifications: '',
    bio: '',
    status: 'Active',
    hireDate: '',
    address: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [subjects, setSubjects] = useState<SubjectDocument[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  // Populate form when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        countryCode: initialData.countryCode || '+61',
        subjects: initialData.subjects || [],
        qualifications: initialData.qualifications || '',
        bio: initialData.bio || '',
        status: initialData.status || 'Active',
        hireDate: initialData.hireDate || '',
        address: initialData.address || ''
      });
    } else {
      // Reset form for new teacher
      setFormData({
        name: '',
        email: '',
        phone: '',
        countryCode: '+61',
        subjects: [],
        qualifications: '',
        bio: '',
        status: 'Active',
        hireDate: '',
        address: ''
      });
    }
    setErrors({});
    setTouched({});
  }, [initialData, isOpen]);

  // Fetch subjects when modal opens
  useEffect(() => {
    const fetchSubjects = async () => {
      if (isOpen) {
        try {
          setLoadingSubjects(true);
          const fetchedSubjects = await SubjectFirestoreService.getAllSubjects();
          setSubjects(fetchedSubjects);
        } catch (error) {
          console.error('Error fetching subjects:', error);
          // Fallback to hardcoded subjects if fetch fails
          const now = Timestamp.now();
          setSubjects([
            { id: 'math', subjectId: 'SUB-2024-001', name: 'Mathematics', grade: 'All', description: '', isActive: true, createdAt: now, updatedAt: now },
            { id: 'science', subjectId: 'SUB-2024-002', name: 'Science', grade: 'All', description: '', isActive: true, createdAt: now, updatedAt: now },
            { id: 'english', subjectId: 'SUB-2024-003', name: 'English', grade: 'All', description: '', isActive: true, createdAt: now, updatedAt: now }
          ]);
        } finally {
          setLoadingSubjects(false);
        }
      }
    };

    fetchSubjects();
  }, [isOpen]);
  
  // Simplified validation function
  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'name':
        return value.trim() === '' ? 'Name is required' : '';
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? 'Invalid email format' : '';
      case 'subjects':
        return value.length === 0 ? 'At least one subject is required' : '';
      default:
        return '';
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  // Handle phone input change
  const handlePhoneChange = (phone: string) => {
    setFormData(prev => ({ ...prev, phone }));
    
    // Clear phone error when user starts typing
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  // Handle country code change
  const handleCountryCodeChange = (countryCode: string) => {
    setFormData(prev => ({ ...prev, countryCode }));
  };

  // Handle subject selection/deselection
  const handleSubjectToggle = (subjectName: string) => {
    setFormData(prev => {
      const newSubjects = prev.subjects.includes(subjectName)
        ? prev.subjects.filter(s => s !== subjectName)
        : [...prev.subjects, subjectName];
      
      return { ...prev, subjects: newSubjects };
    });
    
    // Clear subjects error when user selects subjects
    if (errors.subjects) {
      setErrors(prev => ({ ...prev, subjects: '' }));
    }
  };

  // Handle field blur for validation
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };
  // Validate entire form (simplified)
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Only required fields
    newErrors.name = validateField('name', formData.name);
    newErrors.email = validateField('email', formData.email);
    newErrors.subjects = validateField('subjects', formData.subjects);

    // Filter out empty errors
    const filteredErrors = Object.fromEntries(
      Object.entries(newErrors).filter(([_, error]) => error !== '')
    );

    setErrors(filteredErrors);
    return Object.keys(filteredErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
      if (!validateForm()) {
      // Mark required fields as touched to show errors
      const requiredFields = ['name', 'email', 'subject'];
      setTouched(Object.fromEntries(requiredFields.map(field => [field, true])));
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  // Subject options from fetched subjects
  const subjectOptions = subjects.map(subject => ({
    value: subject.name,
    label: `${subject.name} (Grade ${subject.grade})`
  }));

  // Status options
  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'On Leave', label: 'On Leave' },
    { value: 'Inactive', label: 'Inactive' }
  ];  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-8 p-8">
        {/* Personal Information Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-3 mb-6">
            Personal Information
          </h3>          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              onBlur={handleBlur}
              error={touched.name ? errors.name : ''}
              required
              placeholder="Enter teacher's full name"
            />
            
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              onBlur={handleBlur}
              error={touched.email ? errors.email : ''}
              required
              placeholder="teacher@example.com"
            />
          </div>
          
          <PhoneInput
            label="Phone Number"
            value={formData.phone || ''}
            countryCode={formData.countryCode}
            onPhoneChange={handlePhoneChange}
            onCountryCodeChange={handleCountryCodeChange}
            error={touched.phone ? errors.phone : ''}
          />
          
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 ml-1">
              Address <span className="text-gray-400">(Optional)</span>
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              placeholder="Enter teacher's address"
            />
          </div>
        </div>

        {/* Professional Information Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-3 mb-6">
            Professional Information
          </h3>          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Multi-Select Subjects */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 ml-1">
                Subjects <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 min-h-[48px]">
                  {loadingSubjects ? (
                    <div className="text-gray-500">Loading subjects...</div>
                  ) : (
                    <div className="space-y-2">
                      {/* Selected subjects display */}
                      {formData.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {formData.subjects.map((subject) => (
                            <span
                              key={subject}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full"
                            >
                              {subject}
                              <button
                                type="button"
                                onClick={() => handleSubjectToggle(subject)}
                                className="ml-1 text-indigo-600 hover:text-indigo-800"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Subject checkboxes */}
                      <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                        {subjects.map((subject) => (
                          <label
                            key={subject.id}
                            className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={formData.subjects.includes(subject.name)}
                              onChange={() => handleSubjectToggle(subject.name)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">{subject.name}</span>
                          </label>
                        ))}
                      </div>
                      
                      {formData.subjects.length === 0 && (
                        <div className="text-gray-400 text-sm">Select subjects this teacher will teach</div>
                      )}
                    </div>
                  )}
                </div>
                {touched.subjects && errors.subjects && (
                  <p className="mt-1 text-sm text-red-600">{errors.subjects}</p>
                )}
              </div>
            </div>
            
            <Select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              options={statusOptions}
              required
            />
          </div>
          
          <Input
            label="Qualifications"
            name="qualifications"
            value={formData.qualifications}
            onChange={handleInputChange}
            onBlur={handleBlur}
            error={touched.qualifications ? errors.qualifications : ''}
            placeholder="e.g., Bachelor of Education, Master's in Mathematics"
          />

          <Input
            label="Hire Date"
            name="hireDate"
            type="date"
            value={formData.hireDate}
            onChange={handleInputChange}
          />
          
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 ml-1">
              Bio <span className="text-gray-400">(Optional)</span>
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              placeholder="Brief description about the teacher's background, experience, or teaching philosophy"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            disabled={loading}
          >
            {submitButtonText}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default TeacherModal;