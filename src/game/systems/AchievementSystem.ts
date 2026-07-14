import type { GameState } from '../types/game';
import { WORKDAY_SCHEDULE } from '../../config/constants';

export const calculateAchievements = (state: Readonly<GameState>): string[] => {
  const unlocked: string[] = [];
  if (state.minutes && state.arrivalTime !== '--' && parseArrival(state.arrivalTime) < 600) unlocked.push('perfect-attendance');
  if (state.bugsFixed > 0 && state.bugsMissed === 0) unlocked.push('bug-destroyer');
  if (state.testerDefeated) unlocked.push('qa-approved');
  if (state.clues <= 3 && state.salaryCollected) unlocked.push('hr-detective');
  if (state.salaryCollected) unlocked.push('salary-secured');
  const exit = parseArrival(state.exitTime);
  if (exit >= WORKDAY_SCHEDULE.officeEnd && exit <= WORKDAY_SCHEDULE.officeEnd + 2) unlocked.push('six-clock-ninja');
  if (state.meetingsHit === 0) unlocked.push('meeting-dodger');
  if (state.teaQuestCompleted && state.exitTime !== '--') unlocked.push('tea-powered');
  if (state.difficulty === 'corporate' && state.exitTime !== '--') unlocked.push('corporate-survivor');
  if (state.bugsMissed >= 2 && state.exitTime !== '--') unlocked.push('works-machine');
  return unlocked;
};

const parseArrival = (time: string): number => {
  const match = /^(\d+):(\d+) (AM|PM)$/.exec(time);
  if (!match) return -1;
  let hour = Number(match[1]) % 12;
  if (match[3] === 'PM') hour += 12;
  return hour * 60 + Number(match[2]);
};
