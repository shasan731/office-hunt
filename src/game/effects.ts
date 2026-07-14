import Phaser from 'phaser';
import { app } from './managers/AppContext';
import { colors, textStyle } from './ui';

export type PersonReaction = 'hit' | 'celebrate' | 'panic' | 'confused';

const motionEnabled = (): boolean => !app.save.getData().settings.reducedMotion;

export const addLevelIntro = (scene: Phaser.Scene, title: string, subtitle: string): void => {
  const panel = scene.add.container(640, 142, [
    scene.add.rectangle(7, 8, 720, 74, colors.navy, 0.28),
    scene.add.rectangle(0, 0, 720, 74, colors.navy, 0.95).setStrokeStyle(4, colors.cyan, 0.9),
    scene.add.rectangle(0, -31, 710, 7, colors.yellow, 0.85),
    scene.add.text(0, -10, title.toUpperCase(), textStyle(22, '#ffc857')).setOrigin(0.5),
    scene.add.text(0, 18, subtitle, textStyle(13, '#d9eef7')).setOrigin(0.5),
  ]).setDepth(175).setScrollFactor(0);
  if (motionEnabled()) {
    panel.setScale(0.75).setAlpha(0);
    scene.tweens.add({ targets: panel, scale: 1, alpha: 1, duration: 250, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: panel, y: 120, alpha: 0, delay: 1450, duration: 320, ease: 'Quad.easeIn', onComplete: () => panel.destroy() });
  } else scene.time.delayedCall(1500, () => panel.destroy());
};

export const addInteractionBeacon = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  label = 'E',
  color = colors.yellow,
): Phaser.GameObjects.Container => {
  const diamond = scene.add.star(0, 0, 4, 8, 15, color).setStrokeStyle(3, colors.navy);
  const shine = scene.add.star(-4, -5, 4, 2, 5, colors.white, 0.9);
  const text = scene.add.text(0, 25, label, textStyle(11, '#071a2b')).setOrigin(0.5);
  const beacon = scene.add.container(x, y, [diamond, shine, text]).setDepth(45);
  if (motionEnabled()) scene.tweens.add({ targets: beacon, y: y - 7, scale: 1.08, duration: 560, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  return beacon;
};

export const createAmbientMotes = (
  scene: Phaser.Scene,
  palette: number[] = [colors.cyan, colors.yellow, colors.purple],
  count = 18,
): void => {
  for (let index = 0; index < count; index += 1) {
    const size = Phaser.Math.Between(2, 5);
    const mote = scene.add.rectangle(
      Phaser.Math.Between(45, 1235),
      Phaser.Math.Between(100, 690),
      size,
      size,
      palette[index % palette.length],
      Phaser.Math.FloatBetween(0.08, 0.22),
    ).setDepth(-1);
    if (motionEnabled()) {
      scene.tweens.add({
        targets: mote,
        x: mote.x + Phaser.Math.Between(-35, 35),
        y: mote.y - Phaser.Math.Between(18, 65),
        alpha: { from: mote.alpha, to: 0.02 },
        duration: Phaser.Math.Between(2200, 4800),
        yoyo: true,
        repeat: -1,
        delay: index * 70,
      });
    }
  }
};

export const burstParticles = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  palette: number[] = [colors.yellow, colors.cyan, colors.orange, colors.white],
  amount = 14,
  radius = 70,
): void => {
  if (!motionEnabled()) return;
  for (let index = 0; index < amount; index += 1) {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const distance = Phaser.Math.Between(Math.round(radius * 0.45), radius);
    const particle = scene.add.rectangle(x, y, Phaser.Math.Between(4, 9), Phaser.Math.Between(4, 9), palette[index % palette.length])
      .setDepth(210)
      .setRotation(angle);
    scene.tweens.add({
      targets: particle,
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance + 24,
      angle: Phaser.Math.Between(-180, 180),
      alpha: 0,
      scale: 0.25,
      duration: Phaser.Math.Between(320, 620),
      ease: 'Quad.easeOut',
      onComplete: () => particle.destroy(),
    });
  }
};

export const spawnDust = (scene: Phaser.Scene, x: number, y: number, running = false): void => {
  if (!motionEnabled()) return;
  const dust = scene.add.ellipse(x + Phaser.Math.Between(-8, 8), y + 28, running ? 13 : 9, running ? 7 : 5, 0xf7e7c6, 0.55).setDepth(18);
  scene.tweens.add({ targets: dust, x: dust.x + Phaser.Math.Between(-16, 16), y: dust.y - 10, alpha: 0, scale: 1.8, duration: 280, onComplete: () => dust.destroy() });
};

export const juiceText = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  message: string,
  color = '#ffc857',
): void => {
  const shadow = scene.add.text(x + 3, y + 4, message, textStyle(18, '#071a2b')).setOrigin(0.5).setDepth(218);
  const text = scene.add.text(x, y, message, textStyle(18, color)).setOrigin(0.5).setDepth(219);
  if (motionEnabled()) {
    scene.tweens.add({ targets: [shadow, text], y: y - 40, alpha: 0, scale: 1.18, duration: 760, ease: 'Back.easeOut', onComplete: () => { shadow.destroy(); text.destroy(); } });
  } else scene.time.delayedCall(650, () => { shadow.destroy(); text.destroy(); });
};

export const playPersonReaction = (
  scene: Phaser.Scene,
  person: Phaser.GameObjects.Container,
  reaction: PersonReaction,
): void => {
  if (!motionEnabled() || !person.active) return;
  scene.tweens.killTweensOf(person);
  if (reaction === 'hit') {
    scene.cameras.main.shake(95, 0.006);
    scene.tweens.add({ targets: person, x: person.x - 18, angle: -8, alpha: 0.55, duration: 75, yoyo: true, repeat: 2, onComplete: () => person.setAngle(0).setAlpha(1) });
  } else if (reaction === 'celebrate') {
    burstParticles(scene, person.x, person.y - 20);
    scene.tweens.add({ targets: person, y: person.y - 38, angle: 6, scaleX: 1.12, scaleY: 0.92, duration: 170, yoyo: true, repeat: 2, ease: 'Quad.easeOut', onComplete: () => person.setAngle(0).setScale(1) });
  } else if (reaction === 'panic') {
    scene.tweens.add({ targets: person, angle: { from: -7, to: 7 }, duration: 65, yoyo: true, repeat: 5, onComplete: () => person.setAngle(0) });
  } else {
    scene.tweens.add({ targets: person, angle: { from: -4, to: 4 }, y: person.y - 5, duration: 240, yoyo: true, repeat: 2, ease: 'Sine.easeInOut', onComplete: () => person.setAngle(0) });
  }
};

export const pulseObject = (scene: Phaser.Scene, target: Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform): void => {
  if (!motionEnabled()) return;
  scene.tweens.add({ targets: target, scaleX: 1.06, scaleY: 1.06, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
};

export const impactFlash = (scene: Phaser.Scene, color = colors.white): void => {
  const flash = scene.add.rectangle(640, 360, 1280, 720, color, 0.24).setDepth(400).setScrollFactor(0);
  if (motionEnabled()) scene.cameras.main.shake(110, 0.007);
  scene.tweens.add({ targets: flash, alpha: 0, duration: 150, onComplete: () => flash.destroy() });
};
