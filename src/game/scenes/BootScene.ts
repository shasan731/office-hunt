import Phaser from 'phaser';
import { applyPixelPolish, colors, textStyle } from '../ui';

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create(): void {
    this.cameras.main.setBackgroundColor(colors.navy);
    this.add.text(640, 285, 'OFFICE HUNT', textStyle(62, '#ffc857')).setOrigin(0.5);
    const messages = ['Compiling office politics…', 'Searching for HR…', 'Installing one small change…', 'Restarting attendance device…', 'Warming the tea…', 'Resolving merge conflicts…', 'Avoiding quick meetings…', 'Checking payroll cache…', 'Loading traffic…', 'Planning the escape…'];
    const message = this.add.text(640, 430, Phaser.Utils.Array.GetRandom(messages), textStyle(19)).setOrigin(0.5);
    const bar = this.add.rectangle(390, 490, 0, 12, colors.green).setOrigin(0, 0.5);
    this.tweens.add({ targets: bar, displayWidth: 500, duration: 900, ease: 'Sine.easeInOut' });
    this.time.delayedCall(450, () => message.setText(Phaser.Utils.Array.GetRandom(messages)));
    this.time.delayedCall(1000, () => this.scene.start('MainMenuScene'));
    applyPixelPolish(this);
  }
}
