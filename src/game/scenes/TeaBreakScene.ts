import Phaser from 'phaser';
import { app } from '../managers/AppContext';
import { BaseScene } from './BaseScene';
import { addPerson, animatePerson, colors, textStyle } from '../ui';
import { WORKDAY_SCHEDULE } from '../../config/constants';
import { addPixelCabinet, addPixelCounter, addPixelDesk, addPixelRoom, drawPixelFloor } from '../pixelArt';

interface TeaPart {
  name: string;
  object: Phaser.GameObjects.Container;
  collected: boolean;
  quip: string;
}

interface MeetingInvite {
  person: Phaser.GameObjects.Container;
  direction: number;
}

export class TeaBreakScene extends BaseScene {
  private parts: TeaPart[] = [];
  private invites: MeetingInvite[] = [];
  private teaStall?: Phaser.GameObjects.Container;
  private cooldown = false;

  constructor() { super('TeaBreakScene'); }

  create(): void {
    this.parts = [];
    this.invites = [];
    this.teaStall = undefined;
    this.cooldown = false;
    app.state.setTime(WORKDAY_SCHEDULE.teaStart);
    this.setupWorld('5 / Tea Break', 'Find your mug and tea token, then reach the pantry by 4:45 PM.', 100, 590);
    drawPixelFloor(this, 0xd8edf5, 0xc6e0ea);
    this.add.text(640, 125, '4:30 PM — THE OFFICE RUNS ON TEA AND UNVERIFIED ASSUMPTIONS', textStyle(18, '#071a2b')).setOrigin(0.5);
    addPixelRoom(this, 300, 400, 300, 210, colors.blue, 'YOUR DESK');
    addPixelDesk(this, 300, 420, 235, 'MUG PROBABLY HERE');
    addPixelRoom(this, 690, 240, 300, 190, colors.green, 'ACCOUNTS');
    addPixelCounter(this, 690, 260, 235, 'TOKEN APPROVAL', colors.blue);
    addPixelCabinet(this, 870, 520, 'TEA FILES');
    this.parts = [
      this.createPart(390, 315, 'MUG', 'U', 'Your mug was behind the monitor, attending remotely.'),
      this.createPart(700, 315, 'TEA TOKEN', 'T', 'Token approved after only three invisible signatures.'),
    ];
    this.teaStall = addPixelCounter(this, 1090, 555, 190, 'PANTRY TEA\nMUG + TOKEN + E', colors.orange);
    ['Quick Meeting', 'Tiny Request', 'Client Ping'].forEach((label, index) => {
      const person = addPerson(this, 350 + index * 255, 565 - (index % 2) * 160, colors.purple, label).setDepth(10);
      this.invites.push({ person, direction: index % 2 ? -1 : 1 });
    });
  }

  update(time: number, delta: number): void {
    this.updateMovement(time, delta, 215);
    this.invites.forEach((invite, index) => {
      invite.person.x += invite.direction * (35 + index * 8) * app.difficulty.hazardSpeed * delta / 1000;
      if (invite.person.x < 180 || invite.person.x > 1040) invite.direction *= -1;
      if (!app.save.getData().settings.reducedMotion) animatePerson(invite.person, true, time);
      if (!this.cooldown && this.isNear(invite.person, 55)) this.hitInvite();
    });
  }

  protected override interact(): void {
    const part = this.parts.find((candidate) => !candidate.collected && this.isNear(candidate.object, 85));
    if (part) {
      part.collected = true;
      part.object.setVisible(false);
      app.state.addScore(50);
      app.audio.play('correct');
      this.updateObjective(this.parts.every((candidate) => candidate.collected) ? 'Mug and token ready. Sprint to the orange pantry stall!' : `${part.name} found. One tea requirement remains.`);
      this.showDialog('Tea Quest', part.quip);
      this.refreshHud();
      return;
    }
    if (this.teaStall && this.isNear(this.teaStall, 105)) {
      if (this.parts.some((candidate) => !candidate.collected)) {
        this.showDialog('Tea Vendor', 'No mug, no token, no tea. This system has stricter validation than payroll.');
        return;
      }
      this.finishTea();
    }
  }

  private createPart(x: number, y: number, name: string, icon: string, quip: string): TeaPart {
    const object = this.add.container(x, y, [
      this.add.rectangle(0, 0, 135, 75, colors.yellow).setStrokeStyle(4, colors.navy),
      this.add.text(0, -9, icon, textStyle(24, '#071a2b')).setOrigin(0.5),
      this.add.text(0, 21, `${name} • E`, textStyle(13, '#071a2b')).setOrigin(0.5),
    ]);
    return { name, object, collected: false, quip };
  }

  private hitInvite(): void {
    this.cooldown = true;
    app.state.advanceTime(1.5);
    app.state.changeEnergy(-3);
    app.audio.play('warning');
    this.showDialog('Calendar Notification', 'A five-minute sync tried to become a recurring series. You declined heroically.');
    this.time.delayedCall(850, () => { this.cooldown = false; });
  }

  private finishTea(): void {
    if (this.movementLocked) return;
    app.state.completeTeaQuest();
    app.state.setTime(WORKDAY_SCHEDULE.teaEnd);
    app.audio.play('salary');
    this.showDialog('Tea Vendor', 'Tea acquired at exactly 4:45 PM. Productivity is now mostly caffeine. +200 points and +20 energy.', () => {
      app.state.setTime(WORKDAY_SCHEDULE.salaryHuntStart);
      this.scene.start('HRSearchScene');
    });
  }
}
