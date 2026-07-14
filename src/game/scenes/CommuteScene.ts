import Phaser from 'phaser';
import { app } from '../managers/AppContext';
import { addPixelBuilding, addPixelStreetLight, addPixelVehicle, drawPixelRoad, type PixelVehicleType } from '../pixelArt';
import { colors, textStyle } from '../ui';
import { BaseScene } from './BaseScene';

interface TrafficVehicle {
  object: Phaser.GameObjects.Container;
  direction: number;
  speed: number;
}

export class CommuteScene extends BaseScene {
  private vehicles: TrafficVehicle[] = [];
  private tea?: Phaser.GameObjects.Container;
  private office?: Phaser.GameObjects.Container;
  private dead = false;

  constructor() { super('CommuteScene'); }

  create(): void {
    this.vehicles = [];
    this.tea = undefined;
    this.office = undefined;
    this.dead = false;
    this.setupWorld('1 / Commute', 'Cross the pixel traffic. Cars are fatal. Reach the office before 10:00 AM.', 82, 610);
    this.drawCity();
    this.createTraffic();
  }

  update(time: number, delta: number): void {
    if (this.dead) return;
    this.updateMovement(time, delta);
    this.vehicles.forEach((vehicle) => {
      vehicle.object.x += vehicle.direction * vehicle.speed * app.difficulty.hazardSpeed * delta / 1000;
      if (vehicle.direction > 0 && vehicle.object.x > 1380) vehicle.object.x = -140;
      if (vehicle.direction < 0 && vehicle.object.x < -140) vehicle.object.x = 1380;
      if (!this.movementLocked && this.hitsVehicle(vehicle.object)) this.dieInTraffic();
    });
    if (this.office && this.isNear(this.office, 92)) this.arrive();
  }

  protected override interact(): void {
    if (this.dead || this.movementLocked) return;
    if (this.tea && this.isNear(this.tea, 92)) {
      app.state.addTea();
      app.audio.play('correct');
      this.showDialog('Roadside Tea', 'Emergency tea installed. Productivity +18. Punctuality -3 minutes.');
      this.refreshHud();
    }
  }

  private drawCity(): void {
    drawPixelRoad(this);
    addPixelBuilding(this, 78, 598, 130, 118, 'HOME', colors.yellow);
    this.office = addPixelBuilding(this, 1192, 184, 152, 126, 'MAIN\nOFFICE', colors.blue).setDepth(2);
    addPixelStreetLight(this, 210, 188);
    addPixelStreetLight(this, 930, 614);
    addPixelStreetLight(this, 1010, 188);

    this.add.rectangle(1042, 400, 74, 486, colors.green, 0.13).setStrokeStyle(3, colors.green, 0.72).setDepth(-4);
    this.add.text(1038, 615, 'SAFER\nCROSSING', { ...textStyle(12, '#dfffea'), align: 'center' }).setOrigin(0.5).setDepth(1);

    this.tea = this.add.container(795, 606, [
      this.add.rectangle(6, 7, 118, 66, colors.navy, 0.25),
      this.add.rectangle(0, 0, 116, 64, 0xb65f32).setStrokeStyle(4, colors.navy),
      this.add.rectangle(0, -25, 132, 15, colors.orange).setStrokeStyle(3, colors.navy),
      this.add.rectangle(-36, -25, 22, 15, colors.yellow),
      this.add.rectangle(12, -25, 22, 15, colors.yellow),
      this.add.text(0, -2, 'TEA +18 ⚡', textStyle(14)).setOrigin(0.5),
      this.add.text(0, 20, 'PRESS E', textStyle(11, '#ffe8b0')).setOrigin(0.5),
    ]).setDepth(5);

    this.add.text(270, 665, 'WATCH BOTH WAYS — THE BUILD HAS NO RESPAWN POINT', textStyle(13, '#f7e7a8')).setOrigin(0.5);
    this.add.text(1180, 270, 'GOAL ↑', textStyle(14, '#dfffea')).setOrigin(0.5);
  }

  private createTraffic(): void {
    const traffic: Array<[number, number, number, PixelVehicleType, number, number]> = [
      [250, 206, colors.orange, 'car', 1, 88],
      [760, 296, colors.yellow, 'bus', -1, 64],
      [440, 392, colors.purple, 'rickshaw', 1, 102],
      [1030, 482, colors.green, 'car', -1, 92],
      [590, 574, colors.blue, 'bus', 1, 70],
      [1210, 392, 0xc65353, 'car', -1, 108],
    ];
    traffic.forEach(([x, y, color, type, direction, speed]) => {
      this.vehicles.push({ object: addPixelVehicle(this, x, y, color, type, direction), direction, speed });
    });
  }

  private hitsVehicle(vehicle: Phaser.GameObjects.Container): boolean {
    if (!this.player) return false;
    const hitWidth = Number(vehicle.getData('hitWidth'));
    const hitHeight = Number(vehicle.getData('hitHeight'));
    return Math.abs(this.player.x - vehicle.x) < hitWidth / 2 + 19
      && Math.abs(this.player.y - vehicle.y) < hitHeight / 2 + 27;
  }

  private dieInTraffic(): void {
    if (this.dead) return;
    this.dead = true;
    this.movementLocked = true;
    app.audio.play('collision');
    if (this.player) {
      this.player.setDepth(60).setRotation(1.45);
      this.tweens.add({ targets: this.player, y: this.player.y - 20, alpha: 0.35, duration: 360, ease: 'Quad.easeOut' });
    }
    for (let index = 0; index < 12; index += 1) {
      const pixel = this.add.rectangle(this.player?.x ?? 640, this.player?.y ?? 360, 8, 8, index % 2 ? colors.orange : colors.yellow).setDepth(65);
      this.tweens.add({
        targets: pixel,
        x: pixel.x + Phaser.Math.Between(-65, 65),
        y: pixel.y + Phaser.Math.Between(-55, 20),
        alpha: 0,
        duration: 380,
      });
    }
    if (!app.save.getData().settings.reducedMotion) this.cameras.main.shake(260, 0.012);
    this.cameras.main.flash(180, 255, 122, 89);
    this.time.delayedCall(460, () => this.scene.start('GameOverScene'));
  }

  private arrive(): void {
    if (this.movementLocked || this.dead) return;
    this.movementLocked = true;
    const points = app.state.recordArrival();
    if (app.state.snapshot.minutes < 600) app.state.unlock('perfect-attendance');
    this.showDialog('Office Security', `${points >= 500 ? 'You reached the office before HR noticed.' : points > 0 ? 'Close enough. The attendance device looks optimistic.' : 'Late detected. Blame traffic with confidence.'}  ${points >= 0 ? '+' : ''}${points} points`, () => this.scene.start('LobbyScene'));
  }
}
