import { NextRequest, NextResponse } from 'next/server';
import firebaseAdmin from '@/utils/firebase-server';
import { MeetingBooking } from '@/models/meetingSchema';

export async function POST(request: NextRequest) {
  try {
    const booking: Omit<MeetingBooking, 'id' | 'createdAt' | 'updatedAt'> = await request.json();

    // Validate required fields
    if (!booking.slotId || !booking.teacherId || !booking.studentId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the booking document
    const bookingId = await firebaseAdmin.firestore.addDoc('meetingBookings', {
      ...booking,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Get teacher information
    const teacher = await firebaseAdmin.firestore.getDoc('teachers', booking.teacherId);

    // Get student information
    const student = await firebaseAdmin.firestore.getDoc('students', booking.studentId);

    if (!teacher || !student) {
      return NextResponse.json(
        { error: 'Teacher or student not found' },
        { status: 404 }
      );
    }

    // Create email documents for both teacher and parent
    const emailPromises = [];

    // Teacher email
    const teacherEmailData = {
      to: teacher.email,
      message: {
        subject: `Meeting Scheduled - ${student.name} on ${new Date(booking.date).toLocaleDateString()}`,
        html: generateTeacherMeetingEmail(
          teacher.name,
          student.name,
          student.parent.name,
          booking.date,
          booking.startTime,
          booking.endTime,
          booking.meetingLink,
          booking.subject
        )
      },
      processed: false,
      createdAt: new Date()
    };

    // Parent email
    const parentEmailData = {
      to: student.parent.email,
      message: {
        subject: `Meeting Confirmed - ${teacher.name} and ${student.name} on ${new Date(booking.date).toLocaleDateString()}`,
        html: generateParentMeetingEmail(
          student.name,
          student.parent.name,
          teacher.name,
          booking.date,
          booking.startTime,
          booking.endTime,
          booking.meetingLink,
          booking.subject
        )
      },
      processed: false,
      createdAt: new Date()
    };

    // Create both email documents
    emailPromises.push(
      firebaseAdmin.firestore.addDoc('mail', teacherEmailData),
      firebaseAdmin.firestore.addDoc('mail', parentEmailData)
    );

    // Update the time slot as booked
    emailPromises.push(
      firebaseAdmin.firestore.updateDoc('timeSlots', booking.slotId, {
        isBooked: true,
        studentId: booking.studentId,
        studentName: booking.studentName,
        status: 'booked',
        updatedAt: new Date(),
      })
    );

    await Promise.all(emailPromises);

    console.log('Meeting booking created with emails:', {
      bookingId,
      teacherEmail: teacher.email,
      parentEmail: student.parent.email,
      meetingDate: booking.date,
      meetingTime: `${booking.startTime} - ${booking.endTime}`
    });

    return NextResponse.json({ 
      success: true, 
      bookingId,
      message: 'Meeting booked successfully and confirmation emails sent'
    });

  } catch (error) {
    console.error('Error creating meeting booking:', error);
    return NextResponse.json(
      { error: 'Failed to create meeting booking' },
      { status: 500 }
    );
  }
}

function generateTeacherMeetingEmail(
  teacherName: string,
  studentName: string,
  parentName: string,
  date: string,
  startTime: string,
  endTime: string,
  meetingLink: string,
  subject: string = 'General'
): string {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #4F46E5; text-align: center;">Meeting Confirmation - Dr U Education</h2>
      
      <p>Dear ${teacherName},</p>
      
      <p>A new meeting has been scheduled with one of your students. Here are the details:</p>
      
      <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #374151; margin-top: 0;">Meeting Details:</h3>
        <p><strong>Student:</strong> ${studentName}</p>
        <p><strong>Parent/Guardian:</strong> ${parentName}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${formatTime(startTime)} - ${formatTime(endTime)}</p>
      </div>
      
      <div style="background-color: #EBF8FF; border-left: 4px solid #3B82F6; padding: 15px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Meeting Link:</strong></p>
        <a href="${meetingLink}" style="color: #3B82F6; text-decoration: none; font-weight: bold;">${meetingLink}</a>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${meetingLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Join Meeting
        </a>
      </div>
      
      <p><strong>Important Notes:</strong></p>
      <ul>
        <li>Please join the meeting a few minutes early to test your audio and video</li>
        <li>If you encounter any technical issues, please contact our support team</li>
        <li>This meeting is free of charge as part of our educational support services</li>
      </ul>
      
      <p>If you need to reschedule or cancel this meeting, please contact us as soon as possible.</p>
      
      <p>Thank you for your dedication to our students' education!</p>
      
      <p>Best regards,<br>
      The Dr U Education Team</p>
      
      <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
      <p style="font-size: 12px; color: #6B7280; text-align: center;">
        This is an automated message. For support, please contact our administration team.
      </p>
    </div>
  `.trim();
}

function generateParentMeetingEmail(
  studentName: string,
  parentName: string,
  teacherName: string,
  date: string,
  startTime: string,
  endTime: string,
  meetingLink: string,
  subject: string = 'General'
): string {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #4F46E5; text-align: center;">Meeting Confirmation - Dr U Education</h2>
      
      <p>Dear ${parentName},</p>
      
      <p>Thank you for booking a meeting session for ${studentName}. We're excited to provide personalized educational support!</p>
      
      <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #374151; margin-top: 0;">Meeting Details:</h3>
        <p><strong>Student:</strong> ${studentName}</p>
        <p><strong>Teacher:</strong> ${teacherName}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${formatTime(startTime)} - ${formatTime(endTime)}</p>
      </div>
      
      <div style="background-color: #F0FDF4; border-left: 4px solid #22C55E; padding: 15px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Great News:</strong> This meeting is completely free of charge as part of our commitment to supporting your child's education!</p>
      </div>
      
      <div style="background-color: #EBF8FF; border-left: 4px solid #3B82F6; padding: 15px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Meeting Link:</strong></p>
        <a href="${meetingLink}" style="color: #3B82F6; text-decoration: none; font-weight: bold;">${meetingLink}</a>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${meetingLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Join Meeting
        </a>
      </div>
      
      <p><strong>Before the Meeting:</strong></p>
      <ul>
        <li>Ensure ${studentName} has a quiet space for the session</li>
        <li>Test your internet connection and device camera/microphone</li>
        <li>Join the meeting 5 minutes early to resolve any technical issues</li>
        <li>Have any specific questions or topics ready to discuss</li>
      </ul>
      
      <p><strong>What to Expect:</strong></p>
      <ul>
        <li>Personalized attention from our qualified teacher</li>
        <li>Interactive learning session tailored to ${studentName}'s needs</li>
        <li>Opportunity to ask questions and clarify doubts</li>
        <li>Educational guidance and study tips</li>
      </ul>
      
      <p>If you need to reschedule or have any questions, please don't hesitate to contact us.</p>
      
      <p>We look forward to supporting ${studentName}'s educational journey!</p>
      
      <p>Best regards,<br>
      The Dr U Education Team</p>
      
      <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
      <p style="font-size: 12px; color: #6B7280; text-align: center;">
        This is an automated message. For support, please contact our administration team.
      </p>
    </div>
  `.trim();
}
