import type { Difficulty } from '../types/game';
import difficultyData from '../../data/difficulty.json';

export interface FightBalance {
  playerSpeed: number;
  testerSpeed: number;
  testerDamage: number;
  testerAttackCooldown: number;
  punchDamage: number;
  kickDamage: number;
  blockMultiplier: number;
}

const balanceFor = (difficulty: Difficulty): FightBalance => {
  const config = difficultyData[difficulty];
  return {
    playerSpeed: config.fightPlayerSpeed,
    testerSpeed: config.fightTesterSpeed,
    testerDamage: config.fightTesterDamage,
    testerAttackCooldown: config.fightTesterCooldown,
    punchDamage: config.fightPunchDamage,
    kickDamage: config.fightKickDamage,
    blockMultiplier: config.fightBlockMultiplier,
  };
};

export const FIGHT_BALANCE: Record<Difficulty, FightBalance> = {
  casual: balanceFor('casual'),
  normal: balanceFor('normal'),
  corporate: balanceFor('corporate'),
};

export const applyFightDamage = (health: number, damage: number, multiplier = 1): number =>
  Math.max(0, Math.round(health - damage * multiplier));

export const developerWinsRound = (developerHealth: number, testerHealth: number): boolean =>
  testerHealth <= 0 || (developerHealth > 0 && developerHealth >= testerHealth);
