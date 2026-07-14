import Phaser from 'phaser';
import dialogueData from '../../data/dialogues.json';
import npcData from '../../data/npcs.json';
import { app } from '../managers/AppContext';
import { addInteractionBeacon, burstParticles, juiceText, playPersonReaction, pulseObject } from '../effects';
import { BaseScene } from './BaseScene';
import { addButton, addPerson, animatePerson, colors, textStyle } from '../ui';
import { addPixelCabinet, addPixelCounter, addPixelDesk, addPixelDoor, addPixelPlant, addPixelRoom, addPixelServerRack, addPixelTable, drawPixelFloor } from '../pixelArt';
import { SupportAttackSystem } from '../systems/SupportAttackSystem';

type DialogueKey = keyof typeof dialogueData;

interface OfficeNpc { id: string; role: string; dialogueKey: DialogueKey; person: Phaser.GameObjects.Container; }

export class HRSearchScene extends BaseScene {
  private npcs: OfficeNpc[] = [];
  private hr?: OfficeNpc;
  private clueArrow?: Phaser.GameObjects.Text;
  private supportAttacks?: SupportAttackSystem;
  private printer?: Phaser.GameObjects.Container;
  private printerFixed = false;
  private secretStamp?: Phaser.GameObjects.Container;
  private stampFound = false;
  private challengeObjects: Phaser.GameObjects.GameObject[] = [];
  private hrRoute = 0;
  private readonly routes = [
    [{ x: 1050, y: 185 }, { x: 880, y: 350 }, { x: 1080, y: 560 }],
    [{ x: 590, y: 175 }, { x: 770, y: 560 }, { x: 1040, y: 350 }],
    [{ x: 320, y: 170 }, { x: 600, y: 390 }, { x: 1050, y: 560 }],
    [{ x: 880, y: 180 }, { x: 600, y: 550 }, { x: 350, y: 400 }],
    [{ x: 1050, y: 350 }, { x: 750, y: 185 }, { x: 320, y: 560 }],
  ];
  constructor() { super('HRSearchScene'); }
  create(): void {
    this.npcs = [];
    this.hr = undefined;
    this.clueArrow = undefined;
    this.supportAttacks = undefined;
    this.printer = undefined; this.printerFixed = false; this.secretStamp = undefined; this.stampFound = false; this.challengeObjects = [];
    this.hrRoute = 0;
    this.setupWorld('LEVEL 6 / HUNT HR', 'Solve the office clue hunt, dodge support zombies, and catch the moving HR target.', 120, 610);
    this.drawOffice(); this.createNpcs();
    this.supportAttacks = new SupportAttackSystem(this, {
      getPlayer: () => this.player,
      isHidden: () => this.movementLocked || Boolean(this.player && Phaser.Math.Distance.Between(this.player.x, this.player.y, 460, 390) < 78),
      onCaught: () => this.caughtBySupport(),
      minDelay: Math.round(7500 * app.difficulty.supportDelayScale),
      maxDelay: Math.round(12000 * app.difficulty.supportDelayScale),
      speed: 92 * app.difficulty.hazardSpeed,
      maxActive: Math.min(2, app.difficulty.supportMaxActive),
      firstDelay: Math.round(5000 * app.difficulty.supportDelayScale),
    });
    this.time.addEvent({ delay: app.difficulty.hrMoveMs, loop: true, callback: () => this.moveHr() });
  }
  update(time: number, delta: number): void {
    this.updateMovement(time, delta);
    this.supportAttacks?.update(time, delta);
    if (this.hr && !app.save.getData().settings.reducedMotion) animatePerson(this.hr.person, true, time);
    if (this.clueArrow && this.hr) {
      const angle = Phaser.Math.Angle.Between(this.player!.x, this.player!.y, this.hr.person.x, this.hr.person.y);
      this.clueArrow.setRotation(angle).setPosition(this.player!.x, this.player!.y - 55);
    }
  }
  protected override interact(): void {
    if (this.printer && !this.printerFixed && this.isNear(this.printer, 82)) {
      this.showPrinterPuzzle(); return;
    }
    if (this.secretStamp && !this.stampFound && this.isNear(this.secretStamp, 75)) {
      this.stampFound = true; this.secretStamp.setVisible(false); app.state.addScore(175); app.audio.play('salary');
      burstParticles(this, this.secretStamp.x, this.secretStamp.y); juiceText(this, this.secretStamp.x, this.secretStamp.y - 45, 'LEGENDARY STAMP +175');
      this.showDialog('HR Stamp of Power', 'APPROVED. You do not know what was approved, which makes this the most authentic form in the building.');
      return;
    }
    const near = this.npcs.find((npc) => this.isNear(npc.person, 70));
    if (!near) return;
    if (near.id === 'hr') {
      if (app.state.snapshot.clues < app.difficulty.clueLimit) {
        playPersonReaction(this, near.person, 'panic');
        this.showDialog('HR', `You found me too efficiently. Policy requires ${app.difficulty.clueLimit} colleague clue${app.difficulty.clueLimit === 1 ? '' : 's'} before direct eye contact.`);
        return;
      }
      if (!this.printerFixed) {
        this.showDialog('HR', 'Excellent hunting. Unfortunately, Payroll Form 404 is trapped in the haunted printer near Accounts. Fix it, then catch me again.');
        this.updateObjective('HR found, but bureaucracy has a second phase: fix the haunted printer near Accounts.');
        return;
      }
      if (app.state.snapshot.clues <= 3) app.state.unlock('hr-detective');
      app.state.addScore(app.state.snapshot.clues <= 3 ? 400 : 0);
      playPersonReaction(this, near.person, 'celebrate');
      this.showDialog('HR', 'You found me! Level 6 final challenge: survive the highly scientific salary questionnaire.', () => this.scene.start('SalaryScene'));
      return;
    }
    if (!app.state.addClue(near.id)) {
      this.showDialog(near.role, 'I already gave you my best clue. My second-best clue is “try asking someone else.”');
      return;
    }
    app.audio.play('correct');
    burstParticles(this, near.person.x, near.person.y - 15, [colors.cyan, colors.yellow, colors.white], 8, 45);
    juiceText(this, near.person.x, near.person.y - 65, `CLUE ${app.state.snapshot.clues}`);
    const lines = dialogueData[near.dialogueKey];
    this.showDialog(near.role, Phaser.Utils.Array.GetRandom(lines));
    this.updateObjective(`${app.state.snapshot.clues} clue${app.state.snapshot.clues === 1 ? '' : 's'} collected. ${app.state.snapshot.clues >= app.difficulty.clueLimit ? 'HR is now marked by the arrow!' : 'Keep asking colleagues.'}`);
    if (app.state.snapshot.clues >= app.difficulty.clueLimit && !this.clueArrow) this.clueArrow = this.add.text(0, 0, '➤', textStyle(36, '#ff7a59')).setOrigin(0.5).setDepth(120);
    this.refreshHud();
  }
  private drawOffice(): void {
    drawPixelFloor(this, 0xeee5d2, 0xe3d6be);
    const rooms = [
      [190, 170, 'DEVELOPERS', colors.blue], [460, 170, 'QA', colors.orange], [720, 170, 'MEETING', colors.purple], [1010, 170, 'HR', colors.green],
      [190, 390, 'RECEPTION', colors.cyan], [460, 390, 'SERVER', 0x34495e], [720, 390, 'HALLWAY', colors.yellow], [1010, 390, 'ACCOUNTS', colors.blue],
      [260, 580, 'PANTRY', colors.orange], [600, 580, 'MANAGER', colors.purple], [980, 580, 'EXIT', colors.green],
    ] as const;
    rooms.forEach(([x, y, label, color]) => addPixelRoom(this, x, y, label === 'HALLWAY' ? 210 : 220, 145, Number(color), label));
    addPixelDesk(this, 265, 205, 105); addPixelDesk(this, 520, 205, 105);
    addPixelTable(this, 720, 220, 125, colors.purple);
    addPixelCabinet(this, 1080, 195, 'FILES', colors.green);
    addPixelCounter(this, 255, 420, 100, 'FRONT', colors.cyan);
    addPixelServerRack(this, 500, 400);
    addPixelPlant(this, 770, 410);
    addPixelDesk(this, 1090, 415, 110);
    addPixelCounter(this, 195, 600, 115, 'TEA', colors.orange);
    addPixelDesk(this, 680, 600, 115);
    addPixelDoor(this, 1050, 585, 'EXIT', colors.green);
    this.printer = this.add.container(850, 585, [
      this.add.rectangle(6, 7, 100, 90, colors.navy, 0.24),
      this.add.rectangle(0, 0, 98, 88, 0x607d8b).setStrokeStyle(5, colors.navy),
      this.add.rectangle(0, -17, 72, 32, colors.white).setStrokeStyle(3, colors.navy),
      this.add.rectangle(0, 16, 65, 12, 0xe53935).setStrokeStyle(2, colors.navy),
      this.add.text(0, 37, 'FORM 404', textStyle(10, '#ffffff')).setOrigin(0.5),
    ]).setDepth(7);
    pulseObject(this, this.printer); addInteractionBeacon(this, 850, 515, 'FIX', colors.orange);
    this.secretStamp = this.add.container(1165, 155, [
      this.add.rectangle(0, 8, 30, 42, colors.orange).setStrokeStyle(3, colors.navy),
      this.add.rectangle(0, -14, 50, 22, colors.yellow).setStrokeStyle(3, colors.navy),
      this.add.text(0, 39, 'SECRET', textStyle(9, '#7c5ce7')).setOrigin(0.5),
    ]).setDepth(8);
    pulseObject(this, this.secretStamp);
  }
  private createNpcs(): void {
    const positions = [[190, 190], [440, 190], [710, 200], [1010, 400], [180, 415], [590, 570], [610, 390], [280, 570], [450, 400]];
    npcData.slice(0, 9).forEach((data, index) => {
      const [x, y] = positions[index]; const person = addPerson(this, x, y, data.color, data.role).setDepth(10);
      this.npcs.push({ id: data.id, role: data.role, dialogueKey: data.dialogueKey as DialogueKey, person });
    });
    const hrData = npcData[9]; const routeIndex = Phaser.Math.Between(0, this.routes.length - 1); this.hrRoute = routeIndex;
    const start = this.routes[routeIndex][0]; const person = addPerson(this, start.x, start.y, hrData.color, 'HR • Clipboard').setDepth(10);
    this.hr = { id: 'hr', role: 'HR', dialogueKey: 'hr', person }; this.npcs.push(this.hr);
  }
  private moveHr(): void {
    if (!this.hr || this.movementLocked) return;
    this.hrRoute = (this.hrRoute + 1) % this.routes.length;
    const target = Phaser.Utils.Array.GetRandom(this.routes[this.hrRoute]);
    juiceText(this, this.hr.person.x, this.hr.person.y - 62, 'HR USED CALENDAR TELEPORT!', '#ff9fcf');
    this.tweens.add({ targets: this.hr.person, x: target.x, y: target.y, duration: app.difficulty.hrMoveMs * 0.7, ease: 'Sine.easeInOut' });
  }

  private showPrinterPuzzle(): void {
    this.clearChallenge(); this.movementLocked = true;
    const shade = this.add.rectangle(640, 360, 1280, 720, colors.navy, 0.76).setDepth(300).setInteractive();
    const panel = this.add.rectangle(640, 345, 820, 430, colors.navy, 0.98).setStrokeStyle(6, colors.orange).setDepth(301);
    const heading = this.add.text(640, 188, 'HAUNTED PRINTER BOSS', textStyle(27, '#ffc857')).setOrigin(0.5).setDepth(302);
    const body = this.add.text(640, 245, 'The printer says PAPER JAM, but there is no paper. Choose the ancient ritual.', { ...textStyle(18), align: 'center', wordWrap: { width: 680 } }).setOrigin(0.5).setDepth(302);
    this.challengeObjects = [shade, panel, heading, body];
    ['Offer toner to the cloud', 'Open tray, close tray, whisper "please"', 'Print the printer'].forEach((option, index) => {
      const button = addButton(this, 640, 325 + index * 70, option, () => {
        this.clearChallenge(); this.movementLocked = false;
        if (index === 1) {
          this.printerFixed = true; this.printer?.setAlpha(0.6); app.state.addScore(150); app.audio.play('correct');
          burstParticles(this, this.printer?.x ?? 850, this.printer?.y ?? 585, [colors.green, colors.white, colors.cyan]);
          this.updateObjective('FORM 404 PRINTED! Collect enough clues and catch HR to unlock the salary questionnaire.');
          this.showDialog('Haunted Printer', 'KRR-CHUNK. Form 404 printed successfully, followed by 63 blank pages and somebody else\'s tax return.');
        } else {
          app.state.advanceTime(2); app.audio.play('wrong'); if (this.player) playPersonReaction(this, this.player, 'hit');
          this.showDialog('Haunted Printer', index === 0 ? 'The cloud accepted your toner and returned HTTP 418: I am a teapot.' : 'The printer printed a self-portrait and marked it confidential. Try the tray ritual.');
        }
        this.refreshHud();
      }, 590, index === 1 ? colors.green : colors.purple).setDepth(303);
      this.challengeObjects.push(button);
    });
  }

  private clearChallenge(): void { this.challengeObjects.forEach((object) => object.destroy()); this.challengeObjects = []; }

  private caughtBySupport(): void {
    app.state.caughtBySupport();
    app.audio.play('warning');
    if (this.player) playPersonReaction(this, this.player, 'hit');
    this.refreshHud();
    this.showDialog('Customer Support Zombie', 'A headset detected movement. You were assigned three “quick” customer tickets. Hide near the server rack next time!');
  }
}
