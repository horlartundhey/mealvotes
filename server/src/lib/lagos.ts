// Africa/Lagos is UTC+1 all year (no daylight saving), so plain offset arithmetic is exact.
const OFFSET_MS = 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, '0');

/** "YYYY-MM-DD" as seen in Lagos. */
export const lagosDate = (d: Date) => new Date(d.getTime() + OFFSET_MS).toISOString().slice(0, 10);

/** Hour of day in Lagos as a decimal, e.g. 10:30 → 10.5 */
export const lagosHour = (d: Date) => {
  const shifted = new Date(d.getTime() + OFFSET_MS);
  return shifted.getUTCHours() + shifted.getUTCMinutes() / 60;
};

/** The instant that is `hour`:00 in Lagos on the given Lagos date. */
export const atLagos = (date: string, hour: number) => new Date(`${date}T${pad(hour)}:00:00+01:00`);

export const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

export const addDays = (date: string, days: number) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
