import Phaser from 'phaser';
import { BootScene } from '../game/scenes/BootScene';
import { CodingScene } from '../game/scenes/CodingScene';
import { CommuteScene } from '../game/scenes/CommuteScene';
import { EscapeScene } from '../game/scenes/EscapeScene';
import { GameOverScene } from '../game/scenes/GameOverScene';
import { HRSearchScene } from '../game/scenes/HRSearchScene';
import { LobbyScene } from '../game/scenes/LobbyScene';
import { LunchScene } from '../game/scenes/LunchScene';
import { MainMenuScene } from '../game/scenes/MainMenuScene';
import { NameEntryScene } from '../game/scenes/NameEntryScene';
import { PauseScene } from '../game/scenes/PauseScene';
import { ResultsScene } from '../game/scenes/ResultsScene';
import { SalaryScene } from '../game/scenes/SalaryScene';
import { TeaBreakScene } from '../game/scenes/TeaBreakScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1280,
  height: 720,
  backgroundColor: '#071a2b',
  render: { antialias: false, pixelArt: true, roundPixels: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { activePointers: 3 },
  dom: { createContainer: true },
  scene: [BootScene, MainMenuScene, NameEntryScene, CommuteScene, GameOverScene, LobbyScene, CodingScene, LunchScene, TeaBreakScene, HRSearchScene, SalaryScene, EscapeScene, ResultsScene, PauseScene],
};
