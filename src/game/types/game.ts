export type Difficulty = 'casual' | 'normal' | 'corporate';
export type Stage = 'commute' | 'lobby' | 'coding' | 'lunch' | 'tea-break' | 'hr-search' | 'salary' | 'escape' | 'results';

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
  teaBreaks: number;
  managerCaught: number;
  supportCaught: number;
  meetingsHit: number;
  attendanceMarked: boolean;
  lunchCompleted: boolean;
  teaQuestCompleted: boolean;
  difficulty: Difficulty;
  unlockedThisRun: string[];
}

export interface DifficultyConfig {
  label: string;
  speed: number;
  timeScale: number;
  codingCount: number;
  hrMoveMs: number;
  clueLimit: number;
}
