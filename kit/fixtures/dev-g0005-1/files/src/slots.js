// Opening hours and slots of the meeting rooms. Times are minutes from midnight.
export const OPEN_HOUR = 8;
export const CLOSE_HOUR = 20;

// "2026-03-04 09:00-10:30" -> { day: '2026-03-04', start: 540, end: 630 }
export function parseSlot(text) {
  const m = /^(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2})-(\d{2}):(\d{2})$/.exec(String(text).trim());
  if (!m) throw new Error(`not a slot: ${text}`);
  const start = Number(m[2]) * 60 + Number(m[3]);
  const end = Number(m[4]) * 60 + Number(m[5]);
  if (end <= start) throw new Error('a slot must end after it starts');
  if (start < OPEN_HOUR * 60 || end > CLOSE_HOUR * 60) throw new Error('outside opening hours');
  return { day: m[1], start, end };
}

export function formatSlot({ day, start, end }) {
  const hm = (t) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  return `${day} ${hm(start)}-${hm(end)}`;
}

export function overlaps(a, b) {
  return a.day === b.day && a.start < b.end && b.start < a.end;
}
