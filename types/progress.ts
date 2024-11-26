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

export type UserProgress = {
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
    timeSpent: number; // in seconds
  }[];
}; 