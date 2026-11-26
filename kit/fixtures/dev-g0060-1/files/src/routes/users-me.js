// GET /me
export async function handle(req, deps) {
  if (!req.user) return { status: 401, body: { error: 'sign in first' } };
  try {
    return { status: 200, body: await deps.users.find(req.user.id) };
  } catch (problem) {
    return { status: 500, body: { error: 'could not load your profile: ' + problem.toString() } };
  }
}
