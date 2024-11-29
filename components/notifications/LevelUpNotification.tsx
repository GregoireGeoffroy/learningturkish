"use client";

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Gem } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { soundManager } from '@/lib/utils/sound';

interface LevelUpNotificationProps {
  level: number;
  gemsEarned: number;
  onClose: () => void;
}

export function LevelUpNotification({ level, gemsEarned, onClose }: LevelUpNotificationProps) {
  useEffect(() => {
    soundManager.play('reward');
    
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Card className="p-6 bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-400 rounded-full">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                Level Up! <Star className="w-5 h-5" />
              </h3>
              <p className="text-yellow-100">You reached level {level}</p>
              <p className="flex items-center gap-1 mt-1">
                <Gem className="w-4 h-4" />
                <span>+{gemsEarned} gems earned!</span>
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
} 