import Phaser from 'phaser';
import { WORKDAY_SCHEDULE } from '../../config/constants';
import events from '../../data/randomEvents.json';
import { app } from '../managers/AppContext';
import { addPixelCabinet, addPixelDesk, addPixelDoor, addPixelPlant, drawPixelFloor } from '../pixelArt';
import { SupportAttackSystem } from '../systems/SupportAttackSystem';
import { addPerson, animatePerson, colors, textStyle } from '../ui';
import { BaseScene } from './BaseScene';

interface Trap {
  person: Phaser.GameObjects.Container;
  label: string;
  manager: boolean;
  active: boolean;
  direction: number;
}

export class EscapeScene extends BaseScene {
  private traps: Trap[] = [];
  private exit?: Phaser.GameObjects.Container;
  private hideSpots: Phaser.GameObjects.Container[] = [];
  private supportAttacks?: SupportAttackSystem;
  private hidden = false;
  private collisionCooldown = false;

  constructor() { super('EscapeScene'); }

  create(): void {
    this.traps = [];
    this.exit = undefined;
    this.hideSpots = [];
    this.supportAttacks = undefined;
    this.hidden = false;
    this.collisionCooldown = false;
    this.setupWorld('8 / Escape', 'Reach EXIT. Use cabinets marked HIDE when support zombies attack.', 110, 610);
    drawPixelFloor(this, 0xe8e2f2, 0xd8d0e7);
    for (let x = 260; x < 1100; x += 270) {
      addPixelDesk(this, x, 245, 155);
      addPixelDesk(this, x, 485, 155);
    }
    this.exit = addPixelDoor(this, 1170, 155, 'EXIT\nFREEDOM', colors.green);
    this.hideSpots = [
      addPixelCabinet(this, 180, 365, 'HIDE'),
      addPixelCabinet(this, 640, 160, 'HIDE'),
      addPixelCabinet(this, 1040, 365, 'HIDE'),
    ];
    addPixelPlant(this, 85, 155);
    addPixelPlant(this, 1160, 590);
    events.escape.forEach((label, index) => {
      const person = addPerson(
        this,
        360 + (index % 4) * 205,
        160 + Math.floor(index / 4) * 390,
        index === 0 ? colors.orange : colors.purple,
        label,
      ).setDepth(10);
      this.traps.push({ person, label, manager: index === 0, active: true, direction: index % 2 ? -1 : 1 });
    });
    this.add.text(620, 340, '7:00 PM\nTHE MOST DANGEROUS TEN MINUTES', { ...textStyle(23, '#071a2b'), align: 'center' }).setOrigin(0.5);
    this.add.text(620, 395, 'HEADSETS DETECTED — BREAK LINE OF SIGHT AT A HIDE CABINET', textStyle(14, '#7c5ce7')).setOrigin(0.5);
    this.supportAttacks = new SupportAttackSystem(this, {
      getPlayer: () => this.player,
      isHidden: () => this.hidden || this.movementLocked,
      onCaught: () => this.caughtBySupport(),
      minDelay: Math.round(2400 * app.difficulty.supportDelayScale),
      maxDelay: Math.round(4300 * app.difficulty.supportDelayScale),
      speed: 132 * app.difficulty.hazardSpeed,
      maxActive: app.difficulty.supportMaxActive,
      firstDelay: Math.round(900 * app.difficulty.supportDelayScale),
    });
  }

  update(time: number, delta: number): void {
    this.updateMovement(time, delta, 225);
    const nowHidden = this.hideSpots.some((spot) => this.isNear(spot, 72));
    if (nowHidden !== this.hidden) {
      this.hidden = nowHidden;
      this.updateObjective(this.hidden
        ? 'HIDDEN! Support zombies cannot see you. Move when the headset horde passes.'
        : 'Reach EXIT. Use cabinets marked HIDE to avoid support zombies.');
    }
    this.supportAttacks?.update(time, delta);
    this.traps.forEach((trap, index) => {
      if (!trap.active) return;
      if (!app.save.getData().settings.reducedMotion) animatePerson(trap.person, true, time);
      trap.person.x += trap.direction * (35 + index * 4) * app.difficulty.hazardSpeed * delta / 1000;
      if (trap.person.x < 150 || trap.person.x > 1120) trap.direction *= -1;
      if (!this.collisionCooldown && this.isNear(trap.person, 57)) this.hitTrap(trap);
    });
    if (this.exit && this.isNear(this.exit, 90)) this.finish();
  }

  private hitTrap(trap: Trap): void {
    this.collisionCooldown = true;
    trap.active = false;
    trap.person.setAlpha(0.3);
    if (trap.manager) app.state.caughtByManager();
    else { app.state.hitMeeting(); app.state.changeEnergy(-7); }
    app.audio.play('warning');
    this.showDialog(
      trap.manager ? 'Manager' : 'Office Trap',
      trap.manager
        ? 'Before you go—one tiny strategic request. Four minutes later…'
        : `${trap.label}. Three minutes disappeared into the corporate dimension.`,
    );
    this.time.delayedCall(900, () => { this.collisionCooldown = false; });
    this.refreshHud();
  }

  private caughtBySupport(): void {
    app.state.caughtBySupport();
    app.audio.play('warning');
    this.refreshHud();
    this.showDialog('Customer Support Zombie', '“Just one customer call…” The headset horde consumed three minutes and eight energy. Cabinets are your friends.');
  }

  private finish(): void {
    if (this.movementLocked || !app.state.snapshot.salaryCollected) return;
    this.movementLocked = true;
    const points = app.state.recordExit();
    app.audio.play('exit');
    if (app.state.snapshot.minutes >= WORKDAY_SCHEDULE.officeEnd && app.state.snapshot.minutes <= WORKDAY_SCHEDULE.officeEnd + 2) app.state.unlock('six-clock-ninja');
    if (app.state.snapshot.meetingsHit === 0) app.state.unlock('meeting-dodger');
    const message = app.state.snapshot.minutes <= WORKDAY_SCHEDULE.bestExitEnd
      ? 'You escaped before “quick meeting” was completed.'
      : 'Overtime detected. Work-life balance has left the building.';
    this.showDialog('Office Exit', `${message} ${points >= 0 ? '+' : ''}${points} points`, () => this.scene.start('ResultsScene'));
  }
}
