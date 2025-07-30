import { ClassFirestoreService } from '@/apiservices/classFirestoreService';

/**
 * Utility functions for teacher class management
 * These replace the deprecated classesAssigned field with dynamic queries
 */

/**
 * Get the actual number of classes assigned to a teacher
 * This replaces the deprecated classesAssigned field
 */
export async function getTeacherClassCount(teacherId: string): Promise<number> {
  try {
    const classes = await ClassFirestoreService.getClassesByTeacher(teacherId);
    return classes.length;
  } catch (error) {
    console.error(`Error getting class count for teacher ${teacherId}:`, error);
    return 0;
  }
}

/**
 * Get class counts for multiple teachers efficiently
 * Returns a map of teacherId -> class count
 */
export async function getMultipleTeacherClassCounts(teacherIds: string[]): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  
  // Process teachers in parallel for better performance
  const promises = teacherIds.map(async (teacherId) => {
    const count = await getTeacherClassCount(teacherId);
    counts[teacherId] = count;
  });
  
  await Promise.all(promises);
  
  return counts;
}

/**
 * Check if a teacher has any classes assigned
 */
export async function hasAssignedClasses(teacherId: string): Promise<boolean> {
  const count = await getTeacherClassCount(teacherId);
  return count > 0;
}
