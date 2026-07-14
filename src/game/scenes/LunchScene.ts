import Phaser from 'phaser';
import { WORKDAY_SCHEDULE } from '../../config/constants';
import { app } from '../managers/AppContext';
import { addInteractionBeacon, burstParticles, juiceText, playPersonReaction, pulseObject } from '../effects';
import { addPixelChair, addPixelCounter, addPixelTable, drawPixelFloor } from '../pixelArt';
import { addPerson, colors, textStyle } from '../ui';
import { BaseScene } from './BaseScene';

interface Plate { object: Phaser.GameObjects.Container; clean: boolean; checked: boolean; }
interface CafeteriaNpc { person: Phaser.GameObjects.Container; message: string; spoken: boolean; }

export class LunchScene extends BaseScene {
  private walls: Phaser.Geom.Rectangle[] = [];
  private plates: Plate[] = [];
  private seat?: Phaser.GameObjects.Container;
  private hasPlate = false;
  private seconds = 45;
  private timerText?: Phaser.GameObjects.Text;
  private ended = false;
  private shortcutButton?: Phaser.GameObjects.Container;
  private shortcutWall?: { bounds: Phaser.Geom.Rectangle; visuals: Phaser.GameObjects.GameObject[] };
  private shortcutOpened = false;
  private intern?: Phaser.GameObjects.Container;
  private internRescued = false;
  private goldenSpoon?: Phaser.GameObjects.Container;
  private secretFound = false;
  private npcs: CafeteriaNpc[] = [];

  constructor() { super('LunchScene'); }

  create(): void {
    this.walls = []; this.plates = []; this.seat = undefined; this.hasPlate = false;
    this.shortcutButton = undefined; this.shortcutWall = undefined; this.shortcutOpened = false;
    this.intern = undefined; this.internRescued = false; this.goldenSpoon = undefined; this.secretFound = false; this.npcs = [];
    this.seconds = app.state.snapshot.difficulty === 'casual' ? 65 : app.state.snapshot.difficulty === 'corporate' ? 46 : 55;
    this.timerText = undefined; this.ended = false;
    app.state.setTime(WORKDAY_SCHEDULE.lunchStart);
    this.setupWorld('LEVEL 3 / LUNCH MAZE', 'Find a clean plate and an empty seat. Secrets, shortcuts, and one lost intern are optional.', 90, 620);
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
    if (this.shortcutButton && !this.shortcutOpened && this.isNear(this.shortcutButton, 82)) { this.openShortcut(); return; }
    if (this.intern && !this.internRescued && this.isNear(this.intern, 82)) {
      this.internRescued = true; this.seconds += 7; app.state.addScore(80); app.audio.play('correct');
      playPersonReaction(this, this.intern, 'celebrate'); juiceText(this, this.intern.x, this.intern.y - 60, '+7s INTERN RESCUED', '#8ff0c8');
      this.showDialog('Lost Intern', 'You rescued me from a loop of reserved chairs! I added seven seconds using permissions I absolutely do not have.');
      return;
    }
    if (this.goldenSpoon && !this.secretFound && this.isNear(this.goldenSpoon, 78)) {
      this.secretFound = true; this.goldenSpoon.setVisible(false); app.state.addScore(150); app.audio.play('salary');
      burstParticles(this, this.player?.x ?? 80, this.player?.y ?? 150); juiceText(this, this.player?.x ?? 80, (this.player?.y ?? 150) - 45, 'SECRET +150');
      this.showDialog('Forbidden Cutlery', 'THE GOLDEN SPOON! Legend says it survived every office lunch since the dial-up era. It is also definitely company property.');
      return;
    }
    const npc = this.npcs.find((candidate) => !candidate.spoken && this.isNear(candidate.person, 76));
    if (npc) {
      npc.spoken = true; playPersonReaction(this, npc.person, 'confused');
      this.showDialog('Cafeteria Philosopher', npc.message); return;
    }
    const plate = this.plates.find((candidate) => !candidate.checked && this.isNear(candidate.object, 82));
    if (plate) {
      plate.checked = true;
      if (plate.clean) {
        this.hasPlate = true; plate.object.setVisible(false); app.state.addScore(100); app.audio.play('correct');
        burstParticles(this, plate.object.x, plate.object.y, [colors.green, colors.white, colors.cyan], 12);
        juiceText(this, plate.object.x, plate.object.y - 42, 'HYGIENE FOUND!');
        this.updateObjective('Clean plate found! Navigate through the maze to the glowing EMPTY SEAT.');
        this.showDialog('Clean Plate', 'This plate is so clean it may not belong to this office. Take it before ownership is discussed.');
      } else {
        plate.object.setAlpha(0.35); app.state.advanceTime(2); app.audio.play('wrong');
        if (this.player) playPersonReaction(this, this.player, 'confused');
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
    addPixelCounter(this, 555, 145, 900, 'CAFETERIA CITADEL - CLEANLINESS NOT GUARANTEED', colors.orange);
    const walls: Array<[number, number, number, number]> = [
      [300, 390, 36, 430], [510, 300, 390, 34], [720, 475, 36, 340],
      [920, 250, 310, 34], [930, 520, 330, 34], [480, 590, 280, 34],
      [155, 365, 150, 30], [620, 195, 30, 105], [1080, 405, 185, 30], [820, 635, 30, 92],
    ];
    walls.forEach(([x, y, width, height], index) => this.addMazeWall(x, y, width, height, index));
    this.plates = [
      this.createPlate(1110, 245, true, 'CLEAN'),
      this.createPlate(455, 390, false, 'MAYBE'),
      this.createPlate(850, 400, false, 'VINTAGE'),
      this.createPlate(155, 480, false, 'LEGACY'),
    ];
    this.seat = addPixelChair(this, 1120, 620, colors.green).setScale(1.2);
    this.seat.add(this.add.text(0, -70, 'EMPTY SEAT - E', textStyle(13, '#071a2b')).setOrigin(0.5));
    pulseObject(this, this.seat);
    this.shortcutButton = this.add.container(565, 405, [
      this.add.rectangle(4, 6, 96, 68, colors.navy, 0.24),
      this.add.rectangle(0, 0, 94, 66, colors.purple).setStrokeStyle(4, colors.navy),
      this.add.circle(0, -8, 15, colors.yellow).setStrokeStyle(3, colors.navy),
      this.add.text(0, 21, 'SHORTCUT', textStyle(10, '#ffffff')).setOrigin(0.5),
    ]).setDepth(8);
    addInteractionBeacon(this, 565, 352, 'E', colors.yellow);
    this.intern = addPerson(this, 655, 555, colors.green, 'LOST INTERN').setScale(0.82).setDepth(9);
    addInteractionBeacon(this, 655, 482, 'RESCUE', colors.green);
    this.goldenSpoon = this.add.container(82, 155, [
      this.add.ellipse(0, -8, 20, 28, colors.yellow).setStrokeStyle(3, colors.navy),
      this.add.rectangle(0, 14, 7, 36, colors.yellow).setStrokeStyle(2, colors.navy),
      this.add.text(0, 45, 'SECRET?', textStyle(10, '#071a2b')).setOrigin(0.5),
    ]).setDepth(8);
    pulseObject(this, this.goldenSpoon);
    const diners: Array<[number, number, string, string]> = [
      [430, 190, 'SEAT RESERVED BY LAPTOP', 'My laptop is reserving this seat while I reserve another. This is called horizontal scaling.'],
      [950, 620, 'CALLS DURING LUNCH', 'I joined a client call during lunch to prove that boundaries are an optional dependency.'],
    ];
    diners.forEach(([x, y, label, message], index) => {
      addPixelTable(this, x, y, 120, index % 2 ? colors.purple : 0xa86438);
      const person = addPerson(this, x, y - 15, index % 2 ? colors.purple : colors.blue, label).setScale(0.8).setDepth(8);
      this.npcs.push({ person, spoken: false, message });
    });
  }

  private addMazeWall(x: number, y: number, width: number, height: number, index: number): void {
    const visuals: Phaser.GameObjects.GameObject[] = [
      this.add.rectangle(x + 5, y + 6, width, height, colors.navy, 0.25).setDepth(2),
      this.add.rectangle(x, y, width, height, index % 2 ? colors.purple : colors.blue, 0.9).setStrokeStyle(4, colors.navy).setDepth(3),
      this.add.rectangle(x, y - height / 2 + 7, Math.max(10, width - 8), 8, colors.cyan, 0.45).setDepth(4),
    ];
    const bounds = new Phaser.Geom.Rectangle(x - width / 2 - 25, y - height / 2 - 25, width + 50, height + 50);
    this.walls.push(bounds);
    if (index === 2) this.shortcutWall = { bounds, visuals };
  }

  private openShortcut(): void {
    if (!this.shortcutWall || !this.shortcutButton) return;
    this.shortcutOpened = true;
    this.walls = this.walls.filter((wall) => wall !== this.shortcutWall?.bounds);
    this.shortcutWall.visuals.forEach((visual, index) => this.tweens.add({ targets: visual, alpha: 0, scaleY: 0.05, duration: 240 + index * 40, onComplete: () => visual.destroy() }));
    this.shortcutButton.setAlpha(0.45); app.state.addScore(60); app.audio.play('click');
    burstParticles(this, 720, 475, [colors.purple, colors.cyan, colors.yellow]);
    this.showDialog('Suspicious Wall Button', 'You pressed the unlabeled cafeteria button. A wall retracted. Facilities would like to know how, but Facilities is also lost.');
  }

  private createPlate(x: number, y: number, clean: boolean, label: string): Plate {
    const object = this.add.container(x, y, [
      this.add.rectangle(5, 7, 126, 78, colors.navy, 0.22),
      this.add.rectangle(0, 0, 124, 76, clean ? colors.green : colors.yellow).setStrokeStyle(4, colors.navy),
      this.add.ellipse(0, -8, 58, 34, clean ? colors.white : 0xb87a42).setStrokeStyle(4, colors.navy),
      this.add.text(0, 23, `${label} - E`, textStyle(12, '#071a2b')).setOrigin(0.5),
    ]).setDepth(7);
    if (clean) pulseObject(this, object);
    return { object, clean, checked: false };
  }

  private completeLunch(): void {
    if (this.ended) return; this.ended = true; this.movementLocked = true;
    app.state.completeLunch(); app.state.setTime(WORKDAY_SCHEDULE.lunchEnd); app.audio.play('correct');
    if (this.player) playPersonReaction(this, this.player, 'celebrate');
    this.showDialog('Cafeteria System', `Level 3 passed with ${this.seconds} seconds left. Clean plate, empty seat, and no committee approval. +250 points and +25 energy.`, () => this.scene.start('FightScene'));
  }

  private failLunch(): void {
    if (this.ended) return; this.ended = true; this.movementLocked = true;
    app.state.failLunch(); app.state.setTime(WORKDAY_SCHEDULE.lunchEnd); app.audio.play('warning');
    if (this.player) playPersonReaction(this, this.player, 'panic');
    this.showDialog('HR Warning', 'Lunch exceeded the allotted time. Please chew with greater quarterly alignment. Level 4 is unlocked anyway.', () => this.scene.start('FightScene'));
  }
}
