import Phaser from 'phaser';
import { WORKDAY_SCHEDULE } from '../../config/constants';
import { app } from '../managers/AppContext';
import { addInteractionBeacon, burstParticles, impactFlash, juiceText, playPersonReaction, pulseObject } from '../effects';
import { addPixelCabinet, addPixelDesk, addPixelDoor, addPixelPlant, drawPixelFloor } from '../pixelArt';
import { SupportAttackSystem } from '../systems/SupportAttackSystem';
import { addButton, addPerson, animatePerson, colors, textStyle } from '../ui';
import { BaseScene } from './BaseScene';

interface Manager { person: Phaser.GameObjects.Container; direction: number; }

const BUGS = [
  { prompt: 'Customer says the button only works when clicked. What is the fix?', options: ['Close as expected behavior', 'Add more buttons', 'Restart the customer'], answer: 0, success: 'Ticket closed with maximum technical confidence.' },
  { prompt: 'Production says undefined is not a function. Who invited undefined?', options: ['The intern', 'A missing null check', 'Mercury retrograde'], answer: 1, success: 'Null checked. Undefined has left the meeting.' },
  { prompt: 'The app is slow on a 2009 toaster. Choose the optimization.', options: ['Download more RAM', 'Remove the loading spinner', 'Stop rendering 9,000 confetti particles'], answer: 2, success: 'The toaster now achieves enterprise frame rates.' },
  { prompt: 'The customer deleted their account and cannot log in. Root cause?', options: ['Successful deletion', 'Weak password aura', 'The cloud is tired'], answer: 0, success: 'Case solved. The account remains heroically deleted.' },
  { prompt: 'The PDF is sideways only when the monitor is rotated. Fix?', options: ['Rotate the office', 'Unrotate the monitor', 'Escalate to gravity'], answer: 1, success: 'Monitor restored to portrait-free operations.' },
] as const;

export class WorkGauntletScene extends BaseScene {
  private managers: Manager[] = [];
  private hideSpots: Phaser.GameObjects.Container[] = [];
  private exit?: Phaser.GameObjects.Container;
  private support?: SupportAttackSystem;
  private hidden = false;
  private collisionCooldown = false;
  private challengeObjects: Phaser.GameObjects.GameObject[] = [];
  private keycard?: Phaser.GameObjects.Container;
  private hasKeycard = false;
  private officeChair?: Phaser.GameObjects.Container;
  private chairUsed = false;
  private boostUntil = 0;
  private meetingButton?: Phaser.GameObjects.Container;
  private buttonUsed = false;
  private managersFrozenUntil = 0;
  private exitWarning = false;

  constructor() { super('WorkGauntletScene'); }

  create(): void {
    this.managers = []; this.hideSpots = []; this.exit = undefined; this.support = undefined;
    this.hidden = false; this.collisionCooldown = false; this.challengeObjects = [];
    this.keycard = undefined; this.hasKeycard = false; this.officeChair = undefined; this.chairUsed = false; this.boostUntil = 0;
    this.meetingButton = undefined; this.buttonUsed = false; this.managersFrozenUntil = 0; this.exitWarning = false;
    this.setupWorld('LEVEL 2 / LUNCH GAUNTLET', 'Find the cafeteria keycard, then reach lunch. Cabinets hide you from office predators.', 90, 610);
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
    this.updateMovement(time, delta, time < this.boostUntil ? 315 : 220);
    this.hidden = this.hideSpots.some((spot) => this.isNear(spot, 72));
    this.support?.update(time, delta);
    this.managers.forEach((manager, index) => {
      if (time < this.managersFrozenUntil) {
        animatePerson(manager.person, false, time); return;
      }
      manager.person.x += manager.direction * (42 + index * 9) * app.difficulty.hazardSpeed * delta / 1000;
      if (manager.person.x < 170 || manager.person.x > 1100) manager.direction *= -1;
      if (!app.save.getData().settings.reducedMotion) animatePerson(manager.person, true, time);
      if (!this.hidden && !this.movementLocked && !this.collisionCooldown && this.isNear(manager.person, 58)) this.managerMeeting(index);
    });
    if (this.exit && !this.movementLocked && this.isNear(this.exit, 90)) this.finishLevel();
    this.updateObjective(this.hidden
      ? 'HIDDEN: everyone assumes you are in another meeting. Wait or move carefully.'
      : this.hasKeycard
        ? 'KEYCARD ACQUIRED: reach the cafeteria. Shift runs; cabinets break zombie line of sight.'
        : 'Find the glowing CAFETERIA KEYCARD. Try the runaway office chair if dignity is optional.');
  }

  protected override interact(): void {
    if (this.keycard && !this.hasKeycard && this.isNear(this.keycard, 82)) {
      this.hasKeycard = true; this.keycard.setVisible(false); app.state.addScore(100); app.audio.play('correct');
      burstParticles(this, this.keycard.x, this.keycard.y); juiceText(this, this.keycard.x, this.keycard.y - 40, 'ACCESS GRANTED +100');
      this.showDialog('Cafeteria Keycard', 'The card says TEMPORARY ACCESS, issued in 2014. Naturally, it still controls lunch.');
      return;
    }
    if (this.officeChair && !this.chairUsed && this.isNear(this.officeChair, 82)) {
      this.chairUsed = true; this.officeChair.setVisible(false); this.boostUntil = this.time.now + 5000; app.audio.play('collision');
      burstParticles(this, this.player?.x ?? 330, this.player?.y ?? 620, [colors.orange, colors.yellow, colors.white]);
      this.showDialog('Runaway Office Chair', 'The chair has five wheels, zero brakes, and the confidence of middle management. SPEED BOOST!');
      return;
    }
    if (this.meetingButton && !this.buttonUsed && this.isNear(this.meetingButton, 82)) {
      this.buttonUsed = true; this.meetingButton.setAlpha(0.5); this.managersFrozenUntil = this.time.now + 6500; app.state.addScore(75); app.audio.play('correct');
      impactFlash(this, colors.purple); this.managers.forEach(({ person }) => playPersonReaction(this, person, 'confused'));
      this.showDialog('Emergency Meeting Button', 'Both managers received a calendar invite titled ALIGNMENT ABOUT ALIGNMENT. You have 6.5 seconds of peace.');
    }
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
    this.keycard = this.add.container(615, 155, [
      this.add.rectangle(4, 6, 84, 54, colors.navy, 0.24),
      this.add.rectangle(0, 0, 82, 52, colors.yellow).setStrokeStyle(4, colors.navy),
      this.add.rectangle(-24, -6, 18, 18, colors.cyan).setStrokeStyle(2, colors.navy),
      this.add.text(10, 4, 'LUNCH', textStyle(10, '#071a2b')).setOrigin(0.5),
    ]).setDepth(16);
    pulseObject(this, this.keycard); addInteractionBeacon(this, 615, 108, 'KEY');
    this.officeChair = this.add.container(330, 625, [
      this.add.rectangle(0, -4, 58, 45, colors.blue).setStrokeStyle(4, colors.navy),
      this.add.rectangle(0, 24, 72, 9, colors.navy),
      this.add.circle(-27, 33, 8, colors.orange), this.add.circle(27, 33, 8, colors.orange),
      this.add.text(0, -4, 'BOOST', textStyle(10, '#ffffff')).setOrigin(0.5),
    ]).setDepth(11);
    pulseObject(this, this.officeChair);
    this.meetingButton = this.add.container(875, 625, [
      this.add.rectangle(4, 5, 112, 62, colors.navy, 0.23),
      this.add.rectangle(0, 0, 110, 60, colors.purple).setStrokeStyle(4, colors.navy),
      this.add.circle(0, -8, 15, colors.orange).setStrokeStyle(3, colors.white),
      this.add.text(0, 19, 'MEETING TRAP', textStyle(9, '#ffffff')).setOrigin(0.5),
    ]).setDepth(11);
    addInteractionBeacon(this, 875, 574, 'PRESS', colors.purple);
    this.add.text(640, 675, 'THE CAFETERIA IS 30 METERS AWAY AND SEVEN INTERRUPTIONS DEEP', textStyle(13, '#425466')).setOrigin(0.5);
  }

  private supportBug(): void {
    if (this.movementLocked) return;
    app.state.caughtBySupport();
    app.audio.play('warning');
    if (this.player) playPersonReaction(this, this.player, 'hit');
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
    if (this.player) playPersonReaction(this, this.player, 'panic');
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
    if (!this.hasKeycard) {
      if (!this.exitWarning) {
        this.exitWarning = true;
        this.showDialog('Cafeteria Door', 'ACCESS DENIED. Lunch is a privilege encoded on a tiny yellow keycard. Find it among the desks.', () => {
          this.time.delayedCall(700, () => { this.exitWarning = false; });
        });
      }
      return;
    }
    this.movementLocked = true;
    app.state.setTime(WORKDAY_SCHEDULE.lunchStart);
    if (this.player) playPersonReaction(this, this.player, 'celebrate');
    this.showDialog('Cafeteria Door', 'Level 2 complete. You reached lunch with your code merged and your calendar only lightly damaged.', () => this.scene.start('LunchScene'));
  }
}
