import { describe, expect, it } from 'vitest';
import { formatTime, TimeManager } from '../game/managers/TimeManager';

describe('TimeManager', () => {
  it('formats compressed workday time', () => {
    expect(formatTime(585)).toBe('09:45 AM');
    expect(formatTime(840)).toBe('02:00 PM');
    expect(formatTime(1005)).toBe('04:45 PM');
    expect(formatTime(1140)).toBe('07:00 PM');
  });
  it('advances using its scale', () => {
    const time = new TimeManager(600, 1.5);
    expect(time.advance(10)).toBe(615);
    expect(time.add(5)).toBe(620);
  });
});
