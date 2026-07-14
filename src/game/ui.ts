import Phaser from 'phaser';
import { app } from './managers/AppContext';

export const colors = {
  navy: 0x071a2b, blue: 0x087ea4, cyan: 0x39d8e8, yellow: 0xffc857,
  orange: 0xff7a59, green: 0x12b886, purple: 0x7c5ce7, white: 0xffffff,
};

export const textStyle = (size = 24, color = '#ffffff'): Phaser.Types.GameObjects.Text.TextStyle => ({
  fontFamily: 'Inter, Arial, sans-serif',
  fontSize: `${Math.round(size * (app.save.getData().settings.largeText ? 1.15 : 1))}px`,
  color,
  fontStyle: 'bold',
});

export const applyPixelPolish = (scene: Phaser.Scene, accent = colors.cyan): void => {
  if (!app.save.getData().settings.reducedMotion) scene.cameras.main.fadeIn(180, 7, 26, 43);
  // Layered color, bevels, and restrained scanlines evoke a bright 64-bit-era game UI.
  scene.add.rectangle(52, 360, 82, 620, accent, 0.025).setDepth(938);
  scene.add.rectangle(1228, 360, 82, 620, colors.purple, 0.025).setDepth(938);
  for (let y = 94; y < 714; y += 12) scene.add.rectangle(640, y, 1268, 2, colors.navy, 0.018).setDepth(940);
  scene.add.rectangle(640, 360, 1270, 710, colors.navy, 0)
    .setStrokeStyle(6, colors.navy, 0.34)
    .setDepth(950);
  scene.add.rectangle(640, 360, 1254, 694, colors.navy, 0)
    .setStrokeStyle(2, accent, 0.16)
    .setDepth(949);
  const corners = [[11, 11], [1269, 11], [11, 709], [1269, 709]] as const;
  corners.forEach(([x, y]) => scene.add.rectangle(x, y, 12, 12, accent, 0.7).setDepth(951));
};

export const addButton = (
  scene: Phaser.Scene, x: number, y: number, label: string, action: () => void,
  width = 280, color = colors.blue,
): Phaser.GameObjects.Container => {
  const shadow = scene.add.rectangle(6, 7, width, 54, colors.navy, 0.32);
  const bg = scene.add.rectangle(0, 0, width, 54, color).setStrokeStyle(3, colors.white, 0.9);
  const shine = scene.add.rectangle(0, -21, width - 8, 5, Phaser.Display.Color.ValueToColor(color).lighten(32).color, 0.72);
  const text = scene.add.text(0, 0, label, textStyle(20)).setOrigin(0.5);
  const button = scene.add.container(x, y, [shadow, bg, shine, text]).setSize(width, 61).setInteractive({ useHandCursor: true });
  button.on('pointerover', () => button.setScale(1.04));
  button.on('pointerout', () => button.setScale(1));
  button.on('pointerdown', () => { button.setScale(0.98); app.audio.play('click'); action(); });
  return button;
};

export const addPerson = (
  scene: Phaser.Scene, x: number, y: number, shirt: number, label?: string,
): Phaser.GameObjects.Container => {
  const role = label?.toLowerCase() ?? 'employee';
  const seed = [...role].reduce((total, character) => total + character.charCodeAt(0), 0);
  const skinTones = [0xf2bd8d, 0xd99a6c, 0xb97952, 0x8f5e3c];
  const hairColors = [0x17202a, 0x3d2b1f, 0x593a25, 0x263238];
  const skin = skinTones[seed % skinTones.length];
  const hair = hairColors[(seed >> 2) % hairColors.length];
  const darkShirt = Phaser.Display.Color.ValueToColor(shirt).darken(25).color;

  // Layered 3–8 px shapes, highlights, and role props create a colorful 64-bit-retro silhouette.
  const shadow = scene.add.rectangle(0, 29, 42, 8, 0x000000, 0.18);
  const backLeg = scene.add.rectangle(-8, 21, 10, 20, darkShirt).setStrokeStyle(3, colors.navy);
  const frontLeg = scene.add.rectangle(8, 21, 10, 20, darkShirt).setStrokeStyle(3, colors.navy);
  const backShoe = scene.add.rectangle(-9, 32, 14, 7, colors.navy);
  const frontShoe = scene.add.rectangle(9, 32, 14, 7, colors.navy);
  const backArm = scene.add.rectangle(-19, 2, 7, 27, darkShirt).setStrokeStyle(3, colors.navy);
  const frontArm = scene.add.rectangle(19, 2, 7, 27, shirt).setStrokeStyle(3, colors.navy);
  const hands = [scene.add.rectangle(-19, 17, 7, 7, skin), scene.add.rectangle(19, 17, 7, 7, skin)];
  const torso = scene.add.rectangle(0, 2, 31, 32, shirt).setStrokeStyle(4, colors.navy);
  const shirtLight = Phaser.Display.Color.ValueToColor(shirt).lighten(22).color;
  const shirtPixel = scene.add.rectangle(-10, -7, 5, 13, shirtLight, 0.75);
  const neck = scene.add.rectangle(0, -16, 10, 7, skin).setStrokeStyle(2, colors.navy);
  const ears = [scene.add.rectangle(-16, -29, 5, 10, skin).setStrokeStyle(2, colors.navy), scene.add.rectangle(16, -29, 5, 10, skin).setStrokeStyle(2, colors.navy)];
  const head = scene.add.rectangle(0, -29, 29, 26, skin).setStrokeStyle(4, colors.navy);
  const hairTop = scene.add.rectangle(0, -43, 31, 7, hair).setStrokeStyle(2, colors.navy);
  const hairSide = scene.add.rectangle(seed % 2 ? -12 : 12, -36, 7, 13, hair);
  const fringe = scene.add.rectangle(seed % 3 === 0 ? -5 : 6, -39, 11, 6, hair);
  const eyes = [scene.add.rectangle(-7, -29, 3, 4, colors.navy), scene.add.rectangle(7, -29, 3, 4, colors.navy)];
  const nose = scene.add.rectangle(1, -24, 3, 3, 0xa96849);
  const mouth = scene.add.rectangle(0, -19, 8, 2, 0x7d4135);
  const badge = scene.add.rectangle(9, 3, 9, 12, colors.white).setStrokeStyle(2, colors.navy);
  const badgeLine = scene.add.rectangle(9, 6, 5, 2, colors.blue);
  const items: Phaser.GameObjects.GameObject[] = [
    shadow, backLeg, frontLeg, backShoe, frontShoe, backArm, frontArm, ...hands,
    torso, shirtPixel, neck, ...ears, head, hairTop, hairSide, fringe, ...eyes, nose, mouth,
    badge, badgeLine,
  ];

  if (role.includes('hr') || role.includes('clipboard')) {
    items.push(scene.add.rectangle(22, 8, 14, 22, 0xf4d35e).setStrokeStyle(3, colors.navy));
    items.push(scene.add.rectangle(22, 0, 7, 4, colors.white).setStrokeStyle(1, colors.navy));
  } else if (role.includes('qa') || role.includes('developer')) {
    items.push(scene.add.rectangle(-7, -30, 11, 8, 0x9eeaf2, 0.3).setStrokeStyle(2, colors.navy));
    items.push(scene.add.rectangle(7, -30, 11, 8, 0x9eeaf2, 0.3).setStrokeStyle(2, colors.navy));
    items.push(scene.add.rectangle(0, -30, 4, 2, colors.navy));
  } else if (role.includes('support')) {
    items.push(scene.add.rectangle(0, -38, 37, 4, colors.purple));
    items.push(scene.add.rectangle(17, -29, 5, 13, colors.purple));
    items.push(scene.add.rectangle(21, -20, 9, 3, colors.navy));
  } else if (role.includes('manager')) {
    items.push(scene.add.triangle(0, 5, -4, -9, 4, -9, 0, 12, colors.orange));
  }

  if (label) items.push(scene.add.text(0, 42, label, textStyle(13, '#071a2b')).setOrigin(0.5, 0));
  const person = scene.add.container(x, y, items).setSize(54, 92);
  person.setData('walkParts', { backLeg, frontLeg, backArm, frontArm });
  person.setData('baseY', { backLeg: backLeg.y, frontLeg: frontLeg.y, backArm: backArm.y, frontArm: frontArm.y });
  return person;
};

export const animatePerson = (
  person: Phaser.GameObjects.Container,
  moving: boolean,
  time: number,
): void => {
  const parts = person.getData('walkParts') as Record<string, Phaser.GameObjects.Rectangle> | undefined;
  const base = person.getData('baseY') as Record<string, number> | undefined;
  if (!parts || !base) return;
  const step = moving ? Math.round(Math.sin(time / 75) * 3) : 0;
  parts.backLeg.y = base.backLeg + step;
  parts.frontLeg.y = base.frontLeg - step;
  parts.backArm.y = base.backArm - step;
  parts.frontArm.y = base.frontArm + step;
};
