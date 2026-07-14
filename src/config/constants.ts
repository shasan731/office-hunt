export const WORKDAY_SCHEDULE = {
  commuteStart: 9 * 60 + 45,
  officeStart: 10 * 60,
  lunchStart: 14 * 60,
  lunchEnd: 15 * 60,
  teaStart: 16 * 60 + 30,
  teaEnd: 16 * 60 + 45,
  salaryHuntStart: 18 * 60 + 45,
  officeEnd: 19 * 60,
  bestExitEnd: 19 * 60 + 10,
  overtimePenaltyStart: 19 * 60 + 15,
} as const;
