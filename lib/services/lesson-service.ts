import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Lesson } from '@/types/lesson';

const LESSONS_COLLECTION = 'lessons';

export const lessonService = {
  async createLesson(lesson: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const docRef = await addDoc(collection(db, LESSONS_COLLECTION), {
        ...lesson,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating lesson:', error);
      throw error;
    }
  },

  async updateLesson(id: string, lesson: Partial<Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>>) {
    try {
      const docRef = doc(db, LESSONS_COLLECTION, id);
      await updateDoc(docRef, {
        ...lesson,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating lesson:', error);
      throw error;
    }
  },

  async deleteLesson(id: string) {
    try {
      const docRef = doc(db, LESSONS_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting lesson:', error);
      throw error;
    }
  },

  async getLesson(id: string): Promise<Lesson | null> {
    try {
      const docRef = doc(db, LESSONS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: (data.createdAt as Timestamp).toDate(),
        updatedAt: (data.updatedAt as Timestamp).toDate(),
      } as Lesson;
    } catch (error) {
      console.error('Error getting lesson:', error);
      throw error;
    }
  },

  async getAllLessons(): Promise<Lesson[]> {
    try {
      const q = query(
        collection(db, LESSONS_COLLECTION),
        orderBy('order', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp).toDate(),
        updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
      })) as Lesson[];
    } catch (error) {
      console.error('Error getting lessons:', error);
      throw error;
    }
  },
}; 