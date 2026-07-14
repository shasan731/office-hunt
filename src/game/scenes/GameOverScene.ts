import Phaser from 'phaser';
import { app } from '../managers/AppContext';
import { addPixelVehicle } from '../pixelArt';
import { addButton, addPerson, applyPixelPolish, colors, textStyle } from '../ui';

export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  create(): void {
    this.cameras.main.setBackgroundColor('#160d19');
    for (let y = 95; y < 720; y += 40) {
      for (let x = (y / 40) % 2 ? 20 : 0; x < 1280; x += 80) {
        this.add.rectangle(x, y, 40, 40, 0x321a30, 0.6).setDepth(-5);
      }
    }
    this.add.rectangle(640, 360, 1080, 560, 0x071a2b, 0.96).setStrokeStyle(6, colors.orange);
    this.add.rectangle(640, 116, 1080, 28, colors.orange);
    this.add.text(640, 165, 'COMMUTE FAILED', textStyle(22, '#ff9b7f')).setOrigin(0.5);
    this.add.text(640, 225, 'YOU ARE LATE TO THE OFFICE', textStyle(44, '#ffc857')).setOrigin(0.5);
    this.add.text(640, 278, 'A pixel car ended the commute. HR has marked you permanently absent.', textStyle(18, '#d9eef7')).setOrigin(0.5);

    const employee = addPerson(this, 465, 400, colors.blue, app.state.snapshot.playerName).setScale(1.55).setRotation(1.35).setAlpha(0.48);
    addPixelVehicle(this, 760, 390, colors.orange, 'car', -1).setScale(-1.65, 1.65);
    this.add.text(640, 490, `Final commute score: ${app.state.snapshot.score}  •  Arrival: MISSED`, textStyle(18, '#94b8c8')).setOrigin(0.5);

    addButton(this, 500, 575, 'RETRY COMMUTE', () => this.retry(), 310, colors.green);
    addButton(this, 835, 575, 'MAIN MENU', () => this.scene.start('MainMenuScene'), 290, colors.purple);
    this.add.text(640, 620, 'ENTER: retry  •  ESC: main menu', textStyle(14, '#94b8c8')).setOrigin(0.5);
    applyPixelPolish(this, colors.orange);

    this.input.keyboard?.once('keydown-ENTER', () => this.retry());
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('MainMenuScene'));
    employee.setDepth(4);
  }

  private retry(): void {
    app.state.reset(app.state.snapshot.difficulty, app.state.snapshot.playerName);
    this.scene.start('CommuteScene');
  }
}
