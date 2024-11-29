"use client";

import { Zap, Target, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useEffect, useState } from 'react';

interface Quest {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  xp: number;
  gems: number;
  icon: 'words' | 'time' | 'streak';
}

interface DailyQuestsProps {
  quests: Quest[];
  onQuestComplete?: (questId: string) => void;
}

export function DailyQuests({ quests, onQuestComplete }: DailyQuestsProps) {
  const [timeUntilReset, setTimeUntilReset] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setHours(24, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeUntilReset(`${hours}h ${minutes}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    quests.forEach(quest => {
      if (quest.current >= quest.target && onQuestComplete) {
        onQuestComplete(quest.id);
      }
    });
  }, [quests, onQuestComplete]);

  const getQuestIcon = (type: Quest['icon']) => {
    switch (type) {
      case 'words':
        return <Zap className="w-5 h-5 text-blue-500" />;
      case 'time':
        return <Clock className="w-5 h-5 text-green-500" />;
      case 'streak':
        return <Target className="w-5 h-5 text-orange-500" />;
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Daily Quests</h2>
        <div className="text-sm text-gray-500">
          Resets in {timeUntilReset}
        </div>
      </div>
      <div className="space-y-4">
        {quests.map((quest) => {
          const progress = (quest.current / quest.target) * 100;
          const isComplete = progress >= 100;

          return (
            <div key={quest.id} className="flex items-start gap-4">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                {getQuestIcon(quest.icon)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium">{quest.title}</h3>
                  <div className="flex items-center gap-2 text-sm">
                    {quest.xp > 0 && (
                      <span className="text-purple-500 font-medium">
                        {quest.xp} XP
                      </span>
                    )}
                    {quest.gems > 0 && (
                      <span className="text-blue-500 font-medium">
                        {quest.gems} 💎
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  {quest.description}
                </p>
                <div className="flex items-center gap-2">
                  <Progress value={progress} className="flex-1" />
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {quest.current}/{quest.target}
                  </span>
                </div>
                {isComplete && (
                  <div className="mt-2 text-sm text-green-500 font-medium">
                    ✓ Completed!
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
} 