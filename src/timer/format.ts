export function formatHHMMSS(ms: number): string {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function formatGoal(ms: number): string {
  const totalMinutes = Math.round(Math.max(0, ms) / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) return 'Goal reached';
  const minutes = Math.ceil(ms / 60_000);
  return `${minutes} min left`;
}

export function formatClockTime(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function formatPercent(elapsedMs: number, goalMs: number): string {
  const fraction = goalMs > 0 ? elapsedMs / goalMs : 0;
  const clamped = Math.min(100, Math.max(0, Math.round(fraction * 100)));
  return `${clamped}%`;
}
