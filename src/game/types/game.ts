export type Difficulty = 'casual' | 'normal' | 'corporate';
export type Stage = 'commute' | 'lobby' | 'coding' | 'work-gauntlet' | 'lunch' | 'fight' | 'tea-break' | 'hr-search' | 'salary' | 'escape' | 'results';

export interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
}

export interface GameSettings extends AccessibilitySettings {
  difficulty: Difficulty;
  muted: boolean;
}

export interface HighScoreEntry {
  playerName: string;
  score: number;
  rank: string;
  difficulty: Difficulty;
  completedAt: string;
  arrivalTime: string;
  exitTime: string;
}

export interface SavedGameData {
  version: number;
  highScores: HighScoreEntry[];
  settings: GameSettings;
  tutorialCompleted: boolean;
  achievements: string[];
}

export interface GameState {
  playerName: string;
  stage: Stage;
  minutes: number;
  energy: number;
  score: number;
  arrivalTime: string;
  codingScore: number;
  bugsFixed: number;
  bugsMissed: number;
  salaryCollected: boolean;
  exitTime: string;
  penalties: number;
  bonuses: number;
  clues: number;
  clueSources: string[];
  teaBreaks: number;
  managerCaught: number;
  supportCaught: number;
  meetingsHit: number;
  attendanceMarked: boolean;
  lunchCompleted: boolean;
  lunchFailed: boolean;
  testerDefeated: boolean;
  fightHealthRemaining: number;
  fightRoundsWon: number;
  fightRoundsLost: number;
  teaQuestCompleted: boolean;
  teaQuestFailed: boolean;
  difficulty: Difficulty;
  unlockedThisRun: string[];
}

export interface DifficultyConfig {
  label: string;
  description: string;
  playerSpeed: number;
  hazardSpeed: number;
  timeScale: number;
  codingCount: number;
  hrMoveMs: number;
  clueLimit: number;
  supportDelayScale: number;
  supportMaxActive: number;
  fightPlayerSpeed: number;
  fightTesterSpeed: number;
  fightTesterDamage: number;
  fightTesterCooldown: number;
  fightPunchDamage: number;
  fightKickDamage: number;
  fightBlockMultiplier: number;
}
