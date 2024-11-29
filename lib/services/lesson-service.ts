import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  Timestamp,
  serverTimestamp,
  setDoc,
  where,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Lesson } from '@/types/lesson';
import slugify from 'slugify';

const LESSONS_COLLECTION = 'lessons';

export const PRACTICE_MODES = {
  hangman: {
    name: 'Hangman',
    description: 'Guess the word one letter at a time',
    icon: 'game-controller',
  },
} as const

export const lessonService = {
  createSlug(title: string): string {
    return slugify(title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
  },

  async createLesson(lessonData: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const docRef = doc(collection(db, 'lessons'));
      const now = serverTimestamp();
      const slug = this.createSlug(lessonData.title);
      
      await setDoc(docRef, {
        ...lessonData,
        id: docRef.id,
        slug,
        createdAt: now,
        updatedAt: now
      });

      return {
        ...lessonData,
        id: docRef.id,
        slug,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error creating lesson:', error);
      throw error;
    }
  },

  async getLessonBySlug(slug: string): Promise<Lesson | null> {
    try {
      const q = query(
        collection(db, LESSONS_COLLECTION),
        where('slug', '==', slug),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Lesson;
    } catch (error) {
      console.error('Error getting lesson by slug:', error);
      throw error;
    }
  },

  async updateLesson(id: string, lesson: Partial<Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>>) {
    try {
      const docRef = doc(db, LESSONS_COLLECTION, id);
      const updates = {
        ...lesson,
        updatedAt: serverTimestamp(),
      };
      
      if (lesson.title) {
        updates.slug = this.createSlug(lesson.title);
      }
      
      await updateDoc(docRef, updates);
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
      const querySnapshot = await getDocs(collection(db, 'lessons'));
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          // Convert Firestore Timestamps to JavaScript Dates
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Lesson;
      });
    } catch (error) {
      console.error('Error getting lessons:', error);
      throw error;
    }
  },
}; 