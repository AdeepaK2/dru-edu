import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { firestore as db } from '@/utils/firebase-client';
import { 
  StudyMaterialDocument, 
  StudyMaterialData, 
  StudyMaterialUpdateData,
  StudyMaterialDisplayData,
  formatFileSize,
  formatDuration,
  getRelativeTime
} from '@/models/studyMaterialSchema';

// Collection name
const COLLECTION_NAME = 'studyMaterials';

// Get collection reference
const getStudyMaterialsCollection = () => collection(db, COLLECTION_NAME);

// Convert Firestore document to StudyMaterialDocument
const convertDocumentToStudyMaterial = (doc: any): StudyMaterialDocument => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    uploadedAt: data.uploadedAt?.toDate() || new Date(),
    dueDate: data.dueDate?.toDate() || null,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
};

// Convert StudyMaterialData to Firestore document
const convertStudyMaterialToDocument = (material: StudyMaterialData) => {
  return {
    ...material,
    uploadedAt: material.uploadedAt ? Timestamp.fromDate(material.uploadedAt) : Timestamp.now(),
    dueDate: material.dueDate ? Timestamp.fromDate(material.dueDate) : null,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
};

// Create a new study material
export const createStudyMaterial = async (materialData: StudyMaterialData): Promise<StudyMaterialDocument> => {
  try {
    const docData = convertStudyMaterialToDocument(materialData);
    const docRef = await addDoc(getStudyMaterialsCollection(), docData);
    
    const createdDoc = await getDoc(docRef);
    if (!createdDoc.exists()) {
      throw new Error('Failed to create study material');
    }

    return convertDocumentToStudyMaterial(createdDoc);
  } catch (error) {
    console.error('Error creating study material:', error);
    throw error;
  }
};

// Get study material by ID
export const getStudyMaterialById = async (id: string): Promise<StudyMaterialDocument | null> => {
  try {
    const docRef = doc(getStudyMaterialsCollection(), id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    return convertDocumentToStudyMaterial(docSnap);
  } catch (error) {
    console.error('Error getting study material:', error);
    throw error;
  }
};

// Get all study materials for a class
export const getStudyMaterialsByClass = async (classId: string): Promise<StudyMaterialDocument[]> => {
  try {
    const q = query(
      getStudyMaterialsCollection(),
      where('classId', '==', classId),
      where('isVisible', '==', true),
      orderBy('week', 'asc'),
      orderBy('order', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(convertDocumentToStudyMaterial);
  } catch (error) {
    console.error('Error getting study materials by class:', error);
    throw error;
  }
};

// Get study materials by class and week
export const getStudyMaterialsByWeek = async (classId: string, week: number, year: number): Promise<StudyMaterialDocument[]> => {
  try {
    const q = query(
      getStudyMaterialsCollection(),
      where('classId', '==', classId),
      where('week', '==', week),
      where('year', '==', year),
      where('isVisible', '==', true),
      orderBy('order', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(convertDocumentToStudyMaterial);
  } catch (error) {
    console.error('Error getting study materials by week:', error);
    throw error;
  }
};

// Get study materials by lesson
export const getStudyMaterialsByLesson = async (lessonId: string): Promise<StudyMaterialDocument[]> => {
  try {
    const q = query(
      getStudyMaterialsCollection(),
      where('lessonId', '==', lessonId),
      where('isVisible', '==', true),
      orderBy('order', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(convertDocumentToStudyMaterial);
  } catch (error) {
    console.error('Error getting study materials by lesson:', error);
    throw error;
  }
};

// Update study material
export const updateStudyMaterial = async (
  id: string, 
  updateData: StudyMaterialUpdateData
): Promise<StudyMaterialDocument> => {
  try {
    const docRef = doc(getStudyMaterialsCollection(), id);
    
    const updateFields = {
      ...updateData,
      updatedAt: Timestamp.now(),
      ...(updateData.dueDate && { dueDate: Timestamp.fromDate(updateData.dueDate) }),
    };

    await updateDoc(docRef, updateFields);
    
    const updatedDocSnapshot = await getDoc(docRef);
    if (!updatedDocSnapshot.exists()) {
      throw new Error('Study material not found');
    }

    return convertDocumentToStudyMaterial(updatedDocSnapshot);
  } catch (error) {
    console.error('Error updating study material:', error);
    throw error;
  }
};

// Delete study material
export const deleteStudyMaterial = async (id: string): Promise<void> => {
  try {
    const docRef = doc(getStudyMaterialsCollection(), id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting study material:', error);
    throw error;
  }
};

// Mark material as completed by student
export const markMaterialCompleted = async (materialId: string, studentId: string): Promise<void> => {
  try {
    const docRef = doc(getStudyMaterialsCollection(), materialId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Study material not found');
    }

    const currentData = docSnap.data();
    const completedBy = currentData.completedBy || [];
    
    if (!completedBy.includes(studentId)) {
      completedBy.push(studentId);
      await updateDoc(docRef, { 
        completedBy,
        updatedAt: Timestamp.now()
      });
    }
  } catch (error) {
    console.error('Error marking material as completed:', error);
    throw error;
  }
};

// Unmark material as completed by student
export const unmarkMaterialCompleted = async (materialId: string, studentId: string): Promise<void> => {
  try {
    const docRef = doc(getStudyMaterialsCollection(), materialId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Study material not found');
    }

    const currentData = docSnap.data();
    const completedBy = currentData.completedBy || [];
    
    const updatedCompletedBy = completedBy.filter((id: string) => id !== studentId);
    await updateDoc(docRef, { 
      completedBy: updatedCompletedBy,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error unmarking material as completed:', error);
    throw error;
  }
};

// Increment download count
export const incrementDownloadCount = async (materialId: string): Promise<void> => {
  try {
    const docRef = doc(getStudyMaterialsCollection(), materialId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Study material not found');
    }

    const currentData = docSnap.data();
    const newCount = (currentData.downloadCount || 0) + 1;
    
    await updateDoc(docRef, { 
      downloadCount: newCount,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error incrementing download count:', error);
    throw error;
  }
};

// Increment view count
export const incrementViewCount = async (materialId: string): Promise<void> => {
  try {
    const docRef = doc(getStudyMaterialsCollection(), materialId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Study material not found');
    }

    const currentData = docSnap.data();
    const newCount = (currentData.viewCount || 0) + 1;
    
    await updateDoc(docRef, { 
      viewCount: newCount,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    throw error;
  }
};

// Get study materials grouped by weeks for a class
export const getStudyMaterialsByClassGroupedByWeek = async (classId: string, year: number) => {
  try {
    const q = query(
      getStudyMaterialsCollection(),
      where('classId', '==', classId),
      where('year', '==', year),
      where('isVisible', '==', true),
      orderBy('week', 'asc'),
      orderBy('order', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const materials = querySnapshot.docs.map(convertDocumentToStudyMaterial);

    // Group materials by week
    const weekGroups: { [key: number]: StudyMaterialDocument[] } = {};
    
    materials.forEach(material => {
      if (!weekGroups[material.week]) {
        weekGroups[material.week] = [];
      }
      weekGroups[material.week].push(material);
    });

    // Convert to array with week information
    return Object.entries(weekGroups).map(([week, weekMaterials]) => ({
      week: parseInt(week),
      weekTitle: weekMaterials[0]?.weekTitle || `Week ${week}`,
      materials: weekMaterials,
      stats: {
        totalMaterials: weekMaterials.length,
        requiredMaterials: weekMaterials.filter(m => m.isRequired).length,
        averageCompletion: weekMaterials.length > 0 
          ? Math.round((weekMaterials.reduce((sum, m) => sum + m.completedBy.length, 0) / weekMaterials.length))
          : 0
      }
    }));
  } catch (error) {
    console.error('Error getting study materials grouped by week:', error);
    throw error;
  }
};

// Convert to display data with additional formatting
export const convertToDisplayData = (
  material: StudyMaterialDocument,
  lessonName?: string,
  uploaderName?: string,
  studentId?: string
): StudyMaterialDisplayData => {
  return {
    ...material,
    lessonName,
    uploaderName,
    isCompleted: studentId ? material.completedBy.includes(studentId) : undefined,
    completionPercentage: material.completedBy.length,
    formattedFileSize: formatFileSize(material.fileSize),
    formattedDuration: formatDuration(material.duration),
    relativeUploadTime: getRelativeTime(material.uploadedAt instanceof Date ? material.uploadedAt : material.uploadedAt.toDate()),
  };
};
