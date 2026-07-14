import Phaser from 'phaser';
import { app } from '../managers/AppContext';
import type { Difficulty } from '../types/game';
import { addButton, addPerson, colors, textStyle } from '../ui';
import difficultyData from '../../data/difficulty.json';

export class MainMenuScene extends Phaser.Scene {
  private panel?: Phaser.GameObjects.Container;
  constructor() { super('MainMenuScene'); }

  create(): void {
    this.cameras.main.setBackgroundColor('#a9edf0');
    for (let i = 0; i < 12; i += 1) this.add.circle(i * 120 + 30, 680 - (i % 3) * 18, 75, i % 2 ? colors.cyan : colors.green, 0.18);
    this.add.rectangle(920, 380, 540, 480, colors.white, 0.92).setStrokeStyle(5, colors.navy);
    this.add.text(650, 125, 'SALARY\nCHASE', { ...textStyle(72, '#071a2b'), lineSpacing: -10 });
    this.add.text(654, 320, 'Code. Chase HR. Escape on time.', textStyle(20, '#7c5ce7'));
    addPerson(this, 270, 390, colors.blue).setScale(2.8);
    this.add.rectangle(275, 570, 420, 80, colors.yellow).setStrokeStyle(4, colors.navy);
    this.add.text(275, 570, 'TODAY: PAYROLL DAY!', textStyle(25, '#071a2b')).setOrigin(0.5);
    addButton(this, 920, 390, 'PLAY', () => this.startGame(), 360, colors.orange);
    addButton(this, 810, 465, 'HOW TO PLAY', () => this.showHowTo(), 160, colors.blue);
    addButton(this, 1030, 465, 'SETTINGS', () => this.showSettings(), 160, colors.purple);
    addButton(this, 810, 535, 'HIGH SCORES', () => this.showScores(), 160, colors.green);
    addButton(this, 1030, 535, 'CREDITS', () => this.showCredits(), 160, colors.navy);
    this.add.text(920, 595, `Difficulty: ${app.save.getData().settings.difficulty.toUpperCase()}`, textStyle(17, '#071a2b')).setOrigin(0.5).setName('difficulty-label');
    this.input.keyboard?.on('keydown-ENTER', () => this.startGame());
  }

  private startGame(): void {
    this.scene.start('NameEntryScene');
  }

  private openPanel(title: string): Phaser.GameObjects.Container {
    this.panel?.destroy();
    const shade = this.add.rectangle(0, 0, 1280, 720, colors.navy, 0.82).setInteractive();
    const box = this.add.rectangle(0, 0, 850, 560, colors.white).setStrokeStyle(5, colors.cyan);
    const heading = this.add.text(0, -235, title, textStyle(34, '#071a2b')).setOrigin(0.5);
    const close = addButton(this, 0, 235, 'BACK', () => { this.panel?.destroy(); this.panel = undefined; }, 180, colors.orange);
    this.panel = this.add.container(640, 360, [shade, box, heading, close]).setDepth(200);
    return this.panel;
  }

  private showHowTo(): void {
    const panel = this.openPanel('HOW TO PLAY');
    const copy = [
      'MOVE  Arrow keys / WASD / touch pad', 'INTERACT  E / Space / orange touch button',
      'PAUSE  Escape / HUD pause button', '', 'Reach the office, mark attendance, fix urgent code,',
      'survive lunch and tea, locate HR, collect salary, and', 'escape between 7:00 and 7:10 PM for the best score.', '',
      'Collisions waste time, not limbs. Tea restores energy.',
    ].join('\n');
    panel.add(this.add.text(-360, -170, copy, { ...textStyle(20, '#071a2b'), lineSpacing: 10 }));
  }

  private showSettings(): void {
    const panel = this.openPanel('SETTINGS');
    const settings = app.save.getData().settings;
    const difficulties: Difficulty[] = ['casual', 'normal', 'corporate'];
    difficulties.forEach((difficulty, index) => panel.add(addButton(this, -230 + index * 230, -150, difficulty.toUpperCase(), () => {
      app.save.updateSettings({ difficulty }); this.scene.restart();
    }, 190, settings.difficulty === difficulty ? colors.orange : colors.blue)));
    panel.add(this.add.text(0, -105, difficultyData[settings.difficulty].description, textStyle(14, '#425466')).setOrigin(0.5));
    const toggles: Array<[string, 'muted' | 'reducedMotion' | 'highContrast' | 'largeText']> = [
      ['SOUND', 'muted'], ['REDUCED MOTION', 'reducedMotion'], ['HIGH CONTRAST', 'highContrast'], ['LARGE TEXT', 'largeText'],
    ];
    toggles.forEach(([label, key], index) => {
      const enabled = key === 'muted' ? !settings.muted : settings[key];
      panel.add(addButton(this, index % 2 ? 210 : -210, -50 + Math.floor(index / 2) * 85, `${label}: ${enabled ? 'ON' : 'OFF'}`, () => {
        const value = key === 'muted' ? !settings.muted : !settings[key];
        app.save.updateSettings({ [key]: value });
        if (key === 'muted') app.audio.setMuted(value);
        if (key === 'highContrast') document.body.classList.toggle('high-contrast', value);
        if (key === 'largeText') document.body.classList.toggle('large-text', value);
        this.showSettings();
      }, 340, enabled ? colors.green : colors.navy));
    });
    panel.add(addButton(this, 0, 155, 'RESET PROGRESS', () => {
      if (window.confirm('Reset scores, achievements, and settings?')) { app.save.reset(); this.scene.restart(); }
    }, 280, colors.orange));
  }

  private showScores(): void {
    const panel = this.openPanel('HIGH SCORES');
    const scores = app.save.getData().highScores;
    const copy = scores.length ? scores.map((entry, i) => `${i + 1}.  ${entry.playerName.padEnd(16, ' ')} ${entry.score.toString().padStart(4, '0')}  ${entry.rank.split(' — ')[0]}`).join('\n') : 'No completed workdays yet.\nHR remains undefeated.';
    panel.add(this.add.text(-300, -175, copy, { ...textStyle(20, '#071a2b'), lineSpacing: 12 }));
  }

  private showCredits(): void {
    const panel = this.openPanel('CREDITS');
    panel.add(this.add.text(0, -40, 'Designed and built as an original\nfictional workplace comedy.\n\nProgrammatic art • Synthesized sound\nNo remote assets • No tracking', { ...textStyle(22, '#071a2b'), align: 'center', lineSpacing: 8 }).setOrigin(0.5));
  }
}
