export type VocabularyItem = {
  id?: string;
  question: string;
  answer: string;
};

export interface Lesson {
  id: string;
  slug: string;
  title: string;
  content: string;
  vocabulary: VocabularyItem[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  lastAccessedAt: Date;
  completedAt?: Date;
  progress: number; // 0-100
} 