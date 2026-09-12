import { dayKey, groupByDay, totalsByName } from '../historyStats';
import { SessionRecord } from '../types';

function record(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: '1000-9000',
    name: 'Math',
    goalMs: 60000,
    startedAt: 1000,
    endedAt: 9000,
    totalMs: 8000,
    pauseCount: 1,
    ...overrides,
  };
}

describe('dayKey', () => {
  it('returns the local YYYY-MM-DD for an epoch time', () => {
    const d = new Date(2024, 2, 15, 10, 30); // local time, March 15 2024
    expect(dayKey(d.getTime())).toBe('2024-03-15');
  });

  it('pads single-digit months and days', () => {
    const d = new Date(2024, 0, 5, 0, 0); // Jan 5 2024
    expect(dayKey(d.getTime())).toBe('2024-01-05');
  });
});

describe('groupByDay', () => {
  it('groups sessions by local day, newest day first', () => {
    const now = new Date(2024, 2, 15, 12, 0).getTime();
    const today = new Date(2024, 2, 15, 9, 0).getTime();
    const yesterday = new Date(2024, 2, 14, 9, 0).getTime();

    const records: SessionRecord[] = [
      record({ id: 'y', startedAt: yesterday, endedAt: yesterday + 1000, totalMs: 1000 }),
      record({ id: 't', startedAt: today, endedAt: today + 1000, totalMs: 1000 }),
    ];

    const groups = groupByDay(records, now);
    expect(groups.map((g) => g.day)).toEqual(['2024-03-15', '2024-03-14']);
  });

  it('labels the current day "Today" and the prior day "Yesterday"', () => {
    const now = new Date(2024, 2, 15, 12, 0).getTime();
    const today = new Date(2024, 2, 15, 9, 0).getTime();
    const yesterday = new Date(2024, 2, 14, 9, 0).getTime();
    const older = new Date(2024, 2, 10, 9, 0).getTime();

    const records: SessionRecord[] = [
      record({ id: 'o', startedAt: older, endedAt: older + 1000 }),
      record({ id: 'y', startedAt: yesterday, endedAt: yesterday + 1000 }),
      record({ id: 't', startedAt: today, endedAt: today + 1000 }),
    ];

    const groups = groupByDay(records, now);
    expect(groups[0].label).toBe('Today');
    expect(groups[1].label).toBe('Yesterday');
    expect(groups[2].label).toEqual(expect.any(String));
    expect(groups[2].label.length).toBeGreaterThan(0);
  });

  it('orders records newest first within a day and sums totalMs', () => {
    const now = new Date(2024, 2, 15, 12, 0).getTime();
    const earlier = new Date(2024, 2, 15, 8, 0).getTime();
    const later = new Date(2024, 2, 15, 10, 0).getTime();

    const records: SessionRecord[] = [
      record({ id: 'earlier', startedAt: earlier, endedAt: earlier + 1000, totalMs: 1000 }),
      record({ id: 'later', startedAt: later, endedAt: later + 2000, totalMs: 2000 }),
    ];

    const groups = groupByDay(records, now);
    expect(groups).toHaveLength(1);
    expect(groups[0].records.map((r) => r.id)).toEqual(['later', 'earlier']);
    expect(groups[0].totalMs).toBe(3000);
  });
});

describe('totalsByName', () => {
  it('sums totalMs and counts sessions per name, sorted descending', () => {
    const records: SessionRecord[] = [
      record({ id: '1', name: 'Math', totalMs: 1000 }),
      record({ id: '2', name: 'Reading', totalMs: 5000 }),
      record({ id: '3', name: 'Math', totalMs: 2000 }),
    ];

    expect(totalsByName(records)).toEqual([
      { name: 'Reading', totalMs: 5000, sessions: 1 },
      { name: 'Math', totalMs: 3000, sessions: 2 },
    ]);
  });

  it('returns an empty list for no records', () => {
    expect(totalsByName([])).toEqual([]);
  });
});
