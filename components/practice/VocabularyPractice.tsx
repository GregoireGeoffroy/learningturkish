"use client";

import { useState, useEffect } from 'react';
import { Repeat, ChevronLeft, ChevronRight, RotateCw, BarChart, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/context/AuthContext';
import { progressService } from '@/lib/services/progress-service';
import type { VocabularyItem } from '@/types/lesson';
import type { VocabularyProgress, UserProgress } from '@/types/progress';

type PracticeMode = 'flashcards' | 'quiz' | 'multiple-choice' | 'stats';

type PracticeStats = {
  correctCount: number;
  incorrectCount: number;
  masteredCount: number;
  totalPracticed: number;
};

export function VocabularyPractice({ 
  vocabulary,
  lessonId 
}: { 
  vocabulary: VocabularyItem[];
  lessonId: string;
}) {
  const [mode, setMode] = useState<PracticeMode>('flashcards');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [progress, setProgress] = useState<VocabularyProgress[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [practiceStartTime] = useState<number>(Date.now());
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<PracticeStats>({
    correctCount: 0,
    incorrectCount: 0,
    masteredCount: 0,
    totalPracticed: 0,
  });
  const [shuffledVocabulary, setShuffledVocabulary] = useState(() => 
    [...vocabulary].sort(() => Math.random() - 0.5)
  );
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState<string[]>([]);

  const { user } = useAuth();
  const currentItem = shuffledVocabulary[currentIndex];
  const isLastItem = currentIndex === shuffledVocabulary.length - 1;

  useEffect(() => {
    if (user) {
      loadProgress();
      loadUserProgress();
    }
  }, [user]);

  useEffect(() => {
    if (mode === 'multiple-choice' && currentItem) {
      generateMultipleChoiceOptions();
    }
  }, [currentIndex, mode, currentItem]);

  const loadProgress = async () => {
    if (!user) return;
    setIsLoading(true);
    setError('');
    try {
      const vocabProgress = await progressService.getVocabularyProgress(user.uid, lessonId);
      setProgress(vocabProgress);

      // Calculate stats
      const stats = vocabProgress.reduce((acc, curr) => ({
        correctCount: acc.correctCount + curr.correctCount,
        incorrectCount: acc.incorrectCount + curr.incorrectCount,
        masteredCount: acc.masteredCount + (curr.level === 5 ? 1 : 0),
        totalPracticed: acc.totalPracticed + 1,
      }), {
        correctCount: 0,
        incorrectCount: 0,
        masteredCount: 0,
        totalPracticed: 0,
      });

      setStats(stats);
    } catch (error) {
      setError('Failed to load progress. Please try again.');
      console.error('Error loading progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProgress = async () => {
    if (!user) return;
    try {
      const progress = await progressService.getUserProgress(user.uid);
      setUserProgress(progress);
    } catch (error) {
      console.error('Error loading user progress:', error);
      // Don't show error for user progress as it's not critical
    }
  };

  const generateMultipleChoiceOptions = () => {
    if (!currentItem) return;
    
    const correctAnswer = currentItem.answer;
    const otherAnswers = vocabulary
      .filter(item => item.answer !== correctAnswer)
      .map(item => item.answer)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    const options = [...otherAnswers, correctAnswer]
      .sort(() => Math.random() - 0.5);
    
    setMultipleChoiceOptions(options);
  };

  const updateProgress = async (isCorrect: boolean) => {
    if (!user || !currentItem) return;
    
    setError('');
    const timeSpent = Math.round((Date.now() - practiceStartTime) / 1000);
    
    try {
      await progressService.updateVocabularyProgress(
        user.uid,
        lessonId,
        currentItem.id || `${currentIndex}`,
        isCorrect,
        timeSpent
      );
      await loadProgress();
      await loadUserProgress();
    } catch (error) {
      setError('Failed to update progress. Please try again.');
      console.error('Error updating progress:', error);
    }
  };

  const handleNext = () => {
    if (!currentItem) return;
    
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
    setError('');
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      setQuizAnswer('');
      setShowAnswer(false);
      setError('');
    }
  };

  const handleShuffle = () => {
    setShuffledVocabulary([...vocabulary].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsFlipped(false);
    setQuizAnswer('');
    setShowAnswer(false);
    setError('');
  };

  const checkAnswer = async (answer: string) => {
    if (!currentItem) return;
    
    const normalizedAnswer = answer.toLowerCase().trim();
    const normalizedCorrect = currentItem.answer.toLowerCase().trim();
    const isCorrect = normalizedAnswer === normalizedCorrect;
    
    setShowAnswer(true);
    setQuizAnswer(answer);
    
    if (user) {
      await updateProgress(isCorrect);
    }
  };

  if (!vocabulary.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          No vocabulary items available for this lesson.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Loading practice...</p>
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error: Could not load vocabulary item.</p>
      </div>
    );
  }

  const renderStats = () => (
    <div className="space-y-6">
      {/* Daily Goal Progress */}
      {userProgress && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium">Daily Goal</h3>
            <div className="flex items-center gap-2">
              <Target size={20} className="text-primary-600" />
              <span className="font-bold">{userProgress.dailyGoal} words</span>
            </div>
          </div>
          <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
            <div 
              className="absolute h-full bg-primary-600 rounded-full"
              style={{ 
                width: `${Math.min(
                  (userProgress.practiceHistory[userProgress.practiceHistory.length - 1]?.wordsStudied || 0) 
                  / userProgress.dailyGoal * 100, 100
                )}%` 
              }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {userProgress.practiceHistory[userProgress.practiceHistory.length - 1]?.wordsStudied || 0} / {userProgress.dailyGoal} words today
          </div>
        </div>
      )}

      {/* Streak */}
      {userProgress && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Streak</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current</p>
              <p className="text-3xl font-bold text-primary-600">
                {userProgress.currentStreak} days
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Longest</p>
              <p className="text-3xl font-bold text-primary-600">
                {userProgress.longestStreak} days
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Accuracy</h3>
          <p className="text-3xl font-bold text-green-600">
            {stats.totalPracticed > 0
              ? Math.round((stats.correctCount / (stats.correctCount + stats.incorrectCount)) * 100)
              : 0}%
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Mastered</h3>
          <p className="text-3xl font-bold text-blue-600">
            {stats.masteredCount} / {vocabulary.length}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-4">Progress Details</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Total Practiced:</span>
            <span>{stats.totalPracticed}</span>
          </div>
          <div className="flex justify-between">
            <span>Correct Answers:</span>
            <span className="text-green-600">{stats.correctCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Incorrect Answers:</span>
            <span className="text-red-600">{stats.incorrectCount}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}

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
        <Button
          variant={mode === 'multiple-choice' ? 'default' : 'outline'}
          onClick={() => setMode('multiple-choice')}
        >
          Multiple Choice
        </Button>
        <Button
          variant={mode === 'stats' ? 'default' : 'outline'}
          onClick={() => setMode('stats')}
        >
          <BarChart size={20} className="mr-2" />
          Stats
        </Button>
      </div>

      {/* Practice Area */}
      {mode === 'stats' ? (
        renderStats()
      ) : (
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
          ) : mode === 'multiple-choice' ? (
            // Multiple Choice Mode
            <div className="min-h-[200px]">
              <p className="text-2xl font-medium mb-6 text-center">
                {currentItem.question}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {multipleChoiceOptions.map((option, index) => (
                  <Button
                    key={index}
                    variant={
                      showAnswer
                        ? option === currentItem.answer
                          ? 'default'
                          : quizAnswer === option
                          ? 'destructive'
                          : 'outline'
                        : 'outline'
                    }
                    className="py-8 text-lg"
                    onClick={() => !showAnswer && checkAnswer(option)}
                    disabled={showAnswer}
                  >
                    {option}
                  </Button>
                ))}
              </div>
              {showAnswer && (
                <div className={`mt-4 p-4 rounded-lg ${
                  quizAnswer === currentItem.answer
                    ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                }`}>
                  <p className="font-medium">
                    {quizAnswer === currentItem.answer ? 'Correct!' : 'Not quite right'}
                  </p>
                  <p className="text-sm mt-1">
                    The correct answer is: {currentItem.answer}
                  </p>
                </div>
              )}
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
                      checkAnswer(quizAnswer);
                    } else if (e.key === 'Enter' && showAnswer) {
                      handleNext();
                    }
                  }}
                />
                {!showAnswer ? (
                  <Button
                    className="w-full"
                    onClick={() => checkAnswer(quizAnswer)}
                  >
                    Check Answer
                  </Button>
                ) : (
                  <div className={`p-4 rounded-lg ${
                    quizAnswer === currentItem.answer
                      ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  }`}>
                    <p className="font-medium">
                      {quizAnswer === currentItem.answer ? 'Correct!' : 'Not quite right'}
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
      )}

      {/* Navigation */}
      {mode !== 'stats' && (
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
      )}
    </div>
  );
} 