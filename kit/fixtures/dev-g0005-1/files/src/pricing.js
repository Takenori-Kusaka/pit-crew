// Price of a booking, in yen. Bookings of 4 hours or more get 10% off; members get 20% off on top.
export const RATE_PER_HOUR = { small: 1200, large: 2600 };

export function price({ room, start, end }, { member = false } = {}) {
  const rate = RATE_PER_HOUR[room];
  if (rate === undefined) throw new Error(`unknown room: ${room}`);
  const hours = (end - start) / 60;
  let total = rate * hours;
  if (hours >= 4) total *= 0.9;
  if (member) total *= 0.8;
  return Math.round(total);
}
