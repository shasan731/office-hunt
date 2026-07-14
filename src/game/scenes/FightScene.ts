import Phaser from 'phaser';
import { WORKDAY_SCHEDULE } from '../../config/constants';
import { app } from '../managers/AppContext';
import { FIGHT_BALANCE, applyFightDamage, developerWinsRound } from '../systems/FightSystem';
import { addButton, applyPixelPolish, colors, textStyle } from '../ui';

type Attack = 'punch' | 'kick';

interface FighterParts {
  frontArm: Phaser.GameObjects.Rectangle;
  backArm: Phaser.GameObjects.Rectangle;
  frontLeg: Phaser.GameObjects.Rectangle;
  backLeg: Phaser.GameObjects.Rectangle;
}

export class FightScene extends Phaser.Scene {
  private developer?: Phaser.GameObjects.Container;
  private tester?: Phaser.GameObjects.Container;
  private developerHealth = 100;
  private testerHealth = 100;
  private seconds = 60;
  private round = 1;
  private developerRoundWins = 0;
  private testerRoundWins = 0;
  private developerBar?: Phaser.GameObjects.Rectangle;
  private testerBar?: Phaser.GameObjects.Rectangle;
  private developerRoundPips: Phaser.GameObjects.Rectangle[] = [];
  private testerRoundPips: Phaser.GameObjects.Rectangle[] = [];
  private timerText?: Phaser.GameObjects.Text;
  private statusText?: Phaser.GameObjects.Text;
  private leftKey?: Phaser.Input.Keyboard.Key;
  private rightKey?: Phaser.Input.Keyboard.Key;
  private punchKey?: Phaser.Input.Keyboard.Key;
  private kickKey?: Phaser.Input.Keyboard.Key;
  private blockKey?: Phaser.Input.Keyboard.Key;
  private downKey?: Phaser.Input.Keyboard.Key;
  private spaceKey?: Phaser.Input.Keyboard.Key;
  private touchLeft = false;
  private touchRight = false;
  private touchBlock = false;
  private introLocked = true;
  private ended = false;
  private playerActionUntil = 0;
  private testerActionUntil = 0;
  private nextTesterAttack = 0;

  constructor() { super('FightScene'); }

  create(): void {
    this.resetMatch();
    app.state.setTime(WORKDAY_SCHEDULE.fightStart);
    app.state.beginStage('fight');
    this.cameras.main.setBackgroundColor('#10162f');
    this.drawArena();
    this.drawFightHud();
    this.developer = this.createFighter(330, 505, colors.blue, 'developer');
    this.tester = this.createFighter(950, 505, colors.orange, 'tester').setScale(-1.55, 1.55);
    this.developer.setScale(1.55);
    this.add.text(330, 586, app.state.snapshot.playerName.toUpperCase(), textStyle(15, '#9eeaf2')).setOrigin(0.5);
    this.add.text(950, 586, 'SOFTWARE TESTER', textStyle(15, '#ffad99')).setOrigin(0.5);
    this.setupControls();
    this.showIntro();
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.introLocked || this.ended) return;
        this.seconds -= 1;
        this.timerText?.setText(this.seconds.toString().padStart(2, '0'));
        if (this.seconds <= 0) this.finishRound(developerWinsRound(this.developerHealth, this.testerHealth), 'TIME');
      },
    });
    applyPixelPolish(this, colors.orange);
  }

  update(time: number, delta: number): void {
    if (!this.developer || !this.tester || this.ended || this.introLocked || this.scene.isPaused()) return;
    const balance = FIGHT_BALANCE[app.state.snapshot.difficulty];
    const blocking = this.isBlocking();
    const actionLocked = time < this.playerActionUntil;
    const move = Number(this.rightKey?.isDown || this.touchRight) - Number(this.leftKey?.isDown || this.touchLeft);

    if (!actionLocked && !blocking && move !== 0) {
      const nextX = this.developer.x + move * balance.playerSpeed * delta / 1000;
      this.developer.x = Phaser.Math.Clamp(nextX, 115, Math.min(1110, this.tester.x - 65));
    }
    if (!actionLocked && (Phaser.Input.Keyboard.JustDown(this.punchKey!) || Phaser.Input.Keyboard.JustDown(this.spaceKey!))) this.playerAttack('punch');
    if (!actionLocked && Phaser.Input.Keyboard.JustDown(this.kickKey!)) this.playerAttack('kick');

    this.updateDeveloperPose(time, blocking, move !== 0 && !actionLocked);
    this.updateTester(time, delta);
  }

  private resetMatch(): void {
    this.developer = undefined;
    this.tester = undefined;
    this.developerHealth = 100;
    this.testerHealth = 100;
    this.seconds = 60;
    this.round = 1;
    this.developerRoundWins = 0;
    this.testerRoundWins = 0;
    this.developerBar = undefined;
    this.testerBar = undefined;
    this.developerRoundPips = [];
    this.testerRoundPips = [];
    this.timerText = undefined;
    this.statusText = undefined;
    this.touchLeft = false;
    this.touchRight = false;
    this.touchBlock = false;
    this.introLocked = true;
    this.ended = false;
    this.playerActionUntil = 0;
    this.testerActionUntil = 0;
    this.nextTesterAttack = 0;
  }

  private drawArena(): void {
    const graphics = this.add.graphics().setDepth(-20);
    graphics.fillStyle(0x25345c).fillRect(0, 88, 1280, 430);
    graphics.fillStyle(0x1b2746).fillRect(0, 88, 1280, 22);
    for (let y = 130; y < 480; y += 54) {
      for (let x = (y / 54) % 2 ? 0 : 54; x < 1280; x += 108) {
        graphics.fillStyle(0x31436e, 0.52).fillRect(x, y, 54, 27);
      }
    }
    graphics.fillStyle(0xd7b36a).fillRect(0, 518, 1280, 202);
    for (let x = 0; x < 1280; x += 64) {
      graphics.fillStyle(x % 128 ? 0xc99e57 : 0xe2c37e).fillRect(x, 518, 60, 202);
      graphics.fillStyle(colors.navy, 0.18).fillRect(x + 60, 518, 4, 202);
    }
    graphics.fillStyle(colors.orange).fillRect(90, 514, 1100, 8);
    graphics.fillStyle(colors.navy).fillRect(90, 646, 1100, 7);

    this.add.rectangle(640, 177, 690, 116, 0x071a2b, 0.92).setStrokeStyle(5, colors.orange);
    this.add.text(640, 145, 'BUG BASH ARENA', textStyle(30, '#ffc857')).setOrigin(0.5);
    this.add.text(640, 181, 'DEVELOPMENT  VS  QUALITY ASSURANCE', textStyle(15, '#d9eef7')).setOrigin(0.5);
    this.add.text(640, 213, 'Winner decides whether “works on my machine” is a valid test result.', textStyle(14, '#94b8c8')).setOrigin(0.5);

    for (let x = 80; x <= 1200; x += 80) {
      const shade = x % 160 ? 0x17213b : 0x202e50;
      this.add.rectangle(x, 425, 38, 70, shade).setStrokeStyle(3, colors.navy).setDepth(-2);
      this.add.rectangle(x, 378, 34, 34, shade).setStrokeStyle(3, colors.navy).setDepth(-2);
      this.add.rectangle(x + (x % 160 ? 20 : -20), 400, 10, 44, shade).setRotation(x % 160 ? -0.65 : 0.65).setDepth(-2);
    }
  }

  private drawFightHud(): void {
    this.add.rectangle(640, 45, 1280, 90, colors.navy, 0.98).setDepth(100);
    this.add.text(24, 12, 'LEVEL 4 / QA BUG BASH', textStyle(17, '#39d8e8')).setDepth(102);
    this.add.text(24, 71, 'A/D move  •  J/Space punch  •  K kick  •  S/Down block', textStyle(13, '#d9eef7')).setDepth(102);
    this.add.rectangle(352, 31, 386, 24, 0x311b2d).setStrokeStyle(3, colors.white).setDepth(101);
    this.developerBar = this.add.rectangle(161, 31, 382, 18, colors.green).setOrigin(0, 0.5).setDepth(102);
    this.add.rectangle(928, 31, 386, 24, 0x311b2d).setStrokeStyle(3, colors.white).setDepth(101);
    this.testerBar = this.add.rectangle(1119, 31, 382, 18, colors.orange).setOrigin(1, 0.5).setDepth(102);
    this.add.text(158, 50, 'DEVELOPER', textStyle(12, '#9eeaf2')).setDepth(102);
    this.add.text(1122, 50, 'TESTER', textStyle(12, '#ffad99')).setOrigin(1, 0).setDepth(102);
    for (let index = 0; index < 3; index += 1) {
      this.developerRoundPips.push(this.add.rectangle(263 + index * 22, 58, 14, 10, 0x314052).setStrokeStyle(2, colors.white, 0.55).setDepth(102));
      this.testerRoundPips.push(this.add.rectangle(1017 - index * 22, 58, 14, 10, 0x314052).setStrokeStyle(2, colors.white, 0.55).setDepth(102));
    }
    this.add.rectangle(640, 39, 70, 62, colors.purple).setStrokeStyle(4, colors.white).setDepth(103);
    this.timerText = this.add.text(640, 39, '60', textStyle(27, '#ffffff')).setOrigin(0.5).setDepth(104);
    this.statusText = this.add.text(640, 99, 'ROUND 1', textStyle(14, '#ffc857')).setOrigin(0.5).setDepth(102);
  }

  private setupControls(): void {
    const keyboard = this.input.keyboard;
    this.leftKey = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.rightKey = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.punchKey = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    this.kickKey = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    this.blockKey = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.downKey = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.spaceKey = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    keyboard?.on('keydown-ESC', () => {
      if (this.ended) return;
      this.scene.pause();
      this.scene.launch('PauseScene', { pausedScene: this.scene.key });
    });

    const holdButton = (x: number, label: string, property: 'touchLeft' | 'touchRight' | 'touchBlock', color: number): void => {
      const button = addButton(this, x, 675, label, () => undefined, 86, color).setDepth(120).setAlpha(0.86);
      button.on('pointerdown', () => { this[property] = true; });
      button.on('pointerup', () => { this[property] = false; });
      button.on('pointerout', () => { this[property] = false; });
    };
    holdButton(72, '◀', 'touchLeft', colors.navy);
    holdButton(168, '▶', 'touchRight', colors.navy);
    holdButton(1092, 'BLOCK', 'touchBlock', colors.purple);
    addButton(this, 810, 675, 'PUNCH', () => this.playerAttack('punch'), 120, colors.blue).setDepth(120).setAlpha(0.9);
    addButton(this, 944, 675, 'KICK', () => this.playerAttack('kick'), 120, colors.orange).setDepth(120).setAlpha(0.9);
  }

  private showIntro(): void {
    const introRound = this.round;
    const panel = this.add.container(640, 350, [
      this.add.rectangle(8, 9, 620, 190, 0x000000, 0.4),
      this.add.rectangle(0, 0, 620, 190, colors.navy, 0.97).setStrokeStyle(6, colors.yellow),
      this.add.text(0, -52, `ROUND ${this.round} OF 3`, textStyle(26, '#39d8e8')).setOrigin(0.5),
      this.add.text(0, 4, 'REQUIREMENTS  VS  REALITY', textStyle(32, '#ffc857')).setOrigin(0.5),
      this.add.text(0, 59, 'FIGHT!', textStyle(38, '#ff7a59')).setOrigin(0.5),
    ]).setDepth(180);
    this.time.delayedCall(950, () => {
      panel.destroy();
      if (this.round !== introRound || this.ended) return;
      this.introLocked = false;
      this.nextTesterAttack = this.time.now + 900;
      this.statusText?.setText(`ROUND ${this.round} • DEFEND THE BUILD`);
      app.audio.play('warning');
    });
  }

  private createFighter(x: number, y: number, shirt: number, role: 'developer' | 'tester'): Phaser.GameObjects.Container {
    const skin = role === 'developer' ? 0xd99a6c : 0xb97952;
    const dark = Phaser.Display.Color.ValueToColor(shirt).darken(28).color;
    const hair = role === 'developer' ? 0x263238 : 0x3d2b1f;
    const shadow = this.add.rectangle(0, 42, 66, 12, 0x000000, 0.25);
    const backLeg = this.add.rectangle(-13, 25, 15, 37, dark).setStrokeStyle(4, colors.navy).setRotation(0.08);
    const frontLeg = this.add.rectangle(14, 24, 16, 39, shirt).setStrokeStyle(4, colors.navy).setRotation(-0.08);
    const shoes = [this.add.rectangle(-17, 45, 24, 9, colors.navy), this.add.rectangle(19, 44, 25, 9, colors.navy)];
    const backArm = this.add.rectangle(-24, -1, 12, 42, dark).setStrokeStyle(4, colors.navy).setRotation(0.28);
    const frontArm = this.add.rectangle(25, -3, 13, 44, shirt).setStrokeStyle(4, colors.navy).setRotation(-0.45);
    const hands = [this.add.rectangle(-30, 18, 13, 12, skin).setStrokeStyle(3, colors.navy), this.add.rectangle(34, 14, 14, 12, skin).setStrokeStyle(3, colors.navy)];
    const torso = this.add.rectangle(0, -5, 46, 52, shirt).setStrokeStyle(5, colors.navy);
    const belt = this.add.rectangle(0, 19, 42, 7, colors.navy);
    const neck = this.add.rectangle(0, -34, 14, 12, skin).setStrokeStyle(3, colors.navy);
    const head = this.add.rectangle(0, -54, 38, 37, skin).setStrokeStyle(5, colors.navy);
    const hairTop = this.add.rectangle(-3, -75, 40, 9, hair).setStrokeStyle(3, colors.navy);
    const hairSide = this.add.rectangle(-17, -65, 8, 19, hair);
    const eyes = [this.add.rectangle(-9, -55, 4, 5, colors.navy), this.add.rectangle(9, -55, 4, 5, colors.navy)];
    const mouth = this.add.rectangle(5, -44, 10, 3, 0x743f32);
    const items: Phaser.GameObjects.GameObject[] = [shadow, backLeg, frontLeg, ...shoes, backArm, frontArm, ...hands, torso, belt, neck, head, hairTop, hairSide, ...eyes, mouth];

    if (role === 'developer') {
      items.push(this.add.rectangle(-9, -56, 15, 10, 0x9eeaf2, 0.4).setStrokeStyle(2, colors.navy));
      items.push(this.add.rectangle(9, -56, 15, 10, 0x9eeaf2, 0.4).setStrokeStyle(2, colors.navy));
      items.push(this.add.rectangle(0, -56, 5, 3, colors.navy));
      items.push(this.add.text(0, -4, '</>', textStyle(11, '#ffffff')).setOrigin(0.5));
    } else {
      items.push(this.add.rectangle(31, -2, 23, 34, colors.yellow).setStrokeStyle(4, colors.navy).setRotation(-0.12));
      items.push(this.add.text(31, -4, 'BUG', textStyle(7, '#071a2b')).setOrigin(0.5).setRotation(-0.12));
      items.push(this.add.rectangle(0, -5, 12, 12, colors.white).setStrokeStyle(2, colors.navy));
      items.push(this.add.text(0, -5, 'QA', textStyle(7, '#071a2b')).setOrigin(0.5));
    }
    const fighter = this.add.container(x, y, items).setSize(82, 132).setDepth(20);
    fighter.setData('fighterParts', { frontArm, backArm, frontLeg, backLeg } satisfies FighterParts);
    return fighter;
  }

  private playerAttack(kind: Attack): void {
    if (!this.developer || !this.tester || this.ended || this.introLocked || this.time.now < this.playerActionUntil || this.isBlocking()) return;
    const balance = FIGHT_BALANCE[app.state.snapshot.difficulty];
    const isKick = kind === 'kick';
    this.playerActionUntil = this.time.now + (isKick ? 520 : 320);
    this.poseAttack(this.developer, kind);
    app.audio.play(isKick ? 'collision' : 'click');
    this.time.delayedCall(isKick ? 175 : 105, () => {
      if (this.ended || !this.developer || !this.tester) return;
      const range = isKick ? 155 : 125;
      if (this.tester.x - this.developer.x <= range) {
        this.testerHealth = applyFightDamage(this.testerHealth, isKick ? balance.kickDamage : balance.punchDamage);
        this.tester.x = Math.min(1155, this.tester.x + (isKick ? 42 : 25));
        this.hitEffect(this.tester.x - 35, this.tester.y - 55, isKick ? 'REGRESSION!' : 'FIXED!', colors.yellow);
        app.audio.play('correct');
        this.refreshHealthBars();
        if (this.testerHealth <= 0) this.finishRound(true, 'KO');
      } else {
        this.statusText?.setText('WHIFFED — CANNOT REPRODUCE');
      }
    });
  }

  private updateTester(time: number, delta: number): void {
    if (!this.developer || !this.tester || this.ended) return;
    const balance = FIGHT_BALANCE[app.state.snapshot.difficulty];
    const distance = this.tester.x - this.developer.x;
    const actionLocked = time < this.testerActionUntil;
    if (!actionLocked && distance > 112) {
      this.tester.x = Math.max(this.developer.x + 66, this.tester.x - balance.testerSpeed * delta / 1000);
      this.animateIdle(this.tester, time, true);
    } else if (!actionLocked) {
      this.animateIdle(this.tester, time, false);
      if (time >= this.nextTesterAttack) this.testerAttack();
    }
  }

  private testerAttack(): void {
    if (!this.developer || !this.tester || this.ended) return;
    const balance = FIGHT_BALANCE[app.state.snapshot.difficulty];
    this.testerActionUntil = this.time.now + 440;
    this.nextTesterAttack = this.time.now + balance.testerAttackCooldown;
    const attack: Attack = Phaser.Math.Between(0, 2) === 0 ? 'kick' : 'punch';
    this.poseAttack(this.tester, attack);
    this.statusText?.setText(attack === 'kick' ? 'TESTER USED EDGE CASE!' : 'TESTER FILED A BLOCKER!');
    this.time.delayedCall(140, () => {
      if (this.ended || !this.developer || !this.tester || this.tester.x - this.developer.x > 145) return;
      const blocked = this.isBlocking();
      this.developerHealth = applyFightDamage(this.developerHealth, balance.testerDamage, blocked ? balance.blockMultiplier : 1);
      this.developer.x = Math.max(110, this.developer.x - (blocked ? 10 : 30));
      this.hitEffect(this.developer.x + 35, this.developer.y - 50, blocked ? 'BLOCKED!' : 'REOPENED!', blocked ? colors.cyan : colors.orange);
      app.audio.play(blocked ? 'click' : 'wrong');
      this.refreshHealthBars();
      if (this.developerHealth <= 0) this.finishRound(false, 'KO');
    });
  }

  private updateDeveloperPose(time: number, blocking: boolean, moving: boolean): void {
    if (!this.developer || time < this.playerActionUntil) return;
    const parts = this.developer.getData('fighterParts') as FighterParts;
    if (blocking) {
      parts.frontArm.setRotation(-1.35).setPosition(22, -25);
      parts.backArm.setRotation(-0.9).setPosition(-12, -20);
      this.statusText?.setText('BLOCKING THE BUG REPORT');
      return;
    }
    this.resetPose(this.developer);
    this.animateIdle(this.developer, time, moving);
  }

  private animateIdle(fighter: Phaser.GameObjects.Container, time: number, moving: boolean): void {
    if (app.save.getData().settings.reducedMotion) return;
    const parts = fighter.getData('fighterParts') as FighterParts;
    const step = Math.round(Math.sin(time / (moving ? 70 : 150)) * (moving ? 4 : 2));
    parts.frontLeg.y = 24 + step;
    parts.backLeg.y = 25 - step;
  }

  private poseAttack(fighter: Phaser.GameObjects.Container, kind: Attack): void {
    const parts = fighter.getData('fighterParts') as FighterParts;
    if (kind === 'punch') {
      parts.frontArm.setRotation(-1.5).setPosition(43, -13);
      parts.backArm.setRotation(-0.75);
    } else {
      parts.frontLeg.setRotation(-1.18).setPosition(38, 9);
      parts.frontArm.setRotation(-0.8);
    }
    this.time.delayedCall(kind === 'kick' ? 380 : 230, () => {
      if (fighter.active) this.resetPose(fighter);
    });
  }

  private resetPose(fighter: Phaser.GameObjects.Container): void {
    const parts = fighter.getData('fighterParts') as FighterParts;
    parts.frontArm.setRotation(-0.45).setPosition(25, -3);
    parts.backArm.setRotation(0.28).setPosition(-24, -1);
    parts.frontLeg.setRotation(-0.08).setPosition(14, 24);
    parts.backLeg.setRotation(0.08).setPosition(-13, 25);
  }

  private isBlocking(): boolean {
    return Boolean(this.blockKey?.isDown || this.downKey?.isDown || this.touchBlock);
  }

  private refreshHealthBars(): void {
    this.developerBar?.setDisplaySize(382 * this.developerHealth / 100, 18)
      .setFillStyle(this.developerHealth > 50 ? colors.green : this.developerHealth > 20 ? colors.yellow : colors.orange);
    this.testerBar?.setDisplaySize(382 * this.testerHealth / 100, 18)
      .setFillStyle(this.testerHealth > 50 ? colors.orange : this.testerHealth > 20 ? colors.yellow : 0xe53935);
  }

  private hitEffect(x: number, y: number, label: string, color: number): void {
    const burst = this.add.container(x, y, [
      this.add.star(0, 0, 8, 20, 44, color).setStrokeStyle(4, colors.white),
      this.add.text(0, 0, label, textStyle(12, '#071a2b')).setOrigin(0.5),
    ]).setDepth(80);
    if (!app.save.getData().settings.reducedMotion) {
      this.cameras.main.shake(70, 0.004);
      this.tweens.add({ targets: burst, scale: 1.25, angle: 8, duration: 130, yoyo: true });
    }
    this.time.delayedCall(260, () => burst.destroy());
  }

  private finishRound(won: boolean, reason: 'KO' | 'TIME'): void {
    if (this.ended) return;
    this.ended = true;
    this.touchLeft = false;
    this.touchRight = false;
    this.touchBlock = false;
    if (won) this.developerRoundWins += 1;
    else this.testerRoundWins += 1;
    this.refreshRoundPips();

    if (this.round < 3) {
      app.audio.play(won ? 'correct' : 'wrong');
      this.showRoundResult(won, reason);
      return;
    }

    const matchWon = this.developerRoundWins >= 2;
    if (matchWon) {
      app.state.completeTesterFight(this.developerHealth, this.developerRoundWins, this.testerRoundWins);
      app.state.setTime(WORKDAY_SCHEDULE.fightEnd);
      app.state.unlock('qa-approved');
      app.audio.play('salary');
    } else {
      app.audio.play('wrong');
    }
    this.showMatchResult(matchWon, reason);
  }

  private refreshRoundPips(): void {
    this.developerRoundPips.forEach((pip, index) => pip.setFillStyle(index < this.developerRoundWins ? colors.green : 0x314052));
    this.testerRoundPips.forEach((pip, index) => pip.setFillStyle(index < this.testerRoundWins ? colors.orange : 0x314052));
  }

  private showRoundResult(won: boolean, reason: 'KO' | 'TIME'): void {
    const overlay = this.add.container(640, 350, [
      this.add.rectangle(0, 10, 1280, 720, colors.navy, 0.7).setInteractive(),
      this.add.rectangle(0, 0, 720, 390, colors.navy, 0.98).setStrokeStyle(7, won ? colors.green : colors.orange),
      this.add.text(0, -125, reason === 'KO' ? 'KNOCKOUT!' : 'ROUND TIME!', textStyle(23, '#39d8e8')).setOrigin(0.5),
      this.add.text(0, -68, `ROUND ${this.round}: ${won ? 'DEVELOPER' : 'TESTER'} WINS`, textStyle(35, won ? '#ffc857' : '#ff7a59')).setOrigin(0.5),
      this.add.text(
        0,
        4,
        won
          ? 'One bug closed. The tester has quietly opened two more tabs.'
          : 'The build was returned with the devastating note: “Steps to reproduce attached.”',
        { ...textStyle(18, '#d9eef7'), align: 'center', wordWrap: { width: 590 } },
      ).setOrigin(0.5),
      this.add.text(0, 68, `MATCH SCORE  ${this.developerRoundWins} – ${this.testerRoundWins}`, textStyle(21, '#8ff0c8')).setOrigin(0.5),
    ]).setDepth(190);
    overlay.add(addButton(this, 0, 125, `START ROUND ${this.round + 1}`, () => {
      overlay.destroy();
      this.startNextRound();
    }, 330, won ? colors.green : colors.orange));
  }

  private startNextRound(): void {
    if (!this.developer || !this.tester) return;
    this.round += 1;
    this.developerHealth = 100;
    this.testerHealth = 100;
    this.seconds = 60;
    this.developer.x = 330;
    this.developer.y = 505;
    this.tester.x = 950;
    this.tester.y = 505;
    this.resetPose(this.developer);
    this.resetPose(this.tester);
    this.timerText?.setText('60');
    this.statusText?.setText(`ROUND ${this.round}`);
    this.playerActionUntil = 0;
    this.testerActionUntil = 0;
    this.nextTesterAttack = 0;
    this.touchLeft = false;
    this.touchRight = false;
    this.touchBlock = false;
    this.introLocked = true;
    this.ended = false;
    this.refreshHealthBars();
    this.showIntro();
  }

  private showMatchResult(won: boolean, reason: 'KO' | 'TIME'): void {
    const reward = 200 + this.developerRoundWins * 100 + this.developerHealth * 2;
    this.add.rectangle(640, 360, 1280, 720, colors.navy, 0.72).setDepth(190).setInteractive();
    this.add.rectangle(640, 340, 790, 440, colors.navy, 0.98).setStrokeStyle(7, won ? colors.green : colors.orange).setDepth(191);
    this.add.text(640, 175, reason === 'KO' ? 'FINAL KNOCKOUT!' : 'FINAL BELL!', textStyle(25, '#39d8e8')).setOrigin(0.5).setDepth(192);
    this.add.text(640, 230, won ? 'DEVELOPER WINS MATCH' : 'TESTER WINS MATCH', textStyle(40, won ? '#ffc857' : '#ff7a59')).setOrigin(0.5).setDepth(192);
    this.add.text(640, 276, `THREE-ROUND SCORE  ${this.developerRoundWins} – ${this.testerRoundWins}`, textStyle(21, '#ffffff')).setOrigin(0.5).setDepth(192);
    this.add.text(
      640,
      330,
      won
        ? 'QA approves the build after three rounds and only seventeen new tickets.'
        : 'QA wins the review. Your health bar has been marked “needs revision.”',
      { ...textStyle(18, '#d9eef7'), align: 'center', wordWrap: { width: 650 } },
    ).setOrigin(0.5).setDepth(192);
    this.add.text(
      640,
      395,
      won ? `Final-round health: ${this.developerHealth}%  •  Match bonus: +${reward}` : 'Win at least two of the three rounds to escape into tea break.',
      textStyle(17, won ? '#8ff0c8' : '#ffc857'),
    ).setOrigin(0.5).setDepth(192);
    addButton(this, 640, 485, won ? 'CLAIM TEA BREAK' : 'RETRY 3-ROUND MATCH', () => {
      if (won) this.scene.start('TeaBreakScene');
      else {
        app.state.restoreStageCheckpoint();
        this.scene.restart();
      }
    }, 370, won ? colors.green : colors.orange).setDepth(193);
  }
}
