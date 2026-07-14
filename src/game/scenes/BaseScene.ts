import Phaser from 'phaser';
import { app } from '../managers/AppContext';
import { formatTime } from '../managers/TimeManager';
import { addButton, addPerson, animatePerson, colors, textStyle } from '../ui';

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
    this.add.rectangle(640, 42, 1280, 84, colors.navy, 0.96).setDepth(100);
    this.add.text(24, 14, stageLabel.toUpperCase(), textStyle(18, '#39d8e8')).setDepth(101);
    this.objectiveText = this.add.text(24, 43, objective, textStyle(17)).setDepth(101);
    this.timeText = this.add.text(1020, 17, formatTime(app.state.snapshot.minutes), textStyle(20, '#ffc857')).setDepth(101);
    this.scoreText = this.add.text(1020, 48, `Score ${app.state.snapshot.score}`, textStyle(17)).setDepth(101);
    this.add.rectangle(820, 27, 160, 16, 0x34495e).setOrigin(0).setDepth(101);
    this.energyBar = this.add.rectangle(820, 27, 160, 16, colors.green).setOrigin(0).setDepth(102);
    this.add.text(820, 49, 'ENERGY', textStyle(13, '#ffffff')).setDepth(101);
    addButton(this, 1243, 43, 'Ⅱ', () => this.togglePause(), 48, colors.purple).setDepth(103);
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
    this.energyBar?.setDisplaySize(160 * app.state.snapshot.energy / 100, 16);
  }

  protected isNear(object: Phaser.GameObjects.Components.Transform, distance = 75): boolean {
    return Boolean(this.player && Phaser.Math.Distance.Between(this.player.x, this.player.y, object.x, object.y) < distance);
  }

  protected showDialog(speaker: string, message: string, onClose?: () => void): void {
    this.dialog?.destroy();
    this.movementLocked = true;
    const bg = this.add.rectangle(0, 0, 1080, 150, colors.navy, 0.98).setStrokeStyle(4, colors.cyan);
    const title = this.add.text(-510, -56, speaker, textStyle(20, '#ffc857'));
    const body = this.add.text(-510, -20, message, { ...textStyle(21), wordWrap: { width: 900 } });
    const hint = this.add.text(510, 55, 'E / SPACE / TAP  ›', textStyle(14, '#39d8e8')).setOrigin(1);
    this.dialog = this.add.container(640, 615, [bg, title, body, hint]).setDepth(300).setSize(1080, 150).setInteractive();
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
