"use client";


import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { LessonContent } from '@/types/lesson';

const LessonContentSection = ({ content }: { content: LessonContent }) => {
  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">{content.title}</h2>
      <p className="text-gray-700 dark:text-gray-300 mb-6">{content.explanation}</p>
      
      {content.examples.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Examples</h3>
          <div className="space-y-4">
            {content.examples.map((example, index) => (
              <div key={index} className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white dark:bg-gray-700 rounded">
                  {example.english}
                </div>
                <div className="p-3 bg-white dark:bg-gray-700 rounded">
                  {example.turkish}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Add this sample data (temporary solution)
const SAMPLE_LESSON = {
  id: '1',
  title: 'Sample Lesson',
  content: [
    {
      id: 'section-1',
      title: 'Section 1',
      explanation: 'This is the first section',
      examples: [
        {
          english: 'Hello',
          turkish: 'Merhaba'
        }
      ]
    }
  ]
};

export default function LessonPage() {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const lesson = SAMPLE_LESSON;
  
  const handleNext = () => {
    if (currentSectionIndex < lesson.content.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    } else {
      // Navigate to practice page
      window.location.href = `/practice/${lesson.id}`;
    }
  };

  const handlePrevious = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{lesson.title}</h1>
        <div className="h-1 w-full bg-gray-200 rounded">
          <div 
            className="h-1 bg-blue-500 rounded transition-all duration-300"
            style={{ width: `${((currentSectionIndex + 1) / lesson.content.length) * 100}%` }}
          />
        </div>
      </div>

      <LessonContentSection content={lesson.content[currentSectionIndex]} />

      <div className="flex justify-between mt-8">
        <button
          onClick={handlePrevious}
          disabled={currentSectionIndex === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft size={20} />
          Previous
        </button>

        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
        >
          {currentSectionIndex === lesson.content.length - 1 ? 'Start Practice' : 'Next'}
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
} 