"use client";

import { useState } from 'react';
import { Repeat, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { VocabularyItem } from '@/types/lesson';

type PracticeMode = 'flashcards' | 'quiz';

export function VocabularyPractice({ vocabulary }: { vocabulary: VocabularyItem[] }) {
  const [mode, setMode] = useState<PracticeMode>('flashcards');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [shuffledVocabulary, setShuffledVocabulary] = useState(() => 
    [...vocabulary].sort(() => Math.random() - 0.5)
  );

  const currentItem = shuffledVocabulary[currentIndex];
  const isLastItem = currentIndex === shuffledVocabulary.length - 1;

  const handleNext = () => {
    if (isLastItem) {
      // Reshuffle and start over
      setShuffledVocabulary([...vocabulary].sort(() => Math.random() - 0.5));
      setCurrentIndex(0);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
    setIsFlipped(false);
    setQuizAnswer('');
    setShowAnswer(false);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      setQuizAnswer('');
      setShowAnswer(false);
    }
  };

  const handleShuffle = () => {
    setShuffledVocabulary([...vocabulary].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsFlipped(false);
    setQuizAnswer('');
    setShowAnswer(false);
  };

  const checkAnswer = () => {
    setShowAnswer(true);
  };

  const isCorrectAnswer = () => {
    return quizAnswer.toLowerCase().trim() === currentItem.answer.toLowerCase().trim();
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Mode Selection */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={mode === 'flashcards' ? 'default' : 'outline'}
          onClick={() => setMode('flashcards')}
        >
          Flashcards
        </Button>
        <Button
          variant={mode === 'quiz' ? 'default' : 'outline'}
          onClick={() => setMode('quiz')}
        >
          Quiz
        </Button>
      </div>

      {/* Practice Area */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
        {mode === 'flashcards' ? (
          // Flashcard Mode
          <div
            className="min-h-[200px] flex items-center justify-center cursor-pointer select-none"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className="text-center">
              <p className="text-2xl font-medium mb-2">
                {isFlipped ? currentItem.answer : currentItem.question}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Click to {isFlipped ? 'hide' : 'show'} translation
              </p>
            </div>
          </div>
        ) : (
          // Quiz Mode
          <div className="min-h-[200px]">
            <p className="text-2xl font-medium mb-4 text-center">
              {currentItem.question}
            </p>
            <div className="space-y-4">
              <input
                type="text"
                value={quizAnswer}
                onChange={(e) => setQuizAnswer(e.target.value)}
                placeholder="Type the Turkish translation"
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !showAnswer) {
                    checkAnswer();
                  } else if (e.key === 'Enter' && showAnswer) {
                    handleNext();
                  }
                }}
              />
              {!showAnswer ? (
                <Button
                  className="w-full"
                  onClick={checkAnswer}
                >
                  Check Answer
                </Button>
              ) : (
                <div className={`p-4 rounded-lg ${
                  isCorrectAnswer() 
                    ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                }`}>
                  <p className="font-medium">
                    {isCorrectAnswer() ? 'Correct!' : 'Not quite right'}
                  </p>
                  <p className="text-sm mt-1">
                    The correct answer is: {currentItem.answer}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="mr-2" size={20} />
          Previous
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {currentIndex + 1} / {vocabulary.length}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShuffle}
            title="Shuffle vocabulary"
          >
            <RotateCw size={20} />
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={handleNext}
        >
          {isLastItem ? (
            <>
              Start Over
              <Repeat className="ml-2" size={20} />
            </>
          ) : (
            <>
              Next
              <ChevronRight className="ml-2" size={20} />
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 