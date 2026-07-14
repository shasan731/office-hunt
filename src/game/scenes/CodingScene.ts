import Phaser from 'phaser';
import challenges from '../../data/codingChallenges.json';
import { app } from '../managers/AppContext';
import { addButton, colors, textStyle } from '../ui';
import { WORKDAY_SCHEDULE } from '../../config/constants';

type Mode = 'bugs' | 'logic' | 'errors';

export class CodingScene extends Phaser.Scene {
  private mode: Mode = 'bugs';
  private index = 0;
  private targetCount = 4;
  private seconds = 42;
  private timerText?: Phaser.GameObjects.Text;
  private content?: Phaser.GameObjects.Container;
  private ended = false;
  private answerLocked = false;
  private errorItems: Phaser.GameObjects.Container[] = [];

  constructor() { super('CodingScene'); }

  create(): void {
    app.state.setStage('coding');
    this.mode = Phaser.Utils.Array.GetRandom<Mode>(['bugs', 'logic', 'errors']);
    this.targetCount = app.difficulty.codingCount;
    this.cameras.main.setBackgroundColor('#071a2b');
    this.add.rectangle(640, 44, 1280, 88, 0x0d2638);
    this.add.text(28, 17, '3 / CODING CRISIS', textStyle(21, '#39d8e8'));
    this.add.text(28, 50, `Minigame: ${this.mode === 'bugs' ? 'Fix the Bugs' : this.mode === 'logic' ? 'Connect the Logic' : 'Stop Production Errors'}`, textStyle(17));
    this.timerText = this.add.text(1120, 28, '00:42', textStyle(25, '#ffc857'));
    this.add.rectangle(640, 410, 1130, 540, 0x102f43).setStrokeStyle(4, colors.cyan);
    this.add.text(115, 165, 'urgent-fix.ts  [URGENT, NATURALLY]', textStyle(18, '#ffc857'));
    this.content = this.add.container(0, 0);
    this.time.addEvent({
      delay: 1000,
      repeat: this.seconds,
      callback: () => {
        this.seconds -= 1;
        this.timerText?.setText(`00:${Math.max(0, this.seconds).toString().padStart(2, '0')}`);
        if (this.seconds <= 0) this.finish();
      },
    });
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.pause();
      this.scene.launch('PauseScene', { pausedScene: this.scene.key });
    });
    if (this.mode === 'bugs') this.showBug();
    else if (this.mode === 'logic') this.showLogic();
    else this.startErrors();
  }

  update(_time: number, delta: number): void {
    if (this.mode !== 'errors' || this.ended) return;
    this.errorItems.forEach((item) => {
      item.x += 95 * app.difficulty.speed * delta / 1000;
      if (item.active && item.x > 1010) {
        item.setActive(false).setVisible(false);
        app.state.recordBug(false);
        app.audio.play('wrong');
        this.showProductionQuip('Production adopted the error as a legacy feature.', colors.orange);
        this.index += 1;
        if (this.index >= this.targetCount) this.finish();
        else this.spawnError();
      }
    });
  }

  private showBug(): void {
    this.content?.removeAll(true);
    const challenge = challenges.bugs[this.index % challenges.bugs.length];
    this.content?.add(this.add.text(150, 210, challenge.prompt, {
      ...textStyle(21, '#ffc857'), wordWrap: { width: 950 },
    }));
    this.content?.add(this.add.rectangle(640, 310, 930, 70, 0x071a2b).setStrokeStyle(2, colors.cyan));
    this.content?.add(this.add.text(175, 292, `${this.index + 1}.  ${challenge.code}`, textStyle(25, '#e9f8fb')));
    this.content?.add(this.add.text(175, 355, 'Which token deserves an urgent ticket?', textStyle(17, '#94b8c8')));
    const tokens = Phaser.Utils.Array.Shuffle([challenge.answer, ...challenge.distractors]);
    tokens.forEach((token, index) => this.content?.add(addButton(
      this,
      350 + (index % 2) * 580,
      430 + Math.floor(index / 2) * 72,
      token,
      () => this.answer(token === challenge.answer, challenge.success, challenge.failure),
      500,
      colors.purple,
    )));
  }

  private showLogic(): void {
    this.content?.removeAll(true);
    const challenge = challenges.logic[this.index % challenges.logic.length];
    const shuffled = Phaser.Utils.Array.Shuffle([...challenge.options]);
    this.content?.add(this.add.text(150, 220, challenge.prompt, {
      ...textStyle(23, '#ffc857'), wordWrap: { width: 950 },
    }));
    shuffled.forEach((label, index) => this.content?.add(addButton(
      this,
      350 + (index % 2) * 580,
      345 + Math.floor(index / 2) * 90,
      label,
      () => this.answer(label === challenge.answer, challenge.success, challenge.failure, false),
      500,
      colors.blue,
    )));
  }

  private startErrors(): void {
    this.content?.add(this.add.text(150, 220, 'Tap the corporate disasters before they reach production!', textStyle(24)));
    this.content?.add(this.add.rectangle(1080, 430, 130, 210, colors.orange).setStrokeStyle(5, colors.white));
    this.content?.add(this.add.text(1080, 430, 'PROD\nSERVER', { ...textStyle(20), align: 'center' }).setOrigin(0.5));
    this.spawnError();
  }

  private spawnError(): void {
    const label = Phaser.Utils.Array.GetRandom(challenges.errors);
    const bg = this.add.rectangle(0, 0, 270, 62, colors.purple).setStrokeStyle(3, colors.white);
    const text = this.add.text(0, 0, `!  ${label}`, textStyle(14)).setOrigin(0.5);
    const item = this.add.container(190, Phaser.Math.Between(310, 570), [bg, text])
      .setSize(270, 62)
      .setInteractive({ useHandCursor: true });
    item.once('pointerdown', () => {
      if (!item.active) return;
      item.setActive(false).setVisible(false);
      this.index += 1;
      app.state.recordBug(true);
      app.audio.play('correct');
      this.showProductionQuip('Crisis clicked away. This is definitely sustainable.', colors.green);
      if (this.index >= this.targetCount) this.finish();
      else this.spawnError();
    });
    this.errorItems.push(item);
    this.content?.add(item);
  }

  private answer(
    correct: boolean,
    success: string,
    failure: string,
    advanceOnWrong = true,
  ): void {
    if (this.answerLocked) return;
    this.answerLocked = true;
    app.state.recordBug(correct);
    app.audio.play(correct ? 'correct' : 'wrong');
    const banner = this.add.container(640, 605, [
      this.add.rectangle(0, 0, 1040, 58, correct ? colors.green : colors.orange).setStrokeStyle(3, colors.white),
      this.add.text(0, 0, `${correct ? 'FIXED' : 'WHOOPS'}: ${correct ? success : failure}`, textStyle(17)).setOrigin(0.5),
    ]).setDepth(50);
    this.time.delayedCall(700, () => {
      banner.destroy();
      if (correct || advanceOnWrong) this.index += 1;
      this.answerLocked = false;
      if (this.index >= this.targetCount) this.finish();
      else if (this.mode === 'bugs') this.showBug();
      else if (this.mode === 'logic') this.showLogic();
    });
  }

  private showProductionQuip(message: string, color: number): void {
    const quip = this.add.text(640, 640, message, textStyle(15, '#ffffff'))
      .setOrigin(0.5)
      .setBackgroundColor(`#${color.toString(16).padStart(6, '0')}`)
      .setPadding(12, 6)
      .setDepth(60);
    this.time.delayedCall(650, () => quip.destroy());
  }

  private finish(): void {
    if (this.ended) return;
    this.ended = true;
    this.content?.removeAll(true);
    if (this.seconds > 15) app.state.addScore(300);
    if (app.state.snapshot.bugsMissed === 0) app.state.unlock('bug-destroyer');
    app.state.advanceTime(Math.max(8, 50 - this.seconds));
    const stability = Math.max(5, 100 - app.state.snapshot.bugsMissed * 18);
    this.content?.add(this.add.text(640, 245, 'CODE REVIEW COMPLETE', textStyle(34, '#39d8e8')).setOrigin(0.5));
    const summary = `Bugs fixed        ${app.state.snapshot.bugsFixed}\nBugs introduced   ${app.state.snapshot.bugsMissed}\nProduction stable ${stability}%\nCoffee consumed   ${Phaser.Math.Between(2, 7)}\nTabs opened       ${Phaser.Math.Between(12, 48)}\nManager confidence ${Phaser.Math.Between(3, 96)}%`;
    this.content?.add(this.add.text(410, 310, summary, { ...textStyle(21), lineSpacing: 8 }));
    this.content?.add(addButton(this, 640, 585, 'CLOCK OUT FOR LUNCH', () => {
      app.state.setTime(WORKDAY_SCHEDULE.lunchStart);
      this.scene.start('LunchScene');
    }, 380, colors.orange));
  }
}
