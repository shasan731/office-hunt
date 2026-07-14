import Phaser from 'phaser';
import dialogues from '../../data/dialogues.json';
import { app } from '../managers/AppContext';
import { addInteractionBeacon, burstParticles, juiceText, playPersonReaction, pulseObject } from '../effects';
import { BaseScene } from './BaseScene';
import { addPerson, colors, textStyle } from '../ui';
import { addPixelPlant, drawPixelFloor } from '../pixelArt';

export class LobbyScene extends BaseScene {
  private flight = 0;
  private stairs: Phaser.GameObjects.Container[] = [];
  private device?: Phaser.GameObjects.Container;
  private technician?: Phaser.GameObjects.Container;
  private technicianSpoken = false;
  private emergencySnack?: Phaser.GameObjects.Container;
  private snackFound = false;

  constructor() { super('LobbyScene'); }

  create(): void {
    this.flight = 0;
    this.stairs = [];
    this.device = undefined;
    this.technician = undefined; this.technicianSpoken = false; this.emergencySnack = undefined; this.snackFound = false;
    this.setupWorld('LEVEL 1 / FIVE FLIGHTS', 'Climb flight 1 of 5. Follow the glowing stair sign and press E.', 90, 610);
    this.drawStairwell();
  }

  update(time: number, delta: number): void { this.updateMovement(time, delta, 205); }

  protected override interact(): void {
    if (this.technician && !this.technicianSpoken && this.isNear(this.technician, 80)) {
      this.technicianSpoken = true; playPersonReaction(this, this.technician, 'confused');
      this.showDialog('Lift Technician', 'The lift is not broken. It is practicing work-life balance. The stairs have volunteered to cover its shift.');
      return;
    }
    if (this.emergencySnack && !this.snackFound && this.isNear(this.emergencySnack, 76)) {
      this.snackFound = true; this.emergencySnack.setVisible(false); app.state.changeEnergy(8); app.state.addScore(50); app.audio.play('correct');
      burstParticles(this, this.emergencySnack.x, this.emergencySnack.y, [colors.yellow, colors.orange, colors.white]);
      juiceText(this, this.emergencySnack.x, this.emergencySnack.y - 45, 'STAIR SNACK +8 ENERGY');
      this.showDialog('Emergency Biscuit', 'You found the legally mandated stairwell biscuit. Best-before date: emotionally complicated.');
      return;
    }
    if (this.flight < 5) {
      const stair = this.stairs[this.flight];
      if (!stair || !this.isNear(stair, 90)) return;
      stair.setAlpha(0.42);
      this.flight += 1;
      app.state.advanceTime(1);
      app.state.addScore(20);
      app.audio.play('correct');
      burstParticles(this, stair.x, stair.y, [colors.cyan, colors.yellow, colors.white], 10, 55);
      if (this.player) playPersonReaction(this, this.player, 'celebrate');
      if (this.flight < 5) {
        this.stairs[this.flight].setScale(1.08);
        this.updateObjective(`Flight ${this.flight} cleared. Find flight ${this.flight + 1} of 5 and press E.`);
        this.showDialog('Stairwell', Phaser.Utils.Array.GetRandom([
          `Floor ${this.flight}: the lift passes by without making eye contact.`,
          `Flight ${this.flight} complete. Your legs have opened a support ticket.`,
          `Only ${5 - this.flight} flight${5 - this.flight === 1 ? '' : 's'} left. The stairs remain emotionally unavailable.`,
        ]));
      } else {
        this.device?.setAlpha(1).setScale(1.08);
        this.updateObjective('All five flights cleared! Reach the attendance device and press E before 10:00 AM.');
        this.showDialog('Stairwell', 'Five flights complete. The lift congratulates you from a comfortable distance.');
      }
      this.refreshHud();
      return;
    }

    if (!this.device || !this.isNear(this.device, 90) || app.state.snapshot.attendanceMarked) return;
    app.state.markAttendance();
    app.state.advanceTime(1);
    const points = app.state.recordArrival();
    if (app.state.snapshot.minutes < 600) app.state.unlock('perfect-attendance');
    app.audio.play('correct');
    if (this.player) playPersonReaction(this, this.player, 'celebrate');
    const timing = points >= 500 ? 'Attendance accepted before HR refreshed the dashboard.' : points > 0 ? 'Attendance accepted. The clock looked away politely.' : 'Attendance accepted late. Traffic has been selected as your official explanation.';
    this.showDialog('Attendance Device', `${Phaser.Utils.Array.GetRandom(dialogues.arrival)} ${timing} ${points >= 0 ? '+' : ''}${points} points.`, () => this.scene.start('CodingScene'));
  }

  private drawStairwell(): void {
    drawPixelFloor(this, 0xd8e4ea, 0xbacbd4);
    this.add.rectangle(640, 385, 1120, 520, 0x5b6d7a, 0.2).setStrokeStyle(6, colors.navy).setDepth(-7);
    const positions = [
      { x: 1090, y: 610 }, { x: 1090, y: 500 }, { x: 190, y: 390 }, { x: 1090, y: 280 }, { x: 190, y: 170 },
    ];
    positions.forEach((position, index) => {
      const stair = this.add.container(position.x, position.y, [
        this.add.rectangle(7, 8, 145, 78, colors.navy, 0.25),
        this.add.rectangle(0, 0, 142, 75, index === 0 ? colors.yellow : colors.blue, 0.92).setStrokeStyle(5, colors.navy),
        ...Array.from({ length: 5 }, (_, step) => this.add.rectangle(-45 + step * 22, 22 - step * 10, 25, 9, 0xe7edf0).setStrokeStyle(2, colors.navy)),
        this.add.text(0, -25, `FLIGHT ${index + 1} • E`, textStyle(12, '#071a2b')).setOrigin(0.5),
      ]).setDepth(4);
      if (index > 0) stair.setScale(0.96);
      if (index === 0) pulseObject(this, stair);
      this.stairs.push(stair);
    });
    const rails = [
      [640, 555, 760, 8], [640, 445, 760, 8], [640, 335, 760, 8], [640, 225, 760, 8],
    ];
    rails.forEach(([x, y, width, height]) => this.add.rectangle(x, y, width, height, colors.navy, 0.42).setDepth(-2));
    addPixelPlant(this, 70, 160); addPixelPlant(this, 1200, 610);
    this.device = this.add.container(640, 155, [
      this.add.rectangle(7, 8, 100, 105, colors.navy, 0.25),
      this.add.rectangle(0, 0, 98, 103, 0x263a4a).setStrokeStyle(5, colors.navy),
      this.add.rectangle(0, -18, 62, 40, colors.cyan).setStrokeStyle(3, colors.navy),
      this.add.rectangle(-14, -18, 7, 7, colors.green), this.add.rectangle(14, -18, 7, 7, colors.green),
      this.add.text(0, 28, 'ATTEND • E', textStyle(11)).setOrigin(0.5),
    ]).setDepth(5).setAlpha(0.42);
    addInteractionBeacon(this, 640, 92, 'ATTEND', colors.green);
    this.technician = addPerson(this, 455, 170, colors.purple, 'LIFT TECHNICIAN').setScale(0.82).setDepth(7);
    addInteractionBeacon(this, 455, 98, 'ASK', colors.purple);
    this.emergencySnack = this.add.container(1185, 165, [
      this.add.rectangle(0, 0, 42, 30, 0xc98b3c).setStrokeStyle(3, colors.navy),
      this.add.rectangle(-8, -5, 5, 5, 0x5d4037), this.add.rectangle(9, 6, 5, 5, 0x5d4037),
      this.add.text(0, 28, 'SECRET', textStyle(9, '#7c5ce7')).setOrigin(0.5),
    ]).setDepth(7);
    pulseObject(this, this.emergencySnack);
    this.add.text(640, 645, 'THE LIFT IS “CURRENTLY IN A MEETING.”', textStyle(14, '#071a2b')).setOrigin(0.5);
  }
}
