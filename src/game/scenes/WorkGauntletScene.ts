import Phaser from 'phaser';
import { WORKDAY_SCHEDULE } from '../../config/constants';
import { app } from '../managers/AppContext';
import { addPixelCabinet, addPixelDesk, addPixelDoor, addPixelPlant, drawPixelFloor } from '../pixelArt';
import { SupportAttackSystem } from '../systems/SupportAttackSystem';
import { addButton, addPerson, animatePerson, colors, textStyle } from '../ui';
import { BaseScene } from './BaseScene';

interface Manager { person: Phaser.GameObjects.Container; direction: number; }

const BUGS = [
  { prompt: 'Customer says the button only works when clicked. What is the fix?', options: ['Close as expected behavior', 'Add more buttons', 'Restart the customer'], answer: 0, success: 'Ticket closed with maximum technical confidence.' },
  { prompt: 'Production says undefined is not a function. Who invited undefined?', options: ['The intern', 'A missing null check', 'Mercury retrograde'], answer: 1, success: 'Null checked. Undefined has left the meeting.' },
  { prompt: 'The app is slow on a 2009 toaster. Choose the optimization.', options: ['Download more RAM', 'Remove the loading spinner', 'Stop rendering 9,000 confetti particles'], answer: 2, success: 'The toaster now achieves enterprise frame rates.' },
] as const;

export class WorkGauntletScene extends BaseScene {
  private managers: Manager[] = [];
  private hideSpots: Phaser.GameObjects.Container[] = [];
  private exit?: Phaser.GameObjects.Container;
  private support?: SupportAttackSystem;
  private hidden = false;
  private collisionCooldown = false;
  private challengeObjects: Phaser.GameObjects.GameObject[] = [];

  constructor() { super('WorkGauntletScene'); }

  create(): void {
    this.managers = []; this.hideSpots = []; this.exit = undefined; this.support = undefined;
    this.hidden = false; this.collisionCooldown = false; this.challengeObjects = [];
    this.setupWorld('LEVEL 2 / LUNCH GAUNTLET', 'Reach the cafeteria. Hide at cabinets to avoid support zombies and angry managers.', 90, 610);
    this.drawOfficeRun();
    this.support = new SupportAttackSystem(this, {
      getPlayer: () => this.player,
      isHidden: () => this.hidden || this.movementLocked,
      onCaught: () => this.supportBug(),
      minDelay: Math.round(2800 * app.difficulty.supportDelayScale),
      maxDelay: Math.round(4800 * app.difficulty.supportDelayScale),
      speed: 125 * app.difficulty.hazardSpeed,
      maxActive: app.difficulty.supportMaxActive,
      firstDelay: Math.round(1000 * app.difficulty.supportDelayScale),
    });
  }

  update(time: number, delta: number): void {
    this.updateMovement(time, delta, 220);
    this.hidden = this.hideSpots.some((spot) => this.isNear(spot, 72));
    this.support?.update(time, delta);
    this.managers.forEach((manager, index) => {
      manager.person.x += manager.direction * (42 + index * 9) * app.difficulty.hazardSpeed * delta / 1000;
      if (manager.person.x < 170 || manager.person.x > 1100) manager.direction *= -1;
      if (!app.save.getData().settings.reducedMotion) animatePerson(manager.person, true, time);
      if (!this.hidden && !this.movementLocked && !this.collisionCooldown && this.isNear(manager.person, 58)) this.managerMeeting(index);
    });
    if (this.exit && !this.movementLocked && this.isNear(this.exit, 90)) this.finishLevel();
    this.updateObjective(this.hidden
      ? 'HIDDEN: everyone assumes you are in another meeting. Wait or move carefully.'
      : 'Reach the cafeteria. Cabinets marked HIDE break zombie line of sight.');
  }

  private drawOfficeRun(): void {
    drawPixelFloor(this, 0xdce7ef, 0xc9d7e2);
    for (let x = 260; x <= 980; x += 240) {
      addPixelDesk(this, x, 240, 145, x % 480 ? 'URGENT' : 'VERY URGENT');
      addPixelDesk(this, x, 505, 145, 'NOT A MEETING');
    }
    this.hideSpots = [
      addPixelCabinet(this, 180, 360, 'HIDE', colors.blue),
      addPixelCabinet(this, 640, 360, 'HIDE', colors.green),
      addPixelCabinet(this, 1030, 360, 'HIDE', colors.purple),
    ];
    this.exit = addPixelDoor(this, 1170, 150, 'LUNCH', colors.orange);
    addPixelPlant(this, 80, 150); addPixelPlant(this, 1180, 610);
    ['ANGRY MANAGER', 'SPRINT MANAGER'].forEach((label, index) => {
      const person = addPerson(this, 410 + index * 430, 390 + index * 120, colors.orange, label).setDepth(18);
      this.managers.push({ person, direction: index ? -1 : 1 });
    });
    this.add.text(640, 125, 'THE CAFETERIA IS 30 METERS AWAY AND SEVEN INTERRUPTIONS DEEP', textStyle(16, '#071a2b')).setOrigin(0.5);
  }

  private supportBug(): void {
    if (this.movementLocked) return;
    app.state.caughtBySupport();
    app.audio.play('warning');
    const bug = Phaser.Utils.Array.GetRandom<(typeof BUGS)[number]>([...BUGS]);
    this.showChoice('SUPPORT ZOMBIE BUG ATTACK', bug.prompt, [...bug.options], (index) => {
      const correct = index === bug.answer;
      app.state.recordBug(correct);
      if (!correct) app.state.advanceTime(2);
      this.showDialog('Customer Support Zombie', correct ? bug.success : 'Incorrect. The ticket has been escalated to you, also you, and future you.');
      this.refreshHud();
    });
  }

  private managerMeeting(index: number): void {
    this.collisionCooldown = true;
    app.state.caughtByManager();
    app.state.hitMeeting();
    app.audio.play('warning');
    const prompts = [
      'The manager asks: “Can we have a quick alignment before lunch?”',
      'The manager asks: “Why is the sprint sprinting away from us?”',
    ];
    this.showChoice('SURPRISE MICRO-MEETING', prompts[index % prompts.length], [
      'Yes, but only in interpretive dance', 'I am currently a production dependency', 'Schedule it for last Tuesday',
    ], (choice) => {
      app.state.advanceTime(choice + 1);
      this.showDialog('Angry Manager', [
        'The dance clarified nothing, which counts as alignment.',
        'Dependency accepted. The manager files you under “circle back.”',
        'Excellent calendar choice. The meeting is now technically complete.',
      ][choice]);
      this.time.delayedCall(900, () => { this.collisionCooldown = false; });
      this.refreshHud();
    });
  }

  private showChoice(title: string, prompt: string, options: string[], onPick: (index: number) => void): void {
    this.clearChallenge();
    this.movementLocked = true;
    const shade = this.add.rectangle(640, 360, 1280, 720, colors.navy, 0.74).setDepth(300).setInteractive();
    const panel = this.add.rectangle(640, 350, 850, 470, colors.navy, 0.98).setStrokeStyle(6, colors.cyan).setDepth(301);
    const heading = this.add.text(640, 185, title, textStyle(27, '#ffc857')).setOrigin(0.5).setDepth(302);
    const body = this.add.text(640, 245, prompt, { ...textStyle(19), align: 'center', wordWrap: { width: 700 } }).setOrigin(0.5).setDepth(302);
    this.challengeObjects = [shade, panel, heading, body];
    options.forEach((option, index) => {
      const button = addButton(this, 640, 330 + index * 72, `${String.fromCharCode(65 + index)}. ${option}`, () => {
        this.clearChallenge(); this.movementLocked = false; onPick(index);
      }, 650, index === 0 ? colors.blue : colors.purple).setDepth(303);
      this.challengeObjects.push(button);
    });
  }

  private clearChallenge(): void { this.challengeObjects.forEach((object) => object.destroy()); this.challengeObjects = []; }

  private finishLevel(): void {
    this.movementLocked = true;
    app.state.setTime(WORKDAY_SCHEDULE.lunchStart);
    this.showDialog('Cafeteria Door', 'Level 2 complete. You reached lunch with your code merged and your calendar only lightly damaged.', () => this.scene.start('LunchScene'));
  }
}
