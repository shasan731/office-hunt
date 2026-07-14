import Phaser from 'phaser';
import events from '../../data/randomEvents.json';
import { app } from '../managers/AppContext';
import { BaseScene } from './BaseScene';
import { colors, textStyle } from '../ui';

export class CommuteScene extends BaseScene {
  private obstacles: Phaser.GameObjects.Rectangle[] = [];
  private tea?: Phaser.GameObjects.Container;
  private office?: Phaser.GameObjects.Rectangle;
  private cooldown = false;
  constructor() { super('CommuteScene'); }

  create(): void {
    this.setupWorld('1 / Commute', 'Reach SoftifyBD before traffic achieves sentience.', 80, 610);
    this.add.rectangle(640, 390, 1280, 500, 0x596d78);
    for (let y = 180; y < 650; y += 120) for (let x = 0; x < 1280; x += 160) this.add.rectangle(x + 45, y, 80, 8, colors.white, 0.75);
    this.add.rectangle(70, 600, 115, 105, colors.yellow).setStrokeStyle(4, colors.navy);
    this.add.text(70, 525, 'HOME', textStyle(18, '#071a2b')).setOrigin(0.5);
    this.office = this.add.rectangle(1190, 170, 145, 110, colors.blue).setStrokeStyle(5, colors.navy);
    this.add.text(1190, 158, 'SOFTIFYBD\nOFFICE', { ...textStyle(19), align: 'center' }).setOrigin(0.5);
    const obstacleData = [
      [260, 220, 95, 45, colors.orange], [520, 360, 150, 50, colors.yellow], [820, 220, 80, 58, colors.purple],
      [1000, 475, 130, 46, colors.green], [650, 590, 100, 42, colors.orange], [350, 495, 65, 65, 0x35515c],
    ] as const;
    obstacleData.forEach(([x, y, width, height, color], i) => {
      const item = this.add.rectangle(x, y, width, height, color).setStrokeStyle(4, colors.navy);
      item.setData('direction', i % 2 ? -1 : 1); this.obstacles.push(item);
    });
    this.tea = this.add.container(780, 560, [this.add.rectangle(0, 0, 100, 60, 0xe38b36).setStrokeStyle(4, colors.navy), this.add.text(0, 0, 'TEA\n+18 ⚡', { ...textStyle(15), align: 'center' }).setOrigin(0.5)]);
    this.add.text(1030, 630, 'Shortcut →', textStyle(17, '#ffc857')).setRotation(-0.18);
  }

  update(time: number, delta: number): void {
    this.updateMovement(time, delta);
    this.obstacles.forEach((obstacle, index) => {
      obstacle.x += Number(obstacle.getData('direction')) * (25 + index * 5) * app.difficulty.speed * delta / 1000;
      if (obstacle.x < 160 || obstacle.x > 1120) obstacle.setData('direction', -Number(obstacle.getData('direction')));
      if (!this.cooldown && this.isNear(obstacle, 58)) this.collide();
    });
    if (this.office && this.isNear(this.office, 92)) this.arrive();
  }

  protected override interact(): void {
    if (this.tea && this.isNear(this.tea, 90)) {
      app.state.addTea(); app.audio.play('correct'); this.showDialog('Tea Stall', 'Productivity increased. Punctuality decreased.'); this.refreshHud();
    }
  }

  private collide(): void {
    this.cooldown = true; app.state.changeEnergy(-8); app.state.advanceTime(2); app.audio.play('collision');
    this.showDialog('Traffic Update', Phaser.Utils.Array.GetRandom(events.commute));
    this.time.delayedCall(1000, () => { this.cooldown = false; });
  }

  private arrive(): void {
    if (this.movementLocked) return;
    this.movementLocked = true; const points = app.state.recordArrival();
    if (app.state.snapshot.minutes < 600) app.state.unlock('perfect-attendance');
    this.showDialog('Office Security', `${points >= 500 ? 'You reached the office before HR noticed.' : points > 0 ? 'Close enough. The attendance device looks optimistic.' : 'Late detected. Blame traffic with confidence.'}  ${points >= 0 ? '+' : ''}${points} points`, () => this.scene.start('LobbyScene'));
  }
}
