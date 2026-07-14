import difficultyData from '../../data/difficulty.json';
import type { DifficultyConfig } from '../types/game';
import { AudioManager } from './AudioManager';
import { GameStateManager } from './GameStateManager';
import { SaveManager } from './SaveManager';

export class AppContext {
  readonly save = new SaveManager(typeof localStorage === 'undefined' ? undefined : localStorage);
  readonly state = new GameStateManager(this.save.getData().settings.difficulty);
  readonly audio = new AudioManager(this.save.getData().settings.muted);

  get difficulty(): DifficultyConfig {
    return difficultyData[this.state.snapshot.difficulty] as DifficultyConfig;
  }
}

export const app = new AppContext();
