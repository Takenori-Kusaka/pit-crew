// Scheduled job: cleanup. Called by the scheduler with { db }.
export function run({ db }) {
  try {
    const deleted = db.deleteExpired();
    return { status: 200, body: { ok: true, deleted } };
  } catch (err) {
    return { status: 500, body: { ok: false, error: String(err) } };
  }
}
