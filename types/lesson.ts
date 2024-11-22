export type LessonContent = {
  id: string;
  title: string;
  explanation: string;
  examples: Array<{
    english: string;
    turkish: string;
  }>;
};

export type Lesson = {
  id: string;
  title: string;
  description: string;
  content: LessonContent[];
  isCompleted: boolean;
}; 