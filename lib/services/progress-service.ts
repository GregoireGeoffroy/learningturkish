import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
  Timestamp,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { VocabularyProgress, UserProgress, LessonProgress } from '@/types/progress';
import { auth } from '../firebase/config';

const VOCAB_PROGRESS_COLLECTION = 'vocabularyProgress';
const USER_PROGRESS_COLLECTION = 'userProgress';

// Spaced repetition intervals in days
const SRS_INTERVALS = [1, 3, 7, 14, 30, 90];

// Default daily goal
const DEFAULT_DAILY_GOAL = 20;

interface PracticeHistoryEntry {
  date: Timestamp;
  wordsStudied: number;
  correctAnswers: number;
  timeSpent: number;
}

interface FirestoreUserProgress {
  userId: string;
  dailyGoal: number;
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: Timestamp;
  practiceHistory: PracticeHistoryEntry[];
}

export const progressService = {
  async getVocabularyProgress(userId: string, lessonId: string) {
    try {
      const q = query(
        collection(db, VOCAB_PROGRESS_COLLECTION),
        where('userId', '==', userId),
        where('lessonId', '==', lessonId)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastPracticed: (doc.data().lastPracticed as Timestamp).toDate(),
        nextReviewDate: (doc.data().nextReviewDate as Timestamp).toDate(),
      })) as VocabularyProgress[];
    } catch (error) {
      console.error('Error getting vocabulary progress:', error);
      throw error;
    }
  },

  async updateVocabularyProgress(
    userId: string,
    lessonId: string,
    vocabularyId: string,
    isCorrect: boolean,
    timeSpent: number
  ) {
    try {
      const progressId = `${userId}_${lessonId}_${vocabularyId}`;
      const docRef = doc(db, VOCAB_PROGRESS_COLLECTION, progressId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const currentLevel = data.level;
        const newLevel = isCorrect 
          ? Math.min(currentLevel + 1, SRS_INTERVALS.length - 1)
          : Math.max(currentLevel - 1, 0);

        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + SRS_INTERVALS[newLevel]);

        await updateDoc(docRef, {
          correctCount: data.correctCount + (isCorrect ? 1 : 0),
          incorrectCount: data.incorrectCount + (isCorrect ? 0 : 1),
          lastPracticed: serverTimestamp(),
          nextReviewDate: Timestamp.fromDate(nextReview),
          level: newLevel,
        });
      } else {
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + SRS_INTERVALS[0]);

        await setDoc(docRef, {
          userId,
          lessonId,
          vocabularyId,
          correctCount: isCorrect ? 1 : 0,
          incorrectCount: isCorrect ? 0 : 1,
          lastPracticed: serverTimestamp(),
          nextReviewDate: Timestamp.fromDate(nextReview),
          level: isCorrect ? 1 : 0,
        });
      }

      // Update user progress
      await this.updateUserProgress(userId, 1, isCorrect ? 1 : 0, timeSpent);
    } catch (error) {
      console.error('Error updating vocabulary progress:', error);
      throw error;
    }
  },

  async getUserProgress(userId: string): Promise<UserProgress | null> {
    try {
      const docRef = doc(db, USER_PROGRESS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // Initialize user progress if it doesn't exist
        const initialProgress: Omit<UserProgress, 'id'> = {
          userId,
          dailyGoal: DEFAULT_DAILY_GOAL,
          currentStreak: 0,
          longestStreak: 0,
          lastPracticeDate: new Date(),
          practiceHistory: [],
        };
        await setDoc(docRef, {
          ...initialProgress,
          lastPracticeDate: serverTimestamp(),
        });
        return { id: userId, ...initialProgress };
      }

      const data = docSnap.data() as FirestoreUserProgress;
      return {
        id: docSnap.id,
        userId: data.userId,
        dailyGoal: data.dailyGoal,
        currentStreak: data.currentStreak,
        longestStreak: data.longestStreak,
        lastPracticeDate: data.lastPracticeDate.toDate(),
        practiceHistory: data.practiceHistory.map(entry => ({
          date: entry.date.toDate(),
          wordsStudied: entry.wordsStudied,
          correctAnswers: entry.correctAnswers,
          timeSpent: entry.timeSpent,
        })),
      };
    } catch (error) {
      console.error('Error getting user progress:', error);
      throw error;
    }
  },

  async updateUserProgress(
    userId: string,
    wordsStudied: number,
    correctAnswers: number,
    timeSpent: number
  ) {
    try {
      const docRef = doc(db, USER_PROGRESS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (docSnap.exists()) {
        const data = docSnap.data() as FirestoreUserProgress;
        const lastPracticeDate = data.lastPracticeDate.toDate();
        const lastPracticeDay = new Date(
          lastPracticeDate.getFullYear(),
          lastPracticeDate.getMonth(),
          lastPracticeDate.getDate()
        );

        // Check if this is a new day
        const isNewDay = today.getTime() > lastPracticeDay.getTime();
        const streakBroken = isNewDay && 
          (today.getTime() - lastPracticeDay.getTime()) > (24 * 60 * 60 * 1000);

        // Update streak
        const currentStreak = streakBroken ? 1 : (isNewDay ? data.currentStreak + 1 : data.currentStreak);
        const longestStreak = Math.max(currentStreak, data.longestStreak || 0);

        // Update practice history
        const todayEntry = data.practiceHistory?.find(entry => 
          entry.date.toDate().getTime() === today.getTime()
        );

        let practiceHistory = data.practiceHistory || [];
        if (todayEntry) {
          practiceHistory = practiceHistory.map(entry => {
            if (entry.date.toDate().getTime() === today.getTime()) {
              return {
                ...entry,
                wordsStudied: entry.wordsStudied + wordsStudied,
                correctAnswers: entry.correctAnswers + correctAnswers,
                timeSpent: entry.timeSpent + timeSpent,
              };
            }
            return entry;
          });
        } else {
          practiceHistory.push({
            date: Timestamp.fromDate(today),
            wordsStudied,
            correctAnswers,
            timeSpent,
          });
        }

        await updateDoc(docRef, {
          currentStreak,
          longestStreak,
          lastPracticeDate: serverTimestamp(),
          practiceHistory,
        });
      } else {
        // Initialize user progress
        await setDoc(docRef, {
          userId,
          dailyGoal: DEFAULT_DAILY_GOAL,
          currentStreak: 1,
          longestStreak: 1,
          lastPracticeDate: serverTimestamp(),
          practiceHistory: [{
            date: Timestamp.fromDate(today),
            wordsStudied,
            correctAnswers,
            timeSpent,
          }],
        });
      }
    } catch (error) {
      console.error('Error updating user progress:', error);
      throw error;
    }
  },

  async updateDailyGoal(userId: string, newGoal: number) {
    try {
      const docRef = doc(db, USER_PROGRESS_COLLECTION, userId);
      await updateDoc(docRef, {
        dailyGoal: newGoal,
      });
    } catch (error) {
      console.error('Error updating daily goal:', error);
      throw error;
    }
  },

  async getAllProgress(): Promise<Record<string, LessonProgress>> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        console.warn('No authenticated user found');
        return {};
      }

      const q = query(
        collection(db, 'lessonProgress'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const progress: Record<string, LessonProgress> = {};
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.lessonId) {
          progress[data.lessonId] = {
            lessonId: data.lessonId,
            completed: data.completed || false,
            lastAccessedAt: data.lastAccessedAt?.toDate() || new Date(),
            completedAt: data.completedAt?.toDate() || undefined,
            progress: data.progress || 0
          };
        }
      });
      
      return progress;
    } catch (error) {
      console.error('Error getting lesson progress:', error);
      // Return empty object instead of throwing to prevent UI disruption
      return {};
    }
  },

  async getUserStreak(): Promise<number> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        return 0;
      }

      const userProgressDoc = await getDoc(doc(db, USER_PROGRESS_COLLECTION, userId));
      if (!userProgressDoc.exists()) {
        return 0;
      }

      return userProgressDoc.data().currentStreak || 0;
    } catch (error) {
      console.error('Error getting user streak:', error);
      return 0;
    }
  },

  async updateProgress(lessonId: string, progress: number): Promise<void> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        return;
      }

      const progressId = `${userId}_${lessonId}`;
      const progressRef = doc(db, 'lessonProgress', progressId);
      
      await setDoc(progressRef, {
        userId,
        lessonId,
        progress,
        lastAccessedAt: serverTimestamp(),
        completed: progress === 100,
        completedAt: progress === 100 ? serverTimestamp() : null
      }, { merge: true });
    } catch (error) {
      console.error('Error updating lesson progress:', error);
      throw error;
    }
  }
}; 