/**
 * Firebase Functions for Dr U Education Platform
 * All functions are configured for Melbourne timezone
 */

import {onRequest} from "firebase-functions/v2/https";
import {onDocumentWritten} from "firebase-functions/v2/firestore";
import {logger} from "firebase-functions/v2";
import * as admin from "firebase-admin";
import {Timestamp} from "firebase-admin/firestore";

// Set Melbourne timezone for all Firebase Functions
process.env.TZ = 'Australia/Melbourne';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// CORS configuration for API endpoints
const setCorsHeaders = (response: any) => {
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

// Subjects API Functions
export const getSubjects = onRequest({region: 'australia-southeast1'}, async (request, response) => {
  setCorsHeaders(response);
  
  if (request.method === 'OPTIONS') {
    response.status(200).send();
    return;
  }

  try {
    const snapshot = await db.collection('subjects').orderBy('createdAt', 'desc').get();
    const subjects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    response.status(200).json(subjects);
  } catch (error) {
    logger.error('Error fetching subjects:', error);
    response.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

export const createSubject = onRequest({region: 'australia-southeast1'}, async (request, response) => {
  setCorsHeaders(response);
  
  if (request.method === 'OPTIONS') {
    response.status(200).send();
    return;
  }

  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const subjectData = request.body;
    
    // Generate auto-incrementing subject ID
    const currentYear = new Date().getFullYear();
    const yearPrefix = `SUB-${currentYear}-`;
    
    const snapshot = await db.collection('subjects')
      .where('subjectId', '>=', yearPrefix)
      .where('subjectId', '<', `SUB-${currentYear + 1}-`)
      .orderBy('subjectId', 'desc')
      .limit(1)
      .get();

    let nextNumber = 1;
    if (!snapshot.empty) {
      const lastSubject = snapshot.docs[0].data();
      const lastId = lastSubject.subjectId as string;
      const lastNumber = parseInt(lastId.split('-')[2]);
      nextNumber = lastNumber + 1;
    }

    const subjectId = `${yearPrefix}${nextNumber.toString().padStart(3, '0')}`;
    
    const newSubject = {
      ...subjectData,
      subjectId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await db.collection('subjects').add(newSubject);
    
    response.status(201).json({
      id: docRef.id,
      ...newSubject
    });
  } catch (error) {
    logger.error('Error creating subject:', error);
    response.status(500).json({ error: 'Failed to create subject' });
  }
});

// Classes API Functions
export const getClasses = onRequest({region: 'australia-southeast1'}, async (request, response) => {
  setCorsHeaders(response);
  
  if (request.method === 'OPTIONS') {
    response.status(200).send();
    return;
  }

  try {
    const snapshot = await db.collection('classes').orderBy('createdAt', 'desc').get();
    const classes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    response.status(200).json(classes);
  } catch (error) {
    logger.error('Error fetching classes:', error);
    response.status(500).json({ error: 'Failed to fetch classes' });
  }
});

export const createClass = onRequest({region: 'australia-southeast1'}, async (request, response) => {
  setCorsHeaders(response);
  
  if (request.method === 'OPTIONS') {
    response.status(200).send();
    return;
  }

  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const classData = request.body;
    
    // Generate auto-incrementing class ID
    const currentYear = new Date().getFullYear();
    const yearPrefix = `CLS-${currentYear}-`;
    
    const snapshot = await db.collection('classes')
      .where('classId', '>=', yearPrefix)
      .where('classId', '<', `CLS-${currentYear + 1}-`)
      .orderBy('classId', 'desc')
      .limit(1)
      .get();

    let nextNumber = 1;
    if (!snapshot.empty) {
      const lastClass = snapshot.docs[0].data();
      const lastId = lastClass.classId as string;
      const lastNumber = parseInt(lastId.split('-')[2]);
      nextNumber = lastNumber + 1;
    }

    const classId = `${yearPrefix}${nextNumber.toString().padStart(3, '0')}`;
    
    const newClass = {
      ...classData,
      classId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await db.collection('classes').add(newClass);
    
    response.status(201).json({
      id: docRef.id,
      ...newClass
    });
  } catch (error) {
    logger.error('Error creating class:', error);
    response.status(500).json({ error: 'Failed to create class' });
  }
});

// Teachers API Functions
export const getTeachers = onRequest({region: 'australia-southeast1'}, async (request, response) => {
  setCorsHeaders(response);
  
  if (request.method === 'OPTIONS') {
    response.status(200).send();
    return;
  }

  try {
    const snapshot = await db.collection('teachers').orderBy('createdAt', 'desc').get();
    const teachers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    response.status(200).json(teachers);
  } catch (error) {
    logger.error('Error fetching teachers:', error);
    response.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

export const createTeacher = onRequest({region: 'australia-southeast1'}, async (request, response) => {
  setCorsHeaders(response);
  
  if (request.method === 'OPTIONS') {
    response.status(200).send();
    return;
  }

  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const teacherData = request.body;
    
    // Generate auto-incrementing teacher ID
    const currentYear = new Date().getFullYear();
    const yearPrefix = `TCH-${currentYear}-`;
    
    const snapshot = await db.collection('teachers')
      .where('teacherId', '>=', yearPrefix)
      .where('teacherId', '<', `TCH-${currentYear + 1}-`)
      .orderBy('teacherId', 'desc')
      .limit(1)
      .get();

    let nextNumber = 1;
    if (!snapshot.empty) {
      const lastTeacher = snapshot.docs[0].data();
      const lastId = lastTeacher.teacherId as string;
      const lastNumber = parseInt(lastId.split('-')[2]);
      nextNumber = lastNumber + 1;
    }

    const teacherId = `${yearPrefix}${nextNumber.toString().padStart(3, '0')}`;
    
    const newTeacher = {
      ...teacherData,
      teacherId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await db.collection('teachers').add(newTeacher);
    
    response.status(201).json({
      id: docRef.id,
      ...newTeacher
    });
  } catch (error) {
    logger.error('Error creating teacher:', error);
    response.status(500).json({ error: 'Failed to create teacher' });
  }
});

// Students API Functions
export const getStudents = onRequest({region: 'australia-southeast1'}, async (request, response) => {
  setCorsHeaders(response);
  
  if (request.method === 'OPTIONS') {
    response.status(200).send();
    return;
  }

  try {
    const snapshot = await db.collection('students').orderBy('createdAt', 'desc').get();
    const students = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    response.status(200).json(students);
  } catch (error) {
    logger.error('Error fetching students:', error);
    response.status(500).json({ error: 'Failed to fetch students' });
  }
});

export const createStudent = onRequest({region: 'australia-southeast1'}, async (request, response) => {
  setCorsHeaders(response);
  
  if (request.method === 'OPTIONS') {
    response.status(200).send();
    return;
  }

  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const studentData = request.body;
    
    // Generate auto-incrementing student ID
    const currentYear = new Date().getFullYear();
    const yearPrefix = `STU-${currentYear}-`;
    
    const snapshot = await db.collection('students')
      .where('studentId', '>=', yearPrefix)
      .where('studentId', '<', `STU-${currentYear + 1}-`)
      .orderBy('studentId', 'desc')
      .limit(1)
      .get();

    let nextNumber = 1;
    if (!snapshot.empty) {
      const lastStudent = snapshot.docs[0].data();
      const lastId = lastStudent.studentId as string;
      const lastNumber = parseInt(lastId.split('-')[2]);
      nextNumber = lastNumber + 1;
    }

    const studentId = `${yearPrefix}${nextNumber.toString().padStart(3, '0')}`;
    
    const newStudent = {
      ...studentData,
      studentId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await db.collection('students').add(newStudent);
    
    response.status(201).json({
      id: docRef.id,
      ...newStudent
    });
  } catch (error) {
    logger.error('Error creating student:', error);
    response.status(500).json({ error: 'Failed to create student' });
  }
});

// Question Banks API Functions
export const getQuestionBanks = onRequest({region: 'australia-southeast1'}, async (request, response) => {
  setCorsHeaders(response);
  
  if (request.method === 'OPTIONS') {
    response.status(200).send();
    return;
  }

  try {
    const snapshot = await db.collection('questionBanks').orderBy('createdAt', 'desc').get();
    const questionBanks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    response.status(200).json(questionBanks);
  } catch (error) {
    logger.error('Error fetching question banks:', error);
    response.status(500).json({ error: 'Failed to fetch question banks' });
  }
});

export const createQuestionBank = onRequest({region: 'australia-southeast1'}, async (request, response) => {
  setCorsHeaders(response);
  
  if (request.method === 'OPTIONS') {
    response.status(200).send();
    return;
  }

  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const questionBankData = request.body;
    
    const newQuestionBank = {
      ...questionBankData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await db.collection('questionBanks').add(newQuestionBank);
    
    response.status(201).json({
      id: docRef.id,
      ...newQuestionBank
    });
  } catch (error) {
    logger.error('Error creating question bank:', error);
    response.status(500).json({ error: 'Failed to create question bank' });
  }
});

// Health check endpoint
export const healthCheck = onRequest({region: 'australia-southeast1'}, async (request, response) => {
  setCorsHeaders(response);
  
  if (request.method === 'OPTIONS') {
    response.status(200).send();
    return;
  }

  const melbourneTime = new Date().toLocaleString('en-AU', { 
    timeZone: 'Australia/Melbourne' 
  });
  
  response.status(200).json({
    status: 'healthy',
    timestamp: melbourneTime,
    timezone: 'Australia/Melbourne',
    message: 'Dr U Education API is running!'
  });
});

// Firestore triggers for cache invalidation
export const onSubjectWrite = onDocumentWritten('subjects/{documentId}', (event) => {
  logger.info('Subject document written, cache should be invalidated');
});

export const onClassWrite = onDocumentWritten('classes/{documentId}', (event) => {
  logger.info('Class document written, cache should be invalidated');
});

export const onTeacherWrite = onDocumentWritten('teachers/{documentId}', (event) => {
  logger.info('Teacher document written, cache should be invalidated');
});

export const onStudentWrite = onDocumentWritten('students/{documentId}', (event) => {
  logger.info('Student document written, cache should be invalidated');
});
