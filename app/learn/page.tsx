"use client";

import { useState, useEffect } from 'react';
import { ChevronRight, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { lessonService } from '@/lib/services/lesson-service';
import type { Lesson } from '@/types/lesson';

const LessonCard = ({ lesson }: { lesson: Lesson }) => {
  const router = useRouter();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold mb-2">{lesson.title}</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{lesson.description}</p>
          <p className="text-sm text-gray-500">
            {lesson.vocabulary.length} vocabulary items
          </p>
        </div>
        <BookOpen className="text-blue-500" size={24} />
      </div>
      
      <button 
        className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
        onClick={() => router.push(`/learn/${lesson.id}`)}
      >
        Start Lesson
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

export default function LearnPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadLessons = async () => {
      try {
        const fetchedLessons = await lessonService.getAllLessons();
        setLessons(fetchedLessons);
      } catch (error) {
        setError('Failed to load lessons');
        console.error('Error loading lessons:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLessons();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-8"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-48"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-200 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Error Loading Lessons</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Learn Turkish</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Select a lesson below to start learning Turkish grammar and vocabulary
        </p>
      </div>

      {lessons.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No lessons available yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </div>
  );
} 