import Phaser from 'phaser';
import { colors, textStyle } from './ui';

export const drawPixelFloor = (
  scene: Phaser.Scene,
  light = 0xdce9e5,
  dark = 0xcbded8,
): Phaser.GameObjects.Graphics => {
  const graphics = scene.add.graphics().setDepth(-20);
  graphics.fillStyle(colors.navy).fillRect(44, 90, 1192, 590);
  const tile = 40;
  for (let y = 96; y < 674; y += tile) {
    for (let x = 50; x < 1230; x += tile) {
      graphics.fillStyle(((x / tile + y / tile) % 2 === 0) ? light : dark);
      graphics.fillRect(x, y, tile - 2, tile - 2);
    }
  }
  return graphics;
};

export const addPixelRoom = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  color: number,
  label: string,
): Phaser.GameObjects.Container => scene.add.container(x, y, [
  scene.add.rectangle(7, 7, width, height, colors.navy, 0.25),
  scene.add.rectangle(0, 0, width, height, color, 0.25).setStrokeStyle(5, colors.navy),
  scene.add.rectangle(0, -height / 2 + 13, width - 8, 22, color, 0.9),
  scene.add.text(0, -height / 2 + 13, label, textStyle(12, '#071a2b')).setOrigin(0.5),
]).setDepth(-5);

export const addPixelDesk = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  width = 170,
  label?: string,
): Phaser.GameObjects.Container => {
  const wood = 0xa86438;
  const objects: Phaser.GameObjects.GameObject[] = [
    scene.add.rectangle(6, 8, width, 65, colors.navy, 0.22),
    scene.add.rectangle(0, 0, width, 62, wood).setStrokeStyle(5, colors.navy),
    scene.add.rectangle(0, -21, width - 10, 10, 0xd18a51),
    scene.add.rectangle(-width / 2 + 14, 40, 16, 34, wood).setStrokeStyle(4, colors.navy),
    scene.add.rectangle(width / 2 - 14, 40, 16, 34, wood).setStrokeStyle(4, colors.navy),
    scene.add.rectangle(0, -28, 62, 42, 0x263a4a).setStrokeStyle(5, colors.navy),
    scene.add.rectangle(0, -28, 48, 29, colors.cyan, 0.7),
    scene.add.rectangle(0, -4, 22, 7, colors.navy),
    scene.add.rectangle(0, 12, 82, 13, 0xd9eef7).setStrokeStyle(3, colors.navy),
  ];
  if (label) objects.push(scene.add.text(0, 25, label, textStyle(12, '#ffffff')).setOrigin(0.5));
  return scene.add.container(x, y, objects).setSize(width, 105).setDepth(2);
};

export const addPixelTable = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  width = 180,
  color = 0xa86438,
): Phaser.GameObjects.Container => scene.add.container(x, y, [
  scene.add.rectangle(6, 7, width, 70, colors.navy, 0.2),
  scene.add.rectangle(0, 0, width, 68, color).setStrokeStyle(5, colors.navy),
  scene.add.rectangle(0, -22, width - 10, 10, Phaser.Display.Color.ValueToColor(color).lighten(20).color),
  scene.add.rectangle(-width / 2 + 15, 48, 18, 30, color).setStrokeStyle(4, colors.navy),
  scene.add.rectangle(width / 2 - 15, 48, 18, 30, color).setStrokeStyle(4, colors.navy),
]).setSize(width, 110).setDepth(2);

export const addPixelChair = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  color = colors.blue,
): Phaser.GameObjects.Container => scene.add.container(x, y, [
  scene.add.rectangle(3, 5, 44, 42, colors.navy, 0.2),
  scene.add.rectangle(0, 0, 42, 40, color).setStrokeStyle(4, colors.navy),
  scene.add.rectangle(0, -26, 42, 18, color).setStrokeStyle(4, colors.navy),
  scene.add.rectangle(-13, 27, 7, 18, colors.navy),
  scene.add.rectangle(13, 27, 7, 18, colors.navy),
]).setDepth(1);

export const addPixelCabinet = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  label?: string,
  color = 0x607d8b,
): Phaser.GameObjects.Container => {
  const objects: Phaser.GameObjects.GameObject[] = [
    scene.add.rectangle(7, 7, 76, 105, colors.navy, 0.22),
    scene.add.rectangle(0, 0, 74, 102, color).setStrokeStyle(5, colors.navy),
    scene.add.rectangle(0, -26, 58, 35, 0x90a4ae).setStrokeStyle(3, colors.navy),
    scene.add.rectangle(0, 22, 58, 35, 0x90a4ae).setStrokeStyle(3, colors.navy),
    scene.add.rectangle(0, -26, 12, 4, colors.navy),
    scene.add.rectangle(0, 22, 12, 4, colors.navy),
  ];
  if (label) objects.push(scene.add.text(0, 62, label, textStyle(12, '#071a2b')).setOrigin(0.5));
  return scene.add.container(x, y, objects).setSize(80, 120).setDepth(3);
};

export const addPixelPlant = (scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container =>
  scene.add.container(x, y, [
    scene.add.rectangle(0, 18, 40, 32, 0xc56e33).setStrokeStyle(4, colors.navy),
    scene.add.rectangle(-10, -12, 16, 45, colors.green).setStrokeStyle(3, colors.navy),
    scene.add.rectangle(10, -20, 16, 52, 0x2f9e69).setStrokeStyle(3, colors.navy),
    scene.add.rectangle(0, -35, 14, 42, 0x45c486).setStrokeStyle(3, colors.navy),
  ]).setDepth(3);

export const addPixelDoor = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  color = colors.green,
): Phaser.GameObjects.Container => scene.add.container(x, y, [
  scene.add.rectangle(7, 7, 112, 110, colors.navy, 0.24),
  scene.add.rectangle(0, 0, 110, 108, color).setStrokeStyle(6, colors.navy),
  scene.add.rectangle(0, -34, 90, 22, Phaser.Display.Color.ValueToColor(color).lighten(18).color),
  scene.add.rectangle(36, 12, 8, 8, colors.yellow).setStrokeStyle(2, colors.navy),
  scene.add.text(0, 0, label, { ...textStyle(16), align: 'center' }).setOrigin(0.5),
]).setSize(118, 116).setDepth(4);

export const addPixelServerRack = (scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container => {
  const items: Phaser.GameObjects.GameObject[] = [scene.add.rectangle(0, 0, 76, 112, 0x263a4a).setStrokeStyle(5, colors.navy)];
  for (let row = -38; row <= 38; row += 19) {
    items.push(scene.add.rectangle(0, row, 60, 13, 0x102f43).setStrokeStyle(2, colors.navy));
    items.push(scene.add.rectangle(-20, row, 5, 5, row % 2 ? colors.orange : colors.green));
    items.push(scene.add.rectangle(-10, row, 5, 5, colors.cyan));
  }
  return scene.add.container(x, y, items).setDepth(3);
};

export const addPixelCounter = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  label: string,
  color = colors.orange,
): Phaser.GameObjects.Container => scene.add.container(x, y, [
  scene.add.rectangle(7, 8, width, 92, colors.navy, 0.22),
  scene.add.rectangle(0, 0, width, 90, color).setStrokeStyle(5, colors.navy),
  scene.add.rectangle(0, -36, width + 12, 14, Phaser.Display.Color.ValueToColor(color).lighten(20).color).setStrokeStyle(3, colors.navy),
  scene.add.text(0, 5, label, { ...textStyle(16), align: 'center' }).setOrigin(0.5),
]).setSize(width, 100).setDepth(2);

export const addSupportZombie = (
  scene: Phaser.Scene,
  x: number,
  y: number,
): Phaser.GameObjects.Container => {
  const skin = 0x86b96b;
  const shirt = 0x6d4cc7;
  const shadow = scene.add.rectangle(0, 31, 48, 8, 0x000000, 0.2);
  const leftLeg = scene.add.rectangle(-9, 22, 11, 22, 0x34495e).setStrokeStyle(3, colors.navy);
  const rightLeg = scene.add.rectangle(9, 22, 11, 22, 0x34495e).setStrokeStyle(3, colors.navy);
  const torso = scene.add.rectangle(0, 2, 34, 35, shirt).setStrokeStyle(4, colors.navy);
  const head = scene.add.rectangle(0, -30, 31, 28, skin).setStrokeStyle(4, colors.navy);
  const hair = scene.add.rectangle(-4, -45, 24, 7, 0x263238).setStrokeStyle(2, colors.navy);
  const eyes = [scene.add.rectangle(-7, -31, 4, 4, 0xf4d35e), scene.add.rectangle(7, -31, 4, 4, 0xf4d35e)];
  const mouth = scene.add.rectangle(0, -21, 12, 3, 0x38502f);
  const headsetBand = scene.add.rectangle(0, -40, 41, 5, colors.cyan).setStrokeStyle(2, colors.navy);
  const headsetPads = [scene.add.rectangle(-18, -30, 6, 15, colors.cyan).setStrokeStyle(2, colors.navy), scene.add.rectangle(18, -30, 6, 15, colors.cyan).setStrokeStyle(2, colors.navy)];
  const microphone = scene.add.rectangle(22, -18, 14, 4, colors.cyan).setStrokeStyle(2, colors.navy);
  // Both arms project forward in the classic zombie pose.
  const leftArm = scene.add.rectangle(-11, 10, 9, 35, skin).setStrokeStyle(3, colors.navy).setRotation(-0.18);
  const rightArm = scene.add.rectangle(11, 10, 9, 35, skin).setStrokeStyle(3, colors.navy).setRotation(0.18);
  const hands = [scene.add.rectangle(-15, 29, 10, 9, skin).setStrokeStyle(2, colors.navy), scene.add.rectangle(15, 29, 10, 9, skin).setStrokeStyle(2, colors.navy)];
  const label = scene.add.text(0, 47, 'SUPPORT ZOMBIE', textStyle(11, '#7dff80')).setOrigin(0.5);
  const zombie = scene.add.container(x, y, [shadow, leftLeg, rightLeg, torso, head, hair, ...eyes, mouth, headsetBand, ...headsetPads, microphone, leftArm, rightArm, ...hands, label]).setSize(64, 100).setDepth(35);
  zombie.setData('zombieParts', { leftLeg, rightLeg, leftArm, rightArm });
  return zombie;
};

export const animateSupportZombie = (zombie: Phaser.GameObjects.Container, time: number): void => {
  const parts = zombie.getData('zombieParts') as Record<string, Phaser.GameObjects.Rectangle> | undefined;
  if (!parts) return;
  const step = Math.round(Math.sin(time / 90) * 3);
  parts.leftLeg.y = 22 + step;
  parts.rightLeg.y = 22 - step;
  parts.leftArm.rotation = -0.18 + step * 0.012;
  parts.rightArm.rotation = 0.18 - step * 0.012;
};
