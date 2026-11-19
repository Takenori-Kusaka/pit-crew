// Scheduled job: reindex. Called by the scheduler with { db }.
export function run({ db }) {
  try {
    const indexed = db.reindexAll();
    return { status: 200, body: { ok: true, indexed } };
  } catch (err) {
    return { status: 500, body: { ok: false, error: String(err) } };
  }
}
