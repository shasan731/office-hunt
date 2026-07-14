import Phaser from 'phaser';
import { app } from '../managers/AppContext';
import { formatTime } from '../managers/TimeManager';
import { addButton, addPerson, animatePerson, applyPixelPolish, colors, textStyle } from '../ui';

export abstract class BaseScene extends Phaser.Scene {
  protected player?: Phaser.GameObjects.Container;
  protected movementLocked = false;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys?: Record<'W' | 'A' | 'S' | 'D' | 'E', Phaser.Input.Keyboard.Key>;
  private touch = { left: false, right: false, up: false, down: false };
  private objectiveText?: Phaser.GameObjects.Text;
  private timeText?: Phaser.GameObjects.Text;
  private scoreText?: Phaser.GameObjects.Text;
  private energyBar?: Phaser.GameObjects.Rectangle;
  private lastTick = 0;
  private dialog?: Phaser.GameObjects.Container;

  protected setupWorld(stageLabel: string, objective: string, startX = 90, startY = 400): void {
    const settings = app.save.getData().settings;
    this.player = undefined;
    this.movementLocked = false;
    this.touch = { left: false, right: false, up: false, down: false };
    this.dialog = undefined;
    this.lastTick = this.time.now;
    this.cameras.main.setBackgroundColor(settings.highContrast ? '#02070c' : '#d8f5f7');
    app.state.beginStage(this.keyToStage());
    this.player = addPerson(this, startX, startY, colors.blue).setDepth(20);
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.keys = this.input.keyboard?.addKeys('W,A,S,D,E') as Record<'W' | 'A' | 'S' | 'D' | 'E', Phaser.Input.Keyboard.Key>;
    this.drawHud(stageLabel, objective);
    this.createMobileControls();
    applyPixelPolish(this);
    this.input.keyboard?.on('keydown-ESC', () => this.togglePause());
    this.input.keyboard?.on('keydown-SPACE', () => this.interact());
    this.input.keyboard?.on('keydown-E', () => this.interact());
  }

  private keyToStage(): 'commute' | 'lobby' | 'coding' | 'lunch' | 'tea-break' | 'hr-search' | 'salary' | 'escape' | 'results' {
    const map: Record<string, 'commute' | 'lobby' | 'coding' | 'lunch' | 'tea-break' | 'hr-search' | 'salary' | 'escape' | 'results'> = {
      CommuteScene: 'commute', LobbyScene: 'lobby', CodingScene: 'coding', HRSearchScene: 'hr-search',
      LunchScene: 'lunch', TeaBreakScene: 'tea-break', SalaryScene: 'salary', EscapeScene: 'escape', ResultsScene: 'results',
    };
    return map[this.scene.key] ?? 'commute';
  }

  private drawHud(stageLabel: string, objective: string): void {
    this.add.rectangle(640, 45, 1280, 90, colors.navy, 0.98).setDepth(100);
    this.add.rectangle(640, 88, 1280, 5, colors.cyan, 0.86).setDepth(101);
    this.add.rectangle(103, 25, 176, 32, colors.blue, 0.72).setStrokeStyle(2, colors.cyan).setDepth(101);
    this.add.text(18, 14, stageLabel.toUpperCase(), textStyle(16, '#dffbff')).setDepth(102);
    this.objectiveText = this.add.text(20, 49, objective, { ...textStyle(16), wordWrap: { width: 720 } }).setDepth(102);
    this.timeText = this.add.text(1034, 14, formatTime(app.state.snapshot.minutes), textStyle(19, '#ffc857')).setDepth(102);
    this.scoreText = this.add.text(1034, 49, `SCORE ${app.state.snapshot.score}`, textStyle(15, '#d9eef7')).setDepth(102);
    this.add.text(790, 12, app.state.snapshot.playerName.toUpperCase(), textStyle(11, '#94b8c8')).setDepth(102);
    this.add.rectangle(874, 42, 176, 20, 0x243948).setStrokeStyle(3, colors.white, 0.55).setDepth(101);
    this.energyBar = this.add.rectangle(788, 42, 172, 14, colors.green).setOrigin(0, 0.5).setDepth(102);
    this.add.text(790, 57, 'ENERGY', textStyle(11, '#ffffff')).setDepth(102);
    addButton(this, 1243, 43, 'II', () => this.togglePause(), 48, colors.purple).setDepth(103);
  }

  protected updateObjective(text: string): void { this.objectiveText?.setText(text); }

  protected updateMovement(time: number, delta: number, speed = 210): void {
    if (!this.player || this.movementLocked || this.scene.isPaused()) return;
    const direction = new Phaser.Math.Vector2(
      Number(this.cursors?.right.isDown || this.keys?.D.isDown || this.touch.right) - Number(this.cursors?.left.isDown || this.keys?.A.isDown || this.touch.left),
      Number(this.cursors?.down.isDown || this.keys?.S.isDown || this.touch.down) - Number(this.cursors?.up.isDown || this.keys?.W.isDown || this.touch.up),
    ).normalize();
    this.player.x = Phaser.Math.Clamp(this.player.x + direction.x * speed * app.difficulty.playerSpeed * delta / 1000, 24, 1256);
    this.player.y = Phaser.Math.Clamp(this.player.y + direction.y * speed * app.difficulty.playerSpeed * delta / 1000, 105, 680);
    const moving = direction.lengthSq() > 0;
    if (moving && !app.save.getData().settings.reducedMotion) this.player.rotation = Math.sin(time / 80) * 0.018;
    else this.player.rotation = 0;
    animatePerson(this.player, moving && !app.save.getData().settings.reducedMotion, time);
    if (time - this.lastTick > 1000) { app.state.advanceTime(app.difficulty.timeScale * 0.55); this.lastTick = time; }
    this.refreshHud();
  }

  protected refreshHud(): void {
    this.timeText?.setText(formatTime(app.state.snapshot.minutes));
    this.scoreText?.setText(`Score ${app.state.snapshot.score}`);
    const energy = app.state.snapshot.energy;
    this.energyBar?.setDisplaySize(172 * energy / 100, 14).setFillStyle(energy > 55 ? colors.green : energy > 25 ? colors.yellow : colors.orange);
  }

  protected isNear(object: Phaser.GameObjects.Components.Transform, distance = 75): boolean {
    return Boolean(this.player && Phaser.Math.Distance.Between(this.player.x, this.player.y, object.x, object.y) < distance);
  }

  protected showDialog(speaker: string, message: string, onClose?: () => void): void {
    this.dialog?.destroy();
    this.movementLocked = true;
    const shadow = this.add.rectangle(9, 10, 1080, 150, 0x000000, 0.3);
    const bg = this.add.rectangle(0, 0, 1080, 150, colors.navy, 0.98).setStrokeStyle(4, colors.cyan);
    const stripe = this.add.rectangle(0, -70, 1070, 8, colors.cyan, 0.85);
    const speakerPixel = this.add.rectangle(-488, -42, 34, 34, colors.purple).setStrokeStyle(3, colors.white);
    const initial = this.add.text(-488, -42, speaker.trim().charAt(0).toUpperCase(), textStyle(17)).setOrigin(0.5);
    const title = this.add.text(-510, -56, speaker, textStyle(20, '#ffc857'));
    title.setPosition(-458, -58);
    const body = this.add.text(-458, -22, message, { ...textStyle(20), wordWrap: { width: 850 } });
    const hint = this.add.text(510, 55, 'E / SPACE / TAP  ›', textStyle(14, '#39d8e8')).setOrigin(1);
    this.dialog = this.add.container(640, 615, [shadow, bg, stripe, speakerPixel, initial, title, body, hint]).setDepth(300).setSize(1080, 150).setInteractive();
    if (!app.save.getData().settings.reducedMotion) {
      this.dialog.setY(690);
      this.tweens.add({ targets: this.dialog, y: 615, duration: 170, ease: 'Quad.easeOut' });
    }
    const close = (): void => { this.dialog?.destroy(); this.dialog = undefined; this.movementLocked = false; onClose?.(); };
    this.dialog.once('pointerdown', close);
    this.input.keyboard?.once('keydown-E', close);
    this.input.keyboard?.once('keydown-SPACE', close);
  }

  private createMobileControls(): void {
    if (!this.sys.game.device.input.touch) return;
    const createPad = (x: number, y: number, symbol: string, key: keyof typeof this.touch): void => {
      const button = addButton(this, x, y, symbol, () => undefined, 56, colors.navy).setDepth(150).setAlpha(0.72);
      button.on('pointerdown', () => { this.touch[key] = true; });
      button.on('pointerup', () => { this.touch[key] = false; });
      button.on('pointerout', () => { this.touch[key] = false; });
    };
    createPad(86, 610, '←', 'left'); createPad(198, 610, '→', 'right');
    createPad(142, 554, '↑', 'up'); createPad(142, 666, '↓', 'down');
    addButton(this, 1160, 620, 'E', () => this.interact(), 70, colors.orange).setDepth(150).setAlpha(0.8);
  }

  private togglePause(): void {
    if (this.scene.isPaused()) return;
    this.scene.pause();
    this.scene.launch('PauseScene', { pausedScene: this.scene.key });
  }

  protected interact(): void {}
}
