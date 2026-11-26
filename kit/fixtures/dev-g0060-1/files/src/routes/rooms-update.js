// PUT /rooms/:id
export async function handle(req, deps) {
  if (!req.body?.name) return { status: 400, body: { error: 'name is required' } };
  const room = await deps.rooms.update(req.params.id, { name: req.body.name });
  return { status: 200, body: room };
}
