import Phaser from 'phaser';
import { app } from '../managers/AppContext';
import { BaseScene } from './BaseScene';
import { addPerson, animatePerson, colors, textStyle } from '../ui';
import { WORKDAY_SCHEDULE } from '../../config/constants';
import { addPixelChair, addPixelCounter, addPixelTable, drawPixelFloor } from '../pixelArt';

interface LunchItem {
  name: string;
  object: Phaser.GameObjects.Container;
  collected: boolean;
  quip: string;
}

interface LunchRival {
  person: Phaser.GameObjects.Container;
  direction: number;
}

export class LunchScene extends BaseScene {
  private items: LunchItem[] = [];
  private rivals: LunchRival[] = [];
  private table?: Phaser.GameObjects.Container;
  private collisionCooldown = false;

  constructor() { super('LunchScene'); }

  create(): void {
    this.items = [];
    this.rivals = [];
    this.table = undefined;
    this.collisionCooldown = false;
    app.state.setTime(WORKDAY_SCHEDULE.lunchStart);
    this.setupWorld('4 / Lunch Break', 'Assemble lunch: plate, rice, curry, then claim a table.', 105, 610);
    drawPixelFloor(this, 0xf5dfb5, 0xe9ca91);
    addPixelCounter(this, 640, 130, 1080, 'CAFETERIA SERVICE COUNTER', colors.orange);
    this.add.text(640, 125, 'OFFICE CAFETERIA — QUEUE COMPLEXITY: O(n²)', textStyle(18)).setOrigin(0.5);
    for (let x = 280; x <= 940; x += 330) {
      addPixelTable(this, x, 440, 190);
      addPixelChair(this, x - 65, 520, colors.blue);
      addPixelChair(this, x + 65, 520, colors.blue);
    }
    this.items = [
      this.createItem(250, 220, 'PLATE', '□', 'Plate acquired. It has passed the load-bearing test.'),
      this.createItem(570, 240, 'RICE', ':::', 'Rice secured. Serving size estimated by optimism.'),
      this.createItem(860, 205, 'CURRY', '~', 'Curry collected. Spice level: production hotfix.'),
    ];
    this.table = addPixelTable(this, 1110, 560, 170, colors.green);
    this.table.add(this.add.text(0, 0, 'SAFE TABLE\nE TO EAT', { ...textStyle(15), align: 'center' }).setOrigin(0.5));
    ['Lunch Queue', 'Biryani Reviewer', 'Last Spoon'].forEach((label, index) => {
      const person = addPerson(this, 390 + index * 265, 330, index === 1 ? colors.purple : colors.orange, label).setDepth(10);
      this.rivals.push({ person, direction: index % 2 ? -1 : 1 });
    });
  }

  update(time: number, delta: number): void {
    this.updateMovement(time, delta, 205);
    this.rivals.forEach((rival, index) => {
      rival.person.x += rival.direction * (28 + index * 7) * app.difficulty.hazardSpeed * delta / 1000;
      if (rival.person.x < 170 || rival.person.x > 1060) rival.direction *= -1;
      if (!app.save.getData().settings.reducedMotion) animatePerson(rival.person, true, time);
      if (!this.collisionCooldown && this.isNear(rival.person, 55)) this.bumpLunchQueue();
    });
  }

  protected override interact(): void {
    const item = this.items.find((candidate) => !candidate.collected && this.isNear(candidate.object, 85));
    if (item) {
      item.collected = true;
      item.object.setVisible(false);
      app.state.addScore(50);
      app.audio.play('correct');
      const remaining = this.items.filter((candidate) => !candidate.collected).length;
      this.updateObjective(remaining ? `${item.name} secured. ${remaining} lunch component${remaining === 1 ? '' : 's'} remaining.` : 'Lunch assembled! Reach the green safe table.');
      this.showDialog('Cafeteria System', item.quip);
      this.refreshHud();
      return;
    }
    if (this.table && this.isNear(this.table, 100)) {
      if (this.items.some((candidate) => !candidate.collected)) {
        this.showDialog('Hungry Stomach', 'This plate contains only ambition. Collect the actual food first.');
        return;
      }
      this.finishLunch();
    }
  }

  private createItem(x: number, y: number, name: string, icon: string, quip: string): LunchItem {
    const object = this.add.container(x, y, [
      this.add.rectangle(0, 0, 130, 75, colors.yellow).setStrokeStyle(4, colors.navy),
      this.add.text(0, -8, icon, textStyle(25, '#071a2b')).setOrigin(0.5),
      this.add.text(0, 22, `${name} • E`, textStyle(14, '#071a2b')).setOrigin(0.5),
    ]);
    return { name, object, collected: false, quip };
  }

  private bumpLunchQueue(): void {
    this.collisionCooldown = true;
    app.state.advanceTime(2);
    app.state.changeEnergy(-4);
    app.audio.play('collision');
    this.showDialog('Lunch Queue', 'Someone said “I am only taking one item.” That item was the entire buffet.');
    this.time.delayedCall(900, () => { this.collisionCooldown = false; });
  }

  private finishLunch(): void {
    if (this.movementLocked) return;
    app.state.completeLunch();
    app.state.setTime(WORKDAY_SCHEDULE.lunchEnd);
    app.audio.play('correct');
    this.showDialog(app.state.snapshot.playerName, 'Lunch completed before the food entered a requirements meeting. +250 points and +25 energy.', () => this.scene.start('TeaBreakScene'));
  }
}
