import Phaser from 'phaser';
import dialogues from '../../data/dialogues.json';
import { app } from '../managers/AppContext';
import { BaseScene } from './BaseScene';
import { addPerson, colors, textStyle } from '../ui';
import { addPixelCabinet, addPixelChair, addPixelDesk, addPixelPlant, addPixelRoom, drawPixelFloor } from '../pixelArt';

export class LobbyScene extends BaseScene {
  private device?: Phaser.GameObjects.Container;
  private desk?: Phaser.GameObjects.Container;
  constructor() { super('LobbyScene'); }
  create(): void {
    app.state.advanceTime(4);
    this.setupWorld('2 / Arrival', 'Mark attendance, then reach your desk.', 90, 600);
    drawPixelFloor(this, 0xf6edda, 0xe9dec6);
    addPixelRoom(this, 210, 220, 280, 205, colors.cyan, 'ATTENDANCE ZONE');
    addPixelRoom(this, 1030, 220, 300, 205, colors.orange, 'DEVELOPER DESK');
    addPixelRoom(this, 650, 500, 500, 230, colors.purple, 'LOBBY / WAITING FOR DEVICE');
    this.device = this.add.container(330, 250, [
      this.add.rectangle(6, 7, 78, 112, colors.navy, 0.22),
      this.add.rectangle(0, 0, 76, 110, 0x263a4a).setStrokeStyle(5, colors.navy),
      this.add.rectangle(0, -20, 48, 38, colors.cyan).setStrokeStyle(3, colors.navy),
      this.add.rectangle(-10, -20, 6, 6, colors.green), this.add.rectangle(10, -20, 6, 6, colors.green),
      this.add.rectangle(0, 18, 52, 10, 0x90a4ae).setStrokeStyle(2, colors.navy),
      this.add.text(0, 42, 'ATTEND', textStyle(11)).setOrigin(0.5),
    ]).setDepth(4);
    this.desk = addPixelDesk(this, 1080, 215, 210, 'URGENT BUG WAITING');
    addPixelChair(this, 1080, 310, colors.blue);
    addPixelChair(this, 585, 500, colors.purple); addPixelChair(this, 720, 500, colors.orange);
    addPixelPlant(this, 515, 590); addPixelPlant(this, 790, 590);
    addPixelCabinet(this, 155, 500, 'FORMS');
    addPerson(this, 510, 250, colors.purple, 'Queue'); addPerson(this, 760, 470, colors.orange, 'Manager');
    this.add.text(330, 325, 'Press E', textStyle(16, '#071a2b')).setOrigin(0.5);
  }
  update(time: number, delta: number): void {
    this.updateMovement(time, delta);
    if (this.desk && this.isNear(this.desk, 110) && app.state.snapshot.attendanceMarked) {
      this.movementLocked = true;
      this.showDialog('Team Lead', 'Welcome! Production has created a personalized urgent task for you.', () => this.scene.start('CodingScene'));
    }
  }
  protected override interact(): void {
    if (this.device && this.isNear(this.device, 90) && !app.state.snapshot.attendanceMarked) {
      app.state.markAttendance(); app.state.advanceTime(2); app.audio.play('correct'); this.updateObjective('Attendance marked! Reach your desk.');
      this.showDialog('Attendance Device', Phaser.Utils.Array.GetRandom(dialogues.arrival));
    }
  }
}
