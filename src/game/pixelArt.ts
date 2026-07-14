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
      graphics.fillStyle(0xffffff, 0.1);
      graphics.fillRect(x + 3, y + 3, tile - 10, 3);
      graphics.fillStyle(colors.navy, 0.07);
      graphics.fillRect(x + tile - 6, y + 6, 3, tile - 11);
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

export type PixelVehicleType = 'car' | 'bus' | 'rickshaw';

export const drawPixelRoad = (scene: Phaser.Scene): Phaser.GameObjects.Graphics => {
  const road = scene.add.graphics().setDepth(-20);
  road.fillStyle(0x94d7d2).fillRect(0, 84, 1280, 70);
  road.fillStyle(0x5c6872).fillRect(0, 154, 1280, 496);
  road.fillStyle(0xb8c4c8).fillRect(0, 134, 1280, 22);
  road.fillStyle(0x7d8b91).fillRect(0, 650, 1280, 32);
  road.fillStyle(colors.navy, 0.42).fillRect(0, 154, 1280, 7);
  road.fillStyle(colors.navy, 0.28).fillRect(0, 643, 1280, 7);
  for (let y = 248; y <= 548; y += 100) {
    for (let x = 18; x < 1280; x += 122) {
      road.fillStyle(0xf7e7a8, 0.9).fillRect(x, y, 68, 8);
      road.fillStyle(0xffffff, 0.18).fillRect(x, y, 68, 3);
    }
  }
  for (let y = 168; y < 635; y += 34) {
    road.fillStyle(0xf7f2dc, 0.92).fillRect(1080, y, 76, 18);
    road.fillStyle(colors.navy, 0.12).fillRect(1080, y + 14, 76, 4);
  }
  road.fillStyle(colors.yellow).fillRect(1038, 160, 8, 480);
  road.fillStyle(colors.navy, 0.22).fillRect(1046, 160, 4, 480);
  return road;
};

export const addPixelBuilding = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  color: number,
): Phaser.GameObjects.Container => {
  const dark = Phaser.Display.Color.ValueToColor(color).darken(28).color;
  const light = Phaser.Display.Color.ValueToColor(color).lighten(24).color;
  const items: Phaser.GameObjects.GameObject[] = [
    scene.add.rectangle(8, 8, width, height, colors.navy, 0.25),
    scene.add.rectangle(0, 0, width, height, color).setStrokeStyle(5, colors.navy),
    scene.add.rectangle(0, -height / 2 + 10, width + 12, 20, light).setStrokeStyle(3, colors.navy),
    scene.add.rectangle(0, height / 2 - 24, 38, 48, dark).setStrokeStyle(4, colors.navy),
    scene.add.rectangle(11, height / 2 - 25, 5, 5, colors.yellow),
    scene.add.text(0, -height / 2 + 35, label, { ...textStyle(13, '#071a2b'), align: 'center' }).setOrigin(0.5),
  ];
  for (let wx = -width / 2 + 26; wx <= width / 2 - 26; wx += 48) {
    items.push(scene.add.rectangle(wx, 0, 25, 24, colors.cyan, 0.72).setStrokeStyle(3, colors.navy));
    items.push(scene.add.rectangle(wx - 7, -7, 7, 6, colors.white, 0.55));
  }
  return scene.add.container(x, y, items).setSize(width + 16, height + 16).setDepth(-3);
};

export const addPixelStreetLight = (scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container =>
  scene.add.container(x, y, [
    scene.add.rectangle(0, 0, 8, 78, colors.navy),
    scene.add.rectangle(15, -38, 36, 7, colors.navy),
    scene.add.rectangle(29, -32, 20, 15, colors.yellow).setStrokeStyle(3, colors.navy),
    scene.add.rectangle(29, -35, 12, 5, colors.white, 0.75),
    scene.add.rectangle(0, 39, 28, 8, colors.navy),
  ]).setDepth(-2);

export const addPixelVehicle = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: number,
  type: PixelVehicleType = 'car',
  direction = 1,
): Phaser.GameObjects.Container => {
  const width = type === 'bus' ? 154 : type === 'rickshaw' ? 76 : 112;
  const height = type === 'bus' ? 58 : type === 'rickshaw' ? 62 : 48;
  const dark = Phaser.Display.Color.ValueToColor(color).darken(30).color;
  const light = Phaser.Display.Color.ValueToColor(color).lighten(26).color;
  const items: Phaser.GameObjects.GameObject[] = [
    scene.add.rectangle(4, height / 2 + 5, width + 10, 10, 0x000000, 0.24),
  ];

  if (type === 'rickshaw') {
    items.push(
      scene.add.rectangle(-2, 4, 70, 42, color).setStrokeStyle(4, colors.navy),
      scene.add.rectangle(-9, -19, 49, 22, dark).setStrokeStyle(4, colors.navy),
      scene.add.rectangle(-9, -15, 34, 14, colors.cyan, 0.7).setStrokeStyle(2, colors.navy),
      scene.add.rectangle(30, 10, 22, 18, light).setStrokeStyle(3, colors.navy),
      scene.add.rectangle(-23, 29, 17, 17, colors.navy),
      scene.add.rectangle(28, 29, 17, 17, colors.navy),
      scene.add.rectangle(-23, 29, 7, 7, 0xb8c4c8),
      scene.add.rectangle(28, 29, 7, 7, 0xb8c4c8),
      scene.add.rectangle(39, 8, 7, 9, colors.yellow),
    );
  } else {
    items.push(
      scene.add.rectangle(0, 5, width, height - 14, color).setStrokeStyle(5, colors.navy),
      scene.add.rectangle(type === 'bus' ? -24 : -12, -14, type === 'bus' ? 92 : 58, type === 'bus' ? 29 : 23, light).setStrokeStyle(4, colors.navy),
      scene.add.rectangle(width / 2 - 10, 7, 18, 14, light).setStrokeStyle(3, colors.navy),
      scene.add.rectangle(width / 2 + 2, 7, 7, 8, colors.yellow),
      scene.add.rectangle(-width / 2 - 2, 9, 7, 11, colors.orange),
      scene.add.rectangle(-width * 0.31, height / 2 - 4, 22, 18, colors.navy),
      scene.add.rectangle(width * 0.31, height / 2 - 4, 22, 18, colors.navy),
      scene.add.rectangle(-width * 0.31, height / 2 - 4, 9, 9, 0xb8c4c8),
      scene.add.rectangle(width * 0.31, height / 2 - 4, 9, 9, 0xb8c4c8),
      scene.add.rectangle(0, -height / 2 + 5, width - 18, 5, colors.white, 0.42),
    );
    const windowCount = type === 'bus' ? 4 : 2;
    for (let index = 0; index < windowCount; index += 1) {
      const windowX = type === 'bus' ? -55 + index * 31 : -24 + index * 30;
      items.push(scene.add.rectangle(windowX, -13, type === 'bus' ? 23 : 22, 17, colors.cyan, 0.72).setStrokeStyle(2, colors.navy));
      items.push(scene.add.rectangle(windowX - 5, -17, 7, 4, colors.white, 0.55));
    }
  }

  const vehicle = scene.add.container(x, y, items).setSize(width, height + 16).setDepth(12);
  vehicle.setScale(direction, 1);
  vehicle.setData('hitWidth', width);
  vehicle.setData('hitHeight', height);
  vehicle.setData('vehicleType', type);
  return vehicle;
};

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
