const indiaDate = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
});

export function indiaCalendarDate(now = new Date()): string {
  const parts = Object.fromEntries(indiaDate.formatToParts(now).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function bookingQuickDate(offset: number, now = new Date()) {
  const [year, month, day] = indiaCalendarDate(now).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + offset));
  return {
    value: date.toISOString().slice(0, 10),
    day: date.getUTCDate(),
    month: date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
    weekday: date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
  };
}
