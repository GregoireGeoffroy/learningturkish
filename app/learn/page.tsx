"use client";

import { useState } from 'react';
import { ChevronRight, CheckCircle, BookOpen } from 'lucide-react';
import { Lesson } from '@/types/lesson';

const SAMPLE_LESSON: Lesson = {
  id: "lesson-1",
  title: "Nouns and Articles",
  description: "Learn about Turkish nouns and how articles work differently from English",
  isCompleted: false,
  content: [
    {
      id: "section-1",
      title: "Introduction to Nouns",
      explanation: "Nouns are words that refer to things and ideas. The words man, apple, freedom and Cleopatra are nouns.",
      examples: []
    },
    {
      id: "section-2",
      title: "The Article 'Bir'",
      explanation: "Articles are the words the and a, which we can place before most nouns. The English article a can be translated into Turkish by the word bir. The Turkish word bir also means one in English.",
      examples: [
        { english: "a group", turkish: "bir grup" },
        { english: "one apple", turkish: "bir elma" }
      ]
    },
    {
      id: "section-3",
      title: "The Article 'The'",
      explanation: "The English article the however, is not translated into Turkish. Therefore the Turkish word grup can either be translated into English by group or by the group.",
      examples: [
        { english: "the group", turkish: "grup" },
        { english: "apple", turkish: "elma" }
      ]
    }
  ]
};

const LessonCard = ({ lesson }: { lesson: Lesson }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold mb-2">{lesson.title}</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{lesson.description}</p>
        </div>
        {lesson.isCompleted ? (
          <CheckCircle className="text-green-500" size={24} />
        ) : (
          <BookOpen className="text-blue-500" size={24} />
        )}
      </div>
      
      <button 
        className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
        onClick={() => window.location.href = `/learn/${lesson.id}`}
      >
        Start Lesson
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

export default function LearnPage() {
  const [lessons] = useState([SAMPLE_LESSON]); // In real app, fetch from API/database

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Learn Turkish</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Select a lesson below to start learning Turkish grammar and vocabulary
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {lessons.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} />
        ))}
      </div>
    </div>
  );
} 