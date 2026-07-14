import Phaser from 'phaser';
import achievements from '../../data/achievements.json';
import dialogues from '../../data/dialogues.json';
import { app } from '../managers/AppContext';
import { calculateAchievements } from '../systems/AchievementSystem';
import { rankForScore } from '../systems/ScoringSystem';
import { addButton, applyPixelPolish, colors, textStyle } from '../ui';

export class ResultsScene extends Phaser.Scene {
  constructor() { super('ResultsScene'); }
  create(): void {
    app.state.beginStage('results');
    const state = app.state.snapshot;
    calculateAchievements(state).forEach((id) => app.state.unlock(id));
    app.save.unlock(app.state.snapshot.unlockedThisRun);
    const rank = rankForScore(state.score, state.salaryCollected);
    const previousBest = app.save.getData().highScores[0]?.score ?? -1;
    const madeHighScore = app.save.qualifiesForHighScore(state.score);
    if (madeHighScore) app.save.addHighScore({ playerName: state.playerName, score: state.score, rank, difficulty: state.difficulty, completedAt: new Date().toISOString(), arrivalTime: state.arrivalTime, exitTime: state.exitTime });
    this.cameras.main.setBackgroundColor('#071a2b');
    this.add.circle(155, 125, 160, colors.cyan, 0.1); this.add.circle(1110, 590, 250, colors.purple, 0.12);
    this.add.text(640, 48, 'WORKDAY COMPLETE', textStyle(24, '#39d8e8')).setOrigin(0.5);
    this.add.text(640, 92, rank, textStyle(43, '#ffc857')).setOrigin(0.5);
    this.add.text(640, 145, `${state.playerName} • ${state.score.toLocaleString()} POINTS${state.score > previousBest ? '  •  NEW #1!' : madeHighScore ? '  •  TOP TEN!' : ''}`, textStyle(24)).setOrigin(0.5);
    this.add.rectangle(370, 382, 580, 410, 0x102f43).setStrokeStyle(3, colors.cyan);
    const breakdown = [
      ['Arrival', state.arrivalTime], ['Attendance', state.attendanceMarked ? 'Marked ✓' : 'Missing'],
      ['Coding', `${state.bugsFixed} fixed / ${state.bugsMissed} missed`], ['Break quests', `${state.lunchCompleted && state.teaQuestCompleted ? '2/2 complete' : 'Incomplete'}`],
      ['HR clues', String(state.clues)],
      ['Salary', state.salaryCollected ? 'Collected ✓' : 'Not found'], ['Exit', state.exitTime],
      ['Support attacks', `${state.supportCaught} caught`], ['Bonuses', `+${state.bonuses}`], ['Penalties', `-${state.penalties}`],
    ];
    breakdown.forEach(([label, value], i) => {
      this.add.text(125, 205 + i * 37, label.toUpperCase(), textStyle(15, '#94b8c8'));
      this.add.text(580, 205 + i * 37, value, textStyle(17)).setOrigin(1, 0);
    });
    this.add.rectangle(950, 382, 480, 410, 0x102f43).setStrokeStyle(3, colors.purple);
    this.add.text(740, 195, 'ACHIEVEMENTS UNLOCKED', textStyle(18, '#ffc857'));
    const unlocked = app.state.snapshot.unlockedThisRun;
    const names = unlocked.length ? unlocked.map((id) => achievements.find((item) => item.id === id)?.name ?? id).join('\n✓ ') : 'No new achievements—tomorrow awaits.';
    this.add.text(740, 235, `${unlocked.length ? '✓ ' : ''}${names}`, { ...textStyle(17), lineSpacing: 9, wordWrap: { width: 390 } });
    this.add.text(950, 485, Phaser.Utils.Array.GetRandom(dialogues.results), { ...textStyle(17, '#39d8e8'), align: 'center', wordWrap: { width: 380 } }).setOrigin(0.5);
    addButton(this, 860, 630, 'PLAY AGAIN', () => this.scene.start('NameEntryScene'), 260, colors.orange);
    addButton(this, 1135, 630, 'MAIN MENU', () => this.scene.start('MainMenuScene'), 240, colors.blue);
    applyPixelPolish(this, colors.yellow);
  }
}
