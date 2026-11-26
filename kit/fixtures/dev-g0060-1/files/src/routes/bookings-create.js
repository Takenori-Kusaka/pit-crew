// POST /bookings
export async function handle(req, deps) {
  const { roomId, date } = req.body ?? {};
  if (!roomId || !date) return { status: 400, body: { error: 'roomId and date are required' } };
  try {
    const booking = await deps.bookings.create({ roomId, date });
    return { status: 201, body: booking };
  } catch (err) {
    return { status: 500, body: { error: String(err) } };
  }
}
