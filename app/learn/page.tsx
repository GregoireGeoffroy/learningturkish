"use client";

import { useState, useEffect } from 'react';
import { ChevronRight, Search, Award, Flame, Gem } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { lessonService } from '@/lib/services/lesson-service';
import { progressService } from '@/lib/services/progress-service';
import type { Lesson, LessonProgress } from '@/types/lesson';
import type { UserProgress } from '@/types/progress';
import { useAuth } from '@/lib/context/AuthContext';
import { LeagueCard } from '@/components/learn/LeagueCard';
import { DailyQuests } from '@/components/learn/DailyQuests';
import { Card } from '@/components/ui/card';

// New component for the streak counter
const StreakCounter = ({ streak }: { streak: number }) => (
  <div className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 px-4 py-2 rounded-full">
    <Award size={20} />
    <span className="font-semibold">{streak} Day Streak!</span>
  </div>
);

// New component for the lesson card
const LessonCard = ({ 
  lesson, 
  index, 
  progress 
}: { 
  lesson: Lesson; 
  index: number;
  progress?: LessonProgress;
}) => {
  const router = useRouter();
  
  const handleClick = () => router.push(`/learn/${lesson.slug}`);

  const isCompleted = progress?.completed ?? false;
  const progressPercentage = progress?.progress ?? 0;

  return (
    <div 
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      role="button"
      tabIndex={0}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 
        hover:bg-gray-100 dark:hover:bg-gray-700
        transition-colors duration-200 cursor-pointer relative"
      aria-label={`Start lesson: ${lesson.title}`}
    >
      <div className="flex items-center gap-4">
        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
          ${isCompleted 
            ? 'bg-green-100 dark:bg-green-900' 
            : 'bg-blue-100 dark:bg-blue-900'}`}>
          <span className={`font-semibold
            ${isCompleted 
              ? 'text-green-600 dark:text-green-300' 
              : 'text-blue-600 dark:text-blue-300'}`}>
            {index + 1}
          </span>
        </div>
        
        <div className="flex-grow">
          <h3 className="text-xl font-semibold">{lesson.title}</h3>
          <div className="flex gap-4 text-sm text-gray-500">
            <span>{lesson.vocabulary.length} words</span>
            <span>•</span>
            <span className="capitalize">{lesson.difficulty}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div 
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
          <ChevronRight size={24} className="text-blue-500" />
        </div>
      </div>
    </div>
  );
};

export default function LearnPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<Record<string, LessonProgress>>({});
  const [streak, setStreak] = useState(0);
  const [gems, setGems] = useState(0);
  const { user } = useAuth();
  const [league, setLeague] = useState<UserProgress['league']>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [dailyQuests, setDailyQuests] = useState([
    {
      id: '1',
      title: 'Learn New Words',
      description: 'Learn 20 new words today',
      target: 20,
      current: 0,
      xp: 20,
      gems: 5,
      icon: 'words' as const
    },
    {
      id: '2',
      title: 'Study Time',
      description: 'Spend 15 minutes learning',
      target: 15,
      current: 0,
      xp: 15,
      gems: 3,
      icon: 'time' as const
    },
    {
      id: '3',
      title: 'Keep Your Streak',
      description: 'Complete a lesson to maintain your streak',
      target: 1,
      current: 0,
      xp: 10,
      gems: 2,
      icon: 'streak' as const
    }
  ]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        // Load lessons
        const fetchedLessons = await lessonService.getAllLessons();
        setLessons(fetchedLessons);

        // Load user progress and stats
        const userProgress = await progressService.getUserProgress(user.uid);
        const fetchedProgress = await progressService.getAllProgress(user.uid);
        
        setProgress(fetchedProgress as Record<string, LessonProgress>);
        setStreak(userProgress?.currentStreak || 0);
        setLeague(userProgress?.league);
        setGems(userProgress?.gems || 0);
      } catch (error) {
        console.error('Error loading lessons:', error);
        setError('Failed to load lessons');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'all' || lesson.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

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
    <main className="container mx-auto px-4 py-8 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Learn Turkish</h1>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-gray-600 dark:text-gray-300">
                Select a lesson below to start learning Turkish grammar and vocabulary
              </p>
              
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search lessons..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 
                      bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    aria-label="Search lessons"
                  />
                </div>
                
                <select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 
                    bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  aria-label="Filter by difficulty"
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>

          {filteredLessons.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No lessons found matching your criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLessons.map((lesson, index) => (
                <LessonCard 
                  key={lesson.id} 
                  lesson={lesson} 
                  index={index}
                  progress={progress[lesson.id]}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Side Panel */}
        <div className="lg:w-80 space-y-6">
          {/* User Stats */}
          <Card className="p-4">
            <div className="space-y-4">
              {/* Streak */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Flame className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Daily Streak</p>
                  <p className="font-semibold">{streak} days</p>
                </div>
              </div>

              {/* Gems */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Gem className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gems</p>
                  <p className="font-semibold">{gems}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* League Card */}
          {league && <LeagueCard league={league} />}

          {/* Daily Quests */}
          <DailyQuests 
            quests={dailyQuests}
            onQuestComplete={async (questId) => {
              const quest = dailyQuests.find(q => q.id === questId);
              if (quest && user) {
                await progressService.updateGems(user.uid, quest.gems);
              }
            }}
          />
        </div>
      </div>
    </main>
  );
} 