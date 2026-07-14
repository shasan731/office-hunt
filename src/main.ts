import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig';
import { app } from './game/managers/AppContext';
import './styles/global.css';

const settings = app.save.getData().settings;
document.body.classList.toggle('high-contrast', settings.highContrast);
document.body.classList.toggle('large-text', settings.largeText);

const game = new Phaser.Game(gameConfig);
window.addEventListener('beforeunload', () => game.destroy(true));
document.addEventListener('contextmenu', (event) => event.preventDefault());

declare global {
  interface Window { __salaryChase?: Phaser.Game; }
}
window.__salaryChase = game;
