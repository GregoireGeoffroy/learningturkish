const XP_LEVELS = [
  0,      // Level 1
  100,    // Level 2
  300,    // Level 3
  600,    // Level 4
  1000,   // Level 5
  1500,   // Level 6
  2100,   // Level 7
  2800,   // Level 8
  3600,   // Level 9
  4500    // Level 10
];

const LEAGUE_RANKS = {
  bronze: { xpPerRank: 50, divisions: 3 },
  silver: { xpPerRank: 75, divisions: 3 },
  gold: { xpPerRank: 100, divisions: 3 },
  sapphire: { xpPerRank: 150, divisions: 3 },
  ruby: { xpPerRank: 200, divisions: 3 },
  emerald: { xpPerRank: 250, divisions: 3 }
};

export const xpService = {
  calculateLevel(xp: number) {
    let level = 1;
    for (let i = 0; i < XP_LEVELS.length; i++) {
      if (xp >= XP_LEVELS[i]) {
        level = i + 1;
      } else {
        break;
      }
    }
    return {
      level,
      current: xp,
      nextLevelAt: XP_LEVELS[level] || XP_LEVELS[XP_LEVELS.length - 1]
    };
  },

  calculateLeague(xp: number) {
    let totalRanks = 0;
    let remainingXP = xp;
    let currentLeague = 'bronze';
    let currentRank = 1;
    let division = 1;

    for (const [league, config] of Object.entries(LEAGUE_RANKS)) {
      const ranksInLeague = config.divisions * 5; // 5 ranks per division
      const xpNeededForLeague = ranksInLeague * config.xpPerRank;

      if (remainingXP >= xpNeededForLeague) {
        remainingXP -= xpNeededForLeague;
        totalRanks += ranksInLeague;
        currentLeague = league;
      } else {
        const ranksInCurrentLeague = Math.floor(remainingXP / config.xpPerRank);
        totalRanks += ranksInCurrentLeague;
        currentRank = (ranksInCurrentLeague % 5) + 1;
        division = Math.floor(ranksInCurrentLeague / 5) + 1;
        break;
      }
    }

    return {
      name: currentLeague,
      rank: currentRank,
      division,
      xp: remainingXP,
      nextRankAt: LEAGUE_RANKS[currentLeague as keyof typeof LEAGUE_RANKS].xpPerRank
    };
  }
}; 