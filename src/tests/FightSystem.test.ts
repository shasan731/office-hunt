import { describe, expect, it } from 'vitest';
import { applyFightDamage, developerWinsRound, FIGHT_BALANCE } from '../game/systems/FightSystem';

describe('fight system', () => {
  it('scales the tester across every difficulty', () => {
    expect(FIGHT_BALANCE.casual.testerSpeed).toBeLessThan(FIGHT_BALANCE.normal.testerSpeed);
    expect(FIGHT_BALANCE.normal.testerSpeed).toBeLessThan(FIGHT_BALANCE.corporate.testerSpeed);
    expect(FIGHT_BALANCE.casual.testerDamage).toBeLessThan(FIGHT_BALANCE.normal.testerDamage);
    expect(FIGHT_BALANCE.normal.testerDamage).toBeLessThan(FIGHT_BALANCE.corporate.testerDamage);
    expect(FIGHT_BALANCE.casual.testerAttackCooldown).toBeGreaterThan(FIGHT_BALANCE.corporate.testerAttackCooldown);
  });

  it('reduces blocked damage and never creates negative health', () => {
    expect(applyFightDamage(100, 20)).toBe(80);
    expect(applyFightDamage(100, 20, 0.25)).toBe(95);
    expect(applyFightDamage(5, 20)).toBe(0);
  });

  it('awards timeout ties to the developer', () => {
    expect(developerWinsRound(40, 40)).toBe(true);
    expect(developerWinsRound(39, 40)).toBe(false);
    expect(developerWinsRound(1, 0)).toBe(true);
  });
});
