import type { Difficulty, GameSettings, HighScoreEntry, SavedGameData } from '../types/game';

export const SAVE_KEY = 'salary-chase-office-adventure';
export const LEGACY_SAVE_KEY = 'softifybd-salary-chase';
export const SAVE_VERSION = 1;

const defaults: SavedGameData = {
  version: SAVE_VERSION,
  highScores: [],
  settings: {
    difficulty: 'normal',
    muted: true,
    reducedMotion: false,
    highContrast: false,
    largeText: false,
  },
  tutorialCompleted: false,
  achievements: [],
};

const isDifficulty = (value: unknown): value is Difficulty =>
  value === 'casual' || value === 'normal' || value === 'corporate';

const isHighScore = (value: unknown): value is HighScoreEntry => {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.score === 'number' &&
    typeof item.rank === 'string' &&
    isDifficulty(item.difficulty) &&
    typeof item.completedAt === 'string' &&
    typeof item.arrivalTime === 'string' &&
    typeof item.exitTime === 'string'
  );
};

export class SaveManager {
  private data: SavedGameData;

  constructor(private readonly storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>) {
    this.data = this.load();
  }

  private load(): SavedGameData {
    if (!this.storage) return structuredClone(defaults);
    try {
      const currentRaw = this.storage.getItem(SAVE_KEY);
      const legacyRaw = currentRaw ? null : this.storage.getItem(LEGACY_SAVE_KEY);
      const raw = currentRaw ?? legacyRaw;
      if (!raw) return structuredClone(defaults);
      const parsed = JSON.parse(raw) as Partial<SavedGameData>;
      if (parsed.version !== SAVE_VERSION) return structuredClone(defaults);
      const settings = parsed.settings as Partial<GameSettings> | undefined;
      const loaded: SavedGameData = {
        version: SAVE_VERSION,
        highScores: Array.isArray(parsed.highScores)
          ? parsed.highScores.filter(isHighScore).map((entry) => ({
            ...entry,
            playerName: typeof entry.playerName === 'string'
              ? entry.playerName.trim().slice(0, 16) || 'Anonymous Dev'
              : 'Anonymous Dev',
          })).slice(0, 10)
          : [],
        settings: {
          difficulty: isDifficulty(settings?.difficulty) ? settings.difficulty : 'normal',
          muted: typeof settings?.muted === 'boolean' ? settings.muted : true,
          reducedMotion: Boolean(settings?.reducedMotion),
          highContrast: Boolean(settings?.highContrast),
          largeText: Boolean(settings?.largeText),
        },
        tutorialCompleted: Boolean(parsed.tutorialCompleted),
        achievements: Array.isArray(parsed.achievements)
          ? parsed.achievements.filter((item): item is string => typeof item === 'string')
          : [],
      };
      if (legacyRaw) {
        this.storage.setItem(SAVE_KEY, JSON.stringify(loaded));
        this.storage.removeItem(LEGACY_SAVE_KEY);
      }
      return loaded;
    } catch {
      return structuredClone(defaults);
    }
  }

  private persist(): void {
    try {
      this.storage?.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch {
      // Storage can be unavailable in private browsing; gameplay remains functional.
    }
  }

  getData(): SavedGameData {
    return structuredClone(this.data);
  }

  updateSettings(settings: Partial<GameSettings>): GameSettings {
    this.data.settings = { ...this.data.settings, ...settings };
    this.persist();
    return { ...this.data.settings };
  }

  addHighScore(entry: HighScoreEntry): HighScoreEntry[] {
    this.data.highScores = [...this.data.highScores, entry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    this.persist();
    return [...this.data.highScores];
  }

  qualifiesForHighScore(score: number): boolean {
    return this.data.highScores.length < 10 || score > this.data.highScores[this.data.highScores.length - 1].score;
  }

  unlock(ids: string[]): string[] {
    this.data.achievements = [...new Set([...this.data.achievements, ...ids])];
    this.persist();
    return [...this.data.achievements];
  }

  reset(): void {
    this.data = structuredClone(defaults);
    try {
      this.storage?.removeItem(SAVE_KEY);
      this.storage?.removeItem(LEGACY_SAVE_KEY);
    } catch {
      // Ignore unavailable storage.
    }
  }
}
