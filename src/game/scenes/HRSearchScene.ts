import Phaser from 'phaser';
import dialogueData from '../../data/dialogues.json';
import npcData from '../../data/npcs.json';
import { app } from '../managers/AppContext';
import { BaseScene } from './BaseScene';
import { addPerson, animatePerson, colors, textStyle } from '../ui';
import { addPixelCabinet, addPixelCounter, addPixelDesk, addPixelDoor, addPixelPlant, addPixelRoom, addPixelServerRack, addPixelTable, drawPixelFloor } from '../pixelArt';
import { SupportAttackSystem } from '../systems/SupportAttackSystem';

type DialogueKey = keyof typeof dialogueData;

interface OfficeNpc { id: string; role: string; dialogueKey: DialogueKey; person: Phaser.GameObjects.Container; }

export class HRSearchScene extends BaseScene {
  private npcs: OfficeNpc[] = [];
  private hr?: OfficeNpc;
  private clueArrow?: Phaser.GameObjects.Text;
  private supportAttacks?: SupportAttackSystem;
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
    this.hrRoute = 0;
    this.setupWorld('6 / Find HR', 'Ask for clues. Hide near the server rack if support zombies attack.', 120, 610);
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
    const near = this.npcs.find((npc) => this.isNear(npc.person, 70));
    if (!near) return;
    if (near.id === 'hr') {
      if (app.state.snapshot.clues <= 3) app.state.unlock('hr-detective');
      app.state.addScore(app.state.snapshot.clues <= 3 ? 400 : 0);
      this.showDialog('HR', 'You found me! Is this about the highly anticipated monthly notification?', () => this.scene.start('SalaryScene'));
      return;
    }
    if (!app.state.addClue(near.id)) {
      this.showDialog(near.role, 'I already gave you my best clue. My second-best clue is “try asking someone else.”');
      return;
    }
    app.audio.play('correct');
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
    this.tweens.add({ targets: this.hr.person, x: target.x, y: target.y, duration: app.difficulty.hrMoveMs * 0.7, ease: 'Sine.easeInOut' });
  }

  private caughtBySupport(): void {
    app.state.caughtBySupport();
    app.audio.play('warning');
    this.refreshHud();
    this.showDialog('Customer Support Zombie', 'A headset detected movement. You were assigned three “quick” customer tickets. Hide near the server rack next time!');
  }
}
