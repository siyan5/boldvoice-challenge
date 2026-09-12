import { formatHHMMSS } from '../format';

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
