import { describe, expect, it } from 'vitest';
import { LEGACY_SAVE_KEY, SAVE_KEY, SaveManager } from '../game/managers/SaveManager';

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
}

describe('SaveManager', () => {
  it('recovers from corrupted storage', () => {
    const storage = new MemoryStorage(); storage.setItem(SAVE_KEY, '{not json');
    expect(new SaveManager(storage).getData().settings.difficulty).toBe('normal');
  });
  it('persists settings and validates difficulty', () => {
    const storage = new MemoryStorage(); const save = new SaveManager(storage);
    save.updateSettings({ difficulty: 'corporate', highContrast: true });
    expect(new SaveManager(storage).getData().settings).toMatchObject({ difficulty: 'corporate', highContrast: true });
  });
  it('migrates the legacy branded save key without losing settings', () => {
    const storage = new MemoryStorage();
    storage.setItem(LEGACY_SAVE_KEY, JSON.stringify({
      version: 1,
      highScores: [],
      settings: { difficulty: 'casual', muted: false, reducedMotion: true, highContrast: false, largeText: false },
      tutorialCompleted: true,
      achievements: ['salary-secured'],
    }));
    const save = new SaveManager(storage);
    expect(save.getData().settings).toMatchObject({ difficulty: 'casual', muted: false, reducedMotion: true });
    expect(storage.getItem(SAVE_KEY)).not.toBeNull();
    expect(storage.getItem(LEGACY_SAVE_KEY)).toBeNull();
  });
  it('sorts and limits high scores', () => {
    const save = new SaveManager(new MemoryStorage());
    for (let score = 0; score < 12; score += 1) save.addHighScore({ playerName: `Dev ${score}`, score, rank: 'D', difficulty: 'normal', completedAt: 'now', arrivalTime: '10:00 AM', exitTime: '07:00 PM' });
    expect(save.getData().highScores).toHaveLength(10);
    expect(save.getData().highScores[0].score).toBe(11);
    expect(save.qualifiesForHighScore(0)).toBe(false);
    expect(save.qualifiesForHighScore(50)).toBe(true);
  });
});
