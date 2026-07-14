import Phaser from 'phaser';
import { app } from '../managers/AppContext';
import { addButton, colors, textStyle } from '../ui';

export class PauseScene extends Phaser.Scene {
  private pausedScene = '';
  constructor() { super('PauseScene'); }
  init(data: { pausedScene: string }): void { this.pausedScene = data.pausedScene; }
  create(): void {
    this.add.rectangle(640, 360, 1280, 720, colors.navy, 0.88).setInteractive();
    this.add.text(640, 130, 'COFFEE BREAK', textStyle(46, '#ffc857')).setOrigin(0.5);
    this.add.text(640, 185, 'The workday is paused. Miracles happen.', textStyle(18)).setOrigin(0.5);
    addButton(this, 640, 275, 'RESUME', () => this.resume(), 340, colors.green);
    addButton(this, 640, 345, 'RESTART STAGE', () => {
      app.state.restoreStageCheckpoint();
      this.scene.stop(this.pausedScene);
      this.scene.stop();
      this.scene.start(this.pausedScene);
    }, 340, colors.blue);
    addButton(this, 640, 415, `SOUND: ${app.audio.isMuted ? 'OFF' : 'ON'}`, () => {
      const muted = !app.audio.isMuted; app.audio.setMuted(muted); app.save.updateSettings({ muted }); this.scene.restart({ pausedScene: this.pausedScene });
    }, 340, colors.purple);
    addButton(this, 640, 485, 'RESTART DAY', () => { app.state.reset(app.save.getData().settings.difficulty, app.state.snapshot.playerName); this.scene.stop(this.pausedScene); this.scene.stop(); this.scene.start('CommuteScene'); }, 340, colors.orange);
    addButton(this, 640, 555, 'MAIN MENU', () => { this.scene.stop(this.pausedScene); this.scene.stop(); this.scene.start('MainMenuScene'); }, 340, colors.navy);
    this.input.keyboard?.once('keydown-ESC', () => this.resume());
  }
  private resume(): void { this.scene.resume(this.pausedScene); this.scene.stop(); }
}
