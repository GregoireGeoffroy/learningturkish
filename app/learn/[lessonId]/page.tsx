"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { lessonService } from '@/lib/services/lesson-service';
import { VocabularyPractice } from '@/components/practice/VocabularyPractice';
import { Button } from '@/components/ui/button';
import type { Lesson } from '@/types/lesson';

export default function LessonPage({ params }: { params: { lessonId: string } }) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPractice, setShowPractice] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadLesson = async () => {
      try {
        const fetchedLesson = await lessonService.getLesson(params.lessonId);
        if (!fetchedLesson) {
          setError('Lesson not found');
          return;
        }
        setLesson(fetchedLesson);
      } catch (error) {
        setError('Failed to load lesson');
        console.error('Error loading lesson:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLesson();
  }, [params.lessonId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded h-16"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-200 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Error</h2>
          <p>{error || 'Lesson not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Lessons
        </button>
        <h1 className="text-3xl font-bold mb-2">{lesson.title}</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-4">{lesson.description}</p>
        <Button
          onClick={() => setShowPractice(!showPractice)}
          variant={showPractice ? "secondary" : "default"}
        >
          {showPractice ? 'View Vocabulary List' : 'Practice Vocabulary'}
        </Button>
      </div>

      {showPractice ? (
        <VocabularyPractice vocabulary={lesson.vocabulary} />
      ) : (
        /* Vocabulary List */
        <div className="max-w-2xl">
          <h2 className="text-xl font-semibold mb-4">Vocabulary</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            {lesson.vocabulary.map((item, index) => (
              <div
                key={index}
                className={`
                  p-4 flex justify-between items-center
                  ${index !== 0 ? 'border-t border-gray-200 dark:border-gray-700' : ''}
                `}
              >
                <div className="flex-1">
                  <p className="font-medium">{item.question}</p>
                  <p className="text-gray-600 dark:text-gray-400">{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 