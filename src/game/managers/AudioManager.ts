export type SoundName = 'click' | 'collision' | 'correct' | 'wrong' | 'salary' | 'exit' | 'warning';

const frequencies: Record<SoundName, number[]> = {
  click: [480], collision: [150, 110], correct: [520, 720], wrong: [220, 170],
  salary: [440, 660, 880], exit: [600, 800], warning: [260, 260],
};

export class AudioManager {
  private context?: AudioContext;

  constructor(private muted = true) {}

  setMuted(muted: boolean): void { this.muted = muted; }
  get isMuted(): boolean { return this.muted; }

  play(name: SoundName): void {
    if (this.muted || typeof AudioContext === 'undefined') return;
    this.context ??= new AudioContext();
    const now = this.context.currentTime;
    frequencies[name].forEach((frequency, index) => {
      const oscillator = this.context!.createOscillator();
      const gain = this.context!.createGain();
      oscillator.type = name === 'warning' ? 'square' : 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.06, now + index * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.1 + 0.12);
      oscillator.connect(gain).connect(this.context!.destination);
      oscillator.start(now + index * 0.1);
      oscillator.stop(now + index * 0.1 + 0.13);
    });
  }
}
