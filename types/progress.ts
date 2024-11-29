export type VocabularyProgress = {
  id?: string;
  userId: string;
  lessonId: string;
  vocabularyId: string;
  correctCount: number;
  incorrectCount: number;
  lastPracticed: Date;
  nextReviewDate: Date;
  level: number; // 0-5 for spaced repetition levels
};

export type LessonProgress = {
  id?: string;
  userId: string;
  lessonId: string;
  completed: boolean;
  lastStudied: Date;
  totalCorrect: number;
  totalIncorrect: number;
  masteredVocabulary: number;
};

export interface UserProgress {
  id?: string;
  userId: string;
  dailyGoal: number;
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: Date;
  practiceHistory: {
    date: Date;
    wordsStudied: number;
    correctAnswers: number;
    timeSpent: number;
  }[];
  gems: number;
  league: {
    name: string;
    rank: number;
    division: number;
    xp: number;  // XP in current league
    nextRankAt: number;  // XP needed for next rank
  };
  dailyQuests: {
    completed: string[];
    lastResetDate: Date;
    progress: {
      wordsLearned: number;
      timeSpent: number;
      lessonsCompleted: number;
    };
  };
  xp: {
    current: number;
    level: number;
    nextLevelAt: number;
  };
} 