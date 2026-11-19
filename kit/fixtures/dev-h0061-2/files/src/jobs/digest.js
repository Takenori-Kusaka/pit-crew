// Scheduled job: digest. Called by the scheduler with { db }.
export function run({ db }) {
  try {
    const sent = db.sendPendingDigests();
    return { status: 200, body: { ok: true, sent } };
  } catch (err) {
    return { status: 500, body: { ok: false, error: String(err) } };
  }
}
