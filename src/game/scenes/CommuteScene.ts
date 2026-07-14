import Phaser from 'phaser';
import { app } from '../managers/AppContext';
import { addPixelBuilding, addPixelStreetLight, addPixelVehicle, drawPixelRoad, type PixelVehicleType } from '../pixelArt';
import { colors, textStyle } from '../ui';
import { BaseScene } from './BaseScene';

type CommutePhase = 'home-to-bus' | 'bus-ride' | 'bus-to-boat' | 'boat-ride' | 'boat-to-office';
type Weather = 'SUNNY' | 'RAINY' | 'WINDY' | 'CLOUDY';

interface TrafficVehicle { object: Phaser.GameObjects.Container; direction: number; speed: number; }
interface CommuteData { phase?: CommutePhase; weather?: Weather; }

export class CommuteScene extends BaseScene {
  private phase: CommutePhase = 'home-to-bus';
  private weather: Weather = 'SUNNY';
  private vehicles: TrafficVehicle[] = [];
  private destination?: Phaser.GameObjects.Container;
  private dead = false;

  constructor() { super('CommuteScene'); }

  init(data: CommuteData): void {
    this.phase = data.phase ?? 'home-to-bus';
    this.weather = data.weather ?? Phaser.Utils.Array.GetRandom<Weather>(['SUNNY', 'RAINY', 'WINDY', 'CLOUDY']);
  }

  create(): void {
    this.vehicles = [];
    this.destination = undefined;
    this.dead = false;
    this.setupWorld('LEVEL 1 / THE COMMUTE', this.objectiveForPhase(), 82, this.phase === 'bus-to-boat' ? 170 : 610);
    this.drawWeather();
    if (this.phase === 'bus-ride') this.createRide('bus');
    else if (this.phase === 'boat-ride') this.createRide('boat');
    else { this.drawCrossing(); this.createTraffic(); }
  }

  update(time: number, delta: number): void {
    if (this.dead || this.phase === 'bus-ride' || this.phase === 'boat-ride') return;
    this.updateMovement(time, delta, this.weather === 'WINDY' ? 198 : 210);
    this.vehicles.forEach((vehicle) => {
      const weatherScale = this.weather === 'RAINY' ? 0.86 : this.weather === 'WINDY' ? 1.08 : 1;
      vehicle.object.x += vehicle.direction * vehicle.speed * weatherScale * app.difficulty.hazardSpeed * delta / 1000;
      if (vehicle.direction > 0 && vehicle.object.x > 1380) vehicle.object.x = -160;
      if (vehicle.direction < 0 && vehicle.object.x < -160) vehicle.object.x = 1380;
      if (!this.movementLocked && this.hitsVehicle(vehicle.object)) this.dieInTraffic();
    });
  }

  protected override interact(): void {
    if (this.dead || this.movementLocked || !this.destination || !this.isNear(this.destination, 110)) return;
    this.movementLocked = true;
    if (this.phase === 'home-to-bus') {
      this.showDialog('Bus Conductor', 'Bus caught! Air conditioning is available if every passenger agrees to imagine it.', () => this.nextPhase('bus-ride'));
    } else if (this.phase === 'bus-to-boat') {
      this.showDialog('Boat Captain', 'Welcome aboard. The life jackets are in a requirements meeting.', () => this.nextPhase('boat-ride'));
    } else {
      this.showDialog('Office Security', 'Building reached. Only five flights of stairs remain between you and punctuality.', () => this.scene.start('LobbyScene'));
    }
  }

  private objectiveForPhase(): string {
    const weather = `Weather: ${this.weather.toLowerCase()}.`;
    const objectives: Record<CommutePhase, string> = {
      'home-to-bus': `${weather} Cross traffic and press E at the bus stop.`,
      'bus-ride': `${weather} Remain inside while the bus negotiates with traffic.`,
      'bus-to-boat': `${weather} Cross the second road and press E at the boat jetty.`,
      'boat-ride': `${weather} Enjoy the river and ignore the boat's loading spinner.`,
      'boat-to-office': `${weather} Cross the final road and press E at the office.`,
    };
    return objectives[this.phase];
  }

  private drawCrossing(): void {
    drawPixelRoad(this);
    addPixelStreetLight(this, 210, 188); addPixelStreetLight(this, 930, 614); addPixelStreetLight(this, 1010, 188);
    this.add.rectangle(1042, 400, 74, 486, colors.green, 0.12).setStrokeStyle(3, colors.green, 0.72).setDepth(-4);
    this.add.text(1042, 615, 'SAFER CROSSING', textStyle(10, '#dfffea')).setOrigin(0.5).setDepth(1);
    if (this.phase === 'home-to-bus') {
      addPixelBuilding(this, 78, 598, 130, 118, 'HOME', colors.yellow);
      this.destination = this.createStop(1180, 184, 'BUS STOP', colors.yellow);
      this.add.text(1180, 275, 'BUS TO RIVER', textStyle(13, '#dfffea')).setOrigin(0.5);
    } else if (this.phase === 'bus-to-boat') {
      this.createStop(72, 165, 'BUS DROP', colors.blue);
      this.destination = this.createStop(1180, 605, 'BOAT JETTY', colors.cyan);
      this.add.text(1160, 510, 'CATCH THE BOAT', textStyle(13, '#f7e7a8')).setOrigin(0.5);
    } else {
      this.createStop(78, 600, 'BOAT DROP', colors.cyan);
      this.destination = addPixelBuilding(this, 1190, 184, 160, 132, 'OFFICE', colors.blue).setDepth(3);
      this.add.text(1180, 282, 'FIVE FLIGHTS AWAIT', textStyle(13, '#dfffea')).setOrigin(0.5);
    }
    this.add.text(365, 665, 'THREE ROADS • TWO RIDES • ZERO REMOTE-WORK APPROVALS', textStyle(12, '#f7e7a8')).setOrigin(0.5);
  }

  private createTraffic(): void {
    const traffic: Array<[number, number, number, PixelVehicleType, number, number]> = [
      [250, 206, colors.orange, 'car', 1, 88], [760, 296, colors.yellow, 'bus', -1, 64],
      [440, 392, colors.purple, 'rickshaw', 1, 102], [1030, 482, colors.green, 'car', -1, 92],
      [590, 574, colors.blue, 'bus', 1, 70], [1210, 392, 0xc65353, 'car', -1, 108],
    ];
    const offset = this.phase === 'bus-to-boat' ? 130 : this.phase === 'boat-to-office' ? 260 : 0;
    traffic.forEach(([x, y, color, type, direction, speed]) => {
      this.vehicles.push({ object: addPixelVehicle(this, (x + offset) % 1320, y, color, type, direction), direction, speed });
    });
  }

  private createRide(type: 'bus' | 'boat'): void {
    this.movementLocked = true;
    this.player?.setVisible(false);
    const boat = type === 'boat';
    this.add.rectangle(640, 430, 1280, 440, boat ? 0x2389a6 : 0x59636b).setDepth(-10);
    for (let index = 0; index < 10; index += 1) {
      this.add.rectangle(index * 150, 330 + (index % 3) * 75, boat ? 90 : 80, boat ? 6 : 8, boat ? 0x8de7ee : colors.yellow, 0.55).setDepth(-9);
    }
    const vehicle = boat ? this.createBoat(-170, 440) : addPixelVehicle(this, -190, 455, colors.yellow, 'bus', 1).setScale(2.15);
    this.add.text(640, 610, boat ? 'RIVER COMMUTE: NOW WITH 100% MORE WATER' : 'BUS STATUS: MOVING • SEATS: THEORETICAL', textStyle(17, boat ? '#dfffea' : '#ffc857')).setOrigin(0.5);
    const duration = app.save.getData().settings.reducedMotion ? 900 : 2300;
    this.tweens.add({ targets: vehicle, x: 1470, y: boat ? 425 : 455, duration, ease: 'Sine.easeInOut' });
    this.time.delayedCall(duration + 50, () => {
      app.state.advanceTime(4);
      this.nextPhase(boat ? 'boat-to-office' : 'bus-to-boat');
    });
  }

  private createStop(x: number, y: number, label: string, color: number): Phaser.GameObjects.Container {
    return this.add.container(x, y, [
      this.add.rectangle(5, 8, 135, 105, colors.navy, 0.24),
      this.add.rectangle(0, 0, 132, 102, color).setStrokeStyle(5, colors.navy),
      this.add.rectangle(0, -42, 148, 18, Phaser.Display.Color.ValueToColor(color).lighten(20).color).setStrokeStyle(3, colors.navy),
      this.add.text(0, -18, label, textStyle(12, '#071a2b')).setOrigin(0.5),
      this.add.text(0, 20, 'PRESS E', textStyle(13, '#071a2b')).setOrigin(0.5),
    ]).setDepth(4);
  }

  private createBoat(x: number, y: number): Phaser.GameObjects.Container {
    return this.add.container(x, y, [
      this.add.ellipse(0, 30, 175, 36, 0x000000, 0.22),
      this.add.rectangle(0, 12, 150, 56, 0xb65f32).setStrokeStyle(5, colors.navy),
      this.add.triangle(-82, 12, 0, -28, 42, 28, 0, 28, 0xb65f32).setStrokeStyle(4, colors.navy),
      this.add.triangle(82, 12, 0, -28, 0, 28, -42, 28, 0xb65f32).setStrokeStyle(4, colors.navy),
      this.add.rectangle(0, -26, 104, 55, colors.yellow).setStrokeStyle(5, colors.navy),
      this.add.rectangle(-27, -28, 34, 26, colors.cyan).setStrokeStyle(3, colors.navy),
      this.add.rectangle(27, -28, 34, 26, colors.cyan).setStrokeStyle(3, colors.navy),
      this.add.rectangle(0, -61, 126, 12, colors.orange).setStrokeStyle(3, colors.navy),
      this.add.text(0, 10, 'OFFICE FERRY', textStyle(11)).setOrigin(0.5),
    ]).setDepth(8).setScale(1.9);
  }

  private drawWeather(): void {
    const badgeColor = this.weather === 'SUNNY' ? colors.yellow : this.weather === 'RAINY' ? colors.blue : this.weather === 'WINDY' ? colors.green : colors.purple;
    this.add.rectangle(1125, 112, 245, 38, badgeColor, 0.94).setStrokeStyle(3, colors.navy).setDepth(90);
    this.add.text(1125, 112, `WEATHER: ${this.weather}`, textStyle(14, this.weather === 'SUNNY' ? '#071a2b' : '#ffffff')).setOrigin(0.5).setDepth(91);
    if (this.weather === 'SUNNY') {
      this.add.circle(1080, 190, 42, colors.yellow).setStrokeStyle(8, colors.orange).setDepth(-6);
      this.add.circle(1065, 176, 12, colors.white, 0.45).setDepth(-5);
      return;
    }
    if (this.weather === 'CLOUDY') {
      for (let index = 0; index < 5; index += 1) {
        const cloud = this.add.container(100 + index * 260, 165 + (index % 2) * 42, [
          this.add.circle(-35, 5, 28, 0xb9c6d0, 0.88), this.add.circle(0, -5, 40, 0xd7e1e7, 0.92),
          this.add.circle(38, 8, 30, 0xaebdc8, 0.9), this.add.rectangle(0, 15, 110, 35, 0xc6d3db, 0.9),
        ]).setDepth(-6);
        if (!app.save.getData().settings.reducedMotion) this.tweens.add({ targets: cloud, x: cloud.x + 55, duration: 4200 + index * 300, yoyo: true, repeat: -1 });
      }
      return;
    }
    const count = this.weather === 'RAINY' ? 34 : 22;
    for (let index = 0; index < count; index += 1) {
      const particle = this.weather === 'RAINY'
        ? this.add.rectangle(Phaser.Math.Between(20, 1260), Phaser.Math.Between(110, 680), 3, 22, 0x9eeaf2, 0.7).setRotation(-0.22).setDepth(85)
        : this.add.rectangle(Phaser.Math.Between(20, 1260), Phaser.Math.Between(110, 680), 13, 7, index % 2 ? colors.yellow : colors.green, 0.78).setRotation(index).setDepth(85);
      if (!app.save.getData().settings.reducedMotion) this.tweens.add({
        targets: particle, x: particle.x + (this.weather === 'RAINY' ? -90 : 260),
        y: particle.y + (this.weather === 'RAINY' ? 310 : Phaser.Math.Between(-45, 45)), angle: this.weather === 'WINDY' ? 280 : 0,
        duration: this.weather === 'RAINY' ? 950 : 1800, repeat: -1,
      });
    }
  }

  private nextPhase(phase: CommutePhase): void { this.scene.restart({ phase, weather: this.weather }); }

  private hitsVehicle(vehicle: Phaser.GameObjects.Container): boolean {
    if (!this.player) return false;
    return Math.abs(this.player.x - vehicle.x) < Number(vehicle.getData('hitWidth')) / 2 + 19
      && Math.abs(this.player.y - vehicle.y) < Number(vehicle.getData('hitHeight')) / 2 + 27;
  }

  private dieInTraffic(): void {
    if (this.dead) return;
    this.dead = true; this.movementLocked = true; app.audio.play('collision');
    this.player?.setDepth(60).setRotation(1.45).setAlpha(0.35);
    if (!app.save.getData().settings.reducedMotion) this.cameras.main.shake(260, 0.012);
    this.cameras.main.flash(180, 255, 122, 89);
    this.time.delayedCall(460, () => this.scene.start('GameOverScene'));
  }
}
