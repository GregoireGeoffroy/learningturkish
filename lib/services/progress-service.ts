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
  arrayUnion,
  increment,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { VocabularyProgress, UserProgress, LessonProgress } from '@/types/progress';
import { auth } from '../firebase/config';
import { lessonService } from '../services/lesson-service';
import { xpService } from '../services/xp-service';

const VOCAB_PROGRESS_COLLECTION = 'vocabularyProgress';
const USER_PROGRESS_COLLECTION = 'userProgress';

// Spaced repetition intervals in days
const SRS_INTERVALS = [1, 3, 7, 14, 30, 90];

// Default daily goal
const DEFAULT_DAILY_GOAL = 20;
const INITIAL_GEMS = 0;

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

interface UserProgress {
  userId: string;
  dailyGoal: number;
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: Date;
  practiceHistory: PracticeHistoryEntry[];
  gems: number;
  league: {
    name: string;
    rank: number;
    division: number;
  };
  dailyQuests?: {
    completed: string[];
    lastResetDate: Date;
  };
  xp: {
    current: number;
    level: number;
    nextLevelAt: number;
  };
}

const createInitialProgress = (userId: string): Omit<UserProgress, 'id'> => ({
  userId,
  dailyGoal: DEFAULT_DAILY_GOAL,
  currentStreak: 0,
  longestStreak: 0,
  lastPracticeDate: new Date(),
  practiceHistory: [],
  gems: INITIAL_GEMS,
  league: {
    name: 'Bronze',
    rank: 1,
    division: 1,
    xp: 0,
    nextRankAt: 50
  },
  xp: {
    current: 0,
    level: 1,
    nextLevelAt: 100
  },
  dailyQuests: {
    completed: [],
    lastResetDate: new Date(),
    progress: {
      wordsLearned: 0,
      timeSpent: 0,
      lessonsCompleted: 0
    }
  }
});

export const progressService = {
  async getVocabularyProgress(userId: string, slug: string) {
    try {
      const q = query(
        collection(db, VOCAB_PROGRESS_COLLECTION),
        where('userId', '==', userId),
        where('slug', '==', slug)
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
    slug: string,
    vocabularyId: string,
    isCorrect: boolean,
    timeSpent: number
  ) {
    try {
      const progressId = `${userId}_${slug}_${vocabularyId}`;
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
          slug,
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
        const initialProgress = createInitialProgress(userId);
        await setDoc(docRef, {
          ...initialProgress,
          lastPracticeDate: serverTimestamp(),
          lastResetDate: serverTimestamp()
        });
        return { id: userId, ...initialProgress };
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId: data.userId,
        dailyGoal: data.dailyGoal,
        currentStreak: data.currentStreak,
        longestStreak: data.longestStreak,
        lastPracticeDate: data.lastPracticeDate.toDate(),
        practiceHistory: data.practiceHistory?.map((entry: any) => ({
          date: entry.date.toDate(),
          wordsStudied: entry.wordsStudied,
          correctAnswers: entry.correctAnswers,
          timeSpent: entry.timeSpent,
        })) || [],
        gems: data.gems || INITIAL_GEMS,
        league: data.league || {
          name: 'Bronze',
          rank: 1,
          division: 1,
          xp: 0,
          nextRankAt: 50
        },
        xp: data.xp || {
          current: 0,
          level: 1,
          nextLevelAt: 100
        },
        dailyQuests: data.dailyQuests || {
          completed: [],
          lastResetDate: new Date(),
          progress: {
            wordsLearned: 0,
            timeSpent: 0,
            lessonsCompleted: 0
          }
        }
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
        if (data.slug) {
          progress[data.slug] = {
            slug: data.slug,
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

  async updateProgress(slug: string, progress: number): Promise<void> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        return;
      }

      // Try to get lesson by ID first
      let lesson = await lessonService.getLesson(slug);
      
      // If not found, try by slug
      if (!lesson) {
        lesson = await lessonService.getLessonBySlug(slug);
      }

      if (!lesson) {
        console.error('Lesson not found');
        return;
      }

      const progressId = `${userId}_${lesson.id}`;
      const progressRef = doc(db, 'lessonProgress', progressId);
      
      await setDoc(progressRef, {
        userId,
        slug: lesson.slug,  // Always use the lesson ID for storage
        progress,
        lastAccessedAt: serverTimestamp(),
        completed: progress === 100,
        completedAt: progress === 100 ? serverTimestamp() : null
      }, { merge: true });
    } catch (error) {
      console.error('Error updating lesson progress:', error);
      throw error;
    }
  },

  async updateGems(userId: string, amount: number): Promise<void> {
    try {
      const userProgress = await this.getUserProgress(userId);
      if (!userProgress) return;

      const userRef = doc(db, USER_PROGRESS_COLLECTION, userProgress.id);
      await updateDoc(userRef, {
        gems: (userProgress.gems || 0) + amount
      });
    } catch (error) {
      console.error('Error updating gems:', error);
      throw error;
    }
  },

  async updateQuestProgress(
    userId: string,
    type: 'words' | 'time' | 'lessons',
    amount: number
  ): Promise<void> {
    try {
      const userProgress = await this.getUserProgress(userId);
      if (!userProgress?.id) return;

      const userRef = doc(db, USER_PROGRESS_COLLECTION, userProgress.id);
      
      // Initialize daily quests if not exists
      if (!userProgress.dailyQuests) {
        await updateDoc(userRef, {
          dailyQuests: {
            completed: [],
            lastResetDate: serverTimestamp(),
            progress: {
              wordsLearned: 0,
              timeSpent: 0,
              lessonsCompleted: 0
            }
          }
        });
        return;
      }

      // Reset progress if it's a new day
      const lastReset = userProgress.dailyQuests.lastResetDate;
      const now = new Date();
      if (lastReset && now.getDate() !== lastReset.getDate()) {
        await updateDoc(userRef, {
          'dailyQuests.completed': [],
          'dailyQuests.lastResetDate': serverTimestamp(),
          'dailyQuests.progress': {
            wordsLearned: 0,
            timeSpent: 0,
            lessonsCompleted: 0
          }
        });
        return;
      }

      // Update the specific progress type
      const progressField = type === 'words' ? 'wordsLearned' : 
                           type === 'time' ? 'timeSpent' : 'lessonsCompleted';
      
      await updateDoc(userRef, {
        [`dailyQuests.progress.${progressField}`]: increment(amount)
      });

    } catch (error) {
      console.error('Error updating quest progress:', error);
      throw error;
    }
  },

  async addXP(userId: string, amount: number): Promise<void> {
    try {
      const userProgress = await this.getUserProgress(userId);
      if (!userProgress?.id) return;

      const currentXP = userProgress.xp.current + amount;
      const newXPInfo = xpService.calculateLevel(currentXP);
      const newLeagueInfo = xpService.calculateLeague(currentXP);

      const userRef = doc(db, USER_PROGRESS_COLLECTION, userProgress.id);
      await updateDoc(userRef, {
        xp: newXPInfo,
        league: newLeagueInfo
      });

      // If level increased, give gems reward
      if (newXPInfo.level > userProgress.xp.level) {
        const gemsReward = newXPInfo.level * 5; // 5 gems per level
        await this.updateGems(userId, gemsReward);
      }
    } catch (error) {
      console.error('Error updating XP:', error);
      throw error;
    }
  }
}; 