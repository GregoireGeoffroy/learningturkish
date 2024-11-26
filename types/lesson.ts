export type VocabularyItem = {
  id?: string;
  question: string;
  answer: string;
};

export type Lesson = {
  id?: string;
  title: string;
  description: string;
  order: number;
  vocabulary: VocabularyItem[];
  createdAt: Date;
  updatedAt: Date;
}; 