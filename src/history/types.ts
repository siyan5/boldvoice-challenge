export interface SessionRecord {
  id: string; // `${startedAt}-${endedAt}`
  name: string;
  goalMs: number;
  startedAt: number; // epoch ms
  endedAt: number; // epoch ms
  totalMs: number; // accumulatedMs at stop
  pauseCount: number;
}
