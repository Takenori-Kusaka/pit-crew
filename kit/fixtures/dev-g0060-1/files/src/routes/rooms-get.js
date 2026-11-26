// GET /rooms/:id
export async function handle(req, deps) {
  try {
    const room = await deps.rooms.find(req.params.id);
    if (!room) return { status: 404, body: { error: 'room not found' } };
    return { status: 200, body: room };
  } catch (err) {
    return { status: 500, body: { error: err.message } };
  }
}
