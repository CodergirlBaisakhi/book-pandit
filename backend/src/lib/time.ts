export function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function endTime(startTime: string, hours: number) {
  const total = toMinutes(startTime) + Math.round(hours * 60);
  const hour = Math.floor(total / 60) % 24;
  const minute = total % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function rangesOverlap(
  startA: string,
  hoursA: number,
  startB: string,
  hoursB: number,
) {
  const a0 = toMinutes(startA);
  const a1 = a0 + hoursA * 60;
  const b0 = toMinutes(startB);
  const b1 = b0 + hoursB * 60;
  return a0 < b1 && b0 < a1;
}

export function todayISO() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function roundHalf(value: number) {
  return Math.round(value * 2) / 2;
}
