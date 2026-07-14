export const formatTime = (minutes: number): string => {
  const normalized = Math.max(0, Math.floor(minutes));
  const hour24 = Math.floor(normalized / 60) % 24;
  const minute = normalized % 60;
  const suffix = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  return `${hour12.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${suffix}`;
};

export class TimeManager {
  constructor(
    private minutes: number,
    private readonly scale = 1,
  ) {}

  advance(realSeconds: number): number {
    this.minutes += realSeconds * this.scale;
    return this.minutes;
  }

  add(minutes: number): number {
    this.minutes += minutes;
    return this.minutes;
  }

  get value(): number {
    return this.minutes;
  }
}
