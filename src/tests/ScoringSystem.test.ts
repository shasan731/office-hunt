import { describe, expect, it } from 'vitest';
import { arrivalScore, exitScore, rankForScore } from '../game/systems/ScoringSystem';

describe('scoring', () => {
  it('applies arrival bands', () => {
    expect(arrivalScore(599)).toBe(500);
    expect(arrivalScore(610)).toBe(250);
    expect(arrivalScore(616)).toBe(-300);
  });
  it('applies exit bands', () => {
    expect(exitScore(1140)).toBe(500);
    expect(exitScore(1151)).toBe(0);
    expect(exitScore(1156)).toBe(-250);
  });
  it('returns ranks and salary failure', () => {
    expect(rankForScore(3100)).toContain('Office Escape Artist');
    expect(rankForScore(999)).toContain('Overtime Intern');
    expect(rankForScore(9000, false)).toContain('Still Looking for HR');
  });
});
