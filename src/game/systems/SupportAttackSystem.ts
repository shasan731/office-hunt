import Phaser from 'phaser';
import { addSupportZombie, animateSupportZombie } from '../pixelArt';

interface SupportAttackOptions {
  getPlayer: () => Phaser.GameObjects.Container | undefined;
  isHidden: () => boolean;
  onCaught: () => void;
  minDelay: number;
  maxDelay: number;
  speed: number;
  maxActive: number;
  firstDelay?: number;
}

interface ActiveZombie {
  object: Phaser.GameObjects.Container;
  spawnedAt: number;
}

export class SupportAttackSystem {
  private readonly zombies: ActiveZombie[] = [];
  private pausedUntil = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: SupportAttackOptions,
  ) {
    this.schedule(options.firstDelay ?? Phaser.Math.Between(options.minDelay, options.maxDelay));
  }

  update(time: number, delta: number): void {
    const player = this.options.getPlayer();
    if (!player) return;
    const hidden = this.options.isHidden();
    [...this.zombies].forEach((zombie) => {
      if (time - zombie.spawnedAt > 9000) {
        this.remove(zombie);
        return;
      }
      const direction = new Phaser.Math.Vector2(player.x - zombie.object.x, player.y - zombie.object.y).normalize();
      const multiplier = hidden ? -0.35 : 1;
      zombie.object.x = Phaser.Math.Clamp(zombie.object.x + direction.x * this.options.speed * multiplier * delta / 1000, 35, 1245);
      zombie.object.y = Phaser.Math.Clamp(zombie.object.y + direction.y * this.options.speed * multiplier * delta / 1000, 115, 675);
      animateSupportZombie(zombie.object, time);
      if (!hidden && time >= this.pausedUntil && Phaser.Math.Distance.Between(player.x, player.y, zombie.object.x, zombie.object.y) < 54) {
        this.pausedUntil = time + 2200;
        this.options.onCaught();
        this.remove(zombie);
      }
    });
  }

  private schedule(delay: number): void {
    this.scene.time.delayedCall(delay, () => {
      if (this.zombies.length < this.options.maxActive) this.spawn();
      this.schedule(Phaser.Math.Between(this.options.minDelay, this.options.maxDelay));
    });
  }

  private spawn(): void {
    const side = Phaser.Math.Between(0, 3);
    const positions = [
      { x: 45, y: Phaser.Math.Between(160, 650) },
      { x: 1235, y: Phaser.Math.Between(160, 650) },
      { x: Phaser.Math.Between(100, 1180), y: 120 },
      { x: Phaser.Math.Between(100, 1180), y: 665 },
    ];
    const position = positions[side];
    this.zombies.push({ object: addSupportZombie(this.scene, position.x, position.y), spawnedAt: this.scene.time.now });
  }

  private remove(zombie: ActiveZombie): void {
    const index = this.zombies.indexOf(zombie);
    if (index >= 0) this.zombies.splice(index, 1);
    zombie.object.destroy();
  }
}
