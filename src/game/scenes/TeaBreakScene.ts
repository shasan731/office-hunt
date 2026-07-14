import Phaser from 'phaser';
import { WORKDAY_SCHEDULE } from '../../config/constants';
import { app } from '../managers/AppContext';
import { addInteractionBeacon, burstParticles, impactFlash, juiceText, playPersonReaction, pulseObject } from '../effects';
import { addPixelCabinet, addPixelCounter, drawPixelFloor } from '../pixelArt';
import { addPerson, colors, textStyle } from '../ui';
import { BaseScene } from './BaseScene';

interface TeaItem { name: string; order: number; object: Phaser.GameObjects.Container; collected: boolean; quip: string; }

export class TeaBreakScene extends BaseScene {
  private walls: Phaser.Geom.Rectangle[] = [];
  private items: TeaItem[] = [];
  private nextItem = 0;
  private seconds = 42;
  private timerText?: Phaser.GameObjects.Text;
  private ended = false;
  private fuseButton?: Phaser.GameObjects.Container;
  private kettlePowered = false;
  private shortcutWall?: { bounds: Phaser.Geom.Rectangle; visuals: Phaser.GameObjects.GameObject[] };
  private shortcutOpened = false;
  private teaSage?: Phaser.GameObjects.Container;
  private sageSpoken = false;
  private trolley?: Phaser.GameObjects.Container;
  private trolleyUsed = false;
  private boostUntil = 0;
  private secretCoffee?: Phaser.GameObjects.Container;
  private secretFound = false;

  constructor() { super('TeaBreakScene'); }

  create(): void {
    this.walls = []; this.items = []; this.nextItem = 0; this.timerText = undefined; this.ended = false;
    this.fuseButton = undefined; this.kettlePowered = false; this.shortcutWall = undefined; this.shortcutOpened = false;
    this.teaSage = undefined; this.sageSpoken = false; this.trolley = undefined; this.trolleyUsed = false; this.boostUntil = 0;
    this.secretCoffee = undefined; this.secretFound = false;
    this.seconds = app.state.snapshot.difficulty === 'casual' ? 58 : app.state.snapshot.difficulty === 'corporate' ? 38 : 48;
    app.state.setTime(WORKDAY_SCHEDULE.teaStart);
    this.setupWorld('LEVEL 5 / HOT TEA MAZE', 'Power the kettle, then collect hot water, tea, and sugar. Find the Tea Sage for a shortcut.', 90, 620);
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
    const boosted = time < this.boostUntil;
    this.updateMovement(time, delta, boosted ? 305 : 215);
    if (this.walls.some((wall) => wall.contains(this.player!.x, this.player!.y))) this.player.setPosition(previous.x, previous.y);
    if (boosted && !app.save.getData().settings.reducedMotion) this.player.setAngle(Math.sin(time / 45) * 5);
  }

  protected override interact(): void {
    if (this.ended) return;
    if (this.fuseButton && !this.kettlePowered && this.isNear(this.fuseButton, 82)) {
      this.kettlePowered = true; this.fuseButton.setAlpha(0.55); app.state.addScore(50); app.audio.play('correct');
      impactFlash(this, colors.yellow); juiceText(this, this.fuseButton.x, this.fuseButton.y - 55, 'KETTLE ONLINE');
      this.updateObjective('Kettle powered! Find HOT WATER, then TEA BAG, then SUGAR.');
      this.showDialog('Pantry Mainframe', 'Power restored. The kettle has booted in safe mode and accepted the terms of beverage service.');
      return;
    }
    if (this.teaSage && !this.sageSpoken && this.isNear(this.teaSage, 82)) {
      this.sageSpoken = true; this.seconds += 5; app.state.addScore(75); playPersonReaction(this, this.teaSage, 'celebrate');
      this.openShortcut();
      this.showDialog('Tea Sage', 'I have brewed since Internet Explorer 6. The shortcut opens for one offering: never microwave tea. I also found five spare seconds.');
      return;
    }
    if (this.trolley && !this.trolleyUsed && this.isNear(this.trolley, 82)) {
      this.trolleyUsed = true; this.trolley.setVisible(false); this.boostUntil = this.time.now + 5200; app.audio.play('collision');
      burstParticles(this, this.player?.x ?? 400, this.player?.y ?? 620, [colors.orange, colors.yellow, colors.white]);
      juiceText(this, this.player?.x ?? 400, (this.player?.y ?? 620) - 55, 'RUNAWAY TROLLEY BOOST!');
      this.showDialog('Unlicensed Transport', 'You expected a speed boost. You got a runaway snack trolley. Steering is a rumor, but velocity is excellent.');
      return;
    }
    if (this.secretCoffee && !this.secretFound && this.isNear(this.secretCoffee, 75)) {
      this.secretFound = true; this.secretCoffee.setVisible(false); app.state.addScore(125); app.audio.play('salary');
      juiceText(this, this.player?.x ?? 80, (this.player?.y ?? 170) - 50, 'FORBIDDEN BEAN +125');
      this.showDialog('Secret Coffee', 'You discovered the emergency coffee bean. It whispers: "Tea level, wrong beverage." You pocket it for New Game Plus.');
      return;
    }
    const item = this.items.find((candidate) => !candidate.collected && this.isNear(candidate.object, 85));
    if (!item) return;
    if (item.order === 0 && !this.kettlePowered) {
      this.showDialog('Unpowered Kettle', 'The kettle is emotionally available but electrically absent. Find the glowing fuse button first.');
      return;
    }
    if (item.order !== this.nextItem) {
      const needed = this.items.find((candidate) => candidate.order === this.nextItem)?.name ?? 'TEA LOGIC';
      if (this.player) playPersonReaction(this, this.player, 'confused');
      this.showDialog('Tea Compiler', `${item.name} is out of order. Find ${needed} first or the beverage will fail type-checking.`);
      return;
    }
    item.collected = true; item.object.setVisible(false); this.nextItem += 1; app.state.addScore(60); app.audio.play('correct');
    burstParticles(this, item.object.x, item.object.y, [colors.orange, colors.green, colors.yellow]);
    juiceText(this, item.object.x, item.object.y - 45, `+ ${item.name}`);
    this.showDialog('Tea Quest', item.quip);
    if (this.nextItem >= this.items.length) this.completeTea();
    else this.updateObjective(`${item.name} secured. Now find ${this.items.find((candidate) => candidate.order === this.nextItem)?.name}. ${this.seconds}s remain.`);
    this.refreshHud();
  }

  private drawMaze(): void {
    drawPixelFloor(this, 0xd8edf5, 0xc6e0ea);
    addPixelCounter(this, 555, 145, 900, 'PANTRY POWER PLANT - BEVERAGE SLA ACTIVE', colors.orange);
    const walls: Array<[number, number, number, number]> = [
      [270, 390, 34, 440], [500, 245, 420, 34], [690, 465, 34, 350],
      [925, 555, 350, 34], [945, 325, 320, 34], [455, 575, 300, 34],
      [145, 390, 135, 30], [590, 660, 30, 90], [810, 195, 30, 105], [1115, 440, 135, 30],
    ];
    walls.forEach(([x, y, width, height], index) => this.addMazeWall(x, y, width, height, index));
    this.items = [
      this.createTeaItem(1110, 245, 'HOT WATER', 0, colors.orange, 'K', 'Water acquired at maximum legal tea temperature.'),
      this.createTeaItem(430, 390, 'TEA BAG', 1, colors.green, 'T', 'Tea bag found hiding behind seventeen decaf impostors.'),
      this.createTeaItem(1080, 620, 'SUGAR', 2, colors.yellow, 'S', 'Sugar secured. Accounts classified two spoons as capital expenditure.'),
    ];
    this.fuseButton = this.add.container(455, 500, [
      this.add.rectangle(5, 6, 104, 70, colors.navy, 0.23),
      this.add.rectangle(0, 0, 102, 68, 0x455a64).setStrokeStyle(4, colors.navy),
      this.add.circle(0, -7, 17, 0xe53935).setStrokeStyle(4, colors.white),
      this.add.text(0, 22, 'KETTLE FUSE', textStyle(10, '#ffffff')).setOrigin(0.5),
    ]).setDepth(8);
    addInteractionBeacon(this, 455, 445, 'POWER');
    this.teaSage = addPerson(this, 850, 185, colors.purple, 'TEA SAGE').setScale(0.82).setDepth(9);
    addInteractionBeacon(this, 850, 112, 'TRADE', colors.purple);
    this.trolley = this.add.container(405, 625, [
      this.add.rectangle(0, 0, 105, 38, colors.orange).setStrokeStyle(4, colors.navy),
      this.add.rectangle(0, -20, 90, 13, colors.yellow).setStrokeStyle(3, colors.navy),
      this.add.circle(-35, 24, 11, colors.navy), this.add.circle(35, 24, 11, colors.navy),
      this.add.text(0, 0, 'BOOST?', textStyle(11, '#071a2b')).setOrigin(0.5),
    ]).setDepth(8);
    pulseObject(this, this.trolley);
    this.secretCoffee = this.add.container(78, 165, [
      this.add.circle(0, 0, 17, 0x6d4c41).setStrokeStyle(4, colors.yellow),
      this.add.text(0, 34, '???', textStyle(10, '#7c5ce7')).setOrigin(0.5),
    ]).setDepth(8);
    pulseObject(this, this.secretCoffee);
    addPixelCabinet(this, 850, 285, 'DECAF TRAP', colors.purple);
    addPixelCabinet(this, 120, 285, 'EMPTY MUGS', colors.blue);
    this.add.text(640, 685, 'POWER -> WATER -> TEA -> SUGAR -> QUESTIONABLE PRODUCTIVITY', textStyle(12, '#071a2b')).setOrigin(0.5);
  }

  private addMazeWall(x: number, y: number, width: number, height: number, index: number): void {
    const visuals: Phaser.GameObjects.GameObject[] = [
      this.add.rectangle(x + 5, y + 6, width, height, colors.navy, 0.24).setDepth(2),
      this.add.rectangle(x, y, width, height, index % 2 ? colors.green : colors.blue, 0.9).setStrokeStyle(4, colors.navy).setDepth(3),
      this.add.rectangle(x, y - height / 2 + 7, Math.max(10, width - 8), 8, colors.white, 0.28).setDepth(4),
    ];
    const bounds = new Phaser.Geom.Rectangle(x - width / 2 - 25, y - height / 2 - 25, width + 50, height + 50);
    this.walls.push(bounds);
    if (index === 4) this.shortcutWall = { bounds, visuals };
  }

  private openShortcut(): void {
    if (!this.shortcutWall || this.shortcutOpened) return;
    this.shortcutOpened = true;
    this.walls = this.walls.filter((wall) => wall !== this.shortcutWall?.bounds);
    this.shortcutWall.visuals.forEach((visual, index) => this.tweens.add({ targets: visual, alpha: 0, scaleX: 0.05, duration: 230 + index * 35, onComplete: () => visual.destroy() }));
    burstParticles(this, 945, 325, [colors.green, colors.cyan, colors.yellow]);
    juiceText(this, 945, 325, 'SAGE SHORTCUT OPEN');
  }

  private createTeaItem(x: number, y: number, name: string, order: number, color: number, icon: string, quip: string): TeaItem {
    const children: Phaser.GameObjects.GameObject[] = [
      this.add.rectangle(5, 7, 140, 84, colors.navy, 0.22),
      this.add.rectangle(0, 0, 138, 82, color).setStrokeStyle(4, colors.navy),
      this.add.text(0, -10, icon, textStyle(25, '#071a2b')).setOrigin(0.5),
      this.add.text(0, 23, `${name} - E`, textStyle(11, '#071a2b')).setOrigin(0.5),
    ];
    if (order === 0) {
      children.push(this.add.rectangle(0, -22, 42, 29, 0x607d8b).setStrokeStyle(3, colors.navy));
      children.push(this.add.text(0, -55, '~ ~ ~', textStyle(14, '#ffffff')).setOrigin(0.5));
    }
    const object = this.add.container(x, y, children).setDepth(7);
    pulseObject(this, object);
    return { name, order, object, collected: false, quip };
  }

  private completeTea(): void {
    if (this.ended) return; this.ended = true; this.movementLocked = true;
    app.state.completeTeaQuest(); app.state.setTime(WORKDAY_SCHEDULE.teaEnd); app.audio.play('salary');
    if (this.player) playPersonReaction(this, this.player, 'celebrate');
    this.showDialog('Tea Compiler', `Tea built with ${this.seconds} seconds of heat remaining. +200 points and +20 energy. Productivity briefly has a health bar.`, () => {
      app.state.setTime(WORKDAY_SCHEDULE.salaryHuntStart); this.scene.start('HRSearchScene');
    });
  }

  private failTea(): void {
    if (this.ended) return; this.ended = true; this.movementLocked = true;
    app.state.failTeaQuest(); app.state.setTime(WORKDAY_SCHEDULE.teaEnd); app.audio.play('warning');
    if (this.player) playPersonReaction(this, this.player, 'panic');
    this.showDialog('Tea Committee', 'The water went cold while requirements were brewing. Level 6 unlocks, but no tea means no energy bonus. Tragic and correctly documented.', () => {
      app.state.setTime(WORKDAY_SCHEDULE.salaryHuntStart); this.scene.start('HRSearchScene');
    });
  }
}
