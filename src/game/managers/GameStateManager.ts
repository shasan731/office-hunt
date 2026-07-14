import type { Difficulty, GameState, Stage } from '../types/game';
import { arrivalScore, exitScore } from '../systems/ScoringSystem';
import { formatTime } from './TimeManager';
import { WORKDAY_SCHEDULE } from '../../config/constants';

export class GameStateManager {
  private state!: GameState;
  private stageCheckpoint?: GameState;

  constructor(difficulty: Difficulty = 'normal') {
    this.reset(difficulty);
  }

  reset(difficulty: Difficulty, playerName = 'Anonymous Dev'): void {
    this.state = {
      playerName: playerName.trim().slice(0, 16) || 'Anonymous Dev',
      stage: 'commute', minutes: WORKDAY_SCHEDULE.commuteStart, energy: 100, score: 0,
      arrivalTime: '--', codingScore: 0, bugsFixed: 0, bugsMissed: 0,
      salaryCollected: false, exitTime: '--', penalties: 0, bonuses: 0,
      clues: 0, clueSources: [], teaBreaks: 0, managerCaught: 0, supportCaught: 0, meetingsHit: 0,
      attendanceMarked: false, lunchCompleted: false, teaQuestCompleted: false,
      difficulty, unlockedThisRun: [],
    };
    this.stageCheckpoint = undefined;
  }

  get snapshot(): Readonly<GameState> { return this.state; }
  beginStage(stage: Stage): void {
    this.state.stage = stage;
    this.stageCheckpoint = structuredClone(this.state);
  }
  restoreStageCheckpoint(): boolean {
    if (!this.stageCheckpoint || this.stageCheckpoint.stage !== this.state.stage) return false;
    this.state = structuredClone(this.stageCheckpoint);
    return true;
  }
  advanceTime(minutes: number): void { this.state.minutes += minutes; }
  setTime(minutes: number): void { this.state.minutes = minutes; }
  changeEnergy(value: number): void { this.state.energy = Math.min(100, Math.max(0, this.state.energy + value)); }

  addScore(value: number): void {
    this.state.score = Math.max(0, this.state.score + value);
    if (value >= 0) this.state.bonuses += value;
    else this.state.penalties += Math.abs(value);
  }

  recordArrival(): number {
    this.state.arrivalTime = formatTime(this.state.minutes);
    const points = arrivalScore(this.state.minutes);
    this.addScore(points);
    return points;
  }

  recordExit(): number {
    this.state.exitTime = formatTime(this.state.minutes);
    const points = exitScore(this.state.minutes);
    this.addScore(points);
    return points;
  }

  markAttendance(): void { this.state.attendanceMarked = true; }
  completeLunch(): void { this.state.lunchCompleted = true; this.changeEnergy(25); this.addScore(250); }
  completeTeaQuest(): void { this.state.teaQuestCompleted = true; this.state.teaBreaks += 1; this.changeEnergy(20); this.addScore(200); }
  recordBug(correct: boolean): void {
    if (correct) { this.state.bugsFixed += 1; this.state.codingScore += 150; this.addScore(150); }
    else { this.state.bugsMissed += 1; this.state.codingScore = Math.max(0, this.state.codingScore - 75); this.addScore(-75); }
  }
  addClue(sourceId?: string): boolean {
    if (sourceId && this.state.clueSources.includes(sourceId)) return false;
    if (sourceId) this.state.clueSources.push(sourceId);
    this.state.clues += 1;
    this.addScore(50);
    return true;
  }
  collectSalary(): void { this.state.salaryCollected = true; this.addScore(1000); }
  addTea(): void { this.state.teaBreaks += 1; this.changeEnergy(18); this.advanceTime(3); this.addScore(-25); }
  caughtByManager(): void { this.state.managerCaught += 1; this.advanceTime(4); this.addScore(-100); }
  caughtBySupport(): void { this.state.supportCaught += 1; this.advanceTime(3); this.changeEnergy(-8); this.addScore(-75); }
  hitMeeting(): void { this.state.meetingsHit += 1; this.advanceTime(3); }
  unlock(id: string): void { if (!this.state.unlockedThisRun.includes(id)) this.state.unlockedThisRun.push(id); }
}
