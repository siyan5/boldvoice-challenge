import {
  formatHHMMSS,
  formatGoal,
  formatRemaining,
  formatClockTime,
  formatPercent,
} from '../format';

describe('formatHHMMSS', () => {
  it('formats 0 as 00:00:00', () => {
    expect(formatHHMMSS(0)).toBe('00:00:00');
  });

  it('formats 5025000ms as 01:23:45', () => {
    expect(formatHHMMSS(5025000)).toBe('01:23:45');
  });

  it('floors sub-second values to 00:00:00', () => {
    expect(formatHHMMSS(999)).toBe('00:00:00');
  });

  it('floors 59999ms to 00:00:59', () => {
    expect(formatHHMMSS(59999)).toBe('00:00:59');
  });

  it('clamps negative values to 00:00:00', () => {
    expect(formatHHMMSS(-5000)).toBe('00:00:00');
  });

  it('does not cap hours at 99', () => {
    expect(formatHHMMSS(100 * 60 * 60 * 1000)).toBe('100:00:00');
  });
});

describe('formatGoal', () => {
  it('formats 1500000ms as 25m', () => {
    expect(formatGoal(1500000)).toBe('25m');
  });

  it('formats 3000000ms as 50m', () => {
    expect(formatGoal(3000000)).toBe('50m');
  });

  it('formats 3600000ms as 1h', () => {
    expect(formatGoal(3600000)).toBe('1h');
  });

  it('formats 7200000ms as 2h', () => {
    expect(formatGoal(7200000)).toBe('2h');
  });

  it('formats 9000000ms as 2h 30m', () => {
    expect(formatGoal(9000000)).toBe('2h 30m');
  });

  it('formats 0ms as 0m', () => {
    expect(formatGoal(0)).toBe('0m');
  });
});

describe('formatRemaining', () => {
  it('formats 2160000ms as 36 min left', () => {
    expect(formatRemaining(2160000)).toBe('36 min left');
  });

  it('rounds up to whole minutes: 90000ms as 2 min left', () => {
    expect(formatRemaining(90000)).toBe('2 min left');
  });

  it('rounds up to whole minutes: 30000ms as 1 min left', () => {
    expect(formatRemaining(30000)).toBe('1 min left');
  });

  it('formats 0ms as Goal reached', () => {
    expect(formatRemaining(0)).toBe('Goal reached');
  });

  it('formats negative ms as Goal reached', () => {
    expect(formatRemaining(-1000)).toBe('Goal reached');
  });
});

describe('formatClockTime', () => {
  it('returns a non-empty string containing a colon', () => {
    const result = formatClockTime(Date.UTC(2024, 0, 1, 8, 18));
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain(':');
  });
});

describe('formatPercent', () => {
  it('formats a fractional progress as a rounded percentage', () => {
    expect(formatPercent(6200, 10000)).toBe('62%');
  });

  it('clamps above 100%', () => {
    expect(formatPercent(20000, 10000)).toBe('100%');
  });

  it('clamps below 0%', () => {
    expect(formatPercent(-5000, 10000)).toBe('0%');
  });

  it('is 0% for a zero goal', () => {
    expect(formatPercent(5000, 0)).toBe('0%');
  });
});
