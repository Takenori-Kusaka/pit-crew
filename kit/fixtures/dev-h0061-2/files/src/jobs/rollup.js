// Scheduled job: rollup. Called by the scheduler with { db }.
export function run({ db }) {
  try {
    const rows = db.rollupYesterday();
    return { status: 200, body: { ok: true, rows } };
  } catch (err) {
    return { status: 500, body: { ok: false, error: String(err) } };
  }
}
