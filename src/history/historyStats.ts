import { SessionRecord } from './types';

export function dayKey(epochMs: number): string {
  const d = new Date(epochMs);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface DayGroup {
  day: string;
  label: string;
  totalMs: number;
  records: SessionRecord[];
}

export function groupByDay(records: SessionRecord[], now: number = Date.now()): DayGroup[] {
  const todayKey = dayKey(now);
  const yesterdayKey = dayKey(now - 24 * 60 * 60 * 1000);

  const byDay = new Map<string, SessionRecord[]>();
  for (const record of records) {
    const key = dayKey(record.startedAt);
    const bucket = byDay.get(key);
    if (bucket) {
      bucket.push(record);
    } else {
      byDay.set(key, [record]);
    }
  }

  return Array.from(byDay.entries())
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([day, dayRecords]) => {
      const sorted = [...dayRecords].sort((a, b) => b.startedAt - a.startedAt);
      return {
        day,
        label: dayLabel(day, todayKey, yesterdayKey, sorted[0].startedAt),
        totalMs: sorted.reduce((sum, r) => sum + r.totalMs, 0),
        records: sorted,
      };
    });
}

function dayLabel(day: string, todayKey: string, yesterdayKey: string, sampleEpochMs: number): string {
  if (day === todayKey) return 'Today';
  if (day === yesterdayKey) return 'Yesterday';
  return new Date(sampleEpochMs).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export interface NameTotal {
  name: string;
  totalMs: number;
  sessions: number;
}

export function totalsByName(records: SessionRecord[]): NameTotal[] {
  const byName = new Map<string, NameTotal>();
  for (const record of records) {
    const existing = byName.get(record.name);
    if (existing) {
      existing.totalMs += record.totalMs;
      existing.sessions += 1;
    } else {
      byName.set(record.name, { name: record.name, totalMs: record.totalMs, sessions: 1 });
    }
  }
  return Array.from(byName.values()).sort((a, b) => b.totalMs - a.totalMs);
}
