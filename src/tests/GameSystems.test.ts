import { describe, expect, it } from 'vitest';
import difficulty from '../data/difficulty.json';
import { GameStateManager } from '../game/managers/GameStateManager';
import { calculateAchievements } from '../game/systems/AchievementSystem';
import { WORKDAY_SCHEDULE } from '../config/constants';

describe('game systems', () => {
  it('contains all difficulty modes in increasing speed', () => {
    expect(difficulty.casual.speed).toBeLessThan(difficulty.normal.speed);
    expect(difficulty.corporate.speed).toBeGreaterThan(difficulty.normal.speed);
  });
  it('defines the requested office and break schedule', () => {
    expect(WORKDAY_SCHEDULE).toMatchObject({ officeStart: 600, lunchStart: 840, lunchEnd: 900, teaStart: 990, teaEnd: 1005, salaryHuntStart: 1125, officeEnd: 1140 });
  });
  it('moves through state and records performance', () => {
    const game = new GameStateManager('casual'); game.setStage('coding'); game.recordBug(true); game.recordBug(false); game.caughtBySupport();
    expect(game.snapshot.stage).toBe('coding'); expect(game.snapshot.bugsFixed).toBe(1); expect(game.snapshot.bugsMissed).toBe(1);
    expect(game.snapshot.supportCaught).toBe(1); expect(game.snapshot.energy).toBe(92);
  });
  it('unlocks achievements from a completed state', () => {
    const game = new GameStateManager('corporate'); game.recordArrival(); game.recordBug(true); game.collectSalary(); game.setTime(1141); game.recordExit();
    expect(calculateAchievements(game.snapshot)).toEqual(expect.arrayContaining(['perfect-attendance', 'bug-destroyer', 'salary-secured', 'six-clock-ninja', 'corporate-survivor']));
  });
});
