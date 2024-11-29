"use client";

import { Trophy, Shield, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface LeagueCardProps {
  league: {
    name: string;
    rank: number;
    division: number;
  };
}

export function LeagueCard({ league }: LeagueCardProps) {
  const getLeagueColor = (name: string) => {
    switch (name.toLowerCase()) {
      case 'bronze': return 'text-amber-600';
      case 'silver': return 'text-gray-400';
      case 'gold': return 'text-yellow-500';
      case 'sapphire': return 'text-blue-500';
      case 'ruby': return 'text-red-500';
      case 'emerald': return 'text-emerald-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`${getLeagueColor(league.name)} p-2 bg-gray-100 dark:bg-gray-800 rounded-lg`}>
          <Trophy className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            {league.name} League
            <span className="text-sm text-gray-500">
              Division {league.division}
            </span>
          </h3>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Shield className="w-4 h-4" />
            Rank #{league.rank}
            <ChevronUp className="w-4 h-4 text-green-500" />
          </p>
        </div>
      </div>
    </Card>
  );
} 