import Phaser from 'phaser';
import { WORKDAY_SCHEDULE } from '../../config/constants';
import events from '../../data/randomEvents.json';
import { app } from '../managers/AppContext';
import { addInteractionBeacon, burstParticles, impactFlash, juiceText, playPersonReaction, pulseObject } from '../effects';
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
  private overrideSwitch?: Phaser.GameObjects.Container;
  private exitUnlocked = false;
  private trappedIntern?: Phaser.GameObjects.Container;
  private internRescued = false;
  private exitWarning = false;

  constructor() { super('EscapeScene'); }

  create(): void {
    this.traps = [];
    this.exit = undefined;
    this.hideSpots = [];
    this.supportAttacks = undefined;
    this.hidden = false;
    this.collisionCooldown = false;
    this.overrideSwitch = undefined; this.exitUnlocked = false; this.trappedIntern = undefined; this.internRescued = false; this.exitWarning = false;
    this.setupWorld('LEVEL 7 / FINAL ESCAPE', 'Hit the emergency exit override, then escape. Hide from support zombies and managers.', 110, 610);
    drawPixelFloor(this, 0xe8e2f2, 0xd8d0e7);
    for (let x = 260; x < 1100; x += 270) {
      addPixelDesk(this, x, 245, 155);
      addPixelDesk(this, x, 485, 155);
    }
    this.exit = addPixelDoor(this, 1170, 155, 'EXIT\nFREEDOM', colors.green);
    pulseObject(this, this.exit);
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
      this.traps.push({ person, label, manager: index === 0 || index === 3, active: true, direction: index % 2 ? -1 : 1 });
    });
    this.add.rectangle(640, 103, 520, 22, colors.navy, 0.88).setStrokeStyle(2, colors.purple).setDepth(6);
    this.add.text(640, 103, '7:00 PM - FREEDOM PROTOCOL ACTIVE', textStyle(11, '#d9eef7')).setOrigin(0.5).setDepth(7);
    this.overrideSwitch = this.add.container(765, 350, [
      this.add.rectangle(5, 6, 124, 76, colors.navy, 0.23),
      this.add.rectangle(0, 0, 122, 74, 0x455a64).setStrokeStyle(5, colors.navy),
      this.add.circle(0, -10, 20, 0xe53935).setStrokeStyle(4, colors.white),
      this.add.text(0, 24, 'EXIT OVERRIDE', textStyle(10, '#ffffff')).setOrigin(0.5),
    ]).setDepth(9);
    pulseObject(this, this.overrideSwitch); addInteractionBeacon(this, 765, 290, 'PRESS', colors.orange);
    this.trappedIntern = addPerson(this, 420, 350, colors.green, 'TRAPPED INTERN').setScale(0.82).setDepth(10);
    addInteractionBeacon(this, 420, 276, 'RESCUE', colors.green);
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

  protected override interact(): void {
    if (this.overrideSwitch && !this.exitUnlocked && this.isNear(this.overrideSwitch, 82)) {
      this.exitUnlocked = true; this.overrideSwitch.setAlpha(0.5); app.state.addScore(125); app.audio.play('correct');
      impactFlash(this, colors.green); burstParticles(this, this.overrideSwitch.x, this.overrideSwitch.y);
      this.updateObjective('EXIT OVERRIDE ACTIVE! Reach the green freedom door before someone schedules tomorrow.');
      this.showDialog('Emergency Exit Override', 'Door unlocked. Alarm: LEAVING ON TIME IS AN UNUSUAL ACTIVITY. Security has been emotionally notified.');
      return;
    }
    if (this.trappedIntern && !this.internRescued && this.isNear(this.trappedIntern, 80)) {
      this.internRescued = true; app.state.addScore(100); app.audio.play('correct');
      playPersonReaction(this, this.trappedIntern, 'celebrate'); juiceText(this, this.trappedIntern.x, this.trappedIntern.y - 65, 'INTERN EVACUATED +100');
      this.showDialog('Trapped Intern', 'Thank you! I was trapped between a reply-all chain and a mandatory optional survey. I will remember this until my contract ends Friday.');
    }
  }

  private hitTrap(trap: Trap): void {
    this.collisionCooldown = true;
    trap.active = false;
    trap.person.setAlpha(0.3);
    if (trap.manager) app.state.caughtByManager();
    else { app.state.hitMeeting(); app.state.changeEnergy(-7); }
    app.audio.play('warning');
    if (this.player) playPersonReaction(this, this.player, trap.manager ? 'panic' : 'hit');
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
    if (this.player) playPersonReaction(this, this.player, 'hit');
    this.refreshHud();
    this.showDialog('Customer Support Zombie', '“Just one customer call…” The headset horde consumed three minutes and eight energy. Cabinets are your friends.');
  }

  private finish(): void {
    if (this.movementLocked || !app.state.snapshot.salaryCollected) return;
    if (!this.exitUnlocked) {
      if (!this.exitWarning) {
        this.exitWarning = true;
        this.showDialog('Freedom Door', 'LOCKED BY POLICY. Find the red emergency override near the center. It is labelled clearly, which is suspicious.', () => {
          this.time.delayedCall(650, () => { this.exitWarning = false; });
        });
      }
      return;
    }
    this.movementLocked = true;
    const points = app.state.recordExit();
    app.audio.play('exit');
    if (this.player) playPersonReaction(this, this.player, 'celebrate');
    if (app.state.snapshot.minutes >= WORKDAY_SCHEDULE.officeEnd && app.state.snapshot.minutes <= WORKDAY_SCHEDULE.officeEnd + 2) app.state.unlock('six-clock-ninja');
    if (app.state.snapshot.meetingsHit === 0) app.state.unlock('meeting-dodger');
    const message = app.state.snapshot.minutes <= WORKDAY_SCHEDULE.bestExitEnd
      ? 'You escaped before “quick meeting” was completed.'
      : 'Overtime detected. Work-life balance has left the building.';
    this.showDialog('Office Exit', `${message} ${points >= 0 ? '+' : ''}${points} points`, () => this.scene.start('ResultsScene'));
  }
}
