// GET /rooms/:id/bookings
export async function handle(req, deps) {
  try {
    return { status: 200, body: await deps.bookings.forRoom(req.params.id) };
  } catch (err) {
    return { status: 500, body: { error: err instanceof Error ? err.message : 'could not list the bookings' } };
  }
}
