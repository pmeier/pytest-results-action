export function prettyDuration(seconds: number): string {
  seconds = Math.ceil(seconds);

  let minutes = Math.floor(seconds / 60);
  if (minutes === 0) {
    return `${seconds}s`;
  }
  seconds = seconds % 60;

  const hours = Math.floor(minutes / 60);
  if (hours === 0) {
    return `${minutes}m ${seconds}s`;
  }
  minutes = minutes % 60;

  return `${hours}h ${minutes}m ${seconds}s`;
}

export function zip<T, U>(a: T[], b: U[]): [T, U][] {
  return a.map((obj, idx) => [obj, b[idx]]);
}
