import { z } from 'zod';

// Admin schema for validation
export const adminSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Type for admin data
export type AdminData = z.infer<typeof adminSchema>;

// Admin document in Firestore
export interface AdminDocument {
  id: string;
  name: string;
  email: string;
  role: 'admin';
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

// Admin update schema
export const adminUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email format').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

export type AdminUpdateData = z.infer<typeof adminUpdateSchema>;