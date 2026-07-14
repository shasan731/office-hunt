import Phaser from 'phaser';
import { app } from '../managers/AppContext';
import { addPerson, applyPixelPolish, colors, textStyle } from '../ui';

export class NameEntryScene extends Phaser.Scene {
  constructor() { super('NameEntryScene'); }

  create(): void {
    this.cameras.main.setBackgroundColor('#a9edf0');
    this.add.rectangle(640, 360, 940, 560, colors.white, 0.96).setStrokeStyle(6, colors.navy);
    this.add.text(640, 115, 'EMPLOYEE ONBOARDING', textStyle(36, '#071a2b')).setOrigin(0.5);
    this.add.text(640, 165, 'Payroll needs a name. HR promises not to lose it.', textStyle(19, '#7c5ce7')).setOrigin(0.5);
    addPerson(this, 360, 365, colors.blue, 'New Employee').setScale(1.8);
    const dom = this.add.dom(760, 370).createFromHTML(`
      <form class="name-form" aria-label="Employee name form">
        <label for="player-name">YOUR OFFICE NAME</label>
        <input id="player-name" name="playerName" maxlength="16" autocomplete="off" placeholder="Anonymous Dev" aria-describedby="name-privacy" />
        <p id="name-privacy">Only top-ten high-score names are saved.</p>
        <button type="submit">START THE WORKDAY</button>
      </form>
    `);
    const form = dom.node as HTMLFormElement;
    const input = form.querySelector<HTMLInputElement>('#player-name');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.begin(input?.value ?? '');
    });
    this.time.delayedCall(100, () => input?.focus());
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('MainMenuScene'));
    applyPixelPolish(this, colors.blue);
  }

  private begin(rawName: string): void {
    const playerName = rawName.trim().replace(/\s+/g, ' ').slice(0, 16) || 'Anonymous Dev';
    app.state.reset(app.save.getData().settings.difficulty, playerName);
    this.scene.start('CommuteScene');
  }
}
