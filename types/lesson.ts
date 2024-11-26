export type VocabularyItem = {
  id?: string;
  question: string;
  answer: string;
};

export interface Lesson {
  id: string;
  title: string;
  vocabulary: VocabularyItem[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  estimatedTime: number; // in minutes
}

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  lastAccessedAt: Date;
  completedAt?: Date;
  progress: number; // 0-100
} 