import { describe, expect, it } from 'vitest';
import difficulty from '../data/difficulty.json';
import { GameStateManager } from '../game/managers/GameStateManager';
import { calculateAchievements } from '../game/systems/AchievementSystem';
import { WORKDAY_SCHEDULE } from '../config/constants';

describe('game systems', () => {
  it('makes each difficulty meaningfully easier or harder', () => {
    expect(difficulty.casual.hazardSpeed).toBeLessThan(difficulty.normal.hazardSpeed);
    expect(difficulty.corporate.hazardSpeed).toBeGreaterThan(difficulty.normal.hazardSpeed);
    expect(difficulty.casual.playerSpeed).toBeGreaterThan(difficulty.normal.playerSpeed);
    expect(difficulty.corporate.playerSpeed).toBeLessThan(difficulty.normal.playerSpeed);
    expect(difficulty.casual.codingCount).toBeLessThan(difficulty.normal.codingCount);
    expect(difficulty.corporate.codingCount).toBeGreaterThan(difficulty.normal.codingCount);
    expect(difficulty.casual.supportMaxActive).toBe(1);
    expect(difficulty.corporate.supportMaxActive).toBe(3);
  });
  it('defines the requested office and break schedule', () => {
    expect(WORKDAY_SCHEDULE).toMatchObject({ officeStart: 600, lunchStart: 840, lunchEnd: 900, fightStart: 915, fightEnd: 975, teaStart: 990, teaEnd: 1005, salaryHuntStart: 1125, officeEnd: 1140 });
  });
  it('moves through state and records performance', () => {
    const game = new GameStateManager('casual'); game.beginStage('coding'); game.recordBug(true); game.recordBug(false); game.caughtBySupport();
    expect(game.snapshot.stage).toBe('coding'); expect(game.snapshot.bugsFixed).toBe(1); expect(game.snapshot.bugsMissed).toBe(1);
    expect(game.snapshot.supportCaught).toBe(1); expect(game.snapshot.energy).toBe(92);
  });
  it('restores the stage-entry checkpoint without duplicating rewards', () => {
    const game = new GameStateManager('normal');
    game.beginStage('lunch');
    game.completeLunch();
    game.caughtBySupport();
    expect(game.snapshot.score).toBe(175);
    expect(game.restoreStageCheckpoint()).toBe(true);
    expect(game.snapshot).toMatchObject({ stage: 'lunch', score: 0, energy: 100, lunchCompleted: false, supportCaught: 0 });
  });
  it('awards a clue source only once', () => {
    const game = new GameStateManager('normal');
    expect(game.addClue('qa')).toBe(true);
    expect(game.addClue('qa')).toBe(false);
    expect(game.addClue('accounts')).toBe(true);
    expect(game.snapshot).toMatchObject({ clues: 2, score: 100, clueSources: ['qa', 'accounts'] });
  });
  it('records a tester-fight victory once and converts damage to energy loss', () => {
    const game = new GameStateManager('normal');
    game.completeTesterFight(64);
    game.completeTesterFight(100);
    expect(game.snapshot).toMatchObject({ testerDefeated: true, fightHealthRemaining: 64, energy: 93, score: 528 });
  });
  it('unlocks achievements from a completed state', () => {
    const game = new GameStateManager('corporate'); game.recordArrival(); game.recordBug(true); game.collectSalary(); game.setTime(1141); game.recordExit();
    expect(calculateAchievements(game.snapshot)).toEqual(expect.arrayContaining(['perfect-attendance', 'bug-destroyer', 'salary-secured', 'six-clock-ninja', 'corporate-survivor']));
  });
});
