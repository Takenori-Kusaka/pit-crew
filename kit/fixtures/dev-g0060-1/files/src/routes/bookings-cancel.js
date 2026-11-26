// DELETE /bookings/:id
export async function handle(req, deps) {
  try {
    await deps.bookings.cancel(req.params.id);
    return { status: 204, body: null };
  } catch (err) {
    return { status: 500, body: { error: `cancel failed: ${err.message}` } };
  }
}
