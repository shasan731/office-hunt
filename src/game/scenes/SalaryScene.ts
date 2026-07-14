import Phaser from 'phaser';
import { app } from '../managers/AppContext';
import { addButton, addPerson, applyPixelPolish, colors, textStyle } from '../ui';
import { WORKDAY_SCHEDULE } from '../../config/constants';
import { addPixelCabinet, addPixelDesk, addPixelPlant, drawPixelFloor } from '../pixelArt';

export class SalaryScene extends Phaser.Scene {
  private step = 0;
  private content?: Phaser.GameObjects.Container;
  constructor() { super('SalaryScene'); }
  create(): void {
    this.step = 0;
    this.content = undefined;
    app.state.beginStage('salary'); this.cameras.main.setBackgroundColor('#d8f5f7');
    drawPixelFloor(this, 0xdaf0e8, 0xc8e1d8);
    this.add.rectangle(640, 390, 1080, 530, colors.white).setStrokeStyle(6, colors.navy);
    addPixelCabinet(this, 135, 500, 'PAYROLL');
    addPixelDesk(this, 1035, 520, 150, 'HR DESK');
    addPixelPlant(this, 1140, 215);
    this.add.text(640, 120, '7 / THE SALARY CONVERSATION', textStyle(30, '#071a2b')).setOrigin(0.5);
    addPerson(this, 220, 350, colors.blue, 'YOU').setScale(1.5); addPerson(this, 1060, 350, colors.orange, 'HR').setScale(1.5);
    this.content = this.add.container(0, 0); this.showStep();
    applyPixelPolish(this, colors.green);
  }
  private showStep(): void {
    this.content?.removeAll(true);
    const prompts = ['HR: Why are you looking for me?', 'HR: The system says “processing.” What now?', 'HR: Final question—how urgent is this?'];
    const options = [
      [['Discuss my performance', 3], ['I heard salary is ready', 0], ['Technical support!', 4], ['I enjoy walking', 5]],
      [['Refresh payroll cache', 1], ['Wait another sprint', 4], ['Check the envelope', 0], ['Reinstall finance', 3]],
      [['Production critical', 0], ['Before the next meeting', 1], ['Whenever convenient', 4], ['My tea budget is critical', 2]],
    ] as const;
    this.content?.add(this.add.text(640, 205, prompts[this.step], textStyle(25, '#071a2b')).setOrigin(0.5));
    options[this.step].forEach(([label, penalty], index) => this.content?.add(addButton(this, 640, 285 + index * 68, `${String.fromCharCode(65 + index)}. ${label}`, () => {
      app.state.advanceTime(penalty); if (penalty === 0) app.state.addScore(75); this.step += 1;
      if (this.step >= prompts.length) this.collect(); else this.showStep();
    }, 590, penalty === 0 ? colors.green : colors.blue)));
  }
  private collect(): void {
    app.state.collectSalary(); app.state.unlock('salary-secured'); app.audio.play('salary'); this.content?.removeAll(true);
    const envelope = this.add.container(640, 350, [this.add.rectangle(0, 0, 250, 150, colors.yellow).setStrokeStyle(6, colors.navy), this.add.triangle(0, -5, -120, -65, 120, -65, 0, 45, colors.orange), this.add.text(0, 40, 'FICTIONAL SALARY', textStyle(18, '#071a2b')).setOrigin(0.5)]);
    if (!app.save.getData().settings.reducedMotion) this.tweens.add({ targets: envelope, scale: { from: 0.2, to: 1.25 }, angle: { from: -8, to: 0 }, duration: 650, ease: 'Back.easeOut' });
    this.content?.add(envelope); this.content?.add(this.add.text(640, 490, 'SALARY COLLECTED!  +1000', textStyle(38, '#12b886')).setOrigin(0.5));
    this.content?.add(addButton(this, 640, 590, 'BEGIN THE ESCAPE', () => { if (app.state.snapshot.minutes < WORKDAY_SCHEDULE.officeEnd - 6) app.state.setTime(WORKDAY_SCHEDULE.officeEnd - 6); this.scene.start('EscapeScene'); }, 380, colors.orange));
  }
}
