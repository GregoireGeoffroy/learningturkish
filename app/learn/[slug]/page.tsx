import { LessonContent } from './lesson-content';
import { lessonService } from '@/lib/services/lesson-service';

interface PageProps {
  params: {
    slug: string
  }
}

export default async function LessonPage({ params }: PageProps) {
  // Pre-fetch the lesson data
  const lesson = await lessonService.getLessonBySlug(params.slug);
  
  if (!lesson) {
    // Handle 404 case
    return <div>Lesson not found</div>;
  }

  return <LessonContent slug={params.slug} initialLesson={lesson} />;
} 