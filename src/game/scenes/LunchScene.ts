import Phaser from 'phaser';
import { WORKDAY_SCHEDULE } from '../../config/constants';
import { app } from '../managers/AppContext';
import { addPixelChair, addPixelCounter, addPixelTable, drawPixelFloor } from '../pixelArt';
import { addPerson, colors, textStyle } from '../ui';
import { BaseScene } from './BaseScene';

interface Plate { object: Phaser.GameObjects.Container; clean: boolean; checked: boolean; }

export class LunchScene extends BaseScene {
  private walls: Phaser.Geom.Rectangle[] = [];
  private plates: Plate[] = [];
  private seat?: Phaser.GameObjects.Container;
  private hasPlate = false;
  private seconds = 45;
  private timerText?: Phaser.GameObjects.Text;
  private ended = false;

  constructor() { super('LunchScene'); }

  create(): void {
    this.walls = []; this.plates = []; this.seat = undefined; this.hasPlate = false;
    this.seconds = app.state.snapshot.difficulty === 'casual' ? 55 : app.state.snapshot.difficulty === 'corporate' ? 38 : 45;
    this.timerText = undefined; this.ended = false;
    app.state.setTime(WORKDAY_SCHEDULE.lunchStart);
    this.setupWorld('LEVEL 3 / LUNCH MAZE', 'Find the CLEAN plate, then navigate to the glowing empty seat before time runs out.', 90, 620);
    this.drawMaze();
    this.add.rectangle(1110, 145, 190, 82, colors.navy, 0.96).setStrokeStyle(4, colors.orange).setDepth(108);
    this.timerText = this.add.text(1110, 145, `LUNCH CLOCK\n${this.seconds}s`, { ...textStyle(17, '#ffc857'), align: 'center' }).setOrigin(0.5).setDepth(110);
    this.time.addEvent({ delay: 1000, loop: true, callback: () => {
      if (this.ended || this.movementLocked) return;
      this.seconds -= 1; this.timerText?.setText(`LUNCH CLOCK\n${this.seconds}s`);
      if (this.seconds <= 0) this.failLunch();
    } });
  }

  update(time: number, delta: number): void {
    if (this.ended || !this.player) return;
    const previous = { x: this.player.x, y: this.player.y };
    this.updateMovement(time, delta, 205);
    if (this.walls.some((wall) => wall.contains(this.player!.x, this.player!.y))) this.player.setPosition(previous.x, previous.y);
  }

  protected override interact(): void {
    if (this.ended) return;
    const plate = this.plates.find((candidate) => !candidate.checked && this.isNear(candidate.object, 82));
    if (plate) {
      plate.checked = true;
      if (plate.clean) {
        this.hasPlate = true; plate.object.setVisible(false); app.state.addScore(100); app.audio.play('correct');
        this.updateObjective('Clean plate found! Navigate through the maze to the glowing EMPTY SEAT.');
        this.showDialog('Clean Plate', 'This plate is so clean it may not belong to this office. Take it before ownership is discussed.');
      } else {
        plate.object.setAlpha(0.35); app.state.advanceTime(2); app.audio.play('wrong');
        this.showDialog('Suspicious Plate', Phaser.Utils.Array.GetRandom([
          'This plate contains a curry fossil from a previous sprint.',
          'Not clean. The stain has already requested permanent residency.',
          'This plate passed visual QA only because nobody looked at it.',
        ]));
      }
      this.refreshHud(); return;
    }
    if (this.seat && this.isNear(this.seat, 92)) {
      if (!this.hasPlate) { this.showDialog('Empty Seat', 'You found a seat but brought no plate. This is now just an unpaid meeting.'); return; }
      this.completeLunch();
    }
  }

  private drawMaze(): void {
    drawPixelFloor(this, 0xf5dfb5, 0xe9ca91);
    addPixelCounter(this, 555, 145, 900, 'CAFETERIA MAZE • CLEANLINESS NOT GUARANTEED', colors.orange);
    const walls: Array<[number, number, number, number]> = [
      [300, 390, 36, 430], [510, 300, 390, 34], [720, 475, 36, 340],
      [920, 250, 310, 34], [930, 520, 330, 34], [480, 590, 280, 34],
    ];
    walls.forEach(([x, y, width, height], index) => this.addMazeWall(x, y, width, height, index));
    this.plates = [
      this.createPlate(1110, 245, true, 'CLEAN'),
      this.createPlate(455, 390, false, 'MAYBE'),
      this.createPlate(850, 400, false, 'VINTAGE'),
    ];
    this.seat = addPixelChair(this, 1120, 620, colors.green).setScale(1.2);
    this.seat.add(this.add.text(0, -70, 'EMPTY SEAT • E', textStyle(13, '#071a2b')).setOrigin(0.5));
    [
      [430, 190, 'Seat Reserved By Laptop'], [620, 420, 'Lunch Influencer'], [950, 620, 'Calls During Lunch'],
    ].forEach(([x, y, label], index) => {
      addPixelTable(this, Number(x), Number(y), 120, index % 2 ? colors.purple : 0xa86438);
      addPerson(this, Number(x), Number(y) - 15, index % 2 ? colors.purple : colors.blue, String(label)).setScale(0.8).setDepth(8);
    });
  }

  private addMazeWall(x: number, y: number, width: number, height: number, index: number): void {
    this.add.rectangle(x + 5, y + 6, width, height, colors.navy, 0.25).setDepth(2);
    this.add.rectangle(x, y, width, height, index % 2 ? colors.purple : colors.blue, 0.9).setStrokeStyle(4, colors.navy).setDepth(3);
    this.add.rectangle(x, y - height / 2 + 7, Math.max(10, width - 8), 8, colors.cyan, 0.45).setDepth(4);
    this.walls.push(new Phaser.Geom.Rectangle(x - width / 2 - 25, y - height / 2 - 25, width + 50, height + 50));
  }

  private createPlate(x: number, y: number, clean: boolean, label: string): Plate {
    const object = this.add.container(x, y, [
      this.add.rectangle(5, 7, 126, 78, colors.navy, 0.22),
      this.add.rectangle(0, 0, 124, 76, clean ? colors.green : colors.yellow).setStrokeStyle(4, colors.navy),
      this.add.ellipse(0, -8, 58, 34, clean ? colors.white : 0xb87a42).setStrokeStyle(4, colors.navy),
      this.add.text(0, 23, `${label} • E`, textStyle(12, '#071a2b')).setOrigin(0.5),
    ]).setDepth(7);
    return { object, clean, checked: false };
  }

  private completeLunch(): void {
    if (this.ended) return; this.ended = true; this.movementLocked = true;
    app.state.completeLunch(); app.state.setTime(WORKDAY_SCHEDULE.lunchEnd); app.audio.play('correct');
    this.showDialog('Cafeteria System', `Level 3 passed with ${this.seconds} seconds left. Clean plate, empty seat, and no committee approval. +250 points and +25 energy.`, () => this.scene.start('FightScene'));
  }

  private failLunch(): void {
    if (this.ended) return; this.ended = true; this.movementLocked = true;
    app.state.failLunch(); app.state.setTime(WORKDAY_SCHEDULE.lunchEnd); app.audio.play('warning');
    this.showDialog('HR Warning', 'Lunch exceeded the allotted time. This is a funny official warning: please chew with greater quarterly alignment. Level 4 is unlocked anyway.', () => this.scene.start('FightScene'));
  }
}
