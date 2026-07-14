import Phaser from 'phaser';
import { WORKDAY_SCHEDULE } from '../../config/constants';
import { app } from '../managers/AppContext';
import { addPixelCabinet, addPixelCounter, drawPixelFloor } from '../pixelArt';
import { colors, textStyle } from '../ui';
import { BaseScene } from './BaseScene';

interface TeaItem { name: string; order: number; object: Phaser.GameObjects.Container; collected: boolean; quip: string; }

export class TeaBreakScene extends BaseScene {
  private walls: Phaser.Geom.Rectangle[] = [];
  private items: TeaItem[] = [];
  private nextItem = 0;
  private seconds = 35;
  private timerText?: Phaser.GameObjects.Text;
  private ended = false;

  constructor() { super('TeaBreakScene'); }

  create(): void {
    this.walls = []; this.items = []; this.nextItem = 0; this.timerText = undefined; this.ended = false;
    this.seconds = app.state.snapshot.difficulty === 'casual' ? 45 : app.state.snapshot.difficulty === 'corporate' ? 30 : 36;
    app.state.setTime(WORKDAY_SCHEDULE.teaStart);
    this.setupWorld('LEVEL 5 / HOT TEA MAZE', 'Find HOT WATER first, then TEA BAG, then SUGAR before the kettle clock expires.', 90, 620);
    this.drawMaze();
    this.add.rectangle(1110, 145, 190, 82, colors.navy, 0.96).setStrokeStyle(4, colors.orange).setDepth(108);
    this.timerText = this.add.text(1110, 145, `WATER HOT\n${this.seconds}s`, { ...textStyle(17, '#ffc857'), align: 'center' }).setOrigin(0.5).setDepth(110);
    this.time.addEvent({ delay: 1000, loop: true, callback: () => {
      if (this.ended || this.movementLocked) return;
      this.seconds -= 1; this.timerText?.setText(`WATER HOT\n${this.seconds}s`);
      if (this.seconds <= 0) this.failTea();
    } });
  }

  update(time: number, delta: number): void {
    if (this.ended || !this.player) return;
    const previous = { x: this.player.x, y: this.player.y };
    this.updateMovement(time, delta, 215);
    if (this.walls.some((wall) => wall.contains(this.player!.x, this.player!.y))) this.player.setPosition(previous.x, previous.y);
  }

  protected override interact(): void {
    if (this.ended) return;
    const item = this.items.find((candidate) => !candidate.collected && this.isNear(candidate.object, 85));
    if (!item) return;
    if (item.order !== this.nextItem) {
      const needed = this.items.find((candidate) => candidate.order === this.nextItem)?.name ?? 'TEA LOGIC';
      this.showDialog('Tea Compiler', `${item.name} is out of order. Find ${needed} first or the beverage will fail type-checking.`);
      return;
    }
    item.collected = true; item.object.setVisible(false); this.nextItem += 1; app.state.addScore(60); app.audio.play('correct');
    this.showDialog('Tea Quest', item.quip);
    if (this.nextItem >= this.items.length) this.completeTea();
    else this.updateObjective(`${item.name} secured. Now find ${this.items.find((candidate) => candidate.order === this.nextItem)?.name}. ${this.seconds}s of kettle heat remain.`);
    this.refreshHud();
  }

  private drawMaze(): void {
    drawPixelFloor(this, 0xd8edf5, 0xc6e0ea);
    addPixelCounter(this, 555, 145, 900, 'PANTRY LABYRINTH • BEVERAGE SLA ACTIVE', colors.orange);
    const walls: Array<[number, number, number, number]> = [
      [270, 390, 34, 440], [500, 245, 420, 34], [690, 465, 34, 350],
      [925, 555, 350, 34], [945, 325, 320, 34], [455, 575, 300, 34],
    ];
    walls.forEach(([x, y, width, height], index) => this.addMazeWall(x, y, width, height, index));
    this.items = [
      this.createTeaItem(1110, 245, 'HOT WATER', 0, colors.orange, 'K', 'Water acquired at maximum legal tea temperature.'),
      this.createTeaItem(430, 390, 'TEA BAG', 1, colors.green, 'T', 'Tea bag found hiding behind seventeen decaf impostors.'),
      this.createTeaItem(1080, 620, 'SUGAR', 2, colors.yellow, 'S', 'Sugar secured. Accounts has classified two spoons as capital expenditure.'),
    ];
    addPixelCabinet(this, 850, 180, 'DECAF TRAP', colors.purple);
    addPixelCabinet(this, 120, 185, 'EMPTY MUGS', colors.blue);
    this.add.text(640, 665, 'ORDER MATTERS: WATER → TEA → SUGAR → QUESTIONABLE PRODUCTIVITY', textStyle(13, '#071a2b')).setOrigin(0.5);
  }

  private addMazeWall(x: number, y: number, width: number, height: number, index: number): void {
    this.add.rectangle(x + 5, y + 6, width, height, colors.navy, 0.24).setDepth(2);
    this.add.rectangle(x, y, width, height, index % 2 ? colors.green : colors.blue, 0.9).setStrokeStyle(4, colors.navy).setDepth(3);
    this.add.rectangle(x, y - height / 2 + 7, Math.max(10, width - 8), 8, colors.white, 0.28).setDepth(4);
    this.walls.push(new Phaser.Geom.Rectangle(x - width / 2 - 25, y - height / 2 - 25, width + 50, height + 50));
  }

  private createTeaItem(x: number, y: number, name: string, order: number, color: number, icon: string, quip: string): TeaItem {
    const children: Phaser.GameObjects.GameObject[] = [
      this.add.rectangle(5, 7, 140, 84, colors.navy, 0.22),
      this.add.rectangle(0, 0, 138, 82, color).setStrokeStyle(4, colors.navy),
      this.add.text(0, -10, icon, textStyle(25, '#071a2b')).setOrigin(0.5),
      this.add.text(0, 23, `${name} • E`, textStyle(11, '#071a2b')).setOrigin(0.5),
    ];
    if (order === 0) {
      children.push(this.add.rectangle(0, -22, 42, 29, 0x607d8b).setStrokeStyle(3, colors.navy));
      children.push(this.add.text(0, -55, '≈ ≈ ≈', textStyle(14, '#ffffff')).setOrigin(0.5));
    }
    return { name, order, object: this.add.container(x, y, children).setDepth(7), collected: false, quip };
  }

  private completeTea(): void {
    if (this.ended) return; this.ended = true; this.movementLocked = true;
    app.state.completeTeaQuest(); app.state.setTime(WORKDAY_SCHEDULE.teaEnd); app.audio.play('salary');
    this.showDialog('Tea Compiler', `Tea successfully built with ${this.seconds} seconds of heat remaining. +200 points and +20 energy.`, () => {
      app.state.setTime(WORKDAY_SCHEDULE.salaryHuntStart); this.scene.start('HRSearchScene');
    });
  }

  private failTea(): void {
    if (this.ended) return; this.ended = true; this.movementLocked = true;
    app.state.failTeaQuest(); app.state.setTime(WORKDAY_SCHEDULE.teaEnd); app.audio.play('warning');
    this.showDialog('Tea Committee', 'The water went cold while requirements were still brewing. Level 6 is unlocked, but no tea means no energy bonus. Tragic and correctly documented.', () => {
      app.state.setTime(WORKDAY_SCHEDULE.salaryHuntStart); this.scene.start('HRSearchScene');
    });
  }
}
