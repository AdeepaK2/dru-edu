'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/form/Input';
import Select from '@/components/ui/form/Select';
import Textarea from '@/components/ui/form/TextArea';
import Modal from '@/components/ui/Modal';
import { CalendarDays, Clock, MapPin, DollarSign, Users, BookOpen, CheckCircle } from 'lucide-react';
import { ClassDocument } from '@/models/classSchema';
import { EnrollmentRequestData, enrollmentRequestSchema } from '@/models/enrollmentRequestSchema';
import { firestore } from '@/utils/firebase-client';
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';

interface EnrollmentFormData {
  // Student Information
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  dateOfBirth: string;
  year: string;
  school: string;
  
  // Parent Information
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  relationship: 'Mother' | 'Father' | 'Guardian' | 'Other';
  
  // Enrollment Details
  preferredStartDate: string;
  additionalNotes: string;
  agreedToTerms: boolean;
}

const YEAR_LEVELS = [
  'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12'
];

const RELATIONSHIP_OPTIONS = [
  { value: 'Mother', label: 'Mother' },
  { value: 'Father', label: 'Father' },
  { value: 'Guardian', label: 'Guardian' },
  { value: 'Other', label: 'Other' },
];

export default function EnrollmentPage() {
  const [classes, setClasses] = useState<ClassDocument[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassDocument | null>(null);
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<EnrollmentFormData>({
    studentName: '',
    studentEmail: '',
    studentPhone: '',
    dateOfBirth: '',
    year: '',
    school: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    relationship: 'Mother',
    preferredStartDate: '',
    additionalNotes: '',
    agreedToTerms: false,
  });

  // Fetch available classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const classesQuery = query(collection(firestore, 'classes'));
        const querySnapshot = await getDocs(classesQuery);
        const classesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ClassDocument[];
        
        // Filter only active classes
        const activeClasses = classesData.filter((cls: ClassDocument) => cls.status === 'Active');
        setClasses(activeClasses);
      } catch (error) {
        console.error('Error fetching classes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  const handleClassSelect = (classDoc: ClassDocument) => {
    setSelectedClass(classDoc);
    setShowEnrollmentForm(true);
  };

  const handleInputChange = (field: keyof EnrollmentFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.studentName.trim()) errors.push('Student name is required');
    if (!formData.studentEmail.trim()) errors.push('Student email is required');
    if (!formData.studentPhone.trim()) errors.push('Student phone is required');
    if (!formData.dateOfBirth) errors.push('Date of birth is required');
    if (!formData.year) errors.push('Year level is required');
    if (!formData.school.trim()) errors.push('School name is required');
    
    if (!formData.parentName.trim()) errors.push('Parent name is required');
    if (!formData.parentEmail.trim()) errors.push('Parent email is required');
    if (!formData.parentPhone.trim()) errors.push('Parent phone is required');
    
    if (!formData.preferredStartDate) errors.push('Preferred start date is required');
    if (!formData.agreedToTerms) errors.push('You must agree to terms and conditions');
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.studentEmail && !emailRegex.test(formData.studentEmail)) {
      errors.push('Student email format is invalid');
    }
    if (formData.parentEmail && !emailRegex.test(formData.parentEmail)) {
      errors.push('Parent email format is invalid');
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      alert('Please fix the following errors:\n' + errors.join('\n'));
      return;
    }
    
    if (!selectedClass) return;
    
    setSubmitting(true);
    
    try {
      const enrollmentData: EnrollmentRequestData = {
        student: {
          name: formData.studentName,
          email: formData.studentEmail,
          phone: formData.studentPhone,
          dateOfBirth: formData.dateOfBirth,
          year: formData.year,
          school: formData.school,
        },
        parent: {
          name: formData.parentName,
          email: formData.parentEmail,
          phone: formData.parentPhone,
          relationship: formData.relationship,
        },
        classId: selectedClass.id,
        className: selectedClass.name,
        subject: selectedClass.subject,
        centerName: `Center ${selectedClass.centerId}`,
        monthlyFee: selectedClass.monthlyFee,
        preferredStartDate: formData.preferredStartDate,
        additionalNotes: formData.additionalNotes,
        agreedToTerms: formData.agreedToTerms,
      };
      
      // Validate data with Zod schema
      const validatedData = enrollmentRequestSchema.parse(enrollmentData);
      
      // Create enrollment request document
      const enrollmentRequestDoc = {
        ...validatedData,
        status: 'Pending' as const,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      // Add to Firestore
      await addDoc(collection(firestore, 'enrollmentRequests'), enrollmentRequestDoc);
      
      setSuccess(true);
      setShowEnrollmentForm(false);
      // Reset form
      setFormData({
        studentName: '',
        studentEmail: '',
        studentPhone: '',
        dateOfBirth: '',
        year: '',
        school: '',
        parentName: '',
        parentEmail: '',
        parentPhone: '',
        relationship: 'Mother',
        preferredStartDate: '',
        additionalNotes: '',
        agreedToTerms: false,
      });
    } catch (error) {
      console.error('Error submitting enrollment:', error);
      if (error instanceof Error) {
        alert('Failed to submit enrollment request: ' + error.message);
      } else {
        alert('Failed to submit enrollment request. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatSchedule = (schedule: any[]) => {
    return schedule.map(slot => `${slot.day}: ${slot.startTime} - ${slot.endTime}`).join(', ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-[#0088e0] border-solid rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading available classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#01143d] to-[#0088e0] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Enroll in Our Classes</h1>
          <p className="text-xl text-blue-100">
            Choose from our available VCE subjects and start your journey to academic excellence
          </p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Enrollment Request Submitted Successfully!
            </h3>
            <p className="text-green-600">
              We'll review your application and contact you within 2-3 business days.
              Check your email for confirmation details.
            </p>
          </div>
        </div>
      )}

      {/* Available Classes */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Available Classes</h2>
          <p className="text-lg text-gray-600">
            Select a class to begin your enrollment process
          </p>
        </div>

        {classes.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Classes Available</h3>
            <p className="text-gray-500">
              There are currently no active classes available for enrollment.
              Please check back later or contact us directly.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classDoc) => (
              <Card key={classDoc.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="text-xl text-[#01143d]">{classDoc.name}</CardTitle>
                  <p className="text-lg font-semibold text-[#0088e0]">{classDoc.subject}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>Center {classDoc.centerId}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <BookOpen className="w-4 h-4 mr-2" />
                    <span>{classDoc.year}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="text-sm">{formatSchedule(classDoc.schedule)}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{classDoc.enrolledStudents} students enrolled</span>
                  </div>
                  
                  <div className="flex items-center text-green-600 font-semibold">
                    <DollarSign className="w-4 h-4 mr-2" />
                    <span>${classDoc.monthlyFee}/month</span>
                  </div>
                  
                  {classDoc.description && (
                    <p className="text-gray-600 text-sm">{classDoc.description}</p>
                  )}
                  
                  <Button
                    onClick={() => handleClassSelect(classDoc)}
                    className="w-full bg-[#0088e0] hover:bg-[#0066b3] text-white"
                  >
                    Enroll Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Enrollment Form Modal */}
      {showEnrollmentForm && selectedClass && (
        <Modal
          title={`Enroll in ${selectedClass.name}`}
          isOpen={showEnrollmentForm}
          onClose={() => setShowEnrollmentForm(false)}
          className="max-w-4xl"
        >
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Enroll in {selectedClass.name}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Student Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Student Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Student Name"
                    value={formData.studentName}
                    onChange={(e) => handleInputChange('studentName', e.target.value)}
                    required
                  />
                  <Input
                    label="Student Email"
                    type="email"
                    value={formData.studentEmail}
                    onChange={(e) => handleInputChange('studentEmail', e.target.value)}
                    required
                  />
                  <Input
                    label="Student Phone"
                    value={formData.studentPhone}
                    onChange={(e) => handleInputChange('studentPhone', e.target.value)}
                    required
                  />
                  <Input
                    label="Date of Birth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    required
                  />
                  <Select
                    label="Year Level"
                    value={formData.year}
                    onChange={(e) => handleInputChange('year', e.target.value)}
                    options={YEAR_LEVELS.map(year => ({ value: year, label: year }))}
                    required
                  />
                  <Input
                    label="School"
                    value={formData.school}
                    onChange={(e) => handleInputChange('school', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Parent Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Parent/Guardian Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Parent/Guardian Name"
                    value={formData.parentName}
                    onChange={(e) => handleInputChange('parentName', e.target.value)}
                    required
                  />
                  <Input
                    label="Parent/Guardian Email"
                    type="email"
                    value={formData.parentEmail}
                    onChange={(e) => handleInputChange('parentEmail', e.target.value)}
                    required
                  />
                  <Input
                    label="Parent/Guardian Phone"
                    value={formData.parentPhone}
                    onChange={(e) => handleInputChange('parentPhone', e.target.value)}
                    required
                  />
                  <Select
                    label="Relationship"
                    value={formData.relationship}
                    onChange={(e) => handleInputChange('relationship', e.target.value as any)}
                    options={RELATIONSHIP_OPTIONS}
                    required
                  />
                </div>
              </div>

              {/* Enrollment Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Enrollment Details</h3>
                <div className="space-y-4">
                  <Input
                    label="Preferred Start Date"
                    type="date"
                    value={formData.preferredStartDate}
                    onChange={(e) => handleInputChange('preferredStartDate', e.target.value)}
                    required
                  />
                  <Textarea
                    label="Additional Notes (Optional)"
                    value={formData.additionalNotes}
                    onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                    placeholder="Any additional information or special requirements..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={formData.agreedToTerms}
                    onChange={(e) => handleInputChange('agreedToTerms', e.target.checked)}
                    className="mt-1"
                    required
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600">
                    I agree to the terms and conditions, privacy policy, and enrollment policies of Dr. U Education.
                    I understand that enrollment is subject to approval and available spaces.
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEnrollmentForm(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#0088e0] hover:bg-[#0066b3] text-white"
                >
                  {submitting ? 'Submitting...' : 'Submit Enrollment Request'}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
