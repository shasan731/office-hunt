import balance from '../../data/gameBalance.json';
import { WORKDAY_SCHEDULE } from '../../config/constants';

export const arrivalScore = (minutes: number): number => {
  if (minutes < WORKDAY_SCHEDULE.officeStart) return balance.arrivalEarly;
  if (minutes <= WORKDAY_SCHEDULE.officeStart + 15) return balance.arrivalOkay;
  return balance.arrivalLate;
};

export const exitScore = (minutes: number): number => {
  if (minutes >= WORKDAY_SCHEDULE.officeEnd && minutes <= WORKDAY_SCHEDULE.bestExitEnd) return balance.exitBest;
  if (minutes > WORKDAY_SCHEDULE.overtimePenaltyStart) return balance.exitLate;
  return 0;
};

export const rankForScore = (score: number, salaryCollected = true): string => {
  if (!salaryCollected) return 'F — Still Looking for HR';
  if (score >= 3000) return 'S — Office Escape Artist';
  if (score >= 2400) return 'A — Senior Salary Hunter';
  if (score >= 1700) return 'B — Reliable Employee';
  if (score >= 1000) return 'C — Meeting Survivor';
  return 'D — Overtime Intern';
};
